#!/bin/bash

# Quick setup script for Codespace environment

echo "🚀 Setting up Javelin Backend in Codespace..."
echo ""

# Navigate to backend directory
cd /workspaces/javelin-system-main/apps/backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: You need to configure the following in .env:"
        echo "   1. DATABASE_URL - Your MongoDB Atlas connection string"
        echo "   2. JWT_SECRET - A secure random string"
        echo "   3. Other secrets as needed"
        echo ""
        echo "📝 Opening .env file for editing..."
        code .env
    else
        echo "❌ .env.example not found either!"
        exit 1
    fi
else
    echo "✅ .env file found"
fi

echo ""
echo "🔍 Checking DATABASE_URL..."
if grep -q "DATABASE_URL=" .env; then
    DB_URL=$(grep "DATABASE_URL=" .env | head -1)
    # Mask the password
    MASKED_URL=$(echo "$DB_URL" | sed -E 's/(mongodb(\+srv)?:\/\/[^:]+:)[^@]+(@)/\1****\3/')
    echo "✅ DATABASE_URL is set: $MASKED_URL"
    
    # Check if it's still the default/example value
    if echo "$DB_URL" | grep -q "localhost:27017"; then
        echo "⚠️  WARNING: DATABASE_URL is set to localhost!"
        echo "   This won't work in Codespaces. You need MongoDB Atlas."
        echo ""
        echo "   Get a free MongoDB Atlas account at: https://cloud.mongodb.com"
        echo ""
    elif echo "$DB_URL" | grep -q "mongodb+srv://"; then
        echo "✅ Using MongoDB Atlas (recommended for Codespaces)"
    fi
else
    echo "❌ DATABASE_URL not found in .env file!"
    echo ""
    echo "Add this line to your .env file:"
    echo 'DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/javelin_db"'
    echo ""
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🧪 Testing database connection..."
node debug-env.js

echo ""
echo "✅ Setup complete! Now you can:"
echo "   1. Run 'pnpm dev' to start the backend"
echo "   2. Check 'node test-db-connection.js' to verify MongoDB"
echo ""
