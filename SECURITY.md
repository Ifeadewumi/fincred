# Security Policy

## Supported Versions

Currently supported versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security of FinCred seriously. If you discover a security vulnerability, please help us protect our users by reporting it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, report via:

1. **Email:** security@fincred.com
2. **Subject:** `[SECURITY] Brief description of vulnerability`

### What to Include

Please provide:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Suggested fix** (if you have one)
- **Your contact information**

**Example:**
```
Subject: [SECURITY] SQL Injection in goal search endpoint

Description:
The /api/v0/goals/search endpoint is vulnerable to SQL injection 
through the 'name' parameter.

Steps to Reproduce:
1. Send POST request to /api/v0/goals/search
2. Set name parameter to: ' OR '1'='1
3. All goals are returned regardless of ownership

Impact:
High - Attackers can access other users' financial goals

Suggested Fix:
Use parameterized queries instead of string concatenation
```

### Response Timeline

- **24 hours:** Initial acknowledgment
- **7 days:** Preliminary assessment and severity rating
- **30 days:** Fix developed and tested
- **Public disclosure:** After fix is deployed (coordinated with reporter)

### Bug Bounty

We currently do not have a formal bug bounty program. However, we deeply appreciate security researchers and may provide:
- Public acknowledgment (with your permission)
- Swag and merchandise
- Feature priority for reporters

---

## Security Best Practices

### For Developers

#### 1. Authentication & Authorization

**✅ DO:**
- Always validate JWT tokens in protected endpoints
- Check user ownership before allowing resource access
- Use secure password hashing (PBKDF2, bcrypt, argon2)
- Implement rate limiting on auth endpoints

**❌ DON'T:**
- Trust client-side validation alone
- Store passwords in plain text
- Use weak hashing algorithms (MD5, SHA1)
- Expose internal user IDs in URLs

**Example:**
```python
# ✅ Good - Check ownership
def get_goal(goal_id: UUID, current_user: User, session: Session):
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise ResourceNotFoundError()
    return goal

# ❌ Bad - No ownership check
def get_goal(goal_id: UUID, session: Session):
    return session.get(Goal, goal_id)  # May return other users' goals!
```

#### 2. Input Validation

**✅ DO:**
- Validate all input with Pydantic schemas
- Sanitize user input before processing
- Use parameterized queries (ORM prevents SQL injection)
- Validate file uploads (type, size, content)

**❌ DON'T:**
- Trust user input
- Build queries with string concatenation
- Allow arbitrary file uploads
- Expose detailed error messages to clients

**Example:**
```python
# ✅ Good - Pydantic validation
class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    target_date: date = Field(...)
    
    @validator('target_date')
    def validate_future_date(cls, v):
        if v <= date.today():
            raise ValueError('Date must be in future')
        return v

# ❌ Bad - No validation
def create_goal(name, amount, date):
    goal = Goal(name=name, amount=amount, date=date)
    # What if amount is negative? What if date is in past?
```

#### 3. Secrets Management

**✅ DO:**
- Store secrets in environment variables
- Use strong, randomly generated secrets
- Rotate secrets periodically
- Never commit secrets to version control
- Use `.env.example` without real values

**❌ DON'T:**
- Hardcode secrets in code
- Commit `.env` files
- Use default/example secrets in production
- Share secrets in plain text (email, Slack)

**Generate secure secrets:**
```bash
# JWT Secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Database password
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

#### 4. Error Handling

**✅ DO:**
- Use custom exceptions with generic messages
- Log detailed errors server-side
- Return appropriate HTTP status codes
- Hide stack traces from clients in production

**❌ DON'T:**
- Expose internal errors to clients
- Return database error messages
- Show stack traces in production
- Leak system information

**Example:**
```python
# ✅ Good - Safe error handling
try:
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise InvalidCredentialsError("Invalid email or password")
except InvalidCredentialsError:
    raise  # Re-raise custom exception
except Exception as e:
    logger.error(f"Login error: {e}", exc_info=True)  # Log details
    raise InternalServerError("An error occurred")  # Generic message

# ❌ Bad - Exposes internals
except Exception as e:
    return {"error": str(e)}  # May expose "User table not found" etc.
```

#### 5. Dependencies

**✅ DO:**
- Pin dependency versions in `requirements.txt`
- Regularly update dependencies
- Review dependency security advisories
- Use `pip-audit` or Dependabot

**❌ DON'T:**
- Use unpinned versions (`fastapi>=0.100`)
- Ignore security updates
- Use unverified packages
- Install dependencies as root

**Audit dependencies:**
```bash
# Install pip-audit
pip install pip-audit

# Check for vulnerabilities
pip-audit
```

#### 6. Database Security

**✅ DO:**
- Use parameterized queries (SQLModel/SQLAlchemy handles this)
- Apply principle of least privilege for DB users
- Enable SSL/TLS for database connections
- Regularly backup data

**❌ DON'T:**
- Use root/admin DB user for application
- Build queries with string formatting
- Store sensitive data unencrypted
- Expose DB directly to internet

#### 7. API Security

**✅ DO:**
- Implement rate limiting
- Enable CORS with specific origins
- Use HTTPS in production (TLS 1.2+)
- Add security headers (see middleware)
- Validate content types

**❌ DON'T:**
- Allow unrestricted CORS (`*`)
- Use HTTP in production
- Skip rate limiting
- Accept arbitrary content types

**Security headers implemented:**
```python
# In app/core/middleware.py
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Security Checklist for PRs

Before submitting a PR, ensure:

- [ ] No secrets committed (check with `git diff`)
- [ ] Input validation added for new endpoints
- [ ] Authorization checks for protected resources
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are pinned and up-to-date
- [ ] Tests include security edge cases
- [ ] Documentation updated if security-relevant

---

## Known Security Considerations

### 1. Email Verification

**Current:** Mock email service (development only)

**Production:** Must implement real email service with:
- SPF/DKIM/DMARC for email authentication
- Secure email templates
- Rate limiting on verification emails
- Expiring verification tokens

### 2. Password Policy

**Current:** Basic validation (min 8 chars, uppercase, number)

**Consider:** 
- Password strength meter
- Check against breached password lists (Have I Been Pwned API)
- Multi-factor authentication (MFA)

### 3. Session Management

**Current:** JWT tokens (30-minute expiration)

**Consider:**
- Refresh tokens for long-lived sessions
- Token blacklist for logout
- Redis for session storage

### 4. Rate Limiting

**Current:** Not implemented

**Recommended:**
- Per-user rate limiting (60 requests/minute)
- Per-IP rate limiting for auth endpoints (5 attempts/minute)
- Progressive backoff for repeated failures

---

## Incident Response

If a security incident occurs:

1. **Contain:** Immediately patch or disable affected feature
2. **Assess:** Determine scope and impact
3. **Notify:** Inform affected users within 72 hours
4. **Remediate:** Deploy fix and verify resolution
5. **Review:** Conduct post-mortem and update procedures

**Contact:** security@fincred.com

---

## Compliance

FinCred handles sensitive financial data. We aim to comply with:

- **GDPR** - EU data protection regulation
- **CCPA** - California Consumer Privacy Act
- **PCI DSS** - If processing payments (future)

---

## Security Updates

Subscribe to security advisories:
- GitHub Security Advisories
- Python security announcements
- FastAPI security updates
- PostgreSQL security releases

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Pydantic Validators](https://docs.pydantic.dev/latest/usage/validators/)

---

## Acknowledgments

We thank the following security researchers for responsible disclosure:

*(List will be updated as vulnerabilities are responsibly disclosed and fixed)*

---

**Last Updated:** February 2026

For questions about this policy: security@fincred.com
