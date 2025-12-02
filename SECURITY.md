# Security Policy

Infinity Store takes the security of our users, merchants, and partners seriously. The guidelines below explain how to report vulnerabilities responsibly and summarize the safeguards we currently enforce.

## Supported Versions

We release security patches for actively developed branches.

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |
| `dev`   | Yes       |

## Reporting a Vulnerability

**Never disclose suspected vulnerabilities in public issues or discussions.**

### How to Report

1. Email `security@infinitycolor.com` with the subject line `[SECURITY] <summary>`.
2. Encrypt communications when possible. Public keys can be requested from the maintainer team.
3. Only share details with approved security contacts until coordinated disclosure is agreed upon.

### Information to Include

- Vulnerability category (SQLi, XSS, authorization bypass, etc.)
- Impacted component or endpoint, including commit hash or release tag
- Reproduction steps with expected vs. actual results
- Impact analysis (data exposure, privilege escalation, DoS, etc.)
- Suggested mitigations or references, if available
- Environment details (browser, OS, Node/Strapi versions)

### Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 7 calendar days
- **Remediation ETA:** shared once scope is confirmed
- **Disclosure coordination:** mutually agreed timeline once a fix is available

We credit reporters in release notes unless anonymity is requested.

### Report Template

```
Subject: [SECURITY] <Component> <Short description>

Summary:
Provide a concise overview of the issue and potential impact.

Steps to Reproduce:
1. …
2. …
3. …

Impact:
Describe what an attacker can achieve.

Suggested Mitigation:
Optional recommendations or references.

Environment:
- Branch/commit:
- Browser/OS (if applicable):
- Additional configuration:
```

## Preventive Controls

### Backend

- JWT authentication with refresh token rotation
- bcrypt password hashing with per-user salts
- Strapi ORM to avoid raw string concatenation
- Comprehensive input validation and sanitization
- Redis-backed rate limiting and login throttling
- Encrypted database connections and secure session cookies

### Frontend

- React auto-escaping for rendered content
- Content Security Policy and secure headers
- HTTP-only cookies plus CSRF mitigation for privileged actions
- Strict linting for `dangerouslySetInnerHTML` usage
- RTL-aware layouts validated against accessibility rules

### Infrastructure

- Secrets managed via GitHub Environments and deployment vaults
- Least-privilege IAM for CI/CD runners
- Dependency scanning (npm audit, GitHub Dependabot)
- Automated image scanning for container builds
- TLS enforcement for all production endpoints

### Payments & Sensitive Data

- Payment tokens are never persisted beyond the payment gateway session
- Transaction audit logs retained for compliance
- PCI DSS considerations factored into Mellat and SnappPay integrations
- Personally identifiable information encrypted at rest

## Expectations for Contributors

1. **Never commit secrets.** Use `.env` files locally and GitHub Secrets in CI. Review `git diff` before pushing.
2. **Validate and sanitize all inputs.**

   ```typescript
   const email = ctx.request.body.email;
   if (!email || !isValidEmail(email)) {
     return ctx.badRequest("Invalid email");
   }
   ```

3. **Use parameterized queries.**

   ```typescript
   await strapi.db.query("api::product.product").findMany({
     where: { id: productId },
   });

   await strapi.db.connection.raw("SELECT * FROM products WHERE id = ?", [
     productId,
   ]);
   ```

4. **Escape output in the frontend.**

   ```tsx
   <div>{userInput}</div>;
   ```

5. **Enforce authorization on every protected resource.**

   ```typescript
   if (order.user.id !== ctx.state.user.id) {
     return ctx.forbidden("Not authorized");
   }
   ```

## Security Checklist for Pull Requests

- [ ] No hardcoded secrets, credentials, or sensitive file paths
- [ ] Inputs validated and sanitized, both server and client side
- [ ] SQL or ORM queries use safe parameterization
- [ ] Authentication/authorization logic covers new endpoints and UI states
- [ ] Error messages avoid leaking stack traces or operational details
- [ ] Dependencies reviewed (`npm audit`, GitHub alerts) before merging
- [ ] External network calls occur over HTTPS with certificate validation
- [ ] Sensitive data is never logged or echoed to clients

Thank you for helping us keep Infinity Store safe for every user.

## Dependency Security

### Automated Coverage

- **Dependabot** for dependency upgrade PRs
- **npm audit** via CI for vulnerability scanning
- **GitHub Security Alerts** for upstream advisories

### Manual Validation

Run the following commands when introducing dependencies or before releases:

```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

Resolve reported vulnerabilities promptly or document the rationale for any temporary exceptions.

## Incident Response

1. **Containment** — Evaluate blast radius, revoke compromised credentials, and apply hotfixes.
2. **Investigation** — Review logs, identify affected users/data, and capture a detailed timeline.
3. **Notification** — Communicate with stakeholders and, when appropriate, publish a security advisory.
4. **Remediation** — Patch the vulnerability, update tests, and document changes in the CHANGELOG.
5. **Post-incident review** — Capture lessons learned and implement follow-up tasks.

## Security Updates

- Fixes are released as soon as practical once verified.
- Each fix is documented in release notes and, when warranted, in a GitHub Security Advisory.
- All supported branches (`main`, `dev`) receive the patch or a mitigation plan.

## Contact

Questions about this policy or responsible disclosure can be sent to `security@infinitycolor.com`. Avoid public channels for security-related communications.

---

_Last updated: January 2026_
