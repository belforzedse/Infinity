# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| dev     | :white_check_mark: |
| main    | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Reporting Process

If you discover a security vulnerability, please follow these steps:

1. **Email the maintainers** with details about the vulnerability

   - Include a description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

2. **Wait for acknowledgment**

   - We will acknowledge receipt within 48 hours
   - We will provide an initial assessment within 7 days

3. **Coordinate disclosure**
   - We will work with you to understand and fix the issue
   - We will keep you informed about our progress
   - We will coordinate public disclosure timing

### What to Include in Your Report

A good security report should include:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Affected components** (backend API, frontend, authentication system)
- **Step-by-step reproduction** (with code snippets if possible)
- **Impact assessment** (what could an attacker do?)
- **Suggested mitigation** (if you have ideas)
- **Your testing environment** (version, configuration)

### Example Report Template

```
Subject: [SECURITY] [Component] Brief description

Vulnerability Type: SQL Injection / XSS / Authentication / etc.
Affected Component: Backend API / Frontend / Authentication / etc.
Severity: Critical / High / Medium / Low

Description:
[Detailed description of the vulnerability]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Impact:
[What can an attacker do with this vulnerability?]

Suggested Fix:
[Your recommendations, if any]

Environment:
- Version: [e.g., main branch, commit hash]
- Configuration: [any special setup]
```

## Security Measures

### Current Security Features

#### Backend

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (Strapi ORM)
- ✅ CORS configuration
- ✅ Rate limiting (Redis-based)
- ✅ Input validation
- ✅ Secure session management
- ✅ Database connection encryption

#### Frontend

- ✅ XSS prevention (React escaping)
- ✅ CSRF protection
- ✅ Secure HTTP-only cookies
- ✅ Content Security Policy
- ✅ HTTPS enforcement (production)
- ✅ Secure headers

#### Infrastructure

- ✅ Environment variable management
- ✅ Secrets stored securely (GitHub Secrets)
- ✅ Docker security best practices
- ✅ Database password authentication
- ✅ Redis password protection

### Known Security Considerations

#### Payment Gateway Integration

- Payment tokens are not stored in the database
- Transaction logs are maintained for audit
- PCI DSS considerations for payment data

#### User Data

- Passwords are hashed with bcrypt
- Personal information is encrypted at rest (database level)
- JWT tokens expire after 30 days

#### API Security

- Rate limiting on all public endpoints
- Authentication required for sensitive operations
- Input validation on all user inputs
- SQL injection protection via ORM

## Security Best Practices for Contributors

### When Contributing Code

1. **Never commit secrets**

   - Use `.env` files (not tracked in git)
   - Use GitHub Secrets for CI/CD
   - Check before pushing: `git diff` and review changes

2. **Validate all inputs**

   ```typescript
   // ✅ Good
   const email = ctx.request.body.email;
   if (!email || !isValidEmail(email)) {
     return ctx.badRequest("Invalid email");
   }
   ```

3. **Use parameterized queries**

   ```typescript
   // ✅ Good - Strapi ORM (safe)
   await strapi.db.query("api::product.product").findMany({
     where: { id: productId },
   });

   // ✅ Good - Raw query with parameters
   await strapi.db.connection.raw("SELECT * FROM products WHERE id = ?", [
     productId,
   ]);

   // ❌ Bad - String concatenation
   await strapi.db.connection.raw(
     `SELECT * FROM products WHERE id = ${productId}`
   );
   ```

4. **Escape output**

   ```tsx
   {
     /* ✅ Good - React automatically escapes */
   }
   <div>{userInput}</div>;

   {
     /* ❌ Bad - Dangerous HTML */
   }
   <div dangerouslySetInnerHTML={{ __html: userInput }} />;
   ```

5. **Implement proper authorization**
   ```typescript
   // Check if user owns the resource
   if (order.user.id !== ctx.state.user.id) {
     return ctx.forbidden("Not authorized");
   }
   ```

### Security Checklist for PRs

Before submitting a PR, ensure:

- [ ] No hardcoded secrets or API keys
- [ ] All user inputs are validated
- [ ] SQL queries use parameterization
- [ ] Authentication/authorization checks are in place
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date (`npm audit`)
- [ ] HTTPS is used for external API calls
- [ ] Sensitive data is not logged

## Dependency Security

### Automated Checks

We use:

- **Dependabot** - Automated dependency updates
- **npm audit** - Vulnerability scanning
- **GitHub Security Alerts** - Notification of known vulnerabilities

### Manual Review

Run these commands periodically:

```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
cd frontend
npm audit
npm audit fix
```

## Incident Response

If a security incident occurs:

1. **Immediate Actions**

   - Assess the scope and impact
   - Contain the vulnerability
   - Deploy a hotfix if necessary

2. **Investigation**

   - Review logs and audit trails
   - Identify affected users/data
   - Document the incident

3. **Notification**

   - Notify affected users (if applicable)
   - Public disclosure (after fix is deployed)
   - Update security documentation

4. **Post-Incident**
   - Conduct retrospective
   - Improve security measures
   - Update documentation and training

## Security Updates

Security patches will be:

- Released as soon as possible
- Documented in release notes
- Announced via GitHub Security Advisories
- Applied to supported versions

## Contact

For security concerns, please contact the repository maintainers.

**Please do not use public channels for security-related communications.**

---

_Last updated: December 2025_
