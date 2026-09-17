from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from .models import BookingStatus, Category, ExhibitType

# ---------------------------------------------------------------- auth


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    phone_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: str | None
    is_verified: bool
    created_at: datetime


# ---------------------------------------------------------------- museums


class ExhibitionRead(BaseModel):
    id: int
    title: str
    description: str
    type: ExhibitType
    start_date: date
    end_date: date | None
    image_url: str


class MuseumRead(BaseModel):
    """List-item shape: everything a museum card needs."""

    id: int
    name: str
    category: Category
    description: str
    city: str
    address: str
    latitude: float
    longitude: float
    image_url: str
    opening_hours: str
    admission_fee: float
    avg_rating: float
    review_count: int


class MuseumDetail(MuseumRead):
    contact: str
    exhibitions: list[ExhibitionRead]


class CategoryRead(BaseModel):
    value: str
    label: str


# ---------------------------------------------------------------- reviews


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewRead(BaseModel):
    id: int
    museum_id: int
    museum_name: str
    user_id: int
    user_name: str
    rating: int
    comment: str | None
    created_at: datetime


# ---------------------------------------------------------------- bookings


class BookingCreate(BaseModel):
    museum_id: int
    visit_date: date
    time_slot: str
    num_tickets: int = Field(ge=1, le=6)


class BookingRead(BaseModel):
    id: int
    museum: MuseumRead
    visit_date: date
    time_slot: str
    num_tickets: int
    total_price: float
    status: BookingStatus
    reference: str
    created_at: datetime


TokenResponse.model_rebuild()
