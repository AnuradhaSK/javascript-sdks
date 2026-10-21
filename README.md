![ThunderID JavaScript SDKs](https://raw.githubusercontent.com/thunder-id/thunderid/refs/heads/main/docs/static/assets/images/readme/repo-banner-javascript-sdks.png)

JavaScript SDKs for ThunderID. Provides authentication and user management for browser, Node.js, and framework-based web applications.

## Packages

| Package | Version | Description |
|---|---|---|
| [`@thunderid/javascript`](packages/javascript) | ![npm](https://img.shields.io/npm/v/@thunderid/javascript) | Framework-agnostic core SDK |
| [`@thunderid/browser`](packages/browser) | ![npm](https://img.shields.io/npm/v/@thunderid/browser) | Browser runtime SDK |
| [`@thunderid/node`](packages/node) | ![npm](https://img.shields.io/npm/v/@thunderid/node) | Node.js runtime SDK |
| [`@thunderid/react`](packages/react) | ![npm](https://img.shields.io/npm/v/@thunderid/react) | React SDK |
| [`@thunderid/nextjs`](packages/nextjs) | ![npm](https://img.shields.io/npm/v/@thunderid/nextjs) | Next.js SDK |
| [`@thunderid/react-router`](packages/react-router) | ![npm](https://img.shields.io/npm/v/@thunderid/react-router) | React Router integration |
| [`@thunderid/vue`](packages/vue) | ![npm](https://img.shields.io/npm/v/@thunderid/vue) | Vue SDK |
| [`@thunderid/nuxt`](packages/nuxt) | ![npm](https://img.shields.io/npm/v/@thunderid/nuxt) | Nuxt SDK |
| [`@thunderid/express`](packages/express) | ![npm](https://img.shields.io/npm/v/@thunderid/express) | Express.js SDK |
| [`@thunderid/tanstack-router`](packages/tanstack-router) | ![npm](https://img.shields.io/npm/v/@thunderid/tanstack-router) | TanStack Router integration |
| [`@thunderid/better-auth`](packages/better-auth) | ![npm](https://img.shields.io/npm/v/@thunderid/better-auth) | Better Auth provider helper |

## Playgrounds

Apps under [`playgrounds/`](playgrounds) exercise the SDKs from the source in this workspace. Build the SDKs with
`pnpm build`, then start one:

| Playground | Run | What it shows |
|---|---|---|
| [Browser](playgrounds/browser) | `pnpm --filter @thunderid/playground-browser dev` | Capability checks against `ThunderIDBrowserClient` with a live `on()` hook log, an explorer for the `@thunderid/browser` UI helpers, and tokens |
| [Express](playgrounds/express) | `pnpm --filter @thunderid/playground-express dev` | API explorer for the `@thunderid/express` handlers and protected routes, with an SDK trace |
| [Next.js](playgrounds/nextjs) | `pnpm --filter @thunderid/playground-nextjs dev` | Client and server capability checks, a component explorer for the `@thunderid/nextjs` components, a Server page with an API explorer for the proxy and route handlers, and tokens |
| [Node.js](playgrounds/node) | `pnpm --filter @thunderid/playground-node dev` | Operations explorer for every `ThunderIDNodeClient` method from `@thunderid/node`, with the HTTP requests and an SDK trace |
| [Nuxt](playgrounds/nuxt) | `pnpm --filter @thunderid/playground-nuxt dev` | Client and server capability checks, a component explorer for the `@thunderid/nuxt` components with Vue SFC snippets, live composables, and a Server page with the SSR context, the server session, and an API explorer for the module routes, server utilities, and route middleware |
| [React](playgrounds/react) | `pnpm --filter @thunderid/playground-react dev` | Capability checks, a component explorer for the `@thunderid/react` components, and live hooks and tokens |
| [Vue](playgrounds/vue) | `pnpm --filter @thunderid/playground-vue dev` | Capability checks, a component explorer for the `@thunderid/vue` components with Vue SFC snippets, and live composables and tokens |

## Contributing

Please refer to the [Contributing Guide](https://thunderid.dev/community/overview) for the different ways to contribute to this project and the relevant guidelines.

For code contributions, refer to the [Contributing Code](https://thunderid.dev/community/contributing/contributing-code/prerequisites/) section for details on the prerequisites and instructions for running ThunderID in development mode.

## License

This project is licensed under the [Apache License 2.0](https://github.com/thunder-id/thunderid/blob/main/LICENSE).
