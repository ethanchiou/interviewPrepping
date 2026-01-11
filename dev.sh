#!/bin/bash

# Function to handle kill signal
cleanup() {
    echo "🛑 Stopping all services..."
    kill $(jobs -p)
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Interview Simulator..."

# Start Backend
echo "🐍 Starting Backend (Port 8000)..."
cd apps/api
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start Frontend
echo "⚛️ Starting Frontend (Port 3000)..."
cd ../web
npm run dev &
FRONTEND_PID=$!

# Wait for both processes to keep script running
wait $BACKEND_PID $FRONTEND_PID
