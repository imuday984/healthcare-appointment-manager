import json

from fastapi.testclient import TestClient

from app.agents.router import classify_intent
from app.database.init_db import init_db
from app.database.session import SessionLocal
from app.main import app
from app.rag.service import rag_service
from app.services.approvals import ApprovalService
from app.tools.travel import TravelTools


def setup_module():
    init_db()
    rag_service.index_documents()


client = TestClient(app)


def test_primary_routing():
    route = classify_intent("Find flights from Chennai to Delhi")
    assert route.selected_agent == "Flight Assistant"
    assert route.tool_name == "search_flights"


def test_flight_search():
    db = SessionLocal()
    data = TravelTools(db).search_flights("Chennai", "Delhi")
    db.close()
    assert len(data) >= 1


def test_hotel_search():
    db = SessionLocal()
    data = TravelTools(db).search_hotels("Goa")
    db.close()
    assert len(data) >= 1


def test_rag_retrieval():
    res = rag_service.search("What is the cancellation policy?")
    assert any("cancellation" in chunk.lower() for chunk in res.context)


def test_booking_creation_with_approval():
    response = client.post("/api/chat", json={"user_id": 1, "message": "Book hotel in Goa"})
    assert response.status_code == 200
    body = response.json()
    assert body["approval_required"] is True


def test_approval_creation():
    response = client.get("/api/approvals", params={"user_id": 1})
    assert response.status_code == 200
    approvals = response.json()
    assert len(approvals) >= 1
    assert approvals[0]["status"] in {"PENDING", "APPROVED", "REJECTED"}


def test_approved_transaction():
    create = client.post("/api/chat", json={"user_id": 1, "message": "Book hotel in Goa"}).json()
    approval_id = create["approval"]["approval_id"]
    approved = client.post(f"/api/approvals/{approval_id}/approve")
    assert approved.status_code == 200
    assert approved.json()["status"] == "APPROVED"


def test_rejected_transaction():
    create = client.post("/api/chat", json={"user_id": 1, "message": "Book hotel in Goa"}).json()
    approval_id = create["approval"]["approval_id"]
    rejected = client.post(f"/api/approvals/{approval_id}/reject")
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "REJECTED"


def test_ownership_validation():
    response = client.post("/api/chat", json={"user_id": 1, "message": "Cancel flight FL-9999"})
    assert response.status_code == 200
    assert "could not verify booking ownership" in response.json()["response"].lower()


def test_cancellation_flow():
    create = client.post("/api/chat", json={"user_id": 1, "message": "Cancel flight FL-1001"}).json()
    approval_id = create["approval"]["approval_id"]
    approve = client.post(f"/api/approvals/{approval_id}/approve")
    assert approve.status_code == 200

    booking = client.get("/api/bookings/FL-1001", params={"user_id": 1}).json()
    assert booking["status"] == "CANCELLED"
