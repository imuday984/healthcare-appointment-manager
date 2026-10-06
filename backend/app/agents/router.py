from __future__ import annotations

import re
from dataclasses import dataclass

from app.core.config import get_settings


@dataclass
class RouteDecision:
    intent: str
    selected_agent: str
    tool_name: str
    tool_arguments: dict


def _extract_city_pair(message: str) -> tuple[str | None, str | None]:
    pattern = re.search(r"from\s+([a-zA-Z ]+)\s+to\s+([a-zA-Z ]+)", message, flags=re.IGNORECASE)
    if not pattern:
        return None, None
    return pattern.group(1).strip().title(), pattern.group(2).strip().title()


def _extract_after_keyword(message: str, keyword: str) -> str | None:
    match = re.search(rf"{keyword}\s+([a-zA-Z ]+)", message, flags=re.IGNORECASE)
    return match.group(1).strip().title() if match else None


def classify_intent(message: str, history: list[dict] | None = None) -> RouteDecision:
    text = message.lower()
    context_city = None
    for item in reversed(history or []):
        if item.get("role") == "user":
            maybe_city = _extract_after_keyword(item.get("content", ""), "visit")
            if maybe_city:
                context_city = maybe_city
                break

    if "cancellation policy" in text or "refund" in text or "policy" in text or "faq" in text:
        return RouteDecision("RAG_POLICY_QUERY", "Primary Assistant", "search_faq", {"query": message})

    if "flight" in text:
        booking_match = re.search(r"(fl-\d+)", text)
        if "cancel" in text and booking_match:
            booking_id = booking_match.group(1).upper()
            return RouteDecision("CANCEL_FLIGHT", "Flight Assistant", "cancel_flight", {"booking_id": booking_id})
        if "change" in text or "update" in text:
            booking_id = booking_match.group(1).upper() if booking_match else "FL-1001"
            return RouteDecision("UPDATE_FLIGHT", "Flight Assistant", "update_flight", {"booking_id": booking_id, "changes": {"request": "Schedule updated by user"}})
        origin, destination = _extract_city_pair(message)
        return RouteDecision("SEARCH_FLIGHTS", "Flight Assistant", "search_flights", {"origin": origin, "destination": destination})

    if "hotel" in text:
        if "book" in text:
            return RouteDecision("BOOK_HOTEL", "Hotel Assistant", "book_hotel", {"hotel_id": 1, "nights": 3, "check_in": "2026-10-20", "check_out": "2026-10-23"})
        city = _extract_after_keyword(message, "in") or context_city
        return RouteDecision("SEARCH_HOTELS", "Hotel Assistant", "search_hotels", {"city": city})

    if "car" in text or "rental" in text:
        if "book" in text or "rent" in text:
            if "update" in text or "change" in text:
                return RouteDecision("UPDATE_CAR", "Car Rental Assistant", "update_car", {"booking_id": "CAR-3001", "changes": {"request": "Updated pickup"}})
            return RouteDecision("BOOK_CAR", "Car Rental Assistant", "book_car", {"car_id": 1, "start_date": "2026-10-20", "end_date": "2026-10-22"})
        city = _extract_after_keyword(message, "in")
        return RouteDecision("SEARCH_CARS", "Car Rental Assistant", "search_cars", {"city": city})

    if "trip" in text or "excursion" in text or "itinerary" in text:
        if "book" in text:
            return RouteDecision("BOOK_EXCURSION", "Excursion Assistant", "book_excursion", {"excursion_id": 1, "start_date": "2026-11-01", "end_date": "2026-11-05"})
        destination = _extract_after_keyword(message, "to") or _extract_after_keyword(message, "for")
        return RouteDecision("SEARCH_EXCURSIONS", "Excursion Assistant", "search_excursions", {"destination": destination})

    return RouteDecision("GENERAL_QUERY", "Primary Assistant", "search_faq", {"query": message})


def is_sensitive(tool_name: str) -> bool:
    return tool_name.startswith("book_") or tool_name.startswith("update_") or tool_name.startswith("cancel_")


def maybe_llm_route(message: str, history: list[dict] | None = None) -> RouteDecision:
    settings = get_settings()
    if not settings.openai_api_key:
        return classify_intent(message, history)
    return classify_intent(message, history)
