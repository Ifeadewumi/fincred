# Development Guide

Complete guide for setting up and developing the FinCred backend locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running the Application](#running-the-application)
4. [Database Management](#database-management)
5. [Testing](#testing)
6. [Code Quality](#code-quality)
7. [Debugging](#debugging)
8. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

- **Python 3.11 or higher**
  ```bash
  python --version  # Should be 3.11+
  ```

- **PostgreSQL 14 or higher**
  ```bash
  psql --version    # Should be 14+
  ```

- **Git**
  ```bash
  git --version
  ```

### Recommended Tools

- **VS Code** or **PyCharm** (IDE)
- **Postman** or **HTTPie** (API testing)
- **DBeaver** or **pgAdmin** (Database GUI)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fincred/backend
```

### 2. Create Virtual Environment

**Windows:**
```bash
python -m venv ..\.venv
..\.venv\Scripts\activate
```

**macOS/Linux:**
```bash
python -m venv ../.venv
source ../.venv/bin/activate
```

**Verify activation:**
```bash
which python  # Should point to .venv/bin/python
```

### 3. Install Dependencies

```bash
# Production + development dependencies
pip install -r requirements-dev.txt

# Verify installation
pip list
```

### 4. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE fincred;
CREATE USER fincreduser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fincred TO fincreduser;

# Exit
\q
```

### 5. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env with your favorite editor
code .env  # or nano .env
```

**Required variables:**

```bash
# Generate a secure JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env:
JWT_SECRET_KEY=<generated-secret-here>
SQLALCHEMY_DATABASE_URI=postgresql://fincreduser:your_password@localhost/fincred
ENV=development
```

### 6. Run Database Migrations

```bash
# Apply all migrations
alembic upgrade head

# Verify tables created
psql -U fincreduser -d fincred -c "\dt"
```

### 7. Verify Setup

```bash
# Import check
python -c "from app.main import app; print('✅ Success')"

# Start application
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/docs` - you should see the Swagger UI!

---

## Running the Application

### Development Server

```bash
# With auto-reload (recommended for development)
uvicorn app.main:app --reload

# With custom host/port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# With log level
uvicorn app.main:app --reload --log-level debug
```

### Production-like Server

```bash
# Multiple workers (no auto-reload)
uvicorn app.main:app --workers 4

# With Gunicorn (production)
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Verify Running

```bash
# Health check
curl http://127.0.0.1:8000/api/v0/health

# Database health
curl http://127.0.0.1:8000/api/v0/health/db

# Detailed health
curl http://127.0.0.1:8000/api/v0/health/detailed
```

---

## Database Management

### Alembic Migrations

**Create new migration:**
```bash
# Auto-generate from model changes
alembic revision --autogenerate -m "Add new field to User table"

# Review the generated file in alembic/versions/
# Edit if needed, then apply:
alembic upgrade head
```

**Common commands:**
```bash
# Show current version
alembic current

# Show migration history
alembic history

# Upgrade to specific version
alembic upgrade <revision_id>

# Downgrade one version
alembic downgrade -1

# Downgrade to base (caution: drops all)
alembic downgrade base
```

### Direct Database Access

```bash
# Connect to database
psql -U fincreduser -d fincred

# Useful commands:
\dt              # List tables
\d users         # Describe users table
\d+ users        # Describe with details
SELECT * FROM users LIMIT 5;
```

### Reset Database (Development Only!)

```bash
# Drop and recreate
dropdb -U postgres fincred
createdb -U postgres fincred
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fincred TO fincreduser;"

# Run migrations
alembic upgrade head
```

---

## Testing

### Run All Tests

```bash
# Full test suite
pytest tests/

# With verbose output
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
```

### Run Specific Tests

```bash
# By marker
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest -m goals          # Goal-related tests
pytest -m auth           # Auth-related tests

# By file
pytest tests/unit/test_security.py

# By test class
pytest tests/unit/test_security.py::TestPasswordHashing

# By specific test
pytest tests/unit/test_security.py::TestPasswordHashing::test_password_hash_creates_different_hash
```

### Test Options

```bash
# Stop on first failure
pytest tests/ -x

# Show local variables on failure
pytest tests/ -l

# Verbose with short traceback
pytest tests/ -v --tb=short

# Run last failed tests
pytest --lf

# Run failed tests first, then all
pytest --ff
```

### Coverage Reports

```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html

# View report
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows
xdg-open htmlcov/index.html # Linux
```

### Test Database

Tests use **in-memory SQLite** by default (fast, isolated).

To use PostgreSQL for integration tests:
```python
# In tests/conftest.py, modify the fixture
# (Not recommended for CI/CD)
```

---

## Code Quality

### Formatting with Black

```bash
# Format all code
black app/ tests/

# Check without modifying
black app/ tests/ --check

# Show diff
black app/ tests/ --diff
```

### Linting with Ruff

```bash
# Check for issues
ruff check app/

# Auto-fix issues
ruff check app/ --fix

# Check specific rules
ruff check app/ --select F,E,W
```

### Type Checking with Mypy

```bash
# Type check application
mypy app/

# Strict mode
mypy app/ --strict

# Ignore missing imports
mypy app/ --ignore-missing-imports
```

### Pre-commit Hooks (Optional)

```bash
# Install pre-commit
pip install pre-commit

# Set up hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload"
      ],
      "jinja": true,
      "justMyCode": false
    }
  ]
}
```

### Python Debugger

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint() (Python 3.7+)
breakpoint()
```

### Logging

Increase log verbosity:

```bash
# In .env
LOG_LEVEL=DEBUG

# Run with debug logs
uvicorn app.main:app --reload --log-level debug
```

View logs with request ID:
```python
from app.core.logging_config import get_logger
logger = get_logger(__name__)
logger.info("Debug message", extra={"goal_id": goal.id})
```

### Database Queries

Enable SQL echo:

```bash
# In .env
DB_ECHO=true
```

This will print all SQL queries to console.

---

## Common Issues

### Issue: ModuleNotFoundError

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
# Ensure running from backend/ directory
cd fincred/backend
python -m uvicorn app.main:app --reload
```

---

### Issue: Database Connection Error

**Error:** `could not connect to server: Connection refused`

**Solutions:**
1. Start PostgreSQL:
   ```bash
   # Windows
   pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. Check connection string in `.env`:
   ```bash
   SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost:5432/fincred
   ```

3. Verify database exists:
   ```bash
   psql -U postgres -l | grep fincred
   ```

---

### Issue: Alembic Migration Fails

**Error:** `Target database is not up to date`

**Solution:**
```bash
# Check current version
alembic current

# Upgrade to latest
alembic upgrade head

# If stuck, check history
alembic history
```

---

### Issue: Tests Failing

**Error:** Various test failures

**Solutions:**

1. **Clear pytest cache:**
   ```bash
   rm -rf .pytest_cache
   pytest tests/ -v
   ```

2. **Recreate test database:**
   ```bash
   # Tests use in-memory SQLite, but if using Postgres:
   dropdb -U postgres fincred_test
   createdb -U postgres fincred_test
   ```

3. **Check fixtures:**
   ```bash
   pytest tests/ --setup-show
   ```

---

### Issue: Import Errors

**Error:** `ImportError: attempted relative import with no known parent package`

**Solution:**
```bash
# Run as module from backend/ directory
python -m pytest tests/

# Or set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"  # Linux/macOS
set PYTHONPATH=%PYTHONPATH%;%CD%          # Windows
```

---

### Issue: Port Already in Use

**Error:** `ERROR:    [Errno 48] error while attempting to bind on address ('127.0.0.1', 8000): address already in use`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000        # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>        # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
uvicorn app.main:app --reload --port 8001
```

---

## Development Workflow

### Feature Development

1. **Create feature branch:**
   ```bash
   git checkout -b feature/add-budget-tracking
   ```

2. **Make changes and test:**
   ```bash
   # Write code
   # Add tests
   pytest tests/ -v
   ```

3. **Format and lint:**
   ```bash
   black app/ tests/
   ruff check app/ --fix
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add budget tracking feature"
   ```

5. **Create pull request:**
   ```bash
   git push origin feature/add-budget-tracking
   # Open PR on GitHub
   ```

### Database Schema Changes

1. **Modify model in `app/models/`**
2. **Generate migration:**
   ```bash
   alembic revision --autogenerate -m "Add budget field to goals"
   ```
3. **Review generated migration in `alembic/versions/`**
4. **Apply migration:**
   ```bash
   alembic upgrade head
   ```
5. **Update tests if needed**

---

## Environment Variables Reference

```bash
# Application
ENV=development                          # development, staging, production
PROJECT_NAME=FinCred
VERSION=1.0.0
API_V0_PREFIX=/api/v0

# Security
JWT_SECRET_KEY=<required>                # Generate with secrets.token_urlsafe(32)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
SQLALCHEMY_DATABASE_URI=postgresql://user:pass@host:port/db
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_ECHO=false                            # Set to true to log SQL queries

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=INFO                           # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=console                       # console or json
```

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Usage Guide](./API_GUIDE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

---

## Getting Help

- Check [Common Issues](#common-issues) section above
- Search [GitHub Issues](https://github.com/your-org/fincred/issues)
- Read [Stack Overflow](https://stackoverflow.com/questions/tagged/fastapi)
- Contact: support@fincred.com

---

Happy developing! 🚀
