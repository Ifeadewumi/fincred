# app/services/dialog/conversation.py
"""
Main conversation service for AI-powered dialog.

Manages conversation sessions, message handling, and response generation
using the LLM fallback chain and prompt templates.
Supports both in-memory caching and database persistence.
"""

import json
from typing import List, Optional, AsyncIterator, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from pydantic import BaseModel, Field

from app.llm.providers.base import Message, LLMResponse
from app.llm.providers.fallback import FallbackChain
from app.llm.prompts.manager import PromptManager
from app.llm.exceptions import ConversationError
from app.services.dialog.context import ContextBuilder, DialogContext
from app.services.dialog.intents import IntentDetector, Intent
from app.models.user import User
from app.models.conversation import ConversationSessionTable, ConversationMessageTable
from app.core.logging_config import get_logger
from sqlmodel import Session as DBSession

logger = get_logger(__name__)


def message_to_dict(msg: Message) -> dict:
    """Convert Message to dict for JSON storage."""
    return {"role": msg.role, "content": msg.content}


def dict_to_message(d: dict) -> Message:
    """Convert dict back to Message."""
    return Message(role=d["role"], content=d["content"])


class ConversationSession(BaseModel):
    """
    Represents an active conversation session.

    Stores message history and session metadata for continuity
    across multiple exchanges.
    """

    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    messages: List[Message] = Field(default_factory=list)
    intent: str = "general"
    context_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the session history."""
        self.messages.append(Message(role=role, content=content))
        self.updated_at = datetime.utcnow()

    def get_recent_messages(self, limit: int = 20) -> List[Message]:
        """Get the most recent messages for context."""
        result = []
        for msg in self.messages:
            if msg.role == "system":
                result.append(msg)
                break
        non_system = [m for m in self.messages if m.role != "system"]
        result.extend(non_system[-limit:])
        return result

    def to_dict(self) -> dict:
        """Convert session to dict for JSON storage."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "intent": self.intent,
            "messages": [message_to_dict(m) for m in self.messages],
            "context_snapshot": self.context_snapshot,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_table(cls, table: ConversationSessionTable) -> "ConversationSession":
        """Create ConversationSession from database table."""
        messages = [
            dict_to_message(m) for m in json.loads(table.message_history or "[]")
        ]
        return cls(
            id=table.id,
            user_id=table.user_id,
            intent=table.intent,
            messages=messages,
            context_snapshot=json.loads(table.message_history)
            if table.message_history
            else None,
            created_at=table.created_at,
            updated_at=table.updated_at,
        )


class ConversationService:
    """
    Manages AI-powered conversations with users.

    Provides session management, context building, and response
    generation through the LLM fallback chain.

    Features:
    - Database persistence for sessions and messages
    - In-memory cache for performance
    - Automatic sync between cache and database

    Example:
        service = ConversationService(llm=chain, prompt_manager=pm, db=db)
        session = await service.start_session(user, intent="coaching")
        response = await service.send_message(session.id, "Hello!", user)
    """

    SAFETY_DISCLAIMER = (
        "\n\n*This is educational guidance, not professional financial advice. "
        "Please consult a qualified financial advisor for personalized recommendations.*"
    )

    def __init__(
        self,
        llm: FallbackChain,
        prompt_manager: PromptManager,
        db: DBSession,
    ):
        """
        Initialize the conversation service.

        Args:
            llm: LLM fallback chain for generation
            prompt_manager: Prompt template manager
            db: Database session for persistence
        """
        self.llm = llm
        self.prompts = prompt_manager
        self.db = db
        self._sessions: Dict[UUID, ConversationSession] = {}
        self.context_builder = ContextBuilder(db)
        self.intent_detector = IntentDetector()

    def _save_session(self, session: ConversationSession) -> None:
        """Save or update session in database."""
        messages_json = json.dumps([message_to_dict(m) for m in session.messages])

        existing = (
            self.db.query(ConversationSessionTable)
            .filter(ConversationSessionTable.id == session.id)
            .first()
        )

        if existing:
            existing.intent = session.intent
            existing.message_history = messages_json
            existing.context_snapshot = (
                json.dumps(session.context_snapshot)
                if session.context_snapshot
                else None
            )
            existing.updated_at = datetime.utcnow()
        else:
            session_table = ConversationSessionTable(
                id=session.id,
                user_id=session.user_id,
                intent=session.intent,
                message_history=messages_json,
                context_snapshot=json.dumps(session.context_snapshot)
                if session.context_snapshot
                else None,
            )
            self.db.add(session_table)

        self.db.commit()

    def _save_message(self, session_id: UUID, role: str, content: str) -> None:
        """Save individual message to database."""
        msg_table = ConversationMessageTable(
            session_id=session_id,
            role=role,
            content=content,
        )
        self.db.add(msg_table)
        self.db.commit()

    async def start_session(
        self,
        user: User,
        intent: str = "general",
    ) -> ConversationSession:
        """
        Start a new conversation session.

        Args:
            user: User starting the conversation
            intent: Initial conversation intent

        Returns:
            New ConversationSession
        """
        session_id = uuid4()

        context = self.context_builder.build(user)

        system_prompt = self.prompts.get_system_prompt(
            intent=intent,
            context=context.to_prompt_string(),
        )

        session = ConversationSession(
            id=session_id,
            user_id=user.id,
            intent=intent,
            context_snapshot=context.model_dump(),
        )
        session.add_message("system", system_prompt)

        self._sessions[session_id] = session
        self._save_session(session)

        logger.info(
            f"Started conversation session {session_id} for user {user.id} with intent '{intent}'"
        )

        return session

    async def send_message(
        self,
        session_id: Optional[UUID],
        user_message: str,
        user: User,
    ) -> str:
        """
        Send a message and get AI response.

        Args:
            session_id: Session ID (creates new if None)
            user_message: User's message
            user: Current user

        Returns:
            AI response text
        """
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
        else:
            if session_id:
                session = self._load_session(session_id)
            if session is None:
                detected = self.intent_detector.detect(user_message)
                intent_name = self.intent_detector.get_intent_for_prompt(
                    detected.intent
                )
                session = await self.start_session(user, intent=intent_name)

        if not user_message or not user_message.strip():
            raise ConversationError(
                message="Message cannot be empty", session_id=str(session.id)
            )

        session.add_message("user", user_message)
        self._save_message(session.id, "user", user_message)
        self._save_session(session)

        try:
            messages = session.get_recent_messages()
            response = await self.llm.generate(messages=messages)

            session.add_message("assistant", response.content)
            self._save_message(session.id, "assistant", response.content)
            self._save_session(session)

            final_response = response.content
            if self._needs_disclaimer(response.content):
                final_response += self.SAFETY_DISCLAIMER

            logger.debug(f"Generated response for session {session.id}")

            return final_response

        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise ConversationError(
                message="Failed to generate response. Please try again.",
                session_id=str(session.id),
                details={"error": str(e)},
            )

    async def stream_message(
        self,
        session_id: Optional[UUID],
        user_message: str,
        user: User,
    ) -> AsyncIterator[str]:
        """
        Stream a response token by token.

        Args:
            session_id: Session ID (creates new if None)
            user_message: User's message
            user: Current user

        Yields:
            Response tokens as they are generated
        """
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
        else:
            if session_id:
                session = self._load_session(session_id)
            if session is None:
                detected = self.intent_detector.detect(user_message)
                intent_name = self.intent_detector.get_intent_for_prompt(
                    detected.intent
                )
                session = await self.start_session(user, intent=intent_name)

        if not user_message or not user_message.strip():
            raise ConversationError(
                message="Message cannot be empty", session_id=str(session.id)
            )

        session.add_message("user", user_message)
        self._save_message(session.id, "user", user_message)
        self._save_session(session)

        try:
            messages = session.get_recent_messages()
            full_response = ""

            async for token in self.llm.stream(messages=messages):
                full_response += token
                yield token

            session.add_message("assistant", full_response)
            self._save_message(session.id, "assistant", full_response)
            self._save_session(session)

            if self._needs_disclaimer(full_response):
                yield self.SAFETY_DISCLAIMER

        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            raise ConversationError(
                message="Streaming failed. Please try again.",
                session_id=str(session.id),
                details={"error": str(e)},
            )

    def _load_session(self, session_id: UUID) -> Optional[ConversationSession]:
        """Load session from database into cache."""
        table = (
            self.db.query(ConversationSessionTable)
            .filter(ConversationSessionTable.id == session_id)
            .first()
        )

        if table:
            session = ConversationSession.from_table(table)
            self._sessions[session_id] = session
            return session
        return None

    def get_session(self, session_id: UUID) -> Optional[ConversationSession]:
        """Get an existing session by ID."""
        if session_id in self._sessions:
            return self._sessions[session_id]
        return self._load_session(session_id)

    def clear_session(self, session_id: UUID) -> bool:
        """
        Clear and delete a conversation session.

        Args:
            session_id: Session to clear

        Returns:
            True if session was found and cleared
        """
        if session_id in self._sessions:
            del self._sessions[session_id]

        table = (
            self.db.query(ConversationSessionTable)
            .filter(ConversationSessionTable.id == session_id)
            .first()
        )

        if table:
            self.db.delete(table)
            self.db.commit()
            logger.info(f"Cleared conversation session {session_id}")
            return True
        return False

    def get_user_sessions(self, user_id: UUID) -> List[ConversationSession]:
        """Get all sessions for a user."""
        user_sessions = [s for s in self._sessions.values() if s.user_id == user_id]

        db_sessions = (
            self.db.query(ConversationSessionTable)
            .filter(ConversationSessionTable.user_id == user_id)
            .all()
        )

        for table in db_sessions:
            if table.id not in [s.id for s in user_sessions]:
                session = ConversationSession.from_table(table)
                self._sessions[table.id] = session
                user_sessions.append(session)

        return user_sessions

    def refresh_context(self, session_id: UUID, user: User) -> bool:
        """
        Refresh the context for an existing session.

        Rebuilds the system prompt with fresh user data.

        Args:
            session_id: Session to refresh
            user: User for context

        Returns:
            True if session was refreshed
        """
        session = self.get_session(session_id)
        if not session:
            return False

        context = self.context_builder.build(user)
        session.context_snapshot = context.model_dump()

        system_prompt = self.prompts.get_system_prompt(
            intent=session.intent,
            context=context.to_prompt_string(),
        )

        if session.messages and session.messages[0].role == "system":
            session.messages[0] = Message(role="system", content=system_prompt)
        else:
            session.messages.insert(0, Message(role="system", content=system_prompt))

        session.updated_at = datetime.utcnow()
        self._save_session(session)

        logger.debug(f"Refreshed context for session {session_id}")
        return True

    def _needs_disclaimer(self, text: str) -> bool:
        """Check if response contains financial advice needing a disclaimer."""
        advice_indicators = [
            "recommend",
            "should invest",
            "i suggest",
            "my advice",
            "you should",
            "consider investing",
            "put your money",
            "best strategy",
            "optimal approach",
        ]
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in advice_indicators)

    def get_session_count(self) -> int:
        """Get total number of active sessions (in-memory cache)."""
        return len(self._sessions)

    def cleanup_stale_sessions(self, max_age_hours: int = 24) -> int:
        """Remove sessions older than max_age_hours from cache and database."""
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)

        stale_ids = [
            sid
            for sid, session in self._sessions.items()
            if session.updated_at < cutoff
        ]

        for sid in stale_ids:
            del self._sessions[sid]

        self.db.query(ConversationSessionTable).filter(
            ConversationSessionTable.updated_at < cutoff
        ).delete()
        self.db.commit()

        if stale_ids:
            logger.info(f"Cleaned up {len(stale_ids)} stale conversation sessions")

        return len(stale_ids)
