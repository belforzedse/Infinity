## Summary

<!-- Provide a concise description of the business value and technical scope -->

## Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] Bug fix
- [ ] Feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactor / maintenance
- [ ] Performance improvement
- [ ] Test coverage
- [ ] Build / CI / configuration

## Related Work

- Closes #
- Relates to #

## Implementation Notes

<!-- Outline critical design decisions, new dependencies, or migrations -->

- Detail 1
- Detail 2

## Testing

### Automated

- [ ] Unit tests
- [ ] Integration / end-to-end tests
- [ ] Linting
- [ ] Type checks

### Manual Verification

- Environment tested:
- Steps performed:
  1.
  2.
  3.
- Result summary:

### Evidence

```
Paste key test output, logs, or screenshots links (if applicable)
```

## UI Changes (if applicable)

- [ ] Not applicable
- [ ] Screenshots / recordings attached

## Deployment & Rollback

- [ ] No special actions required
- [ ] Requires database migration
- [ ] Requires new/updated environment variables
- [ ] Requires cache purge or queue drain
- [ ] Requires backend restart
- [ ] Requires frontend rebuild

Rollback strategy:

## Checklist

### Code Quality

- [ ] Code follows project style conventions
- [ ] Hard-coded secrets or credentials have not been introduced
- [ ] Logging is intentional and avoids sensitive data
- [ ] Complex logic paths are documented in code comments when necessary

### Documentation

- [ ] README / domain docs updated (if needed)
- [ ] `.cursor/rules/*.mdc` updated (if new patterns were introduced)
- [ ] `CHANGELOG.md` updated (for user-facing changes)

### Backend-Specific

- [ ] Database migrations are included and idempotent
- [ ] API contracts documented or updated
- [ ] Authorization and validation paths reviewed

### Frontend-Specific

- [ ] Responsive layout verified (mobile/tablet/desktop)
- [ ] RTL layout verified when applicable
- [ ] Accessibility expectations met (labels, focus order, keyboard nav)
- [ ] Loading/error/empty states implemented

### Security & Dependencies

- [ ] Third-party packages vetted and justified
- [ ] `npm audit` (or equivalent) run when adding dependencies
- [ ] User input sanitized/validated throughout the change

## Reviewer Notes

<!-- Provide any areas that deserve extra attention -->
