# Repository Management Guide

This guide explains how to manage and maintain the Infinity Store repository effectively.

## Documentation Structure

### Root Level

| File | Purpose | When to Update |
|------|---------|----------------|
| [README.md](../README.md) | Project overview and quick start | When project structure or setup changes |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines | When development process changes |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Community standards | Rarely (unless policy changes) |
| [SECURITY.md](../SECURITY.md) | Security policy and reporting | When security practices change |
| [CHANGELOG.md](../CHANGELOG.md) | Version history | With every release |
| [LICENSE](../LICENSE) | Project license | Only if changing license (rare) |

### .github Directory

| File/Directory | Purpose | When to Update |
|----------------|---------|----------------|
| [COLLABORATORS.md](.github/COLLABORATORS.md) | Team structure and access | When adding/removing team members |
| [SUPPORT.md](.github/SUPPORT.md) | Support resources | When support channels change |
| [CODEOWNERS](.github/CODEOWNERS) | Code ownership assignments | When responsibilities change |
| [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) | PR checklist | When PR requirements change |
| [ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) | Issue templates | When issue reporting process changes |
| [workflows/](.github/workflows/) | CI/CD pipelines | When deployment process changes |
| [LICENSE_OPTIONS.md](.github/LICENSE_OPTIONS.md) | License alternatives | Reference document (rarely) |

## Regular Maintenance Tasks

### Daily
- [ ] Review and respond to new issues
- [ ] Review open pull requests
- [ ] Check CI/CD pipeline status
- [ ] Monitor security alerts

### Weekly
- [ ] Triage open issues
- [ ] Update project boards
- [ ] Review and merge approved PRs
- [ ] Check dependency updates (Dependabot)

### Monthly
- [ ] Update CHANGELOG.md with merged features
- [ ] Review and update documentation
- [ ] Audit team access and permissions
- [ ] Check and update dependencies
- [ ] Review and close stale issues

### Quarterly
- [ ] Major documentation review
- [ ] Performance audit
- [ ] Security audit
- [ ] Dependency major version updates
- [ ] Review and update coding standards

### Per Release
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Tag release in git
- [ ] Update version numbers
- [ ] Deploy to environments
- [ ] Announce release

## Managing Collaborators

### Adding a Collaborator

1. **Via GitHub Web UI**
   - Settings → Collaborators → Add people
   - Enter username
   - Select role (Read, Triage, Write, Maintain, Admin)
   - Send invitation

2. **Update Documentation**
   - Add to [COLLABORATORS.md](COLLABORATORS.md)
   - Update [CODEOWNERS](CODEOWNERS) if needed
   - Notify team

3. **Onboarding**
   - Share documentation links
   - Review contribution guidelines
   - Add to relevant discussions/channels

### Removing a Collaborator

1. **Via GitHub Web UI**
   - Settings → Collaborators
   - Find user → Remove

2. **Security Steps**
   - Rotate shared secrets (if applicable)
   - Review their recent commits
   - Update access logs

3. **Update Documentation**
   - Remove from [COLLABORATORS.md](COLLABORATORS.md)
   - Update [CODEOWNERS](CODEOWNERS) if needed

## Managing Issues

### Issue Triage Process

1. **New Issue Created**
   - Read and understand the issue
   - Verify it's not a duplicate
   - Ask for clarification if needed

2. **Label the Issue**
   - **Type**: `bug`, `enhancement`, `documentation`, `question`
   - **Priority**: `critical`, `high`, `medium`, `low`
   - **Status**: `needs-triage`, `confirmed`, `in-progress`, `blocked`
   - **Component**: `backend`, `frontend`, `ci-cd`, `docs`

3. **Assign and Track**
   - Assign to appropriate person/team
   - Link to related issues/PRs
   - Add to project board

4. **Resolution**
   - Close when fixed/resolved
   - Link to resolving PR
   - Thank the reporter

### Issue Labels

Create these labels in your repository:

**Type**
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `question` - Further information requested
- `refactor` - Code refactoring
- `performance` - Performance improvements
- `security` - Security-related issues

**Priority**
- `critical` - System is broken
- `high` - Important issue
- `medium` - Normal priority
- `low` - Nice to have

**Status**
- `needs-triage` - Needs initial review
- `confirmed` - Issue confirmed
- `in-progress` - Someone is working on it
- `blocked` - Blocked by another issue
- `wontfix` - Not going to fix
- `duplicate` - Already reported

**Component**
- `backend` - Backend/API issues
- `frontend` - Frontend/UI issues
- `ci-cd` - CI/CD pipeline issues
- `database` - Database-related
- `deployment` - Deployment issues
- `testing` - Testing issues

**Extra**
- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed
- `breaking-change` - Breaking change

## Managing Pull Requests

### PR Review Checklist

1. **Initial Check**
   - [ ] PR template filled out
   - [ ] Description is clear
   - [ ] Linked to related issue
   - [ ] CI/CD checks passed

2. **Code Review**
   - [ ] Code follows project standards
   - [ ] Logic is sound
   - [ ] Tests are included
   - [ ] Documentation updated
   - [ ] No security issues

3. **Testing**
   - [ ] Manual testing (if needed)
   - [ ] Edge cases considered
   - [ ] No breaking changes (or documented)

4. **Approval & Merge**
   - [ ] Approve the PR
   - [ ] Choose merge strategy:
     - **Squash and merge** - Multiple small commits
     - **Rebase and merge** - Clean commit history
     - **Create merge commit** - Preserve history
   - [ ] Delete branch after merge

### Merge Strategies

**Use "Squash and merge" for:**
- Feature branches with many WIP commits
- Small bug fixes
- Documentation updates

**Use "Rebase and merge" for:**
- Well-structured commit history
- Atomic commits
- Clean feature branches

**Use "Create merge commit" for:**
- Large features
- Release branches
- When preserving full history is important

## Branch Management

### Protected Branches

Configure branch protection for:

**main branch:**
- Require pull request reviews (1+)
- Require status checks to pass
- Require linear history
- Do not allow force pushes
- Restrict who can push (Admins only)

**dev branch:**
- Require pull request reviews (1+)
- Require status checks to pass
- Allow force pushes (for maintainers)

### Branch Naming

Enforce naming conventions:
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation
- `refactor/*` - Code refactoring
- `test/*` - Adding tests

### Stale Branch Cleanup

Regularly delete:
- Merged branches
- Abandoned branches (60+ days old)
- Use: `git branch -d branch-name` (local)
- Use: `git push origin --delete branch-name` (remote)

## Release Management

### Release Process

1. **Prepare Release**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b release/v2.1.0
   ```

2. **Update Version**
   - Update `package.json` versions
   - Update CHANGELOG.md
   - Update documentation if needed

3. **Create PR to main**
   - Title: "Release v2.1.0"
   - Include changelog in description
   - Request reviews

4. **After Merge**
   ```bash
   git checkout main
   git pull origin main
   git tag v2.1.0
   git push origin v2.1.0
   ```

5. **Create GitHub Release**
   - Go to Releases → New Release
   - Select tag v2.1.0
   - Copy changelog content
   - Publish release

6. **Merge back to dev**
   ```bash
   git checkout dev
   git merge main
   git push origin dev
   ```

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (X.Y.0): New features, no breaking changes
- **PATCH** (X.Y.Z): Bug fixes

## Security Management

### Security Checklist

- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable code scanning (CodeQL)
- [ ] Enable secret scanning
- [ ] Require 2FA for collaborators
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Handling Security Issues

1. **Receive Report** (via SECURITY.md process)
2. **Acknowledge** (within 48 hours)
3. **Investigate** (assess severity and impact)
4. **Develop Fix** (in private if needed)
5. **Test Fix** (thoroughly)
6. **Deploy Fix** (to all affected versions)
7. **Disclose** (coordinate with reporter)
8. **Publish Advisory** (GitHub Security Advisory)

## Automation

### GitHub Actions

Maintain these workflows:
- **Backend CI/CD** - Build and deploy backend
- **Frontend CI/CD** - Build and deploy frontend
- **Dependency Review** - Check dependency changes
- **Stale Issues** - Close stale issues
- **Greetings** - Welcome new contributors

### Bots and Integrations

Consider adding:
- **Dependabot** - Automated dependency updates
- **CodeQL** - Code security scanning
- **Codecov** - Code coverage tracking
- **Conventional Commits** - Commit message validation

## Analytics and Metrics

### Repository Insights

Regularly review:
- Traffic (views and clones)
- Contributors
- Commit activity
- Issue/PR metrics
- Community health

### Key Metrics to Track

- Open/closed issue ratio
- PR merge time
- Time to first response
- Contributor growth
- Code coverage
- Build success rate
- Deployment frequency

## Communication

### Channels

- **Issues** - Bug reports, feature requests
- **Discussions** - Questions, ideas, general chat
- **Pull Requests** - Code review discussions
- **Email** - Security issues, private matters
- **External** - Social media, blog, etc. (if applicable)

### Best Practices

- Respond within 1-2 business days
- Be respectful and professional
- Thank contributors
- Provide clear explanations
- Document decisions
- Close the loop (follow up on resolutions)

## Tools and Resources

### Useful GitHub CLI Commands

```bash
# List issues
gh issue list

# Create issue
gh issue create

# List PRs
gh pr list

# Review PR
gh pr review 123

# Check workflow status
gh run list

# View repository stats
gh repo view
```

### Useful Git Commands

```bash
# Clean up merged branches
git branch --merged | grep -v "\*\|main\|dev" | xargs -n 1 git branch -d

# Update all submodules
git submodule update --remote --merge

# Interactive rebase (clean history)
git rebase -i HEAD~5

# Cherry-pick commit
git cherry-pick abc123
```

## Getting Help

- [GitHub Docs](https://docs.github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

*Last updated: December 2025*

