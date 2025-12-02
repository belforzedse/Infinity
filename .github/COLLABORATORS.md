# Repository Collaborators

This guide documents how access to the Infinity Store repository is organized, the expectations for each role, and the process for onboarding or offboarding collaborators.

## Team Structure

| Role        | Access Level | Description |
| ----------- | ------------ | ----------- |
| Admins      | Admin        | Own repository settings, secrets, and compliance tasks |
| Maintainers | Maintain     | Review and merge pull requests, manage issues, publish releases |
| Developers  | Write        | Contribute features, fixes, and documentation through PRs |
| Contributors| Triage/Read  | Triage issues, review PRs, and propose documentation changes |

> **Note:** GitHub Teams should be used wherever possible to assign permissions consistently. Update this table whenever roles are added, removed, or re-assigned.

### Current Assignments

| Role        | GitHub Handle        | Responsibilities |
| ----------- | -------------------- | ---------------- |
| Admin       | _TBD_                | Repository ownership, CI/CD, credentials |
| Maintainer  | _TBD_                | Release coordination, architecture decisions |
| Developer   | _TBD_                | Feature delivery, peer review |
| Contributor | _Open to applicants_ | Issue triage, documentation |

Populate the placeholders above as soon as access is granted.

## Requesting Access

1. Contact the repository owner or maintainer via the communication channel defined in the onboarding checklist (email or company chat).
2. Provide:
   - Full name and GitHub handle
   - Expected contribution area(s): frontend, backend, CI/CD, documentation, tooling
   - Desired start date and duration (if temporary engagement)
3. The maintainer will review the request, determine the minimum permission level required, and issue the invitation.
4. Once the invite is accepted, update this document and the internal roster.

## Responsibilities and Expectations

### Admins
- Maintain branch protection rules, GitHub Apps, webhooks, and environments.
- Manage GitHub Secrets, deployment tokens, and CI/CD credentials.
- Approve or revoke collaborator access and ensure two-factor authentication compliance.
- Provide final approval for breaking changes or production incidents.

### Maintainers
- Lead code reviews and ensure adherence to architectural and security standards.
- Curate issue and project boards, prioritize incoming work, and coordinate releases.
- Ensure documentation (README, CHANGELOG, CLAUDE guides) stays in sync with code changes.
- Mentor developers and contributors by providing actionable feedback.

### Developers
- Design and implement features or fixes with accompanying tests.
- Keep pull requests focused, documented, and aligned with the PR template.
- Participate in peer reviews and knowledge-sharing sessions.
- Update relevant documentation and changelog entries before requesting review.

### Contributors
- Report reproducible defects with context and logs.
- Suggest enhancements through well-researched issues or discussion threads.
- Provide copy edits or clarifying documentation updates.
- Review pull requests for clarity, UX, or localization considerations when qualified.

## Branch Protection Policy

### `main`
- Admin-only pushes
- Requires at least one maintainer review
- Requires status checks and linear history
- Used exclusively for production releases

### `dev`
- Write access for maintainers and developers
- Requires at least one review and passing CI
- Serves as the integration branch for the next release window

### `experimental`
- Open to developers for spikes, proofs of concept, and demos
- Automated checks recommended but not strictly enforced
- Must never be used for production deployments

## Onboarding Checklist

1. Confirm contributor has enabled GitHub 2FA.
2. Grant the appropriate permission level via Settings → Collaborators or GitHub Teams.
3. Share links to the README, CONTRIBUTING, SECURITY, and SUPPORT guides.
4. Provide access to required secrets or services (PostgreSQL, Redis, payment sandbox) through the secure channel.
5. Update this document with the collaborator’s name and role.

## Offboarding Checklist

1. Remove repository access through GitHub settings and associated teams.
2. Rotate secrets or tokens tied to the departing collaborator’s role.
3. Reassign open issues, PRs, or deployments they were handling.
4. Document any outstanding knowledge transfers.

## Contact

For questions about access levels or responsibilities, reach out to the repository owner or current maintainer team using the project’s primary communication channel.

---

_Last updated: January 2026_
