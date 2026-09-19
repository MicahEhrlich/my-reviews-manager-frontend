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

The selected business is stored in `location`. Review filtering and search use `filter` and `q` query parameters.

## Backend integration

UI components depend on the typed `ReviewsManagerService` interface in `src/services/reviewsManager.ts`. The current `MockReviewsManagerService` keeps deterministic session-only data. A future HTTP implementation can use `VITE_API_BASE_URL` and replace the injected adapter in `src/main.tsx` without changing page components.

Google OAuth credentials, refresh tokens, and Google Business API calls must be handled by the backend rather than exposed to this browser application.
