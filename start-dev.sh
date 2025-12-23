#!/bin/bash

echo "🚀 Starting Javelin System for Codespaces..."
echo ""

# Kill any existing processes
pkill -f "tsx watch src/server.ts" 2>/dev/null
pkill -f "vite/bin/vite.js" 2>/dev/null
sleep 2

# Start backend in background
echo "📦 Starting Backend on port 3002..."
cd /workspaces/javelin-system/apps/backend
PORT=3002 pnpm dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Check if backend is running
if lsof -i :3002 2>/dev/null | grep -q LISTEN; then
    echo "✅ Backend is running on port 3002"
else
    echo "❌ Backend failed to start. Check /tmp/backend.log"
    tail -20 /tmp/backend.log
    exit 1
fi

# Start frontend in background  
echo ""
echo "🎨 Starting Frontend on port 3000..."
cd /workspaces/javelin-system/apps/frontend
CODESPACES=true pnpm dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

# Check if frontend is running
if lsof -i :3000 2>/dev/null | grep -q LISTEN; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend failed to start. Check /tmp/frontend.log"
    tail -20 /tmp/frontend.log
    exit 1
fi

echo ""
echo "✅ Both servers are running!"
echo ""
echo "📝 Access your application:"
echo "   Frontend: https://silver-giggle-w6ppj6qgr542g746-3000.app.github.dev/"
echo "   Backend:  https://silver-giggle-w6ppj6qgr542g746-3002.app.github.dev/api/health"
echo ""
echo "📊 Monitor logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
