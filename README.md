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

We have provided a `setup.sh` script that automates the entire installation and startup process.

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
1. Start infrastructure (Postgres + Redis)
2. Setup Backend (venv, requirements, db seed)
3. Setup Frontend (npm install)
4. Start the application

#### Windows (PowerShell)

```powershell
.\setup.ps1
```

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
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

python -m app.seed
uvicorn app.main:app --reload --port 8000
```
Backend runs at http://localhost:8000

#### 3. Frontend Setup

```bash
cd apps/web
npm install
cp .env.local.example .env.local
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
- Verify OPENROUTER_API_KEY is set correctly in `apps/api/.env`

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