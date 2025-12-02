# Contributing to Infinity Store

Thank you for your interest in contributing to Infinity Store! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 16
- Redis 7
- Git

### Local Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Infinitycolor.git
   cd Infinitycolor
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp dev.env.example dev.env  # Configure your local environment
   npm run develop
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   cp dev.env.example dev.env  # Configure your local environment
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:2888
   - Backend: http://localhost:1337
   - Admin Panel: http://localhost:1337/admin

See [`LOCAL_DEV_SETUP.md`](backend/LOCAL_DEV_SETUP.md) for detailed setup instructions.

## Development Workflow

### Branch Strategy

We use three main branches:

- **`main`** - Production-ready code
- **`dev`** - Integration branch for staging
- **`experimental`** - Testing ground for experimental features

### Creating a Feature Branch

Always create a new branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding tests

## Coding Standards

### TypeScript

- Use **TypeScript strict mode**
- Avoid `any` types - define proper types
- Use functional and declarative programming patterns
- Prefer interfaces over types for object shapes
- Use meaningful variable names with auxiliary verbs (e.g., `isLoading`, `hasError`)

### Code Style

**Backend (Strapi):**

```typescript
// ✅ Good
export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    async find(ctx) {
      const { data, meta } = await super.find(ctx);
      return { data, meta };
    },
  })
);
```

**Frontend (Next.js):**

```typescript
// ✅ Good - Server Component (preferred)
export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);
  return <ProductDetail product={product} />;
}

// ✅ Good - Client Component (when needed)
("use client");
export function AddToCart({ productId }: { productId: string }) {
  const { addItem } = useCart();
  return <button onClick={() => addItem(productId)}>Add to Cart</button>;
}
```

### File Structure

```
backend/src/api/
├── [content-type]/
│   ├── controllers/
│   │   └── [content-type].ts
│   ├── routes/
│   │   └── [content-type].ts
│   ├── services/
│   │   └── [content-type].ts
│   └── content-types/
│       └── [content-type]/
│           └── schema.json

frontend/src/
├── app/
│   └── [route]/
│       ├── page.tsx
│       └── layout.tsx
├── components/
│   └── [feature]/
│       └── ComponentName.tsx
├── services/
│   └── [feature]/
│       └── service.ts
└── types/
    └── [feature].ts
```

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Follow mobile-first responsive design
- Use RTL-first approach for Persian text
- Component-specific styles in the component file

```tsx
// ✅ Good
<div className="flex flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Title</h1>
</div>
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(cart): add discount code validation

- Add validation for discount code format
- Implement usage limit checking
- Add error messages for invalid codes

Closes #123

---

fix(payment): handle Mellat gateway timeout

The payment controller now properly handles timeout scenarios
and returns appropriate error messages to the user.

Fixes #456

---

docs(api): update cart API documentation

Add examples for discount code endpoints
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests when relevant
- Write detailed commit bodies for complex changes

## Pull Request Process

### Before Submitting

1. **Update from dev branch**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout your-branch
   git rebase dev
   ```

2. **Run tests**

   ```bash
   # Backend
   cd backend
   npm test

   # Frontend
   cd frontend
   npm test
   ```

3. **Check linting**

   ```bash
   # Backend
   npm run lint

   # Frontend
   npm run lint
   ```

4. **Build verification**

   ```bash
   # Backend
   npm run build

   # Frontend
   npm run build
   ```

### Submitting a Pull Request

1. Push your branch to your fork

   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request to the `dev` branch (not `main`)

3. Fill out the PR template completely

4. Link related issues (e.g., "Closes #123")

5. Request review from maintainers

### PR Requirements

- ✅ All tests pass
- ✅ No linting errors
- ✅ Code follows project conventions
- ✅ Documentation updated (if needed)
- ✅ Changelog updated (for significant changes)
- ✅ Screenshots/videos (for UI changes)
- ✅ At least one approval from maintainers

### PR Review Process

1. Maintainer reviews your code
2. Automated CI/CD checks run
3. Address any requested changes
4. Once approved, maintainer will merge

## Testing

### Backend Testing

```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- path/to/test   # Specific test
```

Write tests for:

- API endpoints
- Service methods
- Helper functions
- Edge cases

```typescript
// Example test
describe("Cart Service", () => {
  it("should add item to cart", async () => {
    const cart = await strapi.service("api::cart.cart").addItem({
      userId: 1,
      productId: 1,
      quantity: 2,
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });
});
```

### Frontend Testing

```bash
cd frontend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- ComponentName  # Specific test
```

Write tests for:

- Components
- Hooks
- Utility functions
- Integration tests

```typescript
// Example test
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("renders product information", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Document API endpoints using Strapi's built-in documentation
- Update `.cursor/rules/*.mdc` files for new patterns
- Keep README files up to date

```typescript
/**
 * Calculate the total price of cart items including discounts
 * @param items - Array of cart items
 * @param discount - Optional discount object
 * @returns Total price after discounts
 */
export function calculateTotal(items: CartItem[], discount?: Discount): number {
  // Implementation
}
```

### Cursor Rules

When introducing new patterns, add documentation to `.cursor/rules/`:

```bash
# Create new rule file
touch .cursor/rules/my-new-feature.mdc
```

### README Updates

Update relevant README files:

- Project root: [`README.md`](README.md)
- Backend: [`backend/README.md`](backend/README.md) or [`backend/CLAUDE.md`](backend/CLAUDE.md)
- Frontend: [`frontend/README.md`](frontend/README.md) or [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

## Project-Specific Guidelines

### SQL Queries

**Always use lowercase/snake_case column names:**

```typescript
// ✅ CORRECT
const result = await strapi.db.connection.raw(
  `UPDATE local_user_wallets
   SET balance = balance - ?
   WHERE id = ? AND balance >= ?
   RETURNING balance`,
  [amount, walletId, amount]
);

// ❌ WRONG - Don't use quoted camelCase
const result = await strapi.db.connection.raw(
  `UPDATE local_user_wallets
   SET "Balance" = "Balance" - ?  -- This will fail!
   WHERE id = ?`,
  [amount, walletId]
);
```

See `.cursor/rules/sql-column-naming.mdc` for details.

### Persian/RTL Support

- Always test RTL layout
- Use `dir="rtl"` on appropriate elements
- Use logical properties in CSS (e.g., `margin-inline-start` instead of `margin-left`)

### Payment Integration

When working with payment gateways:

- Always log transactions
- Handle timeouts gracefully
- Don't modify cart/stock until payment confirmed
- See `.cursor/rules/cart-clearing-policy.mdc` and `.cursor/rules/backend-stock-adjustment-policy.mdc`

## Getting Help

- **Documentation**: Check `.cursor/rules/*.mdc` files
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Contact**: Reach out to maintainers

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

Thank you for contributing to Infinity Store! 🎉
