# app/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FinCred API"
    SQLALCHEMY_DATABASE_URI: str = (
        "postgresql+psycopg2://user:password@localhost:5432/fincred"
    )
    JWT_SECRET_KEY: str = "CHANGE_ME"  # use env variable in real setup
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        env_file = ".env"


settings = Settings()