# app/services/dialog/intents.py
"""
Intent detection utilities for dialog sessions.

Provides intent classification and routing for different
conversation types and user requests.
"""

from enum import Enum
from typing import Optional, List, Tuple
from pydantic import BaseModel, Field


class Intent(str, Enum):
    """
    Conversation intents that determine prompt selection and behavior.
    """
    
    # Core intents
    GENERAL = "general"
    GREETING = "greeting"
    
    # Onboarding intents
    ONBOARDING = "onboarding"
    PROFILE_SETUP = "profile_setup"
    
    # Goal-related intents
    GOAL_DISCOVERY = "goal_discovery"
    GOAL_CREATE = "goal_create"
    GOAL_UPDATE = "goal_update"
    GOAL_STATUS = "goal_status"
    
    # Planning intents
    PLAN_EXPLANATION = "plan_explanation"
    PLAN_WHATIF = "plan_whatif"
    
    # Tracking intents
    CHECKIN = "checkin"
    PROGRESS_UPDATE = "progress_update"
    
    # Education intents
    EDUCATION = "education"
    EXPLAIN_CONCEPT = "explain_concept"
    
    # Action intents
    ACTION_SETUP = "action_setup"
    NUDGE = "nudge"
    
    # Utility intents
    HELP = "help"
    FEEDBACK = "feedback"
    GOODBYE = "goodbye"


class IntentMatch(BaseModel):
    """
    Result of intent detection.
    
    Attributes:
        intent: Detected intent
        confidence: Confidence score (0.0 to 1.0)
        extracted_entities: Any entities extracted from the message
    """
    
    intent: Intent
    confidence: float = Field(ge=0.0, le=1.0)
    extracted_entities: dict = Field(default_factory=dict)


class IntentDetector:
    """
    Detects user intent from messages using keyword matching.
    
    This is a simple rule-based implementation for MVP.
    Could be upgraded to use LLM-based classification later.
    """
    
    # Keyword patterns for each intent
    PATTERNS: dict[Intent, List[str]] = {
        Intent.GREETING: [
            "hello", "hi", "hey", "good morning", "good afternoon",
            "good evening", "howdy", "what's up", "sup"
        ],
        Intent.GOODBYE: [
            "bye", "goodbye", "see you", "later", "thanks", "thank you",
            "that's all", "done", "exit", "quit"
        ],
        Intent.HELP: [
            "help", "how do i", "how can i", "what can you do",
            "confused", "don't understand", "explain"
        ],
        Intent.GOAL_DISCOVERY: [
            "goal", "goals", "want to save", "want to pay",
            "trying to", "my target", "achieve", "planning to",
            "financial goal", "set a goal"
        ],
        Intent.GOAL_CREATE: [
            "create goal", "new goal", "add goal", "set goal",
            "start saving", "start paying"
        ],
        Intent.GOAL_STATUS: [
            "my goals", "goal progress", "how am i doing",
            "on track", "goal status", "check goal"
        ],
        Intent.PLAN_EXPLANATION: [
            "my plan", "explain plan", "show plan", "what's my plan",
            "how much should i", "recommendation", "suggest"
        ],
        Intent.PLAN_WHATIF: [
            "what if", "if i", "what happens", "scenario",
            "could i", "would it work", "alternative"
        ],
        Intent.CHECKIN: [
            "check in", "checkin", "weekly check", "how was my week",
            "update progress", "weekly update"
        ],
        Intent.PROGRESS_UPDATE: [
            "made a payment", "transferred", "saved", "paid off",
            "update balance", "progress update"
        ],
        Intent.EDUCATION: [
            "what is", "explain", "teach me", "learn about",
            "how does", "difference between", "meaning of"
        ],
        Intent.ACTION_SETUP: [
            "set up transfer", "automate", "automatic", "schedule",
            "recurring", "remind me"
        ],
        Intent.ONBOARDING: [
            "just started", "new here", "getting started",
            "first time", "how to start", "begin"
        ],
        Intent.PROFILE_SETUP: [
            "my income", "my expenses", "i make", "i spend",
            "my salary", "update profile"
        ],
    }
    
    def detect(self, message: str) -> IntentMatch:
        """
        Detect intent from a user message.
        
        Args:
            message: User's message text
        
        Returns:
            IntentMatch with detected intent and confidence
        """
        message_lower = message.lower().strip()
        
        # Score each intent based on keyword matches
        scores: List[Tuple[Intent, float, dict]] = []
        
        for intent, patterns in self.PATTERNS.items():
            match_count = sum(1 for p in patterns if p in message_lower)
            if match_count > 0:
                # Simple confidence based on match count
                confidence = min(match_count / len(patterns) * 2, 1.0)
                scores.append((intent, confidence, {}))
        
        # Sort by confidence
        scores.sort(key=lambda x: x[1], reverse=True)
        
        if scores:
            best = scores[0]
            return IntentMatch(
                intent=best[0],
                confidence=best[1],
                extracted_entities=best[2]
            )
        
        # Default to general intent
        return IntentMatch(
            intent=Intent.GENERAL,
            confidence=0.5,
            extracted_entities={}
        )
    
    def detect_multiple(self, message: str, threshold: float = 0.3) -> List[IntentMatch]:
        """
        Detect all matching intents above a confidence threshold.
        
        Args:
            message: User's message text
            threshold: Minimum confidence threshold
        
        Returns:
            List of IntentMatch objects sorted by confidence
        """
        message_lower = message.lower().strip()
        matches: List[IntentMatch] = []
        
        for intent, patterns in self.PATTERNS.items():
            match_count = sum(1 for p in patterns if p in message_lower)
            if match_count > 0:
                confidence = min(match_count / len(patterns) * 2, 1.0)
                if confidence >= threshold:
                    matches.append(IntentMatch(
                        intent=intent,
                        confidence=confidence
                    ))
        
        return sorted(matches, key=lambda x: x.confidence, reverse=True)
    
    def get_intent_for_prompt(self, intent: Intent) -> str:
        """
        Get the prompt template name for an intent.
        
        Args:
            intent: Intent enum value
        
        Returns:
            Prompt template name
        """
        # Map intents to prompt templates
        mapping = {
            Intent.GENERAL: "general",
            Intent.GREETING: "general",
            Intent.ONBOARDING: "onboarding",
            Intent.PROFILE_SETUP: "onboarding",
            Intent.GOAL_DISCOVERY: "goal_discovery",
            Intent.GOAL_CREATE: "goal_discovery",
            Intent.GOAL_UPDATE: "goal_discovery",
            Intent.GOAL_STATUS: "general",
            Intent.PLAN_EXPLANATION: "plan_explanation",
            Intent.PLAN_WHATIF: "plan_explanation",
            Intent.CHECKIN: "checkin",
            Intent.PROGRESS_UPDATE: "checkin",
            Intent.EDUCATION: "general",
            Intent.EXPLAIN_CONCEPT: "general",
            Intent.ACTION_SETUP: "general",
            Intent.NUDGE: "nudge_generation",
            Intent.HELP: "general",
            Intent.FEEDBACK: "general",
            Intent.GOODBYE: "general",
        }
        
        return mapping.get(intent, "general")
