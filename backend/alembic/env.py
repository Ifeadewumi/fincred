import os
import sys
from logging.config import fileConfig
from uuid import UUID # NEW IMPORT

from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel

# Add the parent directory of 'alembic' to the Python path.
# This allows us to import our application modules.
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- Model Imports ---
# Import all your models here. This is crucial for Alembic's 'autogenerate'
# feature to detect changes in your table schemas.
from app.models.user import User, Profile
from app.models.goal import Goal
from app.models.snapshot import Income, ExpenseEstimate, Debt, SavingsAccount
from app.models.action_plan import ActionPlan
from app.models.tracking import GoalProgress, CheckIn
from app.models.notification import NudgeSchedule
from app.models.education import EducationSnippet


# This is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Metadata and Database URL Configuration ---

# This is the target metadata for Alembic's 'autogenerate' support.
# We point it to SQLModel.metadata, which will contain schema info
# from all imported models.
target_metadata = SQLModel.metadata

# Load the database URL from our application's settings file.
from app.core.config import settings
config.set_main_option("sqlalchemy.url", str(settings.SQLALCHEMY_DATABASE_URI))


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.
    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.
    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
