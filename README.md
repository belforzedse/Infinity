# Infinity Store

Infinity Store is a full-stack e-commerce platform built for the Iranian market with a Strapi backend and a Next.js frontend. This repository contains everything required to run, test, and deploy the platform in a consistent and secure manner.

## Project Structure

```
infinity/
├── apps/
│   ├── apps/backend/      # Strapi 4.25 API (TypeScript, PostgreSQL, Redis)
│   └── apps/frontend/     # Next.js 16 App Router (TypeScript, Tailwind, Jotai)
├── packages/         # Future shared workspace packages
├── package.json      # pnpm workspace scripts
├── pnpm-workspace.yaml
├── turbo.json
└── .github/          # CI/CD workflows and CODEOWNERS
```

## Technology Stack

### Backend
- **Framework**: Strapi 4.25.21 (Headless CMS)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Language**: TypeScript
- **Payment**: Beh Pardakht Mellat, SnappPay
- **Authentication**: Strapi users-permissions plugin

### Frontend
- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3.4.1 + shadcn/ui
- **State**: Jotai 2.11.1
- **UI**: RTL-first design for Persian/Farsi

## Key Capabilities

- Comprehensive shopping journey with intelligent discounting and wallet support
- Secure checkout across Mellat, SnappPay, and in-platform wallet gateways
- Operational tooling for orders, fulfillment, and shipping with Anipo
- Rich user accounts with wallets, histories, and saved preferences
- RTL-first responsive UI optimized for Persian shoppers
- Administrative dashboards for monitoring catalog health and KPIs

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis 7
- pnpm 10+ via Corepack

### Install

```bash
corepack enable
pnpm install
```

### Backend

```bash
pnpm turbo run develop --filter=@repo/backend
```

Starts Strapi on http://localhost:1337.

### Frontend

```bash
pnpm turbo run dev --filter=@repo/frontend
```

Starts Next.js on http://localhost:2888.

See the backend and frontend app directories for additional environment configuration details.

## Documentation

- **Backend Guide**: [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md)
- **Frontend Guide**: [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md)
- **Development Rules**: `.cursor/rules/*.mdc`
- **Troubleshooting**: [`apps/backend/TROUBLESHOOTING-SLUGS.md`](apps/backend/TROUBLESHOOTING-SLUGS.md), [`apps/backend/DOCKER_DEV.md`](apps/backend/DOCKER_DEV.md)

## Deployment

| Branch        | Environment   | Notes                                  |
| ------------- | ------------- | -------------------------------------- |
| `main`        | Production    | Protected, release-ready only          |
| `dev`         | Staging       | Integration branch for feature work    |
| `experimental`| Experimental  | Safe space for spikes and prototypes   |

Each branch has associated CI workflows defined under `.github/workflows`. Refer to the apps/backend/frontend app READMEs for deployment details.

## Contributing

We welcome thoughtful contributions and expect all contributors to follow the established workflows.

- **[Contributing Guide](CONTRIBUTING.md)** — Development workflow and review expectations
- **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community standards
- **[Collaborator Roles](.github/COLLABORATORS.md)** — Access levels and responsibilities

All changes targeting `main` or `dev` must go through a pull request and pass automated checks.

## Support

- **[Support Guide](.github/SUPPORT.md)** — Issue triage and troubleshooting resources
- **[Security Policy](SECURITY.md)** — Private vulnerability disclosure process
- **[GitHub Issues](../../issues)** — Bug reports and feature requests
- **[GitHub Discussions](../../discussions)** — General questions and community topics

## Project Management

- **[Changelog](CHANGELOG.md)** — Release history
- **[Code Owners](.github/CODEOWNERS)** — Default reviewer coverage
- **[Issue Templates](.github/ISSUE_TEMPLATE/)** — Standardized issue creation

## License

Infinity Store is released under the MIT License. See the [LICENSE](LICENSE) file for the full text.


