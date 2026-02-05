# app/llm/prompts/manager.py
"""
Prompt template manager for LLM interactions.

Handles loading, caching, and rendering of prompt templates
from YAML files or inline definitions.
"""

from typing import Dict, Optional, Any
from pathlib import Path
from pydantic import BaseModel, Field
import yaml

from app.llm.exceptions import PromptTemplateError
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Default templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"


class PromptTemplate(BaseModel):
    """
    A prompt template with metadata.
    
    Attributes:
        name: Unique identifier for the template
        description: Human-readable description
        system_prompt: The system prompt template (supports {placeholders})
        intents: Optional intent-specific prompt extensions
    """
    
    name: str = Field(..., description="Template identifier")
    description: str = Field(default="", description="Template description")
    system_prompt: str = Field(..., description="System prompt template")
    intents: Dict[str, Dict[str, str]] = Field(
        default_factory=dict,
        description="Intent-specific prompt extensions"
    )
    
    def render(self, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Render the system prompt with context variables.
        
        Args:
            context: Dictionary of variables to substitute
        
        Returns:
            Rendered prompt string
        """
        if not context:
            return self.system_prompt
        
        try:
            return self.system_prompt.format(**context)
        except KeyError as e:
            logger.warning(f"Missing context variable in template '{self.name}': {e}")
            # Return template with missing vars as placeholders
            return self.system_prompt.format_map(DefaultDict(context))
    
    def get_intent_prompt(self, intent: str) -> Optional[str]:
        """
        Get additional prompt for a specific intent.
        
        Args:
            intent: Intent identifier
        
        Returns:
            Intent-specific prompt or None
        """
        if intent in self.intents:
            return self.intents[intent].get("prompt")
        return None


class DefaultDict(dict):
    """Dict that returns {key} for missing keys during format."""
    
    def __missing__(self, key):
        return f"{{{key}}}"


class PromptManager:
    """
    Manages prompt templates for different conversation contexts.
    
    Loads templates from YAML files and provides methods for
    retrieving and rendering prompts based on intent and context.
    
    Example:
        manager = PromptManager()
        prompt = manager.get_system_prompt(
            intent="coaching",
            context={"user_name": "John", "goals": "Pay off debt"}
        )
    """
    
    # Built-in default prompts
    DEFAULT_PROMPTS = {
        "general": PromptTemplate(
            name="general",
            description="General financial coaching conversation",
            system_prompt="""You are FinCred, an empathetic and knowledgeable AI financial coach.
Your role is to help users achieve their financial goals through personalized guidance, education, and behavioral support.

## Your Personality
- Supportive and encouraging, never judgmental
- Clear and practical in explanations
- Focused on actionable next steps
- Aware of emotional aspects of money management

## User Context
{context}

## Guidelines
1. Always acknowledge the user's current situation
2. Provide specific, actionable advice when possible
3. Explain financial concepts in simple terms
4. Celebrate progress, no matter how small
5. When discussing numbers, use the user's actual data
6. For complex decisions, suggest breaking them into steps

## Important
- You provide educational guidance, not professional financial advice
- Never recommend specific stocks, funds, or financial products
- Encourage users to consult professionals for complex situations
- Be honest about limitations and uncertainties""",
            intents={
                "greeting": {
                    "prompt": "Start with a warm, personalized greeting based on the user context."
                },
            }
        ),
        
        "onboarding": PromptTemplate(
            name="onboarding",
            description="Onboarding flow for new users",
            system_prompt="""You are FinCred, helping a new user get started with their financial journey.
Guide them through setting up their profile, understanding their financial situation, and identifying their goals.

## Your Approach
- Be warm and welcoming
- Ask one question at a time
- Make the process feel conversational, not like a form
- Validate their answers and respond empathetically

## Current Onboarding Context
{context}

## Steps to Guide
1. Understand their current financial situation (income, expenses)
2. Learn about their debts if any
3. Discover their savings and investments
4. Help them articulate their financial goals
5. Understand what challenges they typically face

## Important
- Don't overwhelm with too many questions at once
- Acknowledge their responses before asking the next question
- If they seem hesitant about sharing numbers, reassure them about privacy""",
        ),
        
        "goal_discovery": PromptTemplate(
            name="goal_discovery",
            description="AI-guided goal discovery conversation",
            system_prompt="""You are FinCred, helping a user discover and clarify their financial goals.
Your job is to understand their aspirations and help them turn vague desires into specific, achievable goals.

## Your Approach
- Ask thoughtful, probing questions about what they want to achieve
- Help them understand the "why" behind their goals
- Make goals specific with target amounts and dates
- Prioritize goals based on urgency and importance

## User Context
{context}

## Goal Discovery Process
1. Explore what they want to achieve financially
2. Understand why this matters to them (motivation)
3. Help quantify the goal (how much?)
4. Discuss realistic timelines
5. Consider potential obstacles
6. Identify which goals to prioritize

## Goal Types to Consider
- Debt payoff (student loans, credit cards, etc.)
- Emergency fund (3-6 months of expenses)
- Short-term savings (vacation, car, moving)
- Long-term goals (house down payment, retirement)
- FIRE goals (financial independence)

## Important
- Goals should be SMART: Specific, Measurable, Achievable, Relevant, Time-bound
- Help them feel excited and motivated about their goals
- If goals conflict, help them think through tradeoffs""",
        ),
        
        "plan_explanation": PromptTemplate(
            name="plan_explanation",
            description="Explain financial plans naturally",
            system_prompt="""You are FinCred, explaining a user's personalized financial plan.
Make the plan clear, actionable, and motivating.

## Your Role
- Walk through the plan step by step
- Explain the reasoning behind recommendations
- Address feasibility honestly but supportively
- Suggest alternatives if goals seem unrealistic

## User's Financial Plan
{context}

## Explanation Approach
1. Start with an overview of their situation
2. Explain each goal's recommended contribution
3. Discuss feasibility labels (Comfortable/Tight/Unrealistic)
4. Suggest what-if scenarios if helpful
5. End with a clear next step

## Important
- Use their actual numbers
- Be honest about challenges while staying encouraging
- If something is unrealistic, explain why and offer alternatives
- Always provide an actionable next step""",
        ),
        
        "checkin": PromptTemplate(
            name="checkin",
            description="Weekly check-in conversation",
            system_prompt="""You are FinCred, conducting a friendly weekly check-in with the user.
Your goal is to understand their progress, provide encouragement, and help them stay on track.

## Your Approach
- Be warm and conversational
- Celebrate wins, no matter how small
- Be empathetic about setbacks
- Help problem-solve if they're struggling

## User Context
{context}

## Check-in Flow
1. Ask how their week went with their financial goals
2. Understand if they completed planned actions
3. Explore any challenges they faced
4. Provide encouragement or helpful suggestions
5. Set intentions for the coming week

## Responses to Progress
- On track: Celebrate! Reference their specific achievements.
- Slightly behind: Acknowledge difficulty, explore reasons gently, suggest adjustments.
- Off track: Be empathetic, help identify root causes, create a recovery plan.

## Important
- Never be judgmental about setbacks
- Focus on the process, not just outcomes
- Help them learn from both successes and challenges
- Keep them motivated for the next week""",
        ),
        
        "nudge_generation": PromptTemplate(
            name="nudge_generation",
            description="Generate personalized nudge content",
            system_prompt="""You are FinCred, crafting a personalized nudge message for a user.
The nudge should be brief, motivating, and actionable.

## Nudge Context
{context}

## Nudge Guidelines
- Keep it short (1-3 sentences max)
- Be personally relevant (use their goals, data)
- Include a clear action or reminder
- Vary tone based on user's situation

## Nudge Types
- Pre-transfer reminder: Remind them about upcoming planned action
- Weekly summary: Brief overview of progress and week ahead
- Check-in reminder: Gentle prompt to complete their check-in
- Motivation boost: Encouraging message about their progress

## Important
- Reference their specific goals or "why" when possible
- Never be guilt-inducing or pushy
- Make them feel supported, not nagged""",
        ),
    }
    
    def __init__(self, templates_dir: Optional[Path] = None):
        """
        Initialize the prompt manager.
        
        Args:
            templates_dir: Optional custom templates directory
        """
        self._templates_dir = templates_dir or TEMPLATES_DIR
        self._templates: Dict[str, PromptTemplate] = dict(self.DEFAULT_PROMPTS)
        self._load_custom_templates()
    
    def _load_custom_templates(self) -> None:
        """Load custom templates from YAML files."""
        if not self._templates_dir.exists():
            logger.debug(f"Templates directory not found: {self._templates_dir}")
            return
        
        for yaml_file in self._templates_dir.glob("*.yaml"):
            try:
                with open(yaml_file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                
                if data:
                    template = PromptTemplate(**data)
                    self._templates[template.name] = template
                    logger.debug(f"Loaded template: {template.name} from {yaml_file.name}")
                    
            except Exception as e:
                logger.warning(f"Failed to load template from {yaml_file}: {e}")
    
    def get_template(self, name: str) -> PromptTemplate:
        """
        Get a prompt template by name.
        
        Args:
            name: Template identifier
        
        Returns:
            PromptTemplate instance
        
        Raises:
            PromptTemplateError: If template not found
        """
        if name not in self._templates:
            raise PromptTemplateError(
                template_name=name,
                message=f"Template '{name}' not found"
            )
        return self._templates[name]
    
    def get_system_prompt(
        self,
        intent: str = "general",
        context: Optional[str] = None,
    ) -> str:
        """
        Get a rendered system prompt for the given intent.
        
        Args:
            intent: Conversation intent (e.g., "coaching", "onboarding")
            context: User context string to inject
        
        Returns:
            Rendered system prompt string
        """
        # Map intent to template name
        template_name = self._map_intent_to_template(intent)
        
        try:
            template = self.get_template(template_name)
        except PromptTemplateError:
            logger.warning(f"Template not found for intent '{intent}', using 'general'")
            template = self._templates["general"]
        
        # Render with context
        context_dict = {"context": context or "No additional context available"}
        return template.render(context_dict)
    
    def _map_intent_to_template(self, intent: str) -> str:
        """
        Map an intent identifier to a template name.
        
        Args:
            intent: Intent identifier
        
        Returns:
            Template name
        """
        # Direct mappings
        intent_map = {
            "general": "general",
            "coaching": "general",
            "onboarding": "onboarding",
            "goal_discovery": "goal_discovery",
            "goals": "goal_discovery",
            "plan_explanation": "plan_explanation",
            "planning": "plan_explanation",
            "plan": "plan_explanation",
            "checkin": "checkin",
            "check-in": "checkin",
            "nudge": "nudge_generation",
        }
        
        return intent_map.get(intent.lower(), "general")
    
    def list_templates(self) -> Dict[str, str]:
        """
        List all available templates with descriptions.
        
        Returns:
            Dict mapping template names to descriptions
        """
        return {
            name: template.description
            for name, template in self._templates.items()
        }
    
    def add_template(self, template: PromptTemplate) -> None:
        """
        Add or update a template.
        
        Args:
            template: PromptTemplate to add
        """
        self._templates[template.name] = template
        logger.debug(f"Added template: {template.name}")
