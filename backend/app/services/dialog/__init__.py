# app/services/dialog/__init__.py
"""
Dialog services module for conversational AI.

Provides session management, context building, and conversation
handling for AI-powered financial coaching.
"""

from app.services.dialog.context import DialogContext, ContextBuilder
from app.services.dialog.conversation import ConversationService, ConversationSession
from app.services.dialog.intents import Intent, IntentDetector

__all__ = [
    "DialogContext",
    "ContextBuilder",
    "ConversationService",
    "ConversationSession",
    "Intent",
    "IntentDetector",
]
