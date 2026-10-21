# ThunderID Nuxt Playground

A Nuxt 3 app that exercises every capability of `@thunderid/nuxt`, in the browser and on the Nuxt server, against a
local ThunderID server. It links the SDK packages from this workspace (`workspace:*`), so it always runs the code you
are changing. It is not published.

| Page                         | What it does                                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview (`/`)               | Capability checks for the client and the server (run one or run all, pass/fail with a reason, filters), a session card with an access token countdown read from the server session, the module configuration, and a live SDK event log.                                                     |
| Components (`/components`)   | A component explorer: the components the module auto-imports and the primitives of `@thunderid/vue`, with stories, a viewport, theme, and grid toolbar, and Controls, Code (a Vue SFC generated from the props), Actions, and Accessibility panels.                                         |
| Composables (`/composables`) | Live values of `useThunderID`, `useUser`, `useThunderIDI18n`, `useTheme`, `useFlowMeta`, and `useFlow`.                                                                                                                                                                                     |
| Server (`/server`)           | The context the Nitro plugin built for the server render (`getThunderIDContext`), the session behind `useServerSession`, and an API explorer for every `/api/auth/*` route the module mounts, the playground's own server routes, and the pages behind route middleware, with an SDK trace. |

The playground's own server code shows how an app uses the module:

- `server/api/playground/*.ts`: API routes built on `useServerSession`, `requireServerSession`, and
  `getValidAccessToken` from `@thunderid/nuxt/server`.
- `server/middleware/playground.ts`: server middleware that uses `createRouteMatcher` from `@thunderid/nuxt/utils`. It
  starts the SDK trace for API routes and records `getThunderIDContext` for page renders.
- `pages/protected/index.vue` and `pages/protected/scopes.vue`: pages behind the named `auth` route middleware and a
  `defineThunderIDMiddleware({requireScopes})` middleware.

## Set up a local ThunderID server

1. Start ThunderID on `https://localhost:8090` (see the [ThunderID docs](https://thunderid.dev)) and sign in to the
   Console.
2. Create an application and register this redirect URI: `http://localhost:3002/api/auth/callback`. The browser never
   calls ThunderID directly, so no allowed origins (CORS) are needed.
3. Note the application's client ID, and for the app-native flows its application ID and Flow Secret.

## Run

```bash
# From the repository root: install and build the SDKs once.
pnpm install
pnpm build

# Configure the playground.
cp playgrounds/nuxt/.env.example playgrounds/nuxt/.env
# Set NUXT_PUBLIC_THUNDERID_CLIENT_ID, and NUXT_PUBLIC_THUNDERID_APPLICATION_ID and THUNDERID_FLOW_SECRET for the
# app-native flows.

pnpm --filter @thunderid/playground-nuxt dev
```

Open http://localhost:3002. After changing SDK source, rebuild that package (for example
`pnpm --filter @thunderid/nuxt build`) and restart the dev server.

| Variable                                                                              | Purpose                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `NUXT_PUBLIC_THUNDERID_BASE_URL`                                                      | ThunderID server, for example `https://localhost:8090`.                                    |
| `NUXT_PUBLIC_THUNDERID_CLIENT_ID`                                                     | Client ID of the application. Needed for the redirect sign-in.                             |
| `THUNDERID_CLIENT_SECRET`                                                             | Client secret, for a confidential client. Server-only.                                     |
| `NUXT_PUBLIC_THUNDERID_APPLICATION_ID`                                                | Application ID. Needed by `<SignIn />`, `<SignUp />`, and their checks.                    |
| `THUNDERID_FLOW_SECRET`                                                               | Flow Secret of the application, sent when an app-native flow starts. Server-only.          |
| `THUNDERID_SESSION_SECRET`                                                            | Signs the session cookie. Unset uses an insecure development default.                      |
| `NUXT_PUBLIC_THUNDERID_AFTER_SIGN_IN_URL`, `NUXT_PUBLIC_THUNDERID_AFTER_SIGN_OUT_URL` | Where the browser goes after sign-in and sign-out. Default to `/`.                         |
| `NODE_TLS_REJECT_UNAUTHORIZED=0`                                                      | Lets the Nuxt server talk to a local ThunderID with a self-signed certificate. Local only. |

`nuxt.config.ts` turns on the opt-in features of the module so the playground can show them: back-channel logout and the
three resource pickers (`UserSelect`, `AuthFlowSelect`, `UserTypeSelect`).

Without a client ID the app still runs: the Nitro plugin does not initialize, and checks that need it fail with the
reason.

## Checks

Checks that would leave the page (redirect sign-in, sign-out) only run from their own **Run** button; **Run all checks**
marks them as not run. Results are kept in `sessionStorage` so they survive the sign-in redirect.

## Known SDK gaps

The playground reports these instead of faking them:

- The client context is a facade over the server session: `getIdToken`, `getDecodedIdToken`, `signInSilently`,
  `exchangeToken`, and `http.request` are no-ops, and there is no `getStorageManager`. Their checks are shown as
  unavailable; the Server page reads claims on the server instead.
- No organization API (`useOrganization`, `switchOrganization`): the Organizations check is shown as unavailable.
- No public event subscription. The event log is built from observed composable state plus the calls the playground
  makes.
- No way to issue an expired copy of a session: the cookie is signed with `THUNDERID_SESSION_SECRET` and the module
  exposes no helper for it, so the API explorer's "Expired access token" identity is disabled.
