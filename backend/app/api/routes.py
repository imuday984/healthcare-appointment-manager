import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database.models import ApprovalRequest, Booking, CarRental, Excursion, Flight, Hotel
from app.database.session import get_db
from app.graph.workflow import run_workflow
from app.rag.service import rag_service
from app.schemas.booking import ApprovalActionResponse, ApprovalOut, BookingOut
from app.schemas.chat import ChatRequest, ChatResponse, ConversationMessageOut, ConversationOut, RAGSearchRequest, RAGSearchResponse, RAGStatusResponse
from app.schemas.common import HealthResponse
from app.services.approvals import ApprovalService
from app.services.conversations import ConversationService
from app.tools.travel import TravelTools

router = APIRouter(prefix="/api")
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", demo_mode=settings.demo_mode)


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    conv_service = ConversationService(db)
    convo = conv_service.get_or_create(payload.user_id, payload.conversation_id)

    _, old_messages = conv_service.conversation_detail(convo.conversation_id)
    history = [{"role": m.role, "content": m.content} for m in old_messages]
    user_message = {"role": "user", "content": payload.message}
    history.append(user_message)

    conv_service.add_message(convo.id, "user", payload.message)
    result = run_workflow(db, payload.user_id, convo.conversation_id, history)

    conv_service.add_message(
        convo.id,
        "assistant",
        result.get("final_response", ""),
        agent=result.get("selected_agent"),
        intent=result.get("intent"),
        tool=result.get("tool_name"),
        sources=result.get("sources", []),
    )

    return ChatResponse(
        conversation_id=convo.conversation_id,
        response=result.get("final_response", ""),
        agent=result.get("selected_agent", "Primary Assistant"),
        intent=result.get("intent", "GENERAL_QUERY"),
        tool=result.get("tool_name"),
        sources=result.get("sources", []),
        approval_required=result.get("approval_required", False),
        approval=result.get("approval"),
        workflow_stage=result.get("workflow_stage", "completed"),
    )


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(user_id: int = 1, db: Session = Depends(get_db)):
    conv_service = ConversationService(db)
    conversations = conv_service.list_conversations(user_id)
    out = []
    for convo in conversations:
        _, messages = conv_service.conversation_detail(convo.conversation_id)
        out.append(
            ConversationOut(
                conversation_id=convo.conversation_id,
                user_id=convo.user_id,
                created_at=convo.created_at,
                messages=[
                    ConversationMessageOut(
                        role=m.role,
                        content=m.content,
                        agent=m.agent,
                        intent=m.intent,
                        tool=m.tool,
                        sources=json.loads(m.sources or "[]"),
                        created_at=m.created_at,
                    )
                    for m in messages
                ],
            )
        )
    return out


@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv_service = ConversationService(db)
    convo, messages = conv_service.conversation_detail(conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationOut(
        conversation_id=convo.conversation_id,
        user_id=convo.user_id,
        created_at=convo.created_at,
        messages=[
            ConversationMessageOut(
                role=m.role,
                content=m.content,
                agent=m.agent,
                intent=m.intent,
                tool=m.tool,
                sources=json.loads(m.sources or "[]"),
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.get("/bookings", response_model=list[BookingOut])
def get_bookings(user_id: int = 1, db: Session = Depends(get_db)):
    tools = TravelTools(db)
    return [BookingOut(**b) for b in tools.list_bookings(user_id)]


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, user_id: int = 1, db: Session = Depends(get_db)):
    tools = TravelTools(db)
    booking = tools.get_booking(booking_id, user_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingOut(**booking)


@router.get("/approvals", response_model=list[ApprovalOut])
def get_approvals(user_id: int = 1, db: Session = Depends(get_db)):
    approvals = ApprovalService(db).list_requests(user_id)
    return [
        ApprovalOut(
            id=a.id,
            user_id=a.user_id,
            booking_id=a.booking_id,
            action=a.action,
            description=a.description,
            status=a.status.value,
            created_at=a.created_at,
        )
        for a in approvals
    ]


@router.post("/approvals/{approval_id}/approve", response_model=ApprovalActionResponse)
def approve_action(approval_id: int, db: Session = Depends(get_db)):
    try:
        approval, booking = ApprovalService(db).resolve(approval_id, approved=True)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ApprovalActionResponse(
        approval_id=approval.id,
        status=approval.status.value,
        message="Sensitive action executed successfully." if booking else "Approval was already processed.",
        booking_id=booking.get("booking_id") if booking else approval.booking_id,
        booking_status=booking.get("status") if booking else None,
    )


@router.post("/approvals/{approval_id}/reject", response_model=ApprovalActionResponse)
def reject_action(approval_id: int, db: Session = Depends(get_db)):
    try:
        approval, _ = ApprovalService(db).resolve(approval_id, approved=False)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ApprovalActionResponse(
        approval_id=approval.id,
        status=approval.status.value,
        message="Sensitive action rejected.",
        booking_id=approval.booking_id,
        booking_status=None,
    )


@router.get("/rag/status", response_model=RAGStatusResponse)
def rag_status():
    return RAGStatusResponse(**rag_service.status())


@router.post("/rag/search", response_model=RAGSearchResponse)
def rag_search(payload: RAGSearchRequest):
    result = rag_service.search(payload.query, payload.top_k)
    return RAGSearchResponse(answer=result.answer, sources=result.sources, context=result.context)


@router.get("/flights")
def list_flights(origin: str | None = None, destination: str | None = None, db: Session = Depends(get_db)):
    return TravelTools(db).search_flights(origin, destination)


@router.get("/hotels")
def list_hotels(city: str | None = None, db: Session = Depends(get_db)):
    return TravelTools(db).search_hotels(city)


@router.get("/cars")
def list_cars(city: str | None = None, db: Session = Depends(get_db)):
    return TravelTools(db).search_cars(city)


@router.get("/excursions")
def list_excursions(destination: str | None = None, db: Session = Depends(get_db)):
    return TravelTools(db).search_excursions(destination)
