# app/core/config.py
from typing import Literal, List
from pydantic import field_validator, ValidationInfo
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration settings.
    
    All sensitive values should be provided via environment variables.
    No hardcoded secrets are allowed in this file.
    """
    
    # Environment
    ENV: Literal["development", "staging", "production"] = "development"
    
    # Application
    PROJECT_NAME: str = "FinCred API"
    VERSION: str = "0.1.0"
    API_V0_PREFIX: str = "/api/v0"
    DEBUG: bool = False
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30  # seconds
    DB_POOL_RECYCLE: int = 3600  # 1 hour
    DB_ECHO: bool = False  # Set to True to log SQL queries
    
    # Security - JWT Configuration
    JWT_SECRET_KEY: str  # REQUIRED - No default value
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS Configuration
    CORS_ORIGINS: str | List[str] = "http://localhost:3000,http://localhost:8000"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Logging Configuration
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_FORMAT: Literal["json", "console"] = "console"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Email Configuration (for future use)
    EMAIL_PROVIDER: Literal["mock", "sendgrid", "ses"] = "mock"
    SENDGRID_API_KEY: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    
    # LLM Configuration
    GOOGLE_AI_API_KEY: str | None = None  # Google AI Studio API key
    VERTEX_AI_PROJECT: str | None = None  # Vertex AI project (alternative to API key)
    VERTEX_AI_LOCATION: str = "us-central1"
    
    # Model Chain (comma-separated, first is primary, rest are fallbacks)
    LLM_MODEL_CHAIN: str = "gemini-2.0-flash,gemini-1.5-flash"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 4096
    LLM_TIMEOUT: int = 30  # seconds
    
    # Optional: OpenAI fallback (for future use)
    OPENAI_API_KEY: str | None = None
    
    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info: ValidationInfo) -> str:
        """
        Ensure JWT_SECRET_KEY is set and meets minimum security requirements.
        """
        if not v or v.strip() == "":
            raise ValueError(
                "JWT_SECRET_KEY must be set in environment variables. "
                "Generate a secure secret with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        
        # Only enforce length in production
        if info.data.get("ENV") == "production" and len(v) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters in production. "
                "Current length: {}".format(len(v))
            )
        
        return v
    
    @field_validator("SQLALCHEMY_DATABASE_URI")
    @classmethod
    def validate_database_uri(cls, v: str) -> str:
        """
        Ensure database URI is set and appears valid.
        """
        if not v or v.strip() == "":
            raise ValueError("SQLALCHEMY_DATABASE_URI must be set in environment variables")
        
        if not v.startswith(("postgresql://", "postgresql+psycopg2://")):
            raise ValueError(
                "SQLALCHEMY_DATABASE_URI must be a PostgreSQL connection string, "
                "starting with 'postgresql://' or 'postgresql+psycopg2://'"
            )
        
        return v
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """
        Parse CORS_ORIGINS from comma-separated string or list.
        """
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return []
    
    @field_validator("DEBUG")
    @classmethod
    def set_debug_based_on_env(cls, v: bool, info: ValidationInfo) -> bool:
        """
        Automatically disable DEBUG in production unless explicitly set.
        """
        env = info.data.get("ENV")
        if env == "production" and v:
            # Log a warning but allow it (user explicitly set it)
            import warnings
            warnings.warn("DEBUG is enabled in production environment")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()