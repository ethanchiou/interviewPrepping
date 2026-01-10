# Interview Simulator MVP

A hackathon MVP for conducting mock technical interviews with AI interviewer and real-time coaching.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Monaco Editor + Web Speech API
- **Backend**: FastAPI + WebSocket + Postgres + Redis
- **LLM**: OpenRouter (Gemini 2.5 Pro) streaming from backend only
- **Code Runner**: Client-side JavaScript sandbox via Web Worker

## Quickstart

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker + Docker Compose (for Postgres + Redis)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts Postgres (port 5432) and Redis (port 6379).

### 2. Backend Setup

```bash
cd apps/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Run database migrations and seed
python -m app.seed

# Start backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at http://localhost:8000

### 3. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local
# Defaults should work for local development

# Start development server
npm run dev
```

Frontend runs at http://localhost:3000

### 4. Demo Flow

1. Open http://localhost:3000
2. Select **Company Mode** (e.g., "General" or "Google")
3. Select **Difficulty** (e.g., "Medium")
4. Click **Start Interview**
5. On the interview page:
   - **Left panel**: Interviewer avatar and messages
   - **Center**: Question prompt + Monaco editor with starter code
   - **Right panel**: AI Coach nudges
   - **Bottom**: Transcript panel and Run button
6. **Speak** your thoughts (or type if STT unavailable)
7. **Write code** in the editor
8. Click **Run** to test against sample inputs
9. Ask the interviewer questions by speaking during non-coding states

## Project Structure

```
interview-sim/
├── apps/
│   ├── api/           # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── db.py
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   ├── seed.py
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── requirements.txt
│   └── web/           # Next.js frontend
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend (`apps/api/.env`)

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## API Endpoints

- `GET /health` - Health check
- `GET /questions/pick?company_mode=General&difficulty=Medium` - Get random question
- `POST /sessions` - Create interview session
- `POST /sessions/{id}/end` - End session
- `WS /ws?session_id=<uuid>&token=<token>` - WebSocket connection

## WebSocket Message Format

All messages use this envelope:

```json
{
  "type": "MESSAGE_TYPE",
  "ts_ms": 1730000000000,
  "session_id": "uuid",
  "payload": {}
}
```

### Client → Server

- `CLIENT_READY` - Initial handshake
- `TRANSCRIPT_PARTIAL` - Interim speech recognition
- `TRANSCRIPT_FINAL` - Final speech recognition
- `STATE_CHANGE` - UI state transition
- `CODE_SNAPSHOT` - Code editor updates
- `RUN_RESULT` - Test execution results

### Server → Client

- `INTERVIEWER_STREAM_START` - Begin interviewer message
- `INTERVIEWER_STREAM_DELTA` - Streaming chunk
- `INTERVIEWER_STREAM_END` - End interviewer message
- `COACH_NUDGE` - AI coach hint
- `ERROR` - Error notification

## Code Runner

User code is expected to define a function called `solution`:

```javascript
function solution(nums, target) {
  // your code here
  return result;
}
```

Sample tests are JSON arrays passed as arguments. The runner:
- Executes in a Web Worker (isolated from DOM)
- Has 800ms timeout
- Compares actual vs expected outputs

## Troubleshooting

### Postgres Connection Error

Ensure Docker is running and Postgres container is healthy:
```bash
docker-compose ps
docker-compose logs postgres
```

### Redis Connection Error

Check Redis container:
```bash
docker-compose logs redis
```

### STT Not Working

Web Speech API requires HTTPS in production or localhost in development. Fallback to text input is provided.

### WebSocket Connection Failed

Ensure backend is running on port 8000 and CORS is configured correctly.

## License

MIT (Hackathon MVP)