# app/db/session.py
"""
Database session management and engine configuration.

Configures SQLAlchemy engine with connection pooling and session management.
"""
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Create engine with connection pooling configuration
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=settings.DB_ECHO,  # Log SQL queries (useful for debugging)
    future=True,  # Use SQLAlchemy 2.0 style
    pool_size=settings.DB_POOL_SIZE,  # Number of connections to keep in the pool
    max_overflow=settings.DB_MAX_OVERFLOW,  # Maximum connections beyond pool_size
    pool_timeout=settings.DB_POOL_TIMEOUT,  # Timeout for getting a connection from pool
    pool_recycle=settings.DB_POOL_RECYCLE,  # Recycle connections after this many seconds
    pool_pre_ping=True,  # Test connections before using them (detects disconnections)
)

logger.info(
    f"Database engine configured",
    extra={
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "db_echo": settings.DB_ECHO
    }
)


def init_db() -> None:
    """
    Initialize database schema by creating all tables.
    
    WARNING: Only use in development! Production should use Alembic migrations.
    """
    logger.info("Initializing database schema (creating all tables)")
    SQLModel.metadata.create_all(bind=engine)
    logger.info("Database schema initialized successfully")


def get_session():
    """
    Dependency function to get a database session.
    
    Yields:
        Database session
        
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_session)):
            return db.exec(select(Item)).all()
    """
    with Session(engine) as session:
        yield session
