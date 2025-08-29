#!/bin/bash

# KRN Bot Deployment Script
# This script automates the deployment of the integrated KRN Bot to Cloudflare Workers

set -e

echo "🚀 Deploying KRN Bot to Cloudflare Workers..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "wrangler.jsonc" ]; then
    echo "❌ Error: Please run this script from the krnbot-integrated directory"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed. Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare first:"
    wrangler login
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Type check
echo "🔍 Type checking..."
npm run check

# Deploy
echo "🚀 Deploying to Cloudflare Workers..."
npm run deploy

echo "✅ KRN Bot deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the iframe src in your main app to point to the deployed worker URL"
echo "2. Test the chat functionality"
echo "3. Remove the old krnbot submodule if you haven't already"
echo ""
echo "🔗 Your worker URL should be: https://krnbot-integrated.<your-subdomain>.workers.dev"
