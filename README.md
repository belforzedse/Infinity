# Infinity Store

Infinity Store is a full-stack e-commerce platform built for the Iranian market with a Strapi backend and a Next.js frontend. This repository contains everything required to run, test, and deploy the platform in a consistent and secure manner.

## Project Structure

```
infinity/
├── backend/          # Strapi 4.25 API (TypeScript, PostgreSQL, Redis)
├── frontend/         # Next.js 16 App Router (TypeScript, Tailwind, Jotai)
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
- npm 10+ (ships with Node 20)

### Backend

```bash
cd backend
npm install
npm run develop      # Starts Strapi on http://localhost:1337
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Starts Next.js on http://localhost:2888
```

See the backend and frontend directories for additional environment configuration details.

## Documentation

- **Backend Guide**: [`backend/CLAUDE.md`](backend/CLAUDE.md)
- **Frontend Guide**: [`frontend/CLAUDE.md`](frontend/CLAUDE.md)
- **Development Rules**: `.cursor/rules/*.mdc`
- **Troubleshooting**: [`backend/TROUBLESHOOTING-SLUGS.md`](backend/TROUBLESHOOTING-SLUGS.md), [`backend/DOCKER_DEV.md`](backend/DOCKER_DEV.md)

## Deployment

| Branch        | Environment   | Notes                                  |
| ------------- | ------------- | -------------------------------------- |
| `main`        | Production    | Protected, release-ready only          |
| `dev`         | Staging       | Integration branch for feature work    |
| `experimental`| Experimental  | Safe space for spikes and prototypes   |

Each branch has associated CI workflows defined under `.github/workflows`. Refer to the backend/frontend READMEs for deployment details.

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


