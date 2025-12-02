# Support

Thank you for using Infinity Store! This document provides resources for getting help.

## Getting Help

### Before Asking for Help

1. **Check the Documentation**
   - [README.md](../README.md) - Project overview
   - [Backend Documentation](../backend/CLAUDE.md)
   - [Frontend Documentation](../frontend/CLAUDE.md)
   - [Cursor Rules](../.cursor/rules/) - Development patterns

2. **Search Existing Issues**
   - [Open Issues](https://github.com/YOUR_ORG/Infinitycolor/issues)
   - [Closed Issues](https://github.com/YOUR_ORG/Infinitycolor/issues?q=is%3Aissue+is%3Aclosed)

3. **Review Troubleshooting Guides**
   - [Backend Troubleshooting](../backend/TROUBLESHOOTING-SLUGS.md)
   - [Local Development Setup](../backend/LOCAL_DEV_SETUP.md)
   - [Docker Development](../backend/DOCKER_DEV.md)

## Ways to Get Support

### 1. GitHub Issues

**For bugs, feature requests, and technical questions:**

- [Create a Bug Report](https://github.com/YOUR_ORG/Infinitycolor/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/YOUR_ORG/Infinitycolor/issues/new?template=feature_request.md)
- [Report Documentation Issue](https://github.com/YOUR_ORG/Infinitycolor/issues/new?template=documentation.md)

### 2. GitHub Discussions

**For general questions and community support:**

- [Ask a Question](https://github.com/YOUR_ORG/Infinitycolor/discussions/new?category=q-a)
- [Share Ideas](https://github.com/YOUR_ORG/Infinitycolor/discussions/new?category=ideas)
- [Show and Tell](https://github.com/YOUR_ORG/Infinitycolor/discussions/new?category=show-and-tell)

### 3. Documentation

**Comprehensive guides:**

- **Getting Started**
  - [Quick Start](../README.md#quick-start)
  - [Backend Setup](../backend/LOCAL_DEV_SETUP.md)
  - [Frontend Setup](../frontend/README.md)

- **Development Guides**
  - [Contributing Guidelines](../CONTRIBUTING.md)
  - [API Integration Patterns](../.cursor/rules/api-integration.mdc)
  - [Authentication System](../.cursor/rules/auth-system.mdc)
  - [Cart Implementation](../.cursor/rules/cart-implementation.mdc)

- **Deployment**
  - [Production Deployment](../backend/README.md#deployment)
  - [Docker Configuration](../backend/DOCKER_DEV.md)
  - [CI/CD Pipeline](../.github/workflows/)

## Common Issues and Solutions

### Backend Issues

#### "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection settings in .env
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

#### "Redis connection refused"
```bash
# Check Redis is running
docker ps | grep redis

# Check Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### "Port 1337 already in use"
```bash
# Find and kill the process
npx kill-port 1337

# Or use a different port
PORT=1338 npm run develop
```

### Frontend Issues

#### "API connection failed"
```bash
# Check backend is running
curl http://localhost:1337/api

# Check NEXT_PUBLIC_API_URL in .env
NEXT_PUBLIC_API_URL=http://localhost:1337
```

#### "Build fails with type errors"
```bash
# Regenerate types
cd backend
npm run type:generate

# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

#### "Port 2888 already in use"
```bash
# Find and kill the process
npx kill-port 2888

# Or use a different port
PORT=3000 npm run dev
```

### Docker Issues

#### "Docker build fails"
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -f main.Dockerfile .
```

#### "Container won't start"
```bash
# Check logs
docker logs container-name

# Check environment variables
docker exec container-name env
```

## Response Times

**Please note:** This is an open-source project maintained by volunteers.

- **Critical bugs**: We aim to respond within 1-2 business days
- **General issues**: We aim to respond within 3-5 business days
- **Feature requests**: We'll respond when we can review thoroughly
- **Questions**: Community members often respond quickly

## Security Issues

**Do not report security vulnerabilities as GitHub issues.**

See [SECURITY.md](../SECURITY.md) for how to report security issues privately.

## Contributing

Want to help others? Consider:

- Answering questions in Discussions
- Reviewing pull requests
- Improving documentation
- Writing tutorials or blog posts

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more information.

## Commercial Support

For commercial support, custom development, or consulting services, please contact the maintainers directly.

## Helpful Resources

### Official Documentation
- [Strapi Documentation](https://docs.strapi.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)

### Community Resources
- [Strapi Discord](https://discord.strapi.io/)
- [Next.js Discord](https://nextjs.org/discord)
- [Stack Overflow](https://stackoverflow.com/) - Use tags: `strapi`, `next.js`, `typescript`

### Video Tutorials
- [Strapi YouTube Channel](https://www.youtube.com/c/Strapi)
- [Next.js YouTube Channel](https://www.youtube.com/c/Vercel)

## Contact

- **Project Maintainer**: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- **Repository**: [Infinitycolor](https://github.com/YOUR_ORG/Infinitycolor)

## Thank You

Thank you for being part of the Infinity Store community! Your questions, feedback, and contributions help make this project better for everyone.

