import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    UPDATED = "UPDATED"
    CANCELLED = "CANCELLED"


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False)


class Flight(Base):
    __tablename__ = "flights"
    id = Column(Integer, primary_key=True)
    flight_code = Column(String(30), unique=True, nullable=False)
    origin = Column(String(80), nullable=False)
    destination = Column(String(80), nullable=False)
    travel_date = Column(String(40), nullable=False)
    departure_time = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    seats_available = Column(Integer, nullable=False)


class Hotel(Base):
    __tablename__ = "hotels"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    city = Column(String(80), nullable=False)
    price_per_night = Column(Float, nullable=False)
    rating = Column(Float, nullable=False)
    rooms_available = Column(Integer, nullable=False)


class CarRental(Base):
    __tablename__ = "car_rentals"
    id = Column(Integer, primary_key=True)
    company = Column(String(120), nullable=False)
    city = Column(String(80), nullable=False)
    car_model = Column(String(120), nullable=False)
    price_per_day = Column(Float, nullable=False)
    units_available = Column(Integer, nullable=False)


class Excursion(Base):
    __tablename__ = "excursions"
    id = Column(Integer, primary_key=True)
    excursion_code = Column(String(40), unique=True, nullable=False)
    destination = Column(String(80), nullable=False)
    duration_days = Column(Integer, nullable=False)
    summary = Column(Text, nullable=False)
    price = Column(Float, nullable=False)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    booking_id = Column(String(40), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_type = Column(String(40), nullable=False)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=False)
    start_date = Column(String(40), nullable=True)
    end_date = Column(String(40), nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")


class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(String(64), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    agent = Column(String(80), nullable=True)
    intent = Column(String(60), nullable=True)
    tool = Column(String(80), nullable=True)
    sources = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(String(40), nullable=True)
    action = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    payload = Column(Text, nullable=False)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    processed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User")
