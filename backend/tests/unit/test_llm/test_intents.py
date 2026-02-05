# tests/unit/test_llm/test_intents.py
"""Unit tests for intent detection."""

import pytest
from app.services.dialog.intents import Intent, IntentDetector, IntentMatch


class TestIntent:
    """Tests for Intent enum."""
    
    def test_intent_values(self):
        """Test that key intents exist."""
        assert Intent.GENERAL == "general"
        assert Intent.GREETING == "greeting"
        assert Intent.GOAL_DISCOVERY == "goal_discovery"
        assert Intent.CHECKIN == "checkin"
        assert Intent.ONBOARDING == "onboarding"
    
    def test_intent_is_string(self):
        """Test that Intent values are strings."""
        assert isinstance(Intent.GENERAL.value, str)


class TestIntentMatch:
    """Tests for IntentMatch model."""
    
    def test_match_creation(self):
        """Test creating an intent match."""
        match = IntentMatch(
            intent=Intent.GREETING,
            confidence=0.9
        )
        
        assert match.intent == Intent.GREETING
        assert match.confidence == 0.9
        assert match.extracted_entities == {}
    
    def test_match_with_entities(self):
        """Test match with extracted entities."""
        match = IntentMatch(
            intent=Intent.GOAL_CREATE,
            confidence=0.85,
            extracted_entities={"goal_type": "savings", "amount": 1000}
        )
        
        assert match.extracted_entities["goal_type"] == "savings"
    
    def test_confidence_bounds(self):
        """Test that confidence must be 0-1."""
        IntentMatch(intent=Intent.GENERAL, confidence=0.0)
        IntentMatch(intent=Intent.GENERAL, confidence=1.0)
        
        with pytest.raises(ValueError):
            IntentMatch(intent=Intent.GENERAL, confidence=-0.1)
        
        with pytest.raises(ValueError):
            IntentMatch(intent=Intent.GENERAL, confidence=1.1)


class TestIntentDetector:
    """Tests for IntentDetector."""
    
    def setup_method(self):
        """Set up test detector."""
        self.detector = IntentDetector()
    
    def test_detect_greeting(self):
        """Test detecting greeting intent."""
        match = self.detector.detect("hello there!")
        
        assert match.intent == Intent.GREETING
        assert match.confidence > 0
    
    def test_detect_goal_discovery(self):
        """Test detecting goal discovery intent."""
        match = self.detector.detect("I want to save for a house")
        
        assert match.intent == Intent.GOAL_DISCOVERY
    
    def test_detect_checkin(self):
        """Test detecting check-in intent."""
        match = self.detector.detect("time for my weekly check in")
        
        assert match.intent == Intent.CHECKIN
    
    def test_detect_help(self):
        """Test detecting help intent."""
        match = self.detector.detect("help me understand this")
        
        assert match.intent == Intent.HELP
    
    def test_detect_goodbye(self):
        """Test detecting goodbye intent."""
        match = self.detector.detect("thanks, goodbye!")
        
        assert match.intent == Intent.GOODBYE
    
    def test_detect_onboarding(self):
        """Test detecting onboarding intent."""
        match = self.detector.detect("I'm new here, just getting started")
        
        assert match.intent == Intent.ONBOARDING
    
    def test_detect_plan_whatif(self):
        """Test detecting what-if planning intent."""
        match = self.detector.detect("what if I increased my savings?")
        
        assert match.intent == Intent.PLAN_WHATIF
    
    def test_unknown_defaults_to_general(self):
        """Test that unknown messages default to general."""
        match = self.detector.detect("asdfghjkl random text xyz")
        
        assert match.intent == Intent.GENERAL
        assert match.confidence == 0.5  # Default confidence
    
    def test_case_insensitive(self):
        """Test that detection is case insensitive."""
        lower = self.detector.detect("hello")
        upper = self.detector.detect("HELLO")
        mixed = self.detector.detect("HeLLo")
        
        assert lower.intent == upper.intent == mixed.intent == Intent.GREETING
    
    def test_detect_multiple(self):
        """Test detecting multiple intents above threshold."""
        matches = self.detector.detect_multiple(
            "help me set a goal for saving",
            threshold=0.2
        )
        
        assert len(matches) > 1
        # Should be sorted by confidence
        assert matches[0].confidence >= matches[-1].confidence
    
    def test_get_intent_for_prompt(self):
        """Test getting prompt template for intent."""
        detector = IntentDetector()
        
        assert detector.get_intent_for_prompt(Intent.GENERAL) == "general"
        assert detector.get_intent_for_prompt(Intent.GOAL_DISCOVERY) == "goal_discovery"
        assert detector.get_intent_for_prompt(Intent.CHECKIN) == "checkin"
        assert detector.get_intent_for_prompt(Intent.ONBOARDING) == "onboarding"
    
    def test_real_world_messages(self):
        """Test with realistic user messages."""
        test_cases = [
            ("Hi! I'm ready to start managing my money.", Intent.GREETING),
            ("I want to save for a house", Intent.GOAL_DISCOVERY),
            ("How am I doing with my savings goal?", Intent.GOAL_STATUS),
            ("show me my plan recommendation", Intent.PLAN_EXPLANATION),
            ("time for my weekly check in", Intent.CHECKIN),
            ("teach me what is compound interest", Intent.EDUCATION),
            ("thanks, goodbye!", Intent.GOODBYE),
        ]
        
        for message, expected_intent in test_cases:
            match = self.detector.detect(message)
            assert match.intent == expected_intent, \
                f"Message '{message}' should be {expected_intent}, got {match.intent}"
