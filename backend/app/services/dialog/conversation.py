# app/services/dialog/conversation.py
"""
Main conversation service for AI-powered dialog.

Manages conversation sessions, message handling, and response generation
using the LLM fallback chain and prompt templates.
"""

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
from app.core.logging_config import get_logger
from sqlmodel import Session

logger = get_logger(__name__)


class ConversationSession(BaseModel):
    """
    Represents an active conversation session.
    
    Stores message history and session metadata for continuity
    across multiple exchanges.
    """
    
    id: UUID = Field(default_factory=uuid4)
    user_id: int
    messages: List[Message] = Field(default_factory=list)
    intent: str = "general"
    context_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        """Allow arbitrary types for UUID."""
        arbitrary_types_allowed = True
    
    def add_message(self, role: str, content: str) -> None:
        """Add a message to the session history."""
        self.messages.append(Message(role=role, content=content))
        self.updated_at = datetime.utcnow()
    
    def get_recent_messages(self, limit: int = 20) -> List[Message]:
        """Get the most recent messages for context."""
        # Always include system message if present
        result = []
        
        for msg in self.messages:
            if msg.role == "system":
                result.append(msg)
                break
        
        # Add recent non-system messages
        non_system = [m for m in self.messages if m.role != "system"]
        result.extend(non_system[-limit:])
        
        return result


class ConversationService:
    """
    Manages AI-powered conversations with users.
    
    Provides session management, context building, and response
    generation through the LLM fallback chain.
    
    Example:
        service = ConversationService(llm=chain, prompt_manager=pm, db=db)
        session = await service.start_session(user, intent="coaching")
        response = await service.send_message(session.id, "Hello!", user)
    """
    
    # In-memory session storage (for MVP)
    # In production, use Redis or database storage
    _sessions: Dict[UUID, ConversationSession] = {}
    
    # Safety disclaimer for financial advice
    SAFETY_DISCLAIMER = (
        "\n\n*This is educational guidance, not professional financial advice. "
        "Please consult a qualified financial advisor for personalized recommendations.*"
    )
    
    def __init__(
        self,
        llm: FallbackChain,
        prompt_manager: PromptManager,
        db: Session,
    ):
        """
        Initialize the conversation service.
        
        Args:
            llm: LLM fallback chain for generation
            prompt_manager: Prompt template manager
            db: Database session for context building
        """
        self.llm = llm
        self.prompts = prompt_manager
        self.db = db
        self.context_builder = ContextBuilder(db)
        self.intent_detector = IntentDetector()
    
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
        
        # Build user context
        context = self.context_builder.build(user)
        
        # Get system prompt for intent
        system_prompt = self.prompts.get_system_prompt(
            intent=intent,
            context=context.to_prompt_string(),
        )
        
        # Create session with system message
        session = ConversationSession(
            id=session_id,
            user_id=user.id,
            intent=intent,
            context_snapshot=context.model_dump(),
        )
        session.add_message("system", system_prompt)
        
        # Store session
        self._sessions[session_id] = session
        
        logger.info(f"Started conversation session {session_id} for user {user.id} with intent '{intent}'")
        
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
        # Get or create session
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
        else:
            # Auto-detect intent for new sessions
            detected = self.intent_detector.detect(user_message)
            intent_name = self.intent_detector.get_intent_for_prompt(detected.intent)
            session = await self.start_session(user, intent=intent_name)
        
        # Validate message
        if not user_message or not user_message.strip():
            raise ConversationError(
                message="Message cannot be empty",
                session_id=str(session.id)
            )
        
        # Add user message
        session.add_message("user", user_message)
        
        try:
            # Generate response
            messages = session.get_recent_messages()
            response = await self.llm.generate(messages=messages)
            
            # Add assistant response
            session.add_message("assistant", response.content)
            
            # Add safety disclaimer for financial advice
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
                details={"error": str(e)}
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
        # Get or create session
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
        else:
            detected = self.intent_detector.detect(user_message)
            intent_name = self.intent_detector.get_intent_for_prompt(detected.intent)
            session = await self.start_session(user, intent=intent_name)
        
        # Validate message
        if not user_message or not user_message.strip():
            raise ConversationError(
                message="Message cannot be empty",
                session_id=str(session.id)
            )
        
        # Add user message
        session.add_message("user", user_message)
        
        try:
            messages = session.get_recent_messages()
            full_response = ""
            
            async for token in self.llm.stream(messages=messages):
                full_response += token
                yield token
            
            # Store complete response
            session.add_message("assistant", full_response)
            
            # Yield disclaimer at end if needed
            if self._needs_disclaimer(full_response):
                yield self.SAFETY_DISCLAIMER
                
        except Exception as e:
            logger.error(f"Streaming failed: {e}")
            raise ConversationError(
                message="Streaming failed. Please try again.",
                session_id=str(session.id),
                details={"error": str(e)}
            )
    
    def get_session(self, session_id: UUID) -> Optional[ConversationSession]:
        """Get an existing session by ID."""
        return self._sessions.get(session_id)
    
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
            logger.info(f"Cleared conversation session {session_id}")
            return True
        return False
    
    def get_user_sessions(self, user_id: int) -> List[ConversationSession]:
        """Get all sessions for a user."""
        return [s for s in self._sessions.values() if s.user_id == user_id]
    
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
        session = self._sessions.get(session_id)
        if not session:
            return False
        
        # Rebuild context
        context = self.context_builder.build(user)
        session.context_snapshot = context.model_dump()
        
        # Update system prompt
        system_prompt = self.prompts.get_system_prompt(
            intent=session.intent,
            context=context.to_prompt_string(),
        )
        
        # Replace system message
        if session.messages and session.messages[0].role == "system":
            session.messages[0] = Message(role="system", content=system_prompt)
        else:
            session.messages.insert(0, Message(role="system", content=system_prompt))
        
        session.updated_at = datetime.utcnow()
        
        logger.debug(f"Refreshed context for session {session_id}")
        return True
    
    def _needs_disclaimer(self, text: str) -> bool:
        """
        Check if response contains financial advice needing a disclaimer.
        
        Args:
            text: Response text to check
        
        Returns:
            True if disclaimer should be added
        """
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
        """Get total number of active sessions."""
        return len(self._sessions)
    
    def cleanup_stale_sessions(self, max_age_hours: int = 24) -> int:
        """
        Remove sessions older than max_age_hours.
        
        Args:
            max_age_hours: Maximum session age in hours
        
        Returns:
            Number of sessions removed
        """
        from datetime import timedelta
        
        cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
        stale_ids = [
            sid for sid, session in self._sessions.items()
            if session.updated_at < cutoff
        ]
        
        for sid in stale_ids:
            del self._sessions[sid]
        
        if stale_ids:
            logger.info(f"Cleaned up {len(stale_ids)} stale conversation sessions")
        
        return len(stale_ids)
