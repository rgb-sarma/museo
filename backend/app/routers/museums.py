from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, select

from ..auth import get_current_user
from ..database import get_session
from ..models import Category, Exhibitions, Museums, Reviews, User
from ..schemas import (
    CategoryRead,
    ExhibitionRead,
    MuseumDetail,
    MuseumRead,
    ReviewCreate,
    ReviewRead,
)

router = APIRouter(tags=["museums"])

CATEGORY_LABELS = {
    Category.ART: "Art",
    Category.HISTORY: "History",
    Category.NATURAL_HISTORY: "Natural history",
    Category.SCIENCE: "Science",
    Category.NATURE: "Nature",
    Category.ARCHAEOLOGY: "Archaeology",
    Category.ETHNOGRAPHIC: "Ethnographic",
    Category.CHILDRENS: "Children's",
    Category.CULTURE: "Culture",
    Category.SPECIALTY: "Specialty",
}


def rating_index(session: Session) -> dict[int, tuple[float, int]]:
    """museum_id -> (avg_rating, review_count), computed on the fly."""
    rows = session.exec(
        select(
            Reviews.museum_id,
            func.avg(Reviews.rating),
            func.count(Reviews.id),
        )
        .where(Reviews.deleted_at.is_(None))
        .group_by(Reviews.museum_id)
    ).all()
    return {mid: (round(float(avg), 1), int(count)) for mid, avg, count in rows}


def to_read(museum: Museums, ratings: dict[int, tuple[float, int]]) -> MuseumRead:
    avg, count = ratings.get(museum.id, (0.0, 0))
    return MuseumRead(
        **museum.model_dump(exclude={"contact", "created_at", "deleted_at"}),
        avg_rating=avg,
        review_count=count,
    )


@router.get("/categories", response_model=list[CategoryRead])
def list_categories() -> list[CategoryRead]:
    return [CategoryRead(value=c.value, label=CATEGORY_LABELS[c]) for c in Category]


@router.get("/reviews/me", response_model=list[ReviewRead])
def list_my_reviews(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[ReviewRead]:
    """Backs the 'Your reviews' list on the Profile screen."""
    rows = session.exec(
        select(Reviews, Museums)
        .join(Museums, Museums.id == Reviews.museum_id)
        .where(Reviews.user_id == user.id, Reviews.deleted_at.is_(None))
        .order_by(Reviews.created_at.desc())
    ).all()
    return [
        ReviewRead(
            **review.model_dump(exclude={"deleted_at"}),
            user_name=user.full_name,
            museum_name=museum.name,
        )
        for review, museum in rows
    ]


@router.get("/museums", response_model=list[MuseumRead])
def list_museums(
    session: Session = Depends(get_session),
    city: str | None = None,
    category: Category | None = None,
    min_rating: float = Query(0, ge=0, le=5),
    q: str | None = None,
    sort: str = Query("top_rated", pattern="^(top_rated|price|name)$"),
) -> list[MuseumRead]:
    statement = select(Museums).where(Museums.deleted_at.is_(None))
    if city:
        statement = statement.where(func.lower(Museums.city) == city.lower())
    if category:
        statement = statement.where(Museums.category == category)
    if q:
        statement = statement.where(Museums.name.ilike(f"%{q}%"))

    museums = session.exec(statement).all()
    ratings = rating_index(session)
    items = [to_read(m, ratings) for m in museums]

    if min_rating:
        items = [i for i in items if i.avg_rating >= min_rating]

    if sort == "price":
        items.sort(key=lambda i: i.admission_fee)
    elif sort == "name":
        items.sort(key=lambda i: i.name.lower())
    else:
        items.sort(key=lambda i: (-i.avg_rating, -i.review_count))
    return items


@router.get("/museums/{museum_id}", response_model=MuseumDetail)
def get_museum(museum_id: int, session: Session = Depends(get_session)) -> MuseumDetail:
    museum = session.get(Museums, museum_id)
    if museum is None or museum.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Museum not found")

    exhibitions = session.exec(
        select(Exhibitions)
        .where(Exhibitions.museum_id == museum_id)
        .order_by(Exhibitions.start_date.desc())
    ).all()

    base = to_read(museum, rating_index(session))
    return MuseumDetail(
        **base.model_dump(),
        contact=museum.contact,
        exhibitions=[ExhibitionRead.model_validate(e, from_attributes=True) for e in exhibitions],
    )


@router.get("/museums/{museum_id}/reviews", response_model=list[ReviewRead])
def list_reviews(museum_id: int, session: Session = Depends(get_session)) -> list[ReviewRead]:
    if session.get(Museums, museum_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Museum not found")

    rows = session.exec(
        select(Reviews, User, Museums)
        .join(User, User.id == Reviews.user_id)
        .join(Museums, Museums.id == Reviews.museum_id)
        .where(Reviews.museum_id == museum_id, Reviews.deleted_at.is_(None))
        .order_by(Reviews.created_at.desc())
    ).all()
    return [
        ReviewRead(
            **review.model_dump(exclude={"deleted_at"}),
            user_name=user.full_name,
            museum_name=museum.name,
        )
        for review, user, museum in rows
    ]


@router.post(
    "/museums/{museum_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    museum_id: int,
    body: ReviewCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ReviewRead:
    museum = session.get(Museums, museum_id)
    if museum is None or museum.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Museum not found")

    existing = session.exec(
        select(Reviews).where(Reviews.museum_id == museum_id, Reviews.user_id == user.id)
    ).first()
    if existing:
        # One review per user per museum — update in place rather than 409ing the user out.
        existing.rating = body.rating
        existing.comment = body.comment
        existing.deleted_at = None
        review = existing
    else:
        review = Reviews(
            museum_id=museum_id,
            user_id=user.id,
            rating=body.rating,
            comment=body.comment,
        )
    session.add(review)
    session.commit()
    session.refresh(review)

    return ReviewRead(
        **review.model_dump(exclude={"deleted_at"}),
        user_name=user.full_name,
        museum_name=museum.name,
    )
