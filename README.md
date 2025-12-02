# Infinity Store

Full-stack e-commerce platform for the Iranian market with Strapi backend and Next.js frontend.

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

## Quick Start

### Backend

```bash
cd backend
npm install
npm run develop      # Dev server (port 1337)
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Dev server (port 2888)
```

## Documentation

- **Backend**: [`backend/CLAUDE.md`](backend/CLAUDE.md) - Backend architecture guide
- **Frontend**: [`frontend/CLAUDE.md`](frontend/CLAUDE.md) - Frontend architecture guide
- **Cursor Rules**: `.cursor/rules/*.mdc` - Development guidelines

## Deployment

- **main** → Production
- **dev** → Staging
- **experimental** → Experimental environment

See individual directories for detailed setup and deployment instructions.

## Features

- 🛒 Shopping cart with discount codes
- 💳 Multiple payment gateways (Mellat, SnappPay, Wallet)
- 📦 Order management with Anipo shipping
- 👤 User accounts with wallet system
- 📱 Responsive RTL design
- 🔐 JWT authentication
- 📊 Admin dashboard with reports

## Contributing

This is a private repository. All changes must go through Pull Requests for `main` and `dev` branches.

## License

Private - All Rights Reserved

