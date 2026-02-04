# app/core/logging_config.py
"""
Structured logging configuration for the FinCred API.

Provides both JSON logging (for production) and console logging (for development)
with request correlation, sensitive data filtering, and proper log levels.
"""
import logging
import sys
import json
from typing import Any, Dict
from datetime import datetime, timezone
from pythonjsonlogger import jsonlogger

from app.core.config import settings


class SensitiveDataFilter(logging.Filter):
    """
    Filter to redact sensitive data from log records.
    
    Prevents accidental logging of passwords, tokens, and other sensitive information.
    """
    
    SENSITIVE_KEYS = {
        'password', 'password_hash', 'token', 'secret', 'api_key',
        'authorization', 'jwt', 'credit_card', 'ssn', 'verification_token'
    }
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter and redact sensitive data from log record."""
        if hasattr(record, 'msg') and isinstance(record.msg, dict):
            record.msg = self._redact_sensitive(record.msg)
        
        if hasattr(record, 'args') and isinstance(record.args, dict):
            record.args = self._redact_sensitive(record.args)
        
        return True
    
    def _redact_sensitive(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively redact sensitive keys from dictionary."""
        redacted = {}
        for key, value in data.items():
            if isinstance(key, str) and any(sensitive in key.lower() for sensitive in self.SENSITIVE_KEYS):
                redacted[key] = "***REDACTED***"
            elif isinstance(value, dict):
                redacted[key] = self._redact_sensitive(value)
            elif isinstance(value, list):
                redacted[key] = [
                    self._redact_sensitive(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                redacted[key] = value
        return redacted


class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter that adds standard fields to all log records.
    
    Includes timestamp, log level, logger name, and request correlation.
    """
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to JSON log output."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO format with timezone
        log_record['timestamp'] = datetime.now(timezone.utc).isoformat()
        
        # Add log level
        log_record['level'] = record.levelname
        
        # Add logger name
        log_record['logger'] = record.name
        
        # Add request ID if available (set by middleware)
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        
        # Add environment
        log_record['environment'] = settings.ENV
        
        # Add service name
        log_record['service'] = settings.PROJECT_NAME


class CustomConsoleFormatter(logging.Formatter):
    """
    Custom console formatter with color support and clean output.
    
    Formats log messages for human readability during development.
    """
    
    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors and structure."""
        # Add color based on level
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        reset = self.COLORS['RESET']
        
        # Format timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Build log line
        log_line = f"{color}[{record.levelname}]{reset} {timestamp} - {record.name}"
        
        # Add request ID if available
        if hasattr(record, 'request_id'):
            log_line += f" [{record.request_id}]"
        
        # Add message
        log_line += f" - {record.getMessage()}"
        
        # Add exception info if present
        if record.exc_info:
            log_line += f"\n{self.formatException(record.exc_info)}"
        
        return log_line


def setup_logging() -> None:
    """
    Configure application logging based on environment settings.
    
    Sets up handlers, formatters, filters, and log levels for the entire application.
    """
    # Determine log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove any existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Choose formatter based on settings
    if settings.LOG_FORMAT == "json":
        # JSON formatter for production (machine-readable)
        formatter = CustomJSONFormatter(
            '%(timestamp)s %(level)s %(logger)s %(message)s'
        )
    else:
        # Console formatter for development (human-readable)
        formatter = CustomConsoleFormatter()
    
    console_handler.setFormatter(formatter)
    
    # Add sensitive data filter
    sensitive_filter = SensitiveDataFilter()
    console_handler.addFilter(sensitive_filter)
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Configure third-party library log levels
    # Reduce noise from verbose libraries
    logging.getLogger('uvicorn').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    
    # Log successful setup
    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured: level={settings.LOG_LEVEL}, format={settings.LOG_FORMAT}, env={settings.ENV}"
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the specified module.
    
    Args:
        name: Name of the module (typically __name__)
    
    Returns:
        Configured logger instance
    
    Example:
        logger = get_logger(__name__)
        logger.info("User logged in", extra={"user_id": user.id})
    """
    return logging.getLogger(name)


# Initialize logging on module import
setup_logging()
