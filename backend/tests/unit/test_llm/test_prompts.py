# tests/unit/test_llm/test_prompts.py
"""Unit tests for prompt template management."""

import pytest
from app.llm.prompts.manager import PromptManager, PromptTemplate
from app.llm.exceptions import PromptTemplateError


class TestPromptTemplate:
    """Tests for PromptTemplate class."""
    
    def test_template_creation(self):
        """Test creating a basic template."""
        template = PromptTemplate(
            name="test",
            description="Test template",
            system_prompt="Hello {name}!"
        )
        
        assert template.name == "test"
        assert template.description == "Test template"
        assert template.system_prompt == "Hello {name}!"
    
    def test_template_render_with_context(self):
        """Test rendering template with context variables."""
        template = PromptTemplate(
            name="test",
            system_prompt="Hello {name}, your balance is ${balance}."
        )
        
        result = template.render({"name": "John", "balance": "1000"})
        
        assert result == "Hello John, your balance is $1000."
    
    def test_template_render_without_context(self):
        """Test rendering template without context returns original."""
        template = PromptTemplate(
            name="test",
            system_prompt="Static prompt text"
        )
        
        result = template.render()
        
        assert result == "Static prompt text"
    
    def test_template_render_missing_variable(self):
        """Test rendering with missing variables keeps placeholder."""
        template = PromptTemplate(
            name="test",
            system_prompt="Hello {name}, balance: {balance}"
        )
        
        result = template.render({"name": "John"})
        
        assert "John" in result
        assert "{balance}" in result
    
    def test_template_with_intents(self):
        """Test template with intent-specific prompts."""
        template = PromptTemplate(
            name="coaching",
            system_prompt="You are a coach.",
            intents={
                "goal_discovery": {"prompt": "Help discover goals."},
                "checkin": {"prompt": "Analyze progress."}
            }
        )
        
        assert template.get_intent_prompt("goal_discovery") == "Help discover goals."
        assert template.get_intent_prompt("checkin") == "Analyze progress."
        assert template.get_intent_prompt("unknown") is None


class TestPromptManager:
    """Tests for PromptManager class."""
    
    def test_manager_has_default_templates(self):
        """Test that manager loads default templates."""
        manager = PromptManager()
        
        templates = manager.list_templates()
        
        assert "general" in templates
        assert "onboarding" in templates
        assert "goal_discovery" in templates
        assert "checkin" in templates
    
    def test_get_existing_template(self):
        """Test getting an existing template."""
        manager = PromptManager()
        
        template = manager.get_template("general")
        
        assert template is not None
        assert template.name == "general"
        assert template.system_prompt is not None
    
    def test_get_nonexistent_template_raises(self):
        """Test getting non-existent template raises error."""
        manager = PromptManager()
        
        with pytest.raises(PromptTemplateError):
            manager.get_template("nonexistent_template_xyz")
    
    def test_get_system_prompt_for_intent(self):
        """Test getting system prompt for a specific intent."""
        manager = PromptManager()
        
        prompt = manager.get_system_prompt(
            intent="coaching",
            context="User is a young professional."
        )
        
        assert prompt is not None
        assert "User is a young professional." in prompt
    
    def test_get_system_prompt_unknown_intent_defaults_to_general(self):
        """Test unknown intent falls back to general template."""
        manager = PromptManager()
        
        prompt = manager.get_system_prompt(
            intent="unknown_xyz",
            context="Some context"
        )
        
        # Should get general template
        assert prompt is not None
        assert "Some context" in prompt
    
    def test_add_custom_template(self):
        """Test adding a custom template."""
        manager = PromptManager()
        
        custom_template = PromptTemplate(
            name="custom",
            description="Custom test template",
            system_prompt="Custom prompt: {context}"
        )
        
        manager.add_template(custom_template)
        
        retrieved = manager.get_template("custom")
        assert retrieved.name == "custom"
        assert retrieved.description == "Custom test template"
    
    def test_intent_to_template_mapping(self):
        """Test that intents are correctly mapped to templates."""
        manager = PromptManager()
        
        # Test various intent mappings
        mappings = [
            ("general", "general"),
            ("coaching", "general"),
            ("onboarding", "onboarding"),
            ("goal_discovery", "goal_discovery"),
            ("goals", "goal_discovery"),
            ("checkin", "checkin"),
            ("check-in", "checkin"),
        ]
        
        for intent, expected_template in mappings:
            template_name = manager._map_intent_to_template(intent)
            assert template_name == expected_template, f"Intent '{intent}' should map to '{expected_template}'"
