#!/bin/bash
# Script to remove hardcoded secrets from git history using git-filter-repo
# 
# WARNING: This rewrites git history. All collaborators must re-clone after this.
# 
# Prerequisites:
#   pip install git-filter-repo
#   OR
#   brew install git-filter-repo (macOS)
#
# Usage:
#   1. Create a backup branch: git branch backup-before-secret-removal
#   2. Run this script: bash remove-secrets-from-history.sh
#   3. Review the changes
#   4. Force push: git push origin --force --all

set -e

echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  Make sure you have:"
echo "   1. Created a backup branch"
echo "   2. Pushed the backup branch to remote"
echo "   3. Notified all collaborators"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo is not installed"
    echo "Install it with: pip install git-filter-repo"
    echo "Or: brew install git-filter-repo (macOS)"
    exit 1
fi

echo "🔍 Removing secrets from git history..."

# Remove Mellat credentials
git filter-repo --replace-text <(echo "MELLAT_TERMINAL_ID==>MELLAT_TERMINAL_ID") --force
git filter-repo --replace-text <(echo "MELLAT_PASSWORD==>MELLAT_PASSWORD") --force

# Remove SnappPay credentials
git filter-repo --replace-text <(echo "SNAPPAY_CLIENT_SECRET==>SNAPPAY_CLIENT_SECRET") --force
git filter-repo --replace-text <(echo "SNAPPAY_PASSWORD==>SNAPPAY_PASSWORD") --force

# Remove revalidation secret
git filter-repo --replace-text <(echo "REVALIDATION_SECRET==>REVALIDATION_SECRET") --force

# Remove WooCommerce API keys
git filter-repo --replace-text <(echo "WOOCOMMERCE_CONSUMER_KEY==>WOOCOMMERCE_CONSUMER_KEY") --force
git filter-repo --replace-text <(echo "WOOCOMMERCE_CONSUMER_SECRET==>WOOCOMMERCE_CONSUMER_SECRET") --force

# Remove Strapi API tokens (long tokens)
git filter-repo --replace-text <(echo "STRAPI_API_TOKEN_PRODUCTION==>STRAPI_API_TOKEN_PRODUCTION") --force
git filter-repo --replace-text <(echo "STRAPI_API_TOKEN_STAGING==>STRAPI_API_TOKEN_STAGING") --force
git filter-repo --replace-text <(echo "STRAPI_API_TOKEN_LOCAL==>STRAPI_API_TOKEN_LOCAL") --force
git filter-repo --replace-text <(echo "STRAPI_API_TOKEN==>STRAPI_API_TOKEN") --force

# Remove admin password
git filter-repo --replace-text <(echo "ADMIN_PASSWORD==>ADMIN_PASSWORD") --force

echo "✅ Secrets removed from git history"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes: git log --all"
echo "   2. Verify secrets are gone: git log -p | grep -i 'secret\|password\|token'"
echo "   3. Force push to remote: git push origin --force --all"
echo "   4. Notify all collaborators to re-clone the repository"

