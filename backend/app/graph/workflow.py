from __future__ import annotations

import json
from typing import Any, TypedDict

from sqlalchemy.orm import Session

from app.agents.router import is_sensitive, maybe_llm_route
from app.rag.service import rag_service
from app.services.approvals import ApprovalService
from app.tools.travel import TravelTools


class SupportState(TypedDict, total=False):
    user_id: int
    conversation_id: str
    messages: list[dict]
    intent: str
    selected_agent: str
    tool_name: str
    tool_arguments: dict
    retrieved_context: list[str]
    booking_id: str | None
    approval_required: bool
    approval_status: str
    final_response: str
    sources: list[str]
    tool_result: Any
    approval: dict | None
    workflow_stage: str


def _safe_tool_execute(state: SupportState, tools: TravelTools) -> SupportState:
    tool_name = state["tool_name"]
    args = state.get("tool_arguments", {})
    if tool_name == "search_flights":
        data = tools.search_flights(args.get("origin"), args.get("destination"))
    elif tool_name == "get_flight":
        data = tools.get_flight(args.get("flight_code", ""))
    elif tool_name == "search_hotels":
        data = tools.search_hotels(args.get("city"))
    elif tool_name == "get_hotel":
        data = tools.get_hotel(args.get("hotel_id", 0))
    elif tool_name == "search_cars":
        data = tools.search_cars(args.get("city"))
    elif tool_name == "search_excursions":
        data = tools.search_excursions(args.get("destination"))
    elif tool_name == "retrieve_booking":
        data = tools.get_booking(args["booking_id"], state["user_id"])
    else:
        data = []
    return {
        **state,
        "tool_result": data,
        "final_response": f"{state['selected_agent']} completed {tool_name} successfully.",
        "workflow_stage": "safe_tool_completed",
    }


def _sensitive_action_gate(state: SupportState, tools: TravelTools, approvals: ApprovalService) -> SupportState:
    args = state.get("tool_arguments", {})
    booking_id = args.get("booking_id")
    if booking_id and not tools.get_booking(booking_id, state["user_id"]):
        return {
            **state,
            "approval_required": False,
            "approval_status": "REJECTED",
            "final_response": "I could not verify booking ownership for this sensitive request.",
            "workflow_stage": "ownership_failed",
        }

    policy = rag_service.search("cancellation policy" if "cancel" in state["tool_name"] else "approval policy")
    description = f"{state['tool_name']} requires human approval. Policy: {policy.answer.splitlines()[0] if policy.answer else 'See policy docs.'}"
    approval = approvals.create_request(state["user_id"], state["tool_name"], description, args, booking_id)
    return {
        **state,
        "approval_required": True,
        "approval_status": "PENDING",
        "approval": {
            "approval_id": approval.id,
            "action": approval.action,
            "description": approval.description,
            "status": approval.status.value,
        },
        "sources": policy.sources,
        "retrieved_context": policy.context,
        "final_response": "Action requires approval before execution.",
        "workflow_stage": "approval_pending",
    }


def run_workflow(db: Session, user_id: int, conversation_id: str, messages: list[dict]) -> SupportState:
    tools = TravelTools(db)
    approvals = ApprovalService(db)
    decision = maybe_llm_route(messages[-1]["content"], messages)
    state: SupportState = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": messages,
        "intent": decision.intent,
        "selected_agent": decision.selected_agent,
        "tool_name": decision.tool_name,
        "tool_arguments": decision.tool_arguments,
        "approval_required": False,
        "approval_status": "NOT_REQUIRED",
        "sources": [],
        "retrieved_context": [],
        "booking_id": None,
        "final_response": "",
        "workflow_stage": "intent_classification",
    }

    if state["tool_name"] == "search_faq":
        result = rag_service.search(state["tool_arguments"].get("query") or messages[-1]["content"])
        state.update(
            {
                "retrieved_context": result.context,
                "sources": result.sources,
                "final_response": result.answer,
                "workflow_stage": "rag_response",
            }
        )
    elif is_sensitive(state["tool_name"]):
        state = _sensitive_action_gate(state, tools, approvals)
    else:
        state = _safe_tool_execute(state, tools)

    result = state
    if result.get("tool_result") is not None and isinstance(result["tool_result"], list):
        result["final_response"] = f"{result['final_response']}\n{json.dumps(result['tool_result'], indent=2, default=str)}"
    return result
