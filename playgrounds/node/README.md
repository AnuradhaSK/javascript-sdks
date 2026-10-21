# Node.js playground

A playground for `@thunderid/node`, built against the SDK source in this workspace. It runs a plain `node:http` server
that holds a `ThunderIDNodeClient`, and serves an operations explorer for running each client method against ThunderID.

## What it covers

| Group          | Operations                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Discovery      | `getOpenIDProviderEndpoints()`, `getDiscoveryResponse()`, `getConfiguration()`                                                             |
| Sign-in        | `getSignInUrl()`, `signIn()` (start, and code exchange), `getOBOSignInURL()`, `initiateCIBA()`, `pollCIBA()`                               |
| Session        | `isSignedIn()`, `getUser()`, `getIdToken()`, `getDecodedIdToken()`, `getAccessToken()`, `decodeJwtToken()`, `clearSession()`               |
| Tokens         | `refreshAccessToken()`, `revokeAccessToken()`, `exchangeToken()`, client credentials (`getAccessToken()` on a `client_credentials` client) |
| Sign-out       | `signOut()`, `handleBackchannelLogout()`                                                                                                   |
| Management API | `getUsers()`, `getFlows()`, `getUserTypes()`, `updateUserCredentials()`                                                                    |

`signInSilently()`, `signUp()`, `recover()`, `getUserProfile()` and `updateUserProfile()` are listed as not available:
`ThunderIDNodeClient` does not implement them.

The server also mounts the two routes an app built on the SDK needs: `GET /login` starts sign-in for the browser session
and finishes it on the redirect back from ThunderID, and `GET /logout` redirects to the ThunderID end-session endpoint.

The operations explorer at the playground's root lets you:

- pick an operation, fill in its parameters or JSON argument, and **run it as** your browser session (signed in or not),
  a new session, or a copy of your session whose access token expired a minute ago;
- read what the call resolved to, or the error it rejected with;
- open the **HTTP** tab for the requests the SDK sent to ThunderID, with their responses;
- follow the **SDK trace**: the client methods the call went through, its requests and the SDK's own log lines;
- copy the call as code and read the operation's source.

## Run it against a local ThunderID server

1. Start ThunderID (by default at `https://localhost:8090`).
2. In the ThunderID Console, create an application with an OAuth2 client:
   - redirect URI `http://localhost:3003/login`, post-logout redirect URI `http://localhost:3003/logout`;
   - grant types `authorization_code`, and `refresh_token` for `refreshAccessToken()`;
   - a confidential client (note the client secret);
   - for the client credentials operation, the `client_credentials` grant on this client, or a second client set in
     `THUNDERID_SERVICE_CLIENT_ID` and `THUNDERID_SERVICE_CLIENT_SECRET`.
3. Build the SDKs and configure the playground, from the repository root:

   ```bash
   pnpm install
   pnpm build
   cp playgrounds/node/.env.example playgrounds/node/.env
   ```

   Fill in `THUNDERID_CLIENT_ID` and `THUNDERID_CLIENT_SECRET` in `.env`. A local ThunderID server uses a self-signed
   certificate, so for local development also uncomment `NODE_TLS_REJECT_UNAUTHORIZED=0`.

4. Start the playground:

   ```bash
   pnpm --filter @thunderid/playground-node dev
   ```

5. Open http://localhost:3003, select **Sign in**, and come back to the explorer.

Node runs `src/server.ts` directly, so the playground needs Node.js 22.18 or later and has no build output. `pnpm build`
type-checks it against the workspace SDK, and `pnpm --filter @thunderid/node build` picks up SDK changes on the next
restart.

Without a ThunderID server, the explorer still runs: the top bar shows ThunderID as unreachable and the operations that
call it reject with the SDK's errors, which the trace shows.

## How the trace works

`@thunderid/node` emits no debug events, so the playground assembles the trace itself (`src/trace.ts`): it routes the
SDK logger through its `formatter` hook, wraps the client's methods (including the protected ones the public methods are
built from), and wraps `fetch` to record each request and response. Secrets in requests (`client_secret`, `password`,
the `Authorization` header) are masked.
