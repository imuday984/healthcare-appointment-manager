from datetime import datetime
from pydantic import BaseModel


class BookingOut(BaseModel):
    booking_id: str
    user_id: int
    booking_type: str
    status: str
    details: dict
    start_date: str | None = None
    end_date: str | None = None
    updated_at: datetime


class ApprovalOut(BaseModel):
    id: int
    user_id: int
    booking_id: str | None = None
    action: str
    description: str
    status: str
    created_at: datetime


class ApprovalActionResponse(BaseModel):
    approval_id: int
    status: str
    message: str
    booking_id: str | None = None
    booking_status: str | None = None
