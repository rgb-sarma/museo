import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..auth import get_current_user
from ..database import get_session
from ..models import Bookings, BookingStatus, Museums, User
from ..schemas import BookingCreate, BookingRead
from .museums import rating_index, to_read

router = APIRouter(prefix="/bookings", tags=["bookings"])

# No capacity tracking for the demo — every slot is always available.
TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]


def _read(
    booking: Bookings,
    museum: Museums,
    ratings: dict[int, tuple[float, int]],
) -> BookingRead:
    return BookingRead(
        **booking.model_dump(exclude={"user_id", "museum_id", "updated_at", "deleted_at"}),
        museum=to_read(museum, ratings),
    )


@router.get("/slots", response_model=list[str])
def list_slots() -> list[str]:
    return TIME_SLOTS


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    body: BookingCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> BookingRead:
    museum = session.get(Museums, body.museum_id)
    if museum is None or museum.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Museum not found")
    if body.time_slot not in TIME_SLOTS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown time slot")

    booking = Bookings(
        user_id=user.id,
        museum_id=museum.id,
        visit_date=body.visit_date,
        time_slot=body.time_slot,
        num_tickets=body.num_tickets,
        total_price=round(museum.admission_fee * body.num_tickets, 2),
        status=BookingStatus.CONFIRMED,
        reference=uuid.uuid4().hex[:12].upper(),
    )
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return _read(booking, museum, rating_index(session))


@router.get("", response_model=list[BookingRead])
def list_bookings(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    when: str | None = Query(None, pattern="^(upcoming|past)$"),
) -> list[BookingRead]:
    rows = session.exec(
        select(Bookings, Museums)
        .join(Museums, Museums.id == Bookings.museum_id)
        .where(Bookings.user_id == user.id, Bookings.deleted_at.is_(None))
        .order_by(Bookings.visit_date.desc())
    ).all()

    today = date.today()
    if when == "upcoming":
        rows = [r for r in rows if r[0].visit_date >= today]
    elif when == "past":
        rows = [r for r in rows if r[0].visit_date < today]

    ratings = rating_index(session)
    return [_read(b, m, ratings) for b, m in rows]


@router.get("/{booking_id}", response_model=BookingRead)
def get_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> BookingRead:
    booking = session.get(Bookings, booking_id)
    if booking is None or booking.deleted_at is not None or booking.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    museum = session.get(Museums, booking.museum_id)
    return _read(booking, museum, rating_index(session))


@router.patch("/{booking_id}/cancel", response_model=BookingRead)
def cancel_booking(
    booking_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> BookingRead:
    booking = session.get(Bookings, booking_id)
    if booking is None or booking.deleted_at is not None or booking.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.visit_date < date.today():
        raise HTTPException(status.HTTP_409_CONFLICT, "That visit has already happened")

    booking.status = BookingStatus.CANCELLED
    session.add(booking)
    session.commit()
    session.refresh(booking)
    museum = session.get(Museums, booking.museum_id)
    return _read(booking, museum, rating_index(session))
