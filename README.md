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
| [Express](playgrounds/express) | `pnpm --filter @thunderid/playground-express dev` | API explorer for the `@thunderid/express` handlers and protected routes, with an SDK trace |
| [React](playgrounds/react) | `pnpm --filter @thunderid/playground-react dev` | Capability checks, a component explorer for the `@thunderid/react` components, and live hooks and tokens |

## Contributing

Please refer to the [Contributing Guide](https://thunderid.dev/community/overview) for the different ways to contribute to this project and the relevant guidelines.

For code contributions, refer to the [Contributing Code](https://thunderid.dev/community/contributing/contributing-code/prerequisites/) section for details on the prerequisites and instructions for running ThunderID in development mode.

## License

This project is licensed under the [Apache License 2.0](https://github.com/thunder-id/thunderid/blob/main/LICENSE).
