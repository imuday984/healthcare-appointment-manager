import json

from sqlalchemy.orm import Session

from app.database.models import Booking, BookingStatus, CarRental, Excursion, Flight, Hotel, User


def seed_demo_data(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    user = User(name="Demo Traveler", email="traveler@example.com")
    db.add(user)
    db.flush()

    flights = [
        Flight(flight_code="AI-211", origin="Chennai", destination="Delhi", travel_date="2026-10-15", departure_time="09:30", price=5200, seats_available=18),
        Flight(flight_code="6E-404", origin="Mumbai", destination="Goa", travel_date="2026-10-17", departure_time="14:00", price=4200, seats_available=22),
    ]
    hotels = [
        Hotel(name="Goa Coral Resort", city="Goa", price_per_night=4500, rating=4.4, rooms_available=16),
        Hotel(name="Delhi Sky Stay", city="Delhi", price_per_night=5200, rating=4.2, rooms_available=10),
    ]
    cars = [
        CarRental(company="CityDrive", city="Mumbai", car_model="Hyundai Creta", price_per_day=2800, units_available=8),
        CarRental(company="GoRide", city="Goa", car_model="Maruti Brezza", price_per_day=2400, units_available=6),
    ]
    excursions = [
        Excursion(excursion_code="EX-501", destination="Kerala", duration_days=5, summary="Backwaters, Munnar tea trails, and Alleppey houseboat itinerary.", price=18500),
        Excursion(excursion_code="EX-502", destination="Jaipur", duration_days=3, summary="City palace tour, local food walk, and Amer Fort visit.", price=9900),
    ]

    db.add_all(flights + hotels + cars + excursions)
    db.flush()

    bookings = [
        Booking(
            booking_id="FL-1001",
            user_id=user.id,
            booking_type="FLIGHT",
            resource_id=flights[0].id,
            details=json.dumps({"flight_code": flights[0].flight_code, "route": "Chennai-Delhi"}),
            start_date="2026-10-15",
            status=BookingStatus.CONFIRMED,
        ),
        Booking(
            booking_id="HT-2001",
            user_id=user.id,
            booking_type="HOTEL",
            resource_id=hotels[0].id,
            details=json.dumps({"hotel": hotels[0].name, "city": hotels[0].city, "nights": 3}),
            start_date="2026-10-20",
            end_date="2026-10-23",
            status=BookingStatus.CONFIRMED,
        ),
        Booking(
            booking_id="CAR-3001",
            user_id=user.id,
            booking_type="CAR",
            resource_id=cars[0].id,
            details=json.dumps({"car": cars[0].car_model, "city": cars[0].city}),
            start_date="2026-10-20",
            end_date="2026-10-22",
            status=BookingStatus.CONFIRMED,
        ),
    ]
    db.add_all(bookings)
    db.commit()
