#!/bin/bash

# Function to handle errors
handle_error() {
    echo "❌ Error encountered. Please check the logs."
    exit 1
}

# Trap errors
set -e

echo "🚀 Starting Interview Simulator Setup..."

# 1. Start Infrastructure
echo "📦 Starting Infrastructure (Docker)..."
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 5  # Simple wait, ideally we'd use pg_isready

# 2. Setup Backend
echo "🐍 Setting up Backend..."
cd apps/api

if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "   Installing dependencies..."
pip install -r requirements.txt

if [ ! -f ".env.local" ]; then
    echo "   Creating .env.local file..."
    cat > .env.local << 'EOF'
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
EOF
    echo "⚠️  Please edit apps/api/.env.local to add your OPENROUTER_API_KEY"
fi

echo "   Seeding database..."
python -m app.seed || echo "   (Seed might skip if data exists)"

# 3. Setup Frontend
echo "⚛️ Setting up Frontend..."
cd ../web

if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "   Creating .env.local file..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
EOF
fi

# 4. Run Application
echo "✅ Setup Complete!"
echo "🚀 Starting services..."

# Cleanup function
cleanup() {
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT SIGTERM

cd ../api
source venv/bin/activate
echo "🐍 Starting Backend (Port 8000)..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

sleep 3

cd ../web
echo "⚛️ Starting Frontend (Port 3000)..."
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
