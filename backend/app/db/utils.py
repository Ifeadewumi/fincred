# app/db/utils.py
"""
Database utilities for health checks, connection testing, and retry logic.

Provides helper functions for database operations including health checks,
connection retrying, and query performance monitoring.
"""
import time
from typing import Dict, Any, Optional
from contextlib import contextmanager
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, TimeoutError, DisconnectionError
from sqlmodel import Session

from app.core.logging_config import get_logger
from app.core.exceptions import DatabaseError

logger = get_logger(__name__)


class DatabaseHealthCheck:
    """
    Database health check utilities.
    
    Provides methods to check database connectivity, performance,
    and overall health status.
    """
    
    @staticmethod
    def check_connection(db: Session) -> Dict[str, Any]:
        """
        Check database connection health.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with health check results
        """
        start_time = time.perf_counter()
        
        try:
            # Simple query to verify database is responsive
            result = db.exec(text("SELECT 1")).first()
            
            if result != (1,):
                return {
                    "status": "unhealthy",
                    "message": "Database query returned unexpected result",
                    "response_time_ms": None
                }
            
            response_time = (time.perf_counter() - start_time) * 1000
            
            return {
                "status": "healthy",
                "message": "Database is responsive",
                "response_time_ms": round(response_time, 2)
            }
            
        except (OperationalError, TimeoutError, DisconnectionError) as e:
            logger.error(f"Database health check failed: {e}", exc_info=True)
            return {
                "status": "unhealthy",
                "message": f"Database connection error: {str(e)}",
                "response_time_ms": None
            }
        except Exception as e:
            logger.error(f"Unexpected error during health check: {e}", exc_info=True)
            return {
                "status": "unhealthy",
                "message": f"Unexpected error: {str(e)}",
                "response_time_ms": None
            }
    
    @staticmethod
    def get_database_info(db: Session) -> Dict[str, Any]:
        """
        Get database version and basic information.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with database information
        """
        try:
            # Get PostgreSQL version
            result = db.exec(text("SELECT version()")).first()
            version_string = result[0] if result else "Unknown"
            
            # Get current database name
            result_db = db.exec(text("SELECT current_database()")).first()
            database_name = result_db[0] if result_db else "Unknown"
            
            # Get connection count
            result_conn = db.exec(text(
                "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"
            )).first()
            connection_count = result_conn[0] if result_conn else 0
            
            return {
                "version": version_string.split(",")[0] if "," in version_string else version_string,
                "database": database_name,
                "active_connections": connection_count
            }
            
        except Exception as e:
            logger.warning(f"Could not retrieve database info: {e}")
            return {
                "version": "Unknown",
                "database": "Unknown",
                "active_connections": 0
            }


class ConnectionRetry:
    """
    Database connection retry logic with exponential backoff.
    
    Handles transient database connection failures by retrying
    with increasing delays between attempts.
    """
    
    @staticmethod
    def execute_with_retry(
        func,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        max_delay: float = 30.0
    ):
        """
        Execute a function with retry logic and exponential backoff.
        
        Args:
            func: Function to execute
            max_retries: Maximum number of retry attempts
            initial_delay: Initial delay in seconds before first retry
            backoff_factor: Multiplier for delay after each retry
            max_delay: Maximum delay in seconds between retries
            
        Returns:
            Result of the function execution
            
        Raises:
            DatabaseError: If all retry attempts fail
        """
        delay = initial_delay
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return func()
                
            except (OperationalError, TimeoutError, DisconnectionError) as e:
                last_exception = e
                
                if attempt == max_retries:
                    logger.error(
                        f"Database operation failed after {max_retries} retries",
                        extra={"attempts": attempt + 1},
                        exc_info=True
                    )
                    raise DatabaseError(
                        f"Database operation failed after {max_retries} retries",
                        original_error=e
                    )
                
                logger.warning(
                    f"Database operation failed (attempt {attempt + 1}/{max_retries + 1}), "
                    f"retrying in {delay:.1f}s: {str(e)}",
                    extra={"attempt": attempt + 1, "delay": delay}
                )
                
                time.sleep(delay)
                delay = min(delay * backoff_factor, max_delay)
            
            except Exception:
                # For non-connection errors, don't retry
                raise
        
        # Should never reach here, but just in case
        raise DatabaseError(
            "Database operation failed",
            original_error=last_exception
        )


@contextmanager
def timed_query(query_name: str, log_slow_threshold_ms: float = 1000.0):
    """
    Context manager to time database queries and log slow queries.
    
    Args:
        query_name: Name/description of the query being executed
        log_slow_threshold_ms: Threshold in milliseconds to log as slow query
        
    Usage:
        with timed_query("fetch_user_goals"):
            goals = db.exec(select(Goal).where(...)).all()
    """
    start_time = time.perf_counter()
    
    try:
        yield
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        
        if duration >= log_slow_threshold_ms:
            logger.warning(
                f"Slow query detected: {query_name}",
                extra={
                    "query_name": query_name,
                    "duration_ms": round(duration, 2),
                    "threshold_ms": log_slow_threshold_ms
                }
            )
        else:
            logger.debug(
                f"Query completed: {query_name}",
                extra={
                    "query_name": query_name,
                    "duration_ms": round(duration, 2)
                }
            )


def log_query_performance(query_name: str):
    """
    Decorator to log query performance.
    
    Args:
        query_name: Name/description of the query
        
    Usage:
        @log_query_performance("get_all_user_goals")
        def get_goals(db, user_id):
            return db.exec(select(Goal).where(...)).all()
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with timed_query(query_name):
                return func(*args, **kwargs)
        return wrapper
    return decorator
