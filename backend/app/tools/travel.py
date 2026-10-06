from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.models import Booking, BookingStatus, CarRental, Excursion, Flight, Hotel


class TravelTools:
    def __init__(self, db: Session):
        self.db = db

    # Flight
    def search_flights(self, origin: str | None = None, destination: str | None = None):
        query = self.db.query(Flight)
        if origin:
            query = query.filter(Flight.origin.ilike(origin))
        if destination:
            query = query.filter(Flight.destination.ilike(destination))
        return [
            {
                "id": f.id,
                "flight_code": f.flight_code,
                "origin": f.origin,
                "destination": f.destination,
                "travel_date": f.travel_date,
                "departure_time": f.departure_time,
                "price": f.price,
                "seats_available": f.seats_available,
            }
            for f in query.all()
        ]

    def get_flight(self, flight_code: str):
        flight = self.db.query(Flight).filter(Flight.flight_code == flight_code).first()
        if not flight:
            return None
        return {
            "id": flight.id,
            "flight_code": flight.flight_code,
            "origin": flight.origin,
            "destination": flight.destination,
            "travel_date": flight.travel_date,
            "departure_time": flight.departure_time,
            "price": flight.price,
            "seats_available": flight.seats_available,
        }

    # Hotel
    def search_hotels(self, city: str | None = None):
        query = self.db.query(Hotel)
        if city:
            query = query.filter(Hotel.city.ilike(city))
        return [
            {
                "id": h.id,
                "name": h.name,
                "city": h.city,
                "price_per_night": h.price_per_night,
                "rating": h.rating,
                "rooms_available": h.rooms_available,
            }
            for h in query.all()
        ]

    def get_hotel(self, hotel_id: int):
        hotel = self.db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            return None
        return {
            "id": hotel.id,
            "name": hotel.name,
            "city": hotel.city,
            "price_per_night": hotel.price_per_night,
            "rating": hotel.rating,
            "rooms_available": hotel.rooms_available,
        }

    # Car
    def search_cars(self, city: str | None = None):
        query = self.db.query(CarRental)
        if city:
            query = query.filter(CarRental.city.ilike(city))
        return [
            {
                "id": c.id,
                "company": c.company,
                "city": c.city,
                "car_model": c.car_model,
                "price_per_day": c.price_per_day,
                "units_available": c.units_available,
            }
            for c in query.all()
        ]

    # Excursion
    def search_excursions(self, destination: str | None = None):
        query = self.db.query(Excursion)
        if destination:
            query = query.filter(Excursion.destination.ilike(destination))
        return [
            {
                "id": e.id,
                "excursion_code": e.excursion_code,
                "destination": e.destination,
                "duration_days": e.duration_days,
                "summary": e.summary,
                "price": e.price,
            }
            for e in query.all()
        ]

    def get_booking(self, booking_id: str, user_id: int):
        booking = self.db.query(Booking).filter(Booking.booking_id == booking_id, Booking.user_id == user_id).first()
        if not booking:
            return None
        return self._serialize_booking(booking)

    def list_bookings(self, user_id: int):
        bookings = self.db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.updated_at.desc()).all()
        return [self._serialize_booking(b) for b in bookings]

    def execute_action(self, user_id: int, action: str, payload: dict):
        action = action.lower()
        if action == "book_flight":
            flight = self.db.query(Flight).filter(Flight.id == payload["flight_id"]).first()
            if not flight or flight.seats_available <= 0:
                raise ValueError("Flight unavailable for booking")
            flight.seats_available -= 1
            booking = Booking(
                booking_id=f"FL-{1000 + int(datetime.utcnow().timestamp()) % 9000}",
                user_id=user_id,
                booking_type="FLIGHT",
                resource_id=flight.id,
                details=json.dumps({"flight_code": flight.flight_code, "route": f"{flight.origin}-{flight.destination}"}),
                start_date=flight.travel_date,
                status=BookingStatus.CONFIRMED,
            )
            self.db.add(booking)
            self.db.commit()
            return self._serialize_booking(booking)

        if action == "book_hotel":
            hotel = self.db.query(Hotel).filter(Hotel.id == payload["hotel_id"]).first()
            if not hotel or hotel.rooms_available <= 0:
                raise ValueError("Hotel unavailable for booking")
            hotel.rooms_available -= 1
            booking = Booking(
                booking_id=f"HT-{2000 + int(datetime.utcnow().timestamp()) % 9000}",
                user_id=user_id,
                booking_type="HOTEL",
                resource_id=hotel.id,
                details=json.dumps({"hotel": hotel.name, "city": hotel.city, "nights": payload.get("nights", 1)}),
                start_date=payload.get("check_in"),
                end_date=payload.get("check_out"),
                status=BookingStatus.CONFIRMED,
            )
            self.db.add(booking)
            self.db.commit()
            return self._serialize_booking(booking)

        if action == "book_car":
            car = self.db.query(CarRental).filter(CarRental.id == payload["car_id"]).first()
            if not car or car.units_available <= 0:
                raise ValueError("Car unavailable for booking")
            car.units_available -= 1
            booking = Booking(
                booking_id=f"CAR-{3000 + int(datetime.utcnow().timestamp()) % 9000}",
                user_id=user_id,
                booking_type="CAR",
                resource_id=car.id,
                details=json.dumps({"car": car.car_model, "city": car.city}),
                start_date=payload.get("start_date"),
                end_date=payload.get("end_date"),
                status=BookingStatus.CONFIRMED,
            )
            self.db.add(booking)
            self.db.commit()
            return self._serialize_booking(booking)

        if action == "book_excursion":
            excursion = self.db.query(Excursion).filter(Excursion.id == payload["excursion_id"]).first()
            if not excursion:
                raise ValueError("Excursion unavailable")
            booking = Booking(
                booking_id=f"EX-{4000 + int(datetime.utcnow().timestamp()) % 9000}",
                user_id=user_id,
                booking_type="EXCURSION",
                resource_id=excursion.id,
                details=json.dumps({"destination": excursion.destination, "summary": excursion.summary}),
                start_date=payload.get("start_date"),
                end_date=payload.get("end_date"),
                status=BookingStatus.CONFIRMED,
            )
            self.db.add(booking)
            self.db.commit()
            return self._serialize_booking(booking)

        if action in {"cancel_flight", "cancel_hotel", "cancel_car", "cancel_excursion", "update_flight", "update_hotel", "update_car", "update_excursion"}:
            booking = self.db.query(Booking).filter(Booking.booking_id == payload["booking_id"], Booking.user_id == user_id).first()
            if not booking:
                raise ValueError("Booking not found or not owned by user")
            if action.startswith("cancel"):
                booking.status = BookingStatus.CANCELLED
            else:
                booking.status = BookingStatus.UPDATED
                current_details = json.loads(booking.details)
                current_details.update(payload.get("changes", {}))
                booking.details = json.dumps(current_details)
            self.db.commit()
            return self._serialize_booking(booking)

        raise ValueError(f"Unsupported action {action}")

    def _serialize_booking(self, booking: Booking):
        return {
            "booking_id": booking.booking_id,
            "user_id": booking.user_id,
            "booking_type": booking.booking_type,
            "status": booking.status.value,
            "details": json.loads(booking.details),
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "updated_at": booking.updated_at,
        }
