#!/bin/bash

# Frontend Quick Start Script
echo "🚀 Starting Javelin Frontend..."
echo ""

cd "$(dirname "$0")/apps/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite dist .vite

echo ""
echo "✅ Starting development server..."
echo "🌐 Frontend will be available at: http://localhost:5173"
echo "🔌 Backend should be at: http://localhost:3002"
echo ""
echo "⚠️  Make sure backend is running first:"
echo "   cd apps/backend && pnpm dev"
echo ""

pnpm dev
