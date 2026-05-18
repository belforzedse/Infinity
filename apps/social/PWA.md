# Social PWA Implementation Notes

## Current scope

- Target app: `apps/social` only.
- Shipping now: manifest, install metadata, icons, service worker, offline fallback, public feed/post snapshots, install UX, network state, local comment drafts.
- Deferred: push notifications, background sync, and replay of likes/saves/comments while offline.

## Cache policy

| Surface | Policy |
| --- | --- |
| `/_next/static/*`, icons, fonts | cache-first in the service worker |
| same-origin public image requests, including `/_next/image` | stale-while-revalidate, max 80 entries |
| navigations | network-first, fall back to `/offline` only when the network fails |
| authenticated requests, requests with `Authorization`, mutating methods, `/api/*` | never intercepted or cached by the service worker |
| public home feed snapshots | IndexedDB, latest snapshot only |
| public post snapshots | IndexedDB, max 24 recently viewed posts |
| local comment drafts | localStorage, cleared on successful submit and on logout |

## Route classification

- Public/cacheable read surfaces: `/`, `/post/[slug]`, static assets, public icon files.
- Public but live-only surfaces: `/search`.
- Private/live-only surfaces: `/profile/**`, bookmarks, notifications, auth/session probes, post creation/editing, likes, saves, comments, uploads.

## Deployment rules

- `sw.js` must be served with `Cache-Control: no-cache, no-store, must-revalidate`.
- Service worker updates stay user-controlled: the new worker waits until the user accepts the update banner.
- Cache version is defined in `public/sw.js`; bump it whenever SW cache behavior changes.
- The Social app stays on native Next.js build behavior; no shared storefront package or Heynobat code is required.

## Deferred push roadmap

When push is revisited, add:

1. VAPID public/private configuration.
2. A backend push-subscription table keyed by user and endpoint.
3. Authenticated subscribe/unsubscribe endpoints.
4. A delivery worker for activity events such as comment replies and approved comments.
5. Notification payload contracts with deep links into `/post/[slug]` or profile routes.
6. iOS-specific UX that explains Home Screen installation before requesting permission.

Do not add push subscription code until the backend ownership, delivery path, and unsubscribe lifecycle are agreed.
