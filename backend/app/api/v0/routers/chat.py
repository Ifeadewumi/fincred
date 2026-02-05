# app/api/v0/routers/chat.py
"""
Chat/Conversation API endpoints.

Provides REST and streaming endpoints for AI-powered
financial coaching conversations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List

from app.api.v0.deps import get_current_user, get_db
from app.models.user import User
from app.services.dialog.conversation import ConversationService, ConversationSession
from app.services.dialog.intents import Intent
from app.llm.providers.fallback import FallbackChain
from app.llm.providers.gemini import GeminiProvider
from app.llm.prompts.manager import PromptManager
from app.llm.exceptions import AllProvidersFailedError, ConversationError
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


# ============================================================================
# Request/Response Models
# ============================================================================

class StartSessionRequest(BaseModel):
    """Request to start a new conversation session."""
    
    intent: str = Field(
        default="general",
        description="Conversation intent: general, onboarding, goal_discovery, planning, checkin"
    )


class StartSessionResponse(BaseModel):
    """Response when starting a new session."""
    
    session_id: UUID
    greeting: str
    intent: str


class SendMessageRequest(BaseModel):
    """Request to send a message."""
    
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message (1-4000 characters)"
    )
    session_id: Optional[UUID] = Field(
        default=None,
        description="Session ID (optional, auto-creates if not provided)"
    )


class SendMessageResponse(BaseModel):
    """Response containing AI message."""
    
    session_id: UUID
    response: str
    intent: Optional[str] = None


class SessionInfo(BaseModel):
    """Information about a conversation session."""
    
    session_id: UUID
    intent: str
    message_count: int
    created_at: str
    updated_at: str


class HealthResponse(BaseModel):
    """LLM health check response."""
    
    llm_available: bool
    active_sessions: int
    providers: List[str]


# ============================================================================
# Helper Functions
# ============================================================================

def get_conversation_service(db: Session) -> ConversationService:
    """
    Factory to create ConversationService with configured LLM.
    
    Args:
        db: Database session
    
    Returns:
        Configured ConversationService
    
    Raises:
        HTTPException: If no LLM providers are configured
    """
    # Check for API key
    if not hasattr(settings, 'GOOGLE_AI_API_KEY') or not settings.GOOGLE_AI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service not configured. Please set GOOGLE_AI_API_KEY in environment."
        )
    
    # Parse model chain
    model_chain = getattr(settings, 'LLM_MODEL_CHAIN', 'gemini-2.0-flash,gemini-1.5-flash')
    models = [m.strip() for m in model_chain.split(",") if m.strip()]
    
    if not models:
        models = ["gemini-2.0-flash"]
    
    # Get generation settings
    temperature = getattr(settings, 'LLM_TEMPERATURE', 0.7)
    max_tokens = getattr(settings, 'LLM_MAX_TOKENS', 4096)
    timeout = getattr(settings, 'LLM_TIMEOUT', 30)
    
    # Create providers for each model in chain
    providers = []
    for model in models:
        try:
            provider = GeminiProvider(
                api_key=settings.GOOGLE_AI_API_KEY,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout,
            )
            if provider.is_available():
                providers.append(provider)
                logger.debug(f"Added Gemini provider: {model}")
        except Exception as e:
            logger.warning(f"Failed to initialize provider for {model}: {e}")
    
    if not providers:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No LLM providers could be initialized. Check API key and model names."
        )
    
    # Create fallback chain
    llm = FallbackChain(providers)
    
    # Create prompt manager
    prompts = PromptManager()
    
    return ConversationService(llm=llm, prompt_manager=prompts, db=db)


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/start",
    response_model=StartSessionResponse,
    summary="Start a new conversation",
    description="Start a new conversation session with an optional intent for context.",
)
async def start_conversation(
    request: StartSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a new conversation session.
    
    Creates a session with the specified intent and returns an initial
    greeting from the AI coach.
    """
    try:
        service = get_conversation_service(db)
        session = await service.start_session(user, intent=request.intent)
        
        # Generate initial greeting
        greeting = await service.send_message(
            session_id=session.id,
            user_message="Hello! I'm ready to start.",
            user=user,
        )
        
        return StartSessionResponse(
            session_id=session.id,
            greeting=greeting,
            intent=request.intent,
        )
        
    except AllProvidersFailedError as e:
        logger.error(f"All LLM providers failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Failed to start conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start conversation"
        )


@router.post(
    "/message",
    response_model=SendMessageResponse,
    summary="Send a message",
    description="Send a message and receive an AI response.",
)
async def send_message(
    request: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message and get AI response.
    
    If session_id is not provided, a new session will be created
    with auto-detected intent based on the message content.
    """
    try:
        service = get_conversation_service(db)
        
        response = await service.send_message(
            session_id=request.session_id,
            user_message=request.message,
            user=user,
        )
        
        # Get session for intent info
        session = None
        if request.session_id:
            session = service.get_session(request.session_id)
        
        return SendMessageResponse(
            session_id=request.session_id or UUID("00000000-0000-0000-0000-000000000000"),
            response=response,
            intent=session.intent if session else None,
        )
        
    except ConversationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except AllProvidersFailedError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again later."
        )
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.post(
    "/message/stream",
    summary="Stream a message response",
    description="Send a message and receive streaming AI response (Server-Sent Events).",
)
async def stream_message(
    request: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream a response token by token using Server-Sent Events.
    
    Returns a streaming response with content-type text/event-stream.
    Each token is sent as a data event. Stream ends with [DONE].
    """
    try:
        service = get_conversation_service(db)
        
        async def generate():
            """Async generator for SSE stream."""
            try:
                async for token in service.stream_message(
                    session_id=request.session_id,
                    user_message=request.message,
                    user=user,
                ):
                    # Escape newlines for SSE
                    escaped = token.replace("\n", "\\n")
                    yield f"data: {escaped}\n\n"
                
                yield "data: [DONE]\n\n"
                
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"data: [ERROR] {str(e)}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to start streaming: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start streaming response"
        )


@router.get(
    "/session/{session_id}",
    response_model=SessionInfo,
    summary="Get session info",
    description="Get information about an existing conversation session.",
)
async def get_session(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get information about a conversation session."""
    service = get_conversation_service(db)
    session = service.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verify ownership
    if session.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this session"
        )
    
    return SessionInfo(
        session_id=session.id,
        intent=session.intent,
        message_count=len(session.messages),
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.delete(
    "/session/{session_id}",
    summary="End conversation",
    description="End and clear a conversation session.",
)
async def end_conversation(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End and clear a conversation session."""
    service = get_conversation_service(db)
    session = service.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verify ownership
    if session.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this session"
        )
    
    service.clear_session(session_id)
    
    return {"status": "cleared", "session_id": str(session_id)}


@router.post(
    "/session/{session_id}/refresh",
    summary="Refresh session context",
    description="Refresh the user context in an existing session.",
)
async def refresh_session(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Refresh the context for an existing session.
    
    Useful after the user updates their financial data and wants
    the AI to have the latest information.
    """
    service = get_conversation_service(db)
    session = service.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Verify ownership
    if session.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this session"
        )
    
    refreshed = service.refresh_context(session_id, user)
    
    return {"status": "refreshed" if refreshed else "failed", "session_id": str(session_id)}


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check LLM health",
    description="Check if the LLM service is available.",
)
async def check_llm_health(
    db: Session = Depends(get_db),
):
    """
    Check LLM service health.
    
    Returns availability status, active session count, and configured providers.
    """
    try:
        service = get_conversation_service(db)
        
        return HealthResponse(
            llm_available=service.llm.is_available(),
            active_sessions=service.get_session_count(),
            providers=[str(p) for p in service.llm.providers],
        )
        
    except HTTPException as e:
        return HealthResponse(
            llm_available=False,
            active_sessions=0,
            providers=[],
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            llm_available=False,
            active_sessions=0,
            providers=[],
        )
