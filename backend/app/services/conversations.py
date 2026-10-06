import json
import uuid

from sqlalchemy.orm import Session

from app.database.models import Conversation, ConversationMessage


class ConversationService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, user_id: int, conversation_id: str | None):
        if conversation_id:
            convo = self.db.query(Conversation).filter(Conversation.conversation_id == conversation_id, Conversation.user_id == user_id).first()
            if convo:
                return convo
        convo = Conversation(user_id=user_id, conversation_id=str(uuid.uuid4()))
        self.db.add(convo)
        self.db.commit()
        self.db.refresh(convo)
        return convo

    def add_message(self, db_conversation_id: int, role: str, content: str, agent: str | None = None, intent: str | None = None, tool: str | None = None, sources: list[str] | None = None):
        message = ConversationMessage(
            conversation_id=db_conversation_id,
            role=role,
            content=content,
            agent=agent,
            intent=intent,
            tool=tool,
            sources=json.dumps(sources or []),
        )
        self.db.add(message)
        self.db.commit()
        return message

    def list_conversations(self, user_id: int):
        return self.db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).all()

    def conversation_detail(self, conversation_id: str):
        convo = self.db.query(Conversation).filter(Conversation.conversation_id == conversation_id).first()
        if not convo:
            return None, []
        messages = self.db.query(ConversationMessage).filter(ConversationMessage.conversation_id == convo.id).order_by(ConversationMessage.created_at.asc()).all()
        return convo, messages
