from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    # Explicit: SQLModel would default this to "user", but the FKs below point at "users".
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    phone_number: str | None = None
    is_verified: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime | None = None
    deleted_at: datetime | None = None


class Category(str, Enum):
    ART = "art"
    HISTORY = "history"
    NATURAL_HISTORY = "natural_history"
    SCIENCE = "science"
    NATURE = "nature"
    ARCHAEOLOGY = "archaeology"
    ETHNOGRAPHIC = "ethnographic"
    CHILDRENS = "childrens"
    CULTURE = "culture"
    SPECIALTY = "specialty"


class ExhibitType(str, Enum):
    TEMPORARY = "temporary"
    PERMANENT = "permanent"
    SPECIAL = "special"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Museums(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    category: Category
    description: str
    city: str = Field(index=True)
    address: str
    contact: str
    latitude: float
    longitude: float
    image_url: str
    opening_hours: str
    admission_fee: float
    created_at: datetime = Field(default_factory=utcnow)
    deleted_at: datetime | None = None


class Exhibitions(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    museum_id: int = Field(foreign_key="museums.id", index=True)
    title: str
    description: str
    type: ExhibitType
    start_date: date
    end_date: date | None = None
    image_url: str


class Bookings(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    museum_id: int = Field(foreign_key="museums.id", index=True)
    visit_date: date
    time_slot: str
    num_tickets: int
    total_price: float
    status: BookingStatus = Field(default=BookingStatus.CONFIRMED)
    # Generated server-side on create; this is the value encoded in the ticket QR.
    reference: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime | None = None
    deleted_at: datetime | None = None


class Reviews(SQLModel, table=True):
    # One review per user per museum.
    __table_args__ = (
        UniqueConstraint("user_id", "museum_id", name="uq_review_user_museum"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    museum_id: int = Field(foreign_key="museums.id", index=True)
    # Range is enforced at the API boundary (ReviewCreate: ge=1, le=5).
    rating: int
    comment: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
    deleted_at: datetime | None = None
