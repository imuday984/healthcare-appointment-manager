from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: int = 1
    conversation_id: str | None = None
    message: str = Field(min_length=1, max_length=2000)


class ApprovalCard(BaseModel):
    approval_id: int
    action: str
    description: str
    status: str


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    agent: str
    intent: str
    tool: str | None = None
    sources: list[str] = []
    approval_required: bool = False
    approval: ApprovalCard | None = None
    workflow_stage: str


class ConversationMessageOut(BaseModel):
    role: str
    content: str
    agent: str | None = None
    intent: str | None = None
    tool: str | None = None
    sources: list[str] = []
    created_at: datetime


class ConversationOut(BaseModel):
    conversation_id: str
    user_id: int
    created_at: datetime
    messages: list[ConversationMessageOut]


class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 4


class RAGSearchResponse(BaseModel):
    answer: str
    sources: list[str]
    context: list[str]


class RAGStatusResponse(BaseModel):
    qdrant_available: bool
    collection: str
    document_count: int
    chunk_count: int
    embedding_model: str
    similarity_metric: str
    top_k: int


class ResourceItem(BaseModel):
    id: int
    data: dict[str, Any]
