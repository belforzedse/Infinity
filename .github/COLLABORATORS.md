# Repository Collaborators

This document outlines the access structure for the Infinitycolor repository.

## Current Team Structure

### Admins

- **[Your Name]** (@your-username) - Repository Owner
  - Full administrative access
  - Manages CI/CD, secrets, and deployment

### Maintainers

> Maintainers have write access and can manage issues/PRs but cannot modify sensitive settings

_To be added_

### Developers (Write Access)

> Developers can push code, create branches, and merge PRs

_To be added_

### Contributors (Triage/Read Access)

> Contributors can review code and manage issues

_To be added_

## How to Request Access

1. Contact the repository owner via [method]
2. Specify which areas you'll be working on:
   - Frontend (`/frontend`)
   - Backend (`/backend`)
   - CI/CD (`.github/workflows`)
   - Documentation
3. Minimum required permission level will be assigned

## Role Responsibilities

### Admin Responsibilities

- Manage repository settings and security
- Configure CI/CD pipelines
- Manage deployment secrets
- Add/remove collaborators
- Enforce branch protection rules

### Maintainer Responsibilities

- Review and merge pull requests
- Manage issues and project boards
- Create and manage releases
- Enforce code quality standards

### Developer Responsibilities

- Write and test code
- Submit pull requests
- Review peer code
- Update documentation

### Contributor Responsibilities

- Report bugs
- Suggest features
- Review pull requests
- Update documentation

## Branch Protection Rules

### `main` branch

- Requires pull request reviews before merging
- Requires status checks to pass
- Requires linear history
- Restricts who can push (Admins only)

### `dev` branch

- Requires pull request reviews before merging
- Requires status checks to pass
- Write access for developers

### `experimental` branch

- Testing ground for experimental features
- Fewer restrictions

## Adding New Collaborators

**Via GitHub UI:**

1. Go to Settings → Collaborators
2. Click "Add people"
3. Enter GitHub username
4. Select appropriate role
5. Send invitation

**Via GitHub CLI:**

```bash
# Add collaborator with specific permission
gh api repos/OWNER/REPO/collaborators/USERNAME \
  -X PUT \
  -f permission=write
```

## Removing Collaborators

When a collaborator leaves:

1. Remove them from the repository
2. Rotate any shared secrets they had access to
3. Review their recent commits
4. Update this document

## Questions?

Contact the repository owner for access-related questions.

---

_Last updated: December 2025_
