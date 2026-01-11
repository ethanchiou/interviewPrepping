# Interview Simulator MVP

A hackathon MVP for conducting mock technical interviews with AI interviewer and real-time coaching.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Monaco Editor + Web Speech API
- **Backend**: FastAPI + WebSocket + Postgres + Redis
- **LLM**: OpenRouter (Gemini 2.5 Pro) streaming from backend only
- **Code Runner**: Client-side JavaScript sandbox via Web Worker

## Quickstart

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

### One-Click Setup

We have provided setup scripts that automate the entire installation and startup process. **Just run one command and you're done!**

#### Mac/Linux

```bash
chmod +x setup.sh
./setup.sh
```

#### Windows (PowerShell)

```powershell
.\setup.ps1
```

**What the scripts do automatically:**
1. ✅ Start infrastructure (Postgres + Redis via Docker)
2. ✅ Setup Backend (create venv, install dependencies, seed database)
3. ✅ Create `apps/api/.env.local` with all localhost configuration
4. ✅ Setup Frontend (install npm dependencies)
5. ✅ Create `apps/web/.env.local` with API endpoints
6. ✅ Start both backend and frontend services

**One manual step after running the script:**
- Edit `apps/api/.env.local` and replace `your_api_key_here` with your [OpenRouter API key](https://openrouter.ai/keys)

That's it! The application will be running at http://localhost:3000

### Manual Setup

If you prefer to set up manually, follow these steps:

#### 1. Start Infrastructure

```bash
docker-compose up -d
```
Wait for containers to be healthy (`docker-compose ps`).

#### 2. Backend Setup

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env.local file
cat > .env.local << EOF
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
EOF
# Edit .env.local and add your OPENROUTER_API_KEY

python -m app.seed
uvicorn app.main:app --reload --port 8000
```
Backend runs at http://localhost:8000

#### 3. Frontend Setup

```bash
cd apps/web
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
EOF

npm run dev
```
Frontend runs at http://localhost:3000

## API Endpoints

- `GET /health` - Health check
- `GET /questions/pick?company_mode=General&difficulty=Medium` - Get random question
- `POST /sessions` - Create interview session
- `POST /sessions/{id}/end` - End session
- `WS /ws?session_id=<uuid>&token=<token>` - WebSocket connection

## Troubleshooting

### "Connection refused" on WebSocket
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify backend logs

### STT not working
- Web Speech API only works on localhost or HTTPS
- Check browser permissions for microphone

### LLM errors
- Verify OPENROUTER_API_KEY is set correctly in `apps/api/.env.local`
- Make sure you've replaced `your_api_key_here` with your actual OpenRouter API key

## Project Structure

```
interview-sim/
├── apps/
│   ├── api/           # FastAPI backend
│   └── web/           # Next.js frontend
├── docker-compose.yml
└── setup.sh
```

## License
MIT (Hackathon MVP)