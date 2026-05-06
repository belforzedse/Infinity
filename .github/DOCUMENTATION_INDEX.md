# Documentation Index

Complete index of all documentation files in the Infinity Store repository.

## 📚 Quick Links

### For New Contributors
1. [README.md](../README.md) - Start here
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
3. [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) - Community guidelines
4. [Backend Setup](../apps/backend/LOCAL_DEV_SETUP.md) - Backend development
5. [Frontend Setup](../apps/frontend/README.md) - Frontend development

### For Maintainers
1. [REPOSITORY_MANAGEMENT.md](REPOSITORY_MANAGEMENT.md) - Repository management guide
2. [COLLABORATORS.md](COLLABORATORS.md) - Team and access management
3. [CODEOWNERS](CODEOWNERS) - Code ownership assignments

### For Users
1. [SUPPORT.md](SUPPORT.md) - Getting help
2. [SECURITY.md](../SECURITY.md) - Security policy
3. [CHANGELOG.md](../CHANGELOG.md) - Version history

## 📋 All Documentation Files

### Root Level

#### Project Information
- **[README.md](../README.md)**
  - Project overview
  - Quick start guide
  - Technology stack
  - Features overview

#### Legal & License
- **[LICENSE](../LICENSE)**
  - MIT License
  - Copyright information
  - Usage terms

#### Contributing
- **[CONTRIBUTING.md](../CONTRIBUTING.md)**
  - Development workflow
  - Coding standards
  - Commit guidelines
  - Testing requirements
  - PR process

- **[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)**
  - Community standards
  - Expected behavior
  - Enforcement guidelines

#### Version Control
- **[CHANGELOG.md](../CHANGELOG.md)**
  - Version history
  - Release notes
  - Breaking changes
  - Migration guides

#### Security
- **[SECURITY.md](../SECURITY.md)**
  - Security policy
  - Vulnerability reporting
  - Security measures
  - Best practices

### .github Directory

#### Team Management
- **[COLLABORATORS.md](COLLABORATORS.md)**
  - Team structure
  - Role responsibilities
  - Access management
  - How to add/remove collaborators

- **[CODEOWNERS](CODEOWNERS)**
  - Code ownership assignments
  - Auto-review assignments

#### Community Support
- **[SUPPORT.md](SUPPORT.md)**
  - How to get help
  - Common issues
  - Support channels
  - Community resources

#### Repository Management
- **[REPOSITORY_MANAGEMENT.md](REPOSITORY_MANAGEMENT.md)**
  - Maintenance tasks
  - Issue management
  - PR management
  - Release process
  - Branch management
  - Security management

- **[LICENSE_OPTIONS.md](LICENSE_OPTIONS.md)**
  - Alternative license options
  - License comparison
  - Migration guide

#### Templates
- **[PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md)**
  - PR description template
  - Checklist for submissions
  - Testing requirements

- **[ISSUE_TEMPLATE/bug_report.md](ISSUE_TEMPLATE/bug_report.md)**
  - Bug report template
  - Required information
  - Steps to reproduce

- **[ISSUE_TEMPLATE/feature_request.md](ISSUE_TEMPLATE/feature_request.md)**
  - Feature request template
  - Use cases
  - Implementation ideas

- **[ISSUE_TEMPLATE/documentation.md](ISSUE_TEMPLATE/documentation.md)**
  - Documentation issue template
  - Content suggestions

#### CI/CD
- **[workflows/backend-cicd.yml](workflows/backend-cicd.yml)**
  - Backend build pipeline
  - Deployment automation
  - Environment configurations

### Backend Documentation

#### Setup & Development
- **[apps/backend/README.md](../apps/backend/README.md)**
  - Backend overview
  - Quick start

- **[apps/backend/CLAUDE.md](../apps/backend/CLAUDE.md)**
  - Architecture guide
  - Code patterns
  - Best practices

- **[apps/backend/LOCAL_DEV_SETUP.md](../apps/backend/LOCAL_DEV_SETUP.md)**
  - Local development setup
  - Database configuration
  - Environment variables

- **[apps/backend/LOCAL_DEV_QUICKSTART.md](../apps/backend/LOCAL_DEV_QUICKSTART.md)**
  - Quick setup guide
  - Common commands

- **[apps/backend/DOCKER_DEV.md](../apps/backend/DOCKER_DEV.md)**
  - Docker development
  - Container management

#### Troubleshooting & Guides
- **[apps/backend/TROUBLESHOOTING-SLUGS.md](../apps/backend/TROUBLESHOOTING-SLUGS.md)**
  - Persian slug issues
  - URL handling

- **[apps/backend/COMPLETION_CHECKLIST.md](../apps/backend/COMPLETION_CHECKLIST.md)**
  - Feature completion checklist
  - Quality gates

- **[apps/backend/docs/](../apps/backend/docs/)**
  - Payment gateway docs
  - Cart API guide
  - API schemas

### Frontend Documentation

#### Setup & Development
- **[apps/frontend/README.md](../apps/frontend/README.md)**
  - Frontend overview
  - Quick start

- **[apps/frontend/CLAUDE.md](../apps/frontend/CLAUDE.md)**
  - Architecture guide
  - Component patterns
  - State management

#### Features & Guides
- **[apps/frontend/PWA_ASSESSMENT.md](../apps/frontend/PWA_ASSESSMENT.md)**
  - PWA implementation
  - Service worker

- **[apps/frontend/SEO_TESTING_GUIDE.md](../apps/frontend/SEO_TESTING_GUIDE.md)**
  - SEO optimization
  - Testing procedures

- **[apps/frontend/ADDRESSES_REALTIME_UPDATE.md](../apps/frontend/ADDRESSES_REALTIME_UPDATE.md)**
  - Address management
  - Real-time updates

### Cursor Rules (.cursor/rules/)

Development patterns and guidelines (71 files):

#### Backend Rules
- **API & Authentication**
  - `api-integration.mdc` - API patterns
  - `auth-system.mdc` - Authentication
  - `auth-middleware.mdc` - Auth middleware
  - `custom-apis.mdc` - Custom API endpoints
  - `custom-router.mdc` - Router patterns

- **Data & Schema**
  - `strapi-schema.mdc` - Schema overview
  - `product-schema.mdc` - Product models
  - `user-schema.mdc` - User models
  - `order-cart-schema.mdc` - Order/cart models
  - `contract-schema.mdc` - Contract models
  - `discount-schema.mdc` - Discount models

- **Business Logic**
  - `cart-service-structure.mdc` - Cart service
  - `financial-calculation.mdc` - Financial logic
  - `backend-stock-adjustment-policy.mdc` - Stock management
  - `cart-clearing-policy.mdc` - Cart clearing

- **Reports & Logging**
  - `backend-reports.mdc` - Report APIs
  - `backend-audit-logging.mdc` - Audit logs
  - `event-logging.mdc` - Event system

- **Integrations**
  - `anipo-integration.mdc` - Anipo shipping
  - `payment-snappay.mdc` - SnappPay

#### Frontend Rules
- **Pages**
  - `home-page-layout.mdc` - Home page
  - `pdp-layout.mdc` - Product detail page
  - `plp-layout.mdc` - Product listing page

- **Components**
  - `blog-ui-components.mdc` - Blog components
  - `cart-implementation.mdc` - Cart UI
  - `product-like.mdc` - Favorites
  - `product-search.mdc` - Search UI

- **Features**
  - `wallet-flows.mdc` - Wallet UI
  - `reports-frontend.mdc` - Admin reports
  - `anipo-frontend.mdc` - Anipo UI

- **Admin**
  - `super-admin-structure.mdc` - Admin structure
  - `super-admin-crud.mdc` - CRUD patterns
  - `super-admin-conventions.mdc` - Conventions

#### Guidelines
- **Development**
  - `end-user-pages-guidelines.mdc` - UX guidelines
  - `testing-jest-types.mdc` - Testing
  - `typescript-types.mdc` - TypeScript

- **SEO & Performance**
  - `seo-optimization.mdc` - SEO best practices
  - `seo-pages.mdc` - Page-specific SEO
  - `http2-optimization.mdc` - HTTP/2

- **Database**
  - `sql-column-naming.mdc` - SQL naming rules

## 📖 Documentation by Topic

### Getting Started
1. [README.md](../README.md)
2. [Backend Setup](../apps/backend/LOCAL_DEV_SETUP.md)
3. [Frontend Setup](../apps/frontend/README.md)
4. [Docker Development](../apps/backend/DOCKER_DEV.md)

### Contributing
1. [Contributing Guidelines](../CONTRIBUTING.md)
2. [Code of Conduct](../CODE_OF_CONDUCT.md)
3. [PR Template](PULL_REQUEST_TEMPLATE.md)
4. [Issue Templates](ISSUE_TEMPLATE/)

### Architecture
1. [Backend Architecture](../apps/backend/CLAUDE.md)
2. [Frontend Architecture](../apps/frontend/CLAUDE.md)
3. [Cursor Rules](../.cursor/rules/)

### Features
1. [Cart Implementation](../.cursor/rules/cart-implementation.mdc)
2. [Payment Integration](../.cursor/rules/payment-snappay.mdc)
3. [Product Search](../.cursor/rules/product-search.mdc)
4. [Wallet System](../.cursor/rules/wallet-flows.mdc)
5. [Anipo Shipping](../.cursor/rules/anipo-integration.mdc)

### Maintenance
1. [Repository Management](REPOSITORY_MANAGEMENT.md)
2. [Security Policy](../SECURITY.md)
3. [Changelog](../CHANGELOG.md)
4. [Support](SUPPORT.md)

### Troubleshooting
1. [Backend Troubleshooting](../apps/backend/TROUBLESHOOTING-SLUGS.md)
2. [Common Issues](SUPPORT.md#common-issues-and-solutions)
3. [Docker Issues](SUPPORT.md#docker-issues)

## 🔍 Finding Documentation

### By Role

**New Contributor:**
- README.md → CONTRIBUTING.md → Backend/Frontend Setup → Cursor Rules

**Developer:**
- CLAUDE.md files → Cursor Rules → API Docs

**Maintainer:**
- REPOSITORY_MANAGEMENT.md → COLLABORATORS.md → CODEOWNERS

**User:**
- README.md → SUPPORT.md → Issue Templates

### By Task

**Setting up locally:**
1. [README.md](../README.md)
2. [Backend Setup](../apps/backend/LOCAL_DEV_SETUP.md)
3. [Frontend Setup](../apps/frontend/README.md)

**Making a contribution:**
1. [CONTRIBUTING.md](../CONTRIBUTING.md)
2. [Coding Standards](../CONTRIBUTING.md#coding-standards)
3. [PR Process](../CONTRIBUTING.md#pull-request-process)

**Reporting an issue:**
1. [SUPPORT.md](SUPPORT.md)
2. [Issue Templates](ISSUE_TEMPLATE/)

**Understanding a feature:**
1. Check [Cursor Rules](../.cursor/rules/)
2. Check [CLAUDE.md](../apps/backend/CLAUDE.md) or [apps/frontend/CLAUDE.md](../apps/frontend/CLAUDE.md)
3. Check feature-specific docs in `apps/backend/docs/` or `apps/frontend/docs/`

## 📝 Documentation Standards

### File Naming
- Use UPPERCASE for important docs in root (README.md, CONTRIBUTING.md)
- Use kebab-case for other docs (local-dev-setup.md)
- Use .mdc extension for Cursor rules

### Format
- Use Markdown
- Include table of contents for long docs
- Use code blocks with language tags
- Include examples
- Keep updated dates

### Maintenance
- Review quarterly
- Update with code changes
- Keep in sync with implementation
- Remove outdated information

## 🆘 Need Help?

- Can't find something? [Search the repo](https://github.com/YOUR_ORG/Infinitycolor/search)
- Still stuck? [Create an issue](https://github.com/YOUR_ORG/Infinitycolor/issues/new/choose)
- Want to chat? [Start a discussion](https://github.com/YOUR_ORG/Infinitycolor/discussions)

---

*Last updated: December 2025*
*Total documentation files: 100+*

