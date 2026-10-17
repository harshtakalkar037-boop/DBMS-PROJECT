# Safe public demo mode (not enabled by default)

This branch prepares the backend policy for a public, read-only demonstration. It does **not** enable public demo login by itself and does not change the production deployment.

## Current safety defaults

- `ALLOW_SEEDED_DEMO_LOGINS` defaults to `false`.
- In production, the seven seeded demo identities remain unable to log in unless the flag is explicitly enabled.
- When the flag is enabled, successful logins for those identities receive a signed `isDemo` token claim.
- The API-wide `enforceDemoReadOnly` middleware blocks non-read HTTP methods for those demo tokens before any API route/controller executes. The logout endpoint is allowed so users can end sessions.
- The frontend's local demo picker is still development-only. No production demo picker or public credential disclosure is introduced by this branch.

## CORS deployment configuration

- Set `CORS_ORIGIN` on the backend to the exact origin(s) that should call it, as a comma-separated list (scheme + hostname + optional port; no path).
- For the current production frontend, include `https://dbms-project-snowy-three.vercel.app`.
- Do not use `*` for a credentialed production frontend. The app ignores wildcard entries and denies browser origins that are not explicitly allow-listed.
- Vercel preview URLs are different origins. Add only the specific preview origin needed for testing; do not allow all preview subdomains.
- Requests without an Origin header (for example, server-to-server requests) are not blocked by CORS. Authentication and authorization remain mandatory.

## Do not enable on the existing shared database yet

The repository has publicly visible seeded demo credential material in frontend source. Therefore, enabling `ALLOW_SEEDED_DEMO_LOGINS=true` against the current shared Aiven database would let anyone who knows those credentials read data allowed by each role. The flag must remain false until all of the following are complete:

1. Create a separate demo database/service with generated fictional data only; do not point the demo at a production or shared database.
2. Rotate any demo passwords and secrets that have been exposed; do not reuse passwords committed to source history.
3. Confirm all seed records are fictional and remove any real personal information.
4. Run backend typecheck/build and tests, including direct API attempts to POST/PUT/PATCH/DELETE using each demo role's token.
5. Verify each role's existing route-level permissions and data scoping still apply to GET requests.
6. Only then set `ALLOW_SEEDED_DEMO_LOGINS=true` on the demo backend and configure the demo frontend. Never set it on the ordinary production service.

## Important limitation

The middleware is an additional write guard, not a substitute for route-level authorization or database isolation. It currently guards by HTTP method and signed demo claim. Any future mutating operation exposed through GET would violate HTTP conventions and must be corrected separately. Logout is intentionally permitted; refresh requests are separately controlled by the auth service and still require a valid refresh token.

## Deploying this branch

This branch is not deployed. Review and test it first. Do not merge to `main`, trigger a Render deploy, or change Aiven settings until the isolated demo database and credentials are ready.
