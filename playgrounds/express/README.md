# Express playground

A playground for `@thunderid/express`, built against the SDK source in this workspace. It runs an Express server that
mounts the SDK's handlers and a set of example protected routes, and serves an API explorer for calling them.

## What it covers

| Route                      | Uses                                            |
| -------------------------- | ----------------------------------------------- |
| `GET /login`               | `handleSignIn()`                                |
| `GET /logout`              | `handleSignOut()`                               |
| `POST /flow/sign-in`       | `handleFlow()` (embedded sign-in flow)          |
| `POST /backchannel-logout` | `handleBackchannelLogout()`                     |
| `GET /api/session`         | `client.isSignedIn()`                           |
| `GET /api/me`              | `protect()`, `client.getUser()`                 |
| `GET /api/id-token`        | `protect()`, `client.getDecodedIdToken()`       |
| `POST /api/token/refresh`  | `client.refreshAccessToken()`                   |
| `GET /api/public`          | nothing (baseline)                              |
| `GET /api/orders`, `/:id`  | `protect()`                                     |
| `GET /api/admin/users`     | `protect()`, a scope check, `client.getUsers()` |

Every route sits behind `thunderID()`, which attaches the client to `req.thunderIDAuth`.

The API explorer at the playground's root lets you:

- pick a route and **send it as** an anonymous caller (no cookie), your signed-in session, or a copy of your session
  whose access token expired a minute ago;
- read the response status, body and headers;
- follow the **SDK trace**: the middleware that ran, the client methods they called, the requests the SDK made to
  ThunderID and the SDK's own log lines;
- copy the request as cURL and read the handler's source.

## Run it against a local ThunderID server

1. Start ThunderID (by default at `https://localhost:8090`).
2. In the ThunderID Console, create an application with an OAuth2 client:
   - redirect URI `http://localhost:3000/login`, post-logout redirect URI `http://localhost:3000/logout`;
   - grant types `authorization_code` and, for `POST /api/token/refresh`, `refresh_token`;
   - a confidential client (note the client secret).
3. Build the SDKs and configure the playground, from the repository root:

   ```bash
   pnpm install
   pnpm build
   cp playgrounds/express/.env.example playgrounds/express/.env
   ```

   Fill in `THUNDERID_CLIENT_ID` and `THUNDERID_CLIENT_SECRET` in `.env`. A local ThunderID server uses a self-signed
   certificate, so for local development also uncomment `NODE_TLS_REJECT_UNAUTHORIZED=0`.

4. Start the playground:

   ```bash
   pnpm --filter @thunderid/playground-express dev
   ```

5. Open http://localhost:3000, select **Sign in**, and come back to the explorer.

Node runs `src/server.ts` directly, so the playground needs Node.js 22.18 or later and has no build output. `pnpm build`
type-checks it against the workspace SDK, and `pnpm --filter @thunderid/express build` picks up SDK changes on the next
restart.

Without a ThunderID server, the explorer still runs: the top bar shows ThunderID as unreachable and the routes that call
it answer with the SDK's errors, which the trace shows.

## How the trace works

`@thunderid/express` emits no debug events, so the playground assembles the trace itself (`src/trace.ts`): it routes the
SDK logger through its `formatter` hook, wraps each route's middleware and handlers, wraps the client methods they call,
and wraps `fetch`. Requests sent from the explorer carry an `x-playground-trace` header; the steps recorded while
serving them go back with the response.
