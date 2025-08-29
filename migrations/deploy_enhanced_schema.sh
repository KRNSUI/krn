#!/bin/bash

# Enhanced Database Schema Deployment Script
# This script deploys the enhanced schema to your Cloudflare D1 database

set -e

echo "🚀 Deploying Enhanced KRN Database Schema..."

# Check if we're in the right directory
if [ ! -f "migrations/enhanced_schema.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
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

# Get database name from wrangler.toml or prompt user
DB_NAME=""
if [ -f "wrangler.toml" ]; then
    DB_NAME=$(grep -o 'binding = "KRN_DB"' wrangler.toml | head -1 | sed 's/binding = "\(.*\)"/\1/')
fi

if [ -z "$DB_NAME" ]; then
    echo "📝 Enter your D1 database name (or create one with 'wrangler d1 create <name>'):"
    read -r DB_NAME
fi

if [ -z "$DB_NAME" ]; then
    echo "❌ Error: Database name is required"
    exit 1
fi

echo "📊 Using database: $DB_NAME"

# Check if database exists
if ! wrangler d1 list | grep -q "$DB_NAME"; then
    echo "❌ Error: Database '$DB_NAME' not found. Please create it first:"
    echo "   wrangler d1 create $DB_NAME"
    exit 1
fi

# Deploy the enhanced schema
echo "📋 Deploying enhanced schema..."
wrangler d1 execute "$DB_NAME" --file=./migrations/enhanced_schema.sql

echo "✅ Enhanced schema deployed successfully!"
echo ""
echo "📋 Schema includes:"
echo "  - Enhanced complaints table with counts and flags"
echo "  - Stars table for user interactions"
echo "  - Flags table for content moderation"
echo "  - User sessions table for activity tracking"
echo "  - Automatic triggers for count maintenance"
echo "  - Performance indexes"
echo ""
echo "🔗 Next steps:"
echo "1. Update your wrangler.toml to use the enhanced API endpoints"
echo "2. Test the new functionality with the enhanced feed"
echo "3. Monitor the database performance"
echo ""
echo "📊 You can view your database with:"
echo "   wrangler d1 execute $DB_NAME --command='SELECT name FROM sqlite_master WHERE type=\"table\"'"
