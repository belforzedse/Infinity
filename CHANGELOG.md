# Changelog

All notable changes to Infinity Store will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project documentation
- Contributing guidelines
- Security policy
- Code of conduct
- License file (MIT)
- Collaborators documentation

## [2.0.0] - 2025-12-02

### Major Updates

- Complete e-commerce platform for Iranian market
- Strapi 4.25.21 backend with TypeScript
- Next.js 16 frontend with App Router
- Multi-gateway payment system (Mellat, SnappPay, Wallet)

### Backend

#### Added

- Strapi 4.25.21 backend with TypeScript
- PostgreSQL 16 database integration
- Redis 7 caching layer
- JWT authentication system
- Order management system
- Cart with discount code support
- Wallet system for users
- Anipo shipping integration
- Multi-gateway payment system:
  - Beh Pardakht Mellat
  - SnappPay installments
  - Wallet payments
- Admin reports dashboard
- Audit logging system
- Event logging for user actions
- Super admin management interface
- Product stock management
- User role-based permissions
- Blog/article system with author management

#### Backend Features

- RESTful API with Strapi
- Custom endpoints for:
  - Cart operations
  - Order processing
  - Payment gateway integration
  - User wallet management
  - Product search
  - Discount validation
- Automated stock adjustment after payment
- Transaction logging and audit trails
- Real-time inventory tracking
- Persian slug support for SEO

### Frontend

#### Added

- Next.js 16 with App Router
- React 19.2.0
- TypeScript 5 (strict mode)
- Tailwind CSS 3.4.1 + shadcn/ui
- Jotai 2.11.1 for state management
- RTL-first design for Persian
- Responsive mobile-first layout

#### Frontend Features

- Product listing with filters
- Product detail pages
- Shopping cart with discount codes
- Multi-step checkout flow
- User authentication (register/login)
- User dashboard
- Order history and tracking
- Wallet management
- Product search
- Blog/article pages
- SEO optimization
- Progressive Web App (PWA) support
- Real-time cart updates
- Address management
- Product favorites/likes

### Infrastructure

#### Added

- Docker containerization
- GitHub Actions CI/CD pipeline
- Multi-environment deployment:
  - Production (main branch)
  - Staging (dev branch)
  - Experimental (experimental branch)
- Automated Docker image builds
- GHCR registry integration
- Nginx reverse proxy with HTTP/2
- SSL/TLS configuration
- Redis session management

#### CI/CD Features

- Automated testing on pull requests
- Type generation verification
- Docker image caching
- Automated deployment to VMs
- Environment-specific configurations
- Database migration handling

### Documentation

#### Added

- Comprehensive README files
- Backend architecture guide (CLAUDE.md)
- Frontend architecture guide (CLAUDE.md)
- 70+ Cursor rules for development patterns
- API documentation
- Local development setup guides
- Docker development guides
- Payment gateway integration docs
- Troubleshooting guides

## Development History

### Early Development (Pre-1.0)

#### Initial Setup

- Project structure established
- Monorepo with backend and frontend
- Basic Strapi configuration
- Next.js app setup

#### MVP Features

- Product catalog
- Basic cart functionality
- User registration
- Simple checkout

#### Iterations

- Payment gateway integration (Mellat)
- Persian language support
- RTL layout implementation
- Mobile responsiveness
- Order management
- Admin panel customization

### Migration & Improvements

#### WooCommerce Migration

- Data import scripts from WooCommerce
- Product, category, and order migration
- Image migration
- Category hierarchy preservation

#### Performance Optimization

- Redis caching implementation
- Database query optimization
- Image optimization (WebP format)
- Code splitting
- Lazy loading
- HTTP/2 optimization

#### Security Enhancements

- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting
- JWT token management
- Password hashing improvements
- Redis password authentication

## Known Issues

See [GitHub Issues](https://github.com/YOUR_ORG/Infinitycolor/issues) for current known issues.

## Upgrade Notes

### From 1.x to 2.x

**Breaking Changes:**

- Node.js 20+ required
- PostgreSQL 16 required
- Environment variable changes
- API endpoint changes
- Authentication flow changes

**Migration Steps:**

1. Update Node.js to version 20+
2. Backup database
3. Update environment variables
4. Run database migrations
5. Rebuild frontend and backend
6. Test all critical flows

## Release Schedule

- **Major releases** (X.0.0): Every 6 months
- **Minor releases** (X.Y.0): Every month
- **Patch releases** (X.Y.Z): As needed for bugs/security

## Support

- Current stable: 2.0.0
- Supported versions: main, dev
- Security patches: Applied to all supported versions

---

## Versioning Convention

- **Major** (X.0.0): Breaking changes, major features
- **Minor** (X.Y.0): New features, no breaking changes
- **Patch** (X.Y.Z): Bug fixes, security patches

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

---

_For older versions and detailed commit history, see the git log._

[Unreleased]: https://github.com/YOUR_ORG/Infinitycolor/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/YOUR_ORG/Infinitycolor/releases/tag/v2.0.0
