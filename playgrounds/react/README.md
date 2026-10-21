# ThunderID React Playground

A Vite app that exercises every capability of `@thunderid/react` against a local ThunderID server. It links the SDK
packages from this workspace (`workspace:*`), so it always runs the code you are changing. It is not published.

| Page                        | What it does                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview (`#/`)             | Capability checks driven by the real SDK API (run one or run all, pass/fail with a reason, filters), a session card with an access token countdown, the provider configuration, and a live SDK event log. |
| Components (`#/components`) | A component explorer: a searchable tree of the SDK components and their stories, a viewport, theme, and grid toolbar, and Controls, Code, Actions, and Accessibility panels.                              |
| Hooks (`#/hooks`)           | Live values of `useThunderID`, `useUser`, `useI18n`, `useTranslation`, `useTheme`, `useFlow`, and the management query hooks.                                                                             |
| Tokens (`#/tokens`)         | The access and ID tokens held by the SDK, decoded locally, with expiry and claim notes.                                                                                                                   |

## Set up a local ThunderID server

1. Start ThunderID on `https://localhost:8090` (see the [ThunderID docs](https://thunderid.dev)) and sign in to the
   Console.
2. Create a single-page (public) application and register these URLs:
   - Redirect URIs: `http://localhost:5173`
   - Allowed origins (CORS): `http://localhost:5173`
3. Note the application's client ID and application ID.
4. Accept the server's self-signed certificate once by opening `https://localhost:8090` in the browser you use for the
   playground.

## Run

```bash
# From the repository root: install and build the SDKs once.
pnpm install
pnpm build

# Configure the playground.
cp playgrounds/react/.env.example playgrounds/react/.env
# Set VITE_THUNDERID_CLIENT_ID, and VITE_THUNDERID_APPLICATION_ID for the app-native flows.

pnpm --filter @thunderid/playground-react dev
```

Open http://localhost:5173. After changing SDK source, rebuild that package (for example
`pnpm --filter @thunderid/react build`) and reload.

| Variable                                                                | Purpose                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_THUNDERID_BASE_URL`                                               | ThunderID server. Defaults to `https://localhost:8090`.                                           |
| `VITE_THUNDERID_CLIENT_ID`                                              | Client ID of the SPA application. Required for sign-in.                                           |
| `VITE_THUNDERID_APPLICATION_ID`                                         | Application ID. Needed by `<SignIn />`, `<SignUp />`, `<Recovery />` and their checks.            |
| `VITE_THUNDERID_AFTER_SIGN_IN_URL`, `VITE_THUNDERID_AFTER_SIGN_OUT_URL` | Redirect targets. Default to the app origin.                                                      |
| `VITE_THUNDERID_SCOPES`                                                 | Space separated scopes. Defaults to `openid profile email`.                                       |
| `VITE_THUNDERID_STORAGE`                                                | `sessionStorage`, `localStorage`, or `browserMemory`. Unset uses the SDK default.                 |
| `VITE_PLAYGROUND_EXPRESS_URL`                                           | Where the SDK switcher sends you for the Express playground. Defaults to `http://localhost:3000`. |

Without a server or a client ID the app still runs: checks that need one fail with the reason.

## Checks

Checks that would leave the page (redirect sign-in, sign-out) only run from their own **Run** button; **Run all checks**
marks them as not run. Results are kept in `sessionStorage` so they survive the sign-in redirect.

## Known SDK gaps

The playground reports these instead of faking them:

- No organization API in `@thunderid/react` (`useOrganization`, `switchOrganization`): the Organizations check is shown
  as unavailable.
- No public event subscription. The browser client has `on('sign-in' | 'sign-out' | ...)` hooks, but `ThunderIDProvider`
  keeps them internal. The event log is built from observed `useThunderID()`/`useUser()` state changes plus the SDK
  calls the playground makes. Exposing `on()` (sign-in, sign-out, token refreshed, refresh failed, HTTP request
  start/finish/error) would let apps and this log subscribe directly.
- No manual token refresh or access token expiry on the context. The session card reads expiry from
  `getStorageManager().getSessionData()`, and "Renew silently" uses `signInSilently()`.
- `user`, `signIn`, `signOut`, `signUp`, `recover`, and `getStorageManager` are typed as `any`; see `src/lib/sdk.ts`.
