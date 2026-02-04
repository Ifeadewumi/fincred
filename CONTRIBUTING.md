# Contributing to FinCred

Thank you for your interest in contributing to FinCred! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style Guide](#code-style-guide)
5. [Testing Requirements](#testing-requirements)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Code Review](#code-review)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Other conduct that is inappropriate in a professional setting

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Development Environment** setup (see [DEVELOPMENT.md](docs/DEVELOPMENT.md))
2. **GitHub Account** with SSH keys configured
3. **Understanding** of the project architecture (see [ARCHITECTURE.md](docs/ARCHITECTURE.md))

### First-Time Contributors

Good first issues are labeled with `good-first-issue` on GitHub. These are typically:
- Documentation improvements
- Small bug fixes
- Test additions
- Code formatting updates

---

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone git@github.com:YOUR_USERNAME/fincred.git
cd fincred

# Add upstream remote
git remote add upstream git@github.com:original-org/fincred.git
```

### 2. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create new branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### 3. Make Changes

```bash
# Make your changes
# Write tests
# Update documentation if needed
```

### 4. Test Changes

```bash
# Run full test suite
cd backend
pytest tests/ -v

# Check coverage
pytest --cov=app --cov-report=term-missing

# Run linting
black app/ tests/
ruff check app/ --fix
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add budget tracking feature"
```

(See [Commit Guidelines](#commit-guidelines) for proper format)

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Code Style Guide

### Python Code Standards

**We follow:**
- [PEP 8](https://pep8.org/) - Python style guide
- [PEP 257](https://pep257.readthedocs.io/) - Docstring conventions
- Type hints for all public functions

**Formatting:**
- Use **Black** for code formatting (line length: 88)
- Use **Ruff** for linting
- Use **isort** for import sorting (handled by Ruff)

### Code Formatting

```bash
# Format code
black app/ tests/

# Check formatting without changes
black app/ tests/ --check
```

### Import Organization

```python
# Standard library imports
import os
from datetime import datetime

# Third-party imports
from fastapi import FastAPI
from sqlmodel import Session

# Local application imports
from app.core.config import settings
from app.services.goal_service import create_goal
```

### Type Hints

Always use type hints:

```python
# ✅ Good
def create_goal(session: Session, user: User, goal_data: GoalCreate) -> Goal:
    ...

# ❌ Bad
def create_goal(session, user, goal_data):
    ...
```

### Docstrings

Use Google-style docstrings:

```python
def calculate_progress(current: float, target: float) -> float:
    """
    Calculate progress percentage towards a goal.
    
    Args:
        current: Current amount saved/paid
        target: Target amount
        
    Returns:
        Progress as percentage (0-100)
        
    Raises:
        ValueError: If target is zero or negative
        
    Example:
        >>> calculate_progress(5000, 10000)
        50.0
    """
    if target <= 0:
        raise ValueError("Target must be positive")
    return (current / target) * 100
```

### Naming Conventions

- **Variables/Functions:** `snake_case`
- **Classes:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Private methods:** `_leading_underscore`

```python
# Constants
MAX_ACTIVE_GOALS = 5
JWT_ALGORITHM = "HS256"

# Classes
class GoalService:
    ...

# Functions/Variables
def create_new_goal(session: Session, user: User) -> Goal:
    goal_count = _count_active_goals(user.id)
    ...
```

---

## Testing Requirements

### Test Coverage

- **Minimum coverage:** 70% overall
- **Service layer:** 80% coverage (business logic)
- **New features:** Must include tests
- **Bug fixes:** Must include regression test

### Writing Tests

**Location:**
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`

**Test structure:**
```python
import pytest
from app.services.goal_service import create_new_goal
from app.core.exceptions import GoalLimitExceededError

class TestCreateNewGoal:
    """Tests for create_new_goal function."""
    
    def test_create_goal_success(self, session, test_user):
        """Test successful goal creation."""
        goal_data = GoalCreate(...)
        result = create_new_goal(session, test_user, goal_data)
        
        assert result.id is not None
        assert result.name == "Emergency Fund"
    
    def test_create_goal_limit_exceeded(self, session, test_user, create_goal):
        """Test that creating 6th goal raises error."""
        # Setup: Create 5 goals
        for i in range(5):
            create_goal(test_user.id, name=f"Goal {i}")
        
        # Test: 6th goal should fail
        with pytest.raises(GoalLimitExceededError):
            create_new_goal(session, test_user, GoalCreate(...))
```

### Test Markers

Use pytest markers for organization:

```python
@pytest.mark.unit
@pytest.mark.goals
def test_validate_goal_date():
    ...

@pytest.mark.integration
@pytest.mark.slow
def test_database_migration():
    ...
```

---

## Commit Guidelines

### Commit Message Format

We use **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions/changes
- `chore` - Build/tooling changes

**Examples:**

```bash
# Simple commit
feat(goals): add budget tracking feature

# With body
fix(auth): correct JWT token expiration

Token was expiring immediately due to timezone issue.
Now using UTC timezone for consistency.

# Breaking change
feat(api)!: change pagination response format

BREAKING CHANGE: List endpoints now return {items, total, has_more}
instead of plain arrays.
```

### Commit Best Practices

**✅ Good:**
- Small, focused commits
- Clear, descriptive messages
- Present tense ("add" not "added")
- Reference issue numbers: `fix(goals): #123 - handle null dates`

**❌ Bad:**
- `git commit -m "fix stuff"`
- `git commit -m "WIP"`
- Multiple unrelated changes in one commit
- Committing without testing

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guide (formatted with Black)
- [ ] All tests pass (`pytest tests/ -v`)
- [ ] Coverage meets requirements
- [ ] Docstrings added for public functions
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

```bash
# Update branch
git checkout main
git pull upstream main
git checkout feature/your-feature
git rebase main
```

### PR Title and Description

**Title:** Use conventional commit format
```
feat(goals): add recurring goal support
```

**Description template:**
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Follows code style
- [ ] Self-review completed

## Related Issues
Closes #123
```

### PR Size

Keep PRs manageable:
- **Ideal:** < 400 lines changed
- **Large:** 400-800 lines (may require longer review)
- **Too large:** > 800 lines (consider splitting)

---

## Code Review

### Review Process

1. **Automated checks** (CI/CD) must pass
2. **At least one approval** from maintainer required
3. **Address feedback** - respond to all comments
4. **Resolve conflicts** before merge

### Reviewing Code

When reviewing others' code:

**Look for:**
- Correctness and functionality
- Test coverage
- Code clarity and maintainability
- Performance implications
- Security concerns
- Documentation completeness

**Provide:**
- Constructive feedback
- Specific suggestions
- Praise for good work
- Questions for clarification

**Review etiquette:**
- Be respectful and professional
- Explain reasoning behind suggestions
- Distinguish between "must fix" and "nice to have"
- Respond promptly to author's questions

### Addressing Review Feedback

```bash
# Make changes based on review
git add .
git commit -m "fix: address review comments"
git push origin feature/your-feature
```

**Don't:** Force push if PR is under review (makes tracking changes difficult)

---

## Development Tips

### Running Subset of Tests

```bash
# Specific file
pytest tests/unit/test_security.py

# Specific test class
pytest tests/unit/test_security.py::TestPasswordHashing

# Specific test
pytest tests/unit/test_security.py::TestPasswordHashing::test_hash_verify

# By marker
pytest -m "unit and goals"
```

### Database Migrations

When changing models:

```bash
# Generate migration
alembic revision --autogenerate -m "add budget field to goals"

# Review generated file in alembic/versions/
# Edit if needed

# Apply migration
alembic upgrade head

# Update tests if needed
```

### Pre-commit Hooks (Recommended)

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Hooks will run automatically on git commit
```

---

## Getting Help

**Questions about:**
- **Setup:** See [DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Architecture:** See [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API:** See [API_GUIDE.md](docs/API_GUIDE.md)

**Still stuck?**
- Check existing [GitHub Issues](https://github.com/your-org/fincred/issues)
- Ask in [GitHub Discussions](https://github.com/your-org/fincred/discussions)
- Email: dev@fincred.com

---

## Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project README

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to FinCred! 🙏
