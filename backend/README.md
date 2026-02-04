# FinCred Backend API

AI-powered financial coaching platform helping users achieve their financial goals through personalized planning, progress tracking, and behavioral nudges.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Virtual environment tool (venv recommended)

### Installation

1. **Clone the repository** (if not already done)
```bash
git clone <repository-url>
cd fincred/backend
```

2. **Create and activate virtual environment**
```bash
# Create venv
python -m venv ../.venv

# Activate (Windows)
..\.venv\Scripts\activate

# Activate (macOS/Linux)
source ../.venv/bin/activate
```

3. **Install dependencies**
```bash
# Production dependencies
pip install -r requirements.txt

# Development dependencies (includes testing tools)
pip install -r requirements-dev.txt
```

4. **Configure environment variables**
```bash
# Copy example env file
cp .env.example .env

# Edit .env and set required variables:
# - JWT_SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
# - SQLALCHEMY_DATABASE_URI (PostgreSQL connection string)
```

5. **Run database migrations**
```bash
alembic upgrade head
```

6. **Start the application**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

---

## 📚 Documentation

- **API Documentation**: `http://127.0.0.1:8000/docs` (Swagger UI)
- **Alternative API Docs**: `http://127.0.0.1:8000/redoc` (ReDoc)
- **Development Guide**: [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **Architecture Overview**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **API Usage Guide**: [docs/API_GUIDE.md](../docs/API_GUIDE.md)

---

## 🧪 Testing

Run the full test suite:
```bash
pytest tests/
```

Run specific test types:
```bash
# Unit tests only (fast)
pytest -m unit

# Integration tests only
pytest -m integration

# Tests for specific feature
pytest -m goals
pytest -m auth
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html --cov-report=term-missing
```

View coverage report:
```bash
# Coverage report will be in htmlcov/index.html
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows
```

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                    # API layer
│   │   └── v0/
│   │       ├── deps.py        # Dependencies (auth, pagination)
│   │       └── routers/       # API endpoints
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration management
│   │   ├── security.py        # Authentication & hashing
│   │   ├── exceptions.py      # Custom exception hierarchy
│   │   ├── logging_config.py  # Structured logging
│   │   ├── middleware.py      # Custom middleware
│   │   └── exception_handlers.py
│   ├── db/                     # Database layer
│   │   ├── session.py         # DB session management
│   │   └── utils.py           # DB utilities & health checks
│   ├── models/                 # SQLModel database models
│   ├── schemas/                # Pydantic schemas
│   │   ├── common.py          # Shared schemas (pagination, responses)
│   │   ├── goal.py            # Goal schemas
│   │   └── ...
│   ├── services/               # Business logic layer
│   │   ├── goal_service.py
│   │   └── ...
│   └── main.py                 # FastAPI application entry point
├── tests/
│   ├── conftest.py            # Pytest configuration & fixtures
│   ├── unit/                  # Unit tests
│   │   ├── test_security.py
│   │   └── test_exceptions.py
│   └── integration/           # Integration tests
│       ├── test_health_endpoints.py
│       └── test_goal_service.py
├── alembic/                    # Database migrations
├── .env                        # Environment variables (not in git)
├── .env.example               # Example environment file
├── requirements.txt           # Production dependencies
├── requirements-dev.txt       # Development dependencies
├── pytest.ini                 # Pytest configuration
└── README.md                  # This file
```

---

## 🔑 Key Features

### Implemented ✅
- **Authentication**: JWT-based user authentication with email verification
- **Goal Management**: Create, track, and manage financial goals (max 5 active)
- **Progress Tracking**: Check-ins and goal progress monitoring
- **Action Plans**: Personalized financial action plans
- **Health Checks**: System health monitoring endpoints
- **Structured Logging**: JSON logging with request correlation
- **Error Handling**: Custom exception hierarchy with proper HTTP status codes
- **Testing**: Comprehensive unit and integration tests (55+ tests)
- **API Documentation**: Auto-generated OpenAPI docs with examples

### Architecture Highlights
- **Layered Architecture**: API → Service → Repository pattern
- **Type Safety**: Pydantic schemas for validation
- **Database**: PostgreSQL with SQLModel/SQLAlchemy ORM
- **Connection Pooling**: Optimized database connections
- **Security Headers**: OWASP-recommended security middleware
- **Pagination**: Standardized pagination across endpoints

---

## 🛠️ Development

### Code Quality Tools

**Formatting:**
```bash
black app/ tests/
```

**Linting:**
```bash
ruff check app/
```

**Type Checking:**
```bash
mypy app/
```

### Database Migrations

**Create new migration:**
```bash
alembic revision --autogenerate -m "Description of changes"
```

**Apply migrations:**
```bash
alembic upgrade head
```

**Rollback migration:**
```bash
alembic downgrade -1
```

---

## 📊 Health Endpoints

Monitor application health:

- `GET /api/v0/health` - Basic liveness check
- `GET /api/v0/health/db` - Database connectivity
- `GET /api/v0/health/detailed` - Comprehensive health status

---

## 🔐 Environment Variables

Required variables in `.env`:

```bash
# Application
ENV=development                    # development, staging, production
PROJECT_NAME=FinCred
VERSION=1.0.0
API_V0_PREFIX=/api/v0

# Security
JWT_SECRET_KEY=<generate-secure-key>    # REQUIRED
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
SQLALCHEMY_DATABASE_URI=postgresql://user:pass@localhost/fincred
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600
DB_ECHO=false

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=console    # console or json
```

---

## 🤝 Contributing

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For questions and support, please contact:
- **Email**: support@fincred.com
- **Issues**: [GitHub Issues](https://github.com/your-org/fincred/issues)

---

## 🎯 Next Steps

After setup, try:

1. **Explore API docs**: Visit `http://127.0.0.1:8000/docs`
2. **Run tests**: `pytest tests/ -v`
3. **Create a user**: POST to `/api/v0/auth/register`
4. **Create a goal**: POST to `/api/v0/goals` (with auth token)
5. **Check health**: GET `/api/v0/health/detailed`

Happy coding! 🚀
