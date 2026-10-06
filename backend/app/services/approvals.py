import json

from sqlalchemy.orm import Session

from app.database.models import ApprovalRequest, ApprovalStatus
from app.tools.travel import TravelTools


SENSITIVE_ACTIONS = {
    "book_flight",
    "book_hotel",
    "book_car",
    "book_excursion",
    "update_flight",
    "update_hotel",
    "update_car",
    "update_excursion",
    "cancel_flight",
    "cancel_hotel",
    "cancel_car",
    "cancel_excursion",
}


class ApprovalService:
    def __init__(self, db: Session):
        self.db = db
        self.tools = TravelTools(db)

    def create_request(self, user_id: int, action: str, description: str, payload: dict, booking_id: str | None = None):
        approval = ApprovalRequest(
            user_id=user_id,
            booking_id=booking_id,
            action=action,
            description=description,
            payload=json.dumps(payload),
            status=ApprovalStatus.PENDING,
        )
        self.db.add(approval)
        self.db.commit()
        self.db.refresh(approval)
        return approval

    def list_requests(self, user_id: int | None = None):
        query = self.db.query(ApprovalRequest)
        if user_id:
            query = query.filter(ApprovalRequest.user_id == user_id)
        return query.order_by(ApprovalRequest.created_at.desc()).all()

    def resolve(self, approval_id: int, approved: bool):
        approval = self.db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        if not approval:
            raise ValueError("Approval request not found")
        if approval.processed:
            return approval, None

        approval.processed = True
        approval.status = ApprovalStatus.APPROVED if approved else ApprovalStatus.REJECTED
        booking = None
        if approved:
            booking = self.tools.execute_action(approval.user_id, approval.action, json.loads(approval.payload))
        self.db.commit()
        self.db.refresh(approval)
        return approval, booking
