# Revu dashboard

Hebrew RTL dashboard for an Israeli marketing agency managing Google Business Profile reviews and posts.

## Stack

- Vite, React, and TypeScript
- React Router with hash-based routes for static hosting
- Tailwind CSS plus product-specific CSS tokens
- Vitest and Testing Library

## Development

```bash
npm install
npm run dev
```

Start the backend first (from `backend/`, normally with `docker compose up --build`), then start the frontend. In local development, leave `VITE_API_BASE_URL` empty: Vite proxies `/api`, `/auth`, and `/health` to `http://localhost:3001`, avoiding browser CORS and hostname differences. Use an absolute URL only when the deployed frontend and API are hosted separately:

```bash
VITE_API_BASE_URL=https://api.example.com npm run dev
```

All API requests include credentials. The backend's `FRONTEND_ORIGIN` must exactly match the frontend origin (including scheme and port), and production frontend/API deployments must use a cookie-compatible same-site setup. Local development uses the backend's `AUTH_MODE=dev` together with frontend `VITE_AUTH_MODE=dev`; Google OIDC requires both backend `AUTH_MODE=google` and frontend `VITE_AUTH_MODE=google`.

In development there is no login step: `/api/v1/session` automatically uses the seeded `DEV_USER_EMAIL`. If it returns 401, run the backend seed and verify that `admin@revu.local` exists. The `/auth/google/start` route is intentionally inactive in this mode.

Useful checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Routes

- `/#/overview`
- `/#/reviews`
- `/#/posts`
- `/#/settings`
- `/#/onboarding` (resumable Google Business connection wizard)

The selected business is stored in `location`. Review filtering and search use `filter` and `q` query parameters.

## Backend integration

UI components depend on the typed `ReviewsManagerService` interface in `src/services/reviewsManager.ts`. Runtime uses `HttpReviewsManagerService`; `MockReviewsManagerService` remains available for deterministic tests.

Google OAuth credentials, refresh tokens, and Google Business API calls are handled by the backend rather than exposed to this browser application. The session response includes workspace capabilities; the UI hides unavailable reply and publishing actions, while the backend remains the authoritative enforcement layer.
