# Interview Simulator MVP - Quick Setup Guide

## Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

## Setup Commands

### 1. Start Infrastructure (Postgres + Redis)

```bash
cd /Users/ethanchiou/Desktop/Programming/Projects/interviewPrepping
docker-compose up -d
```

Wait for containers to be healthy:
```bash
docker-compose ps
```

### 2. Backend Setup

```bash
cd apps/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example
cp .env.example .env

# IMPORTANT: Edit .env and add your OPENROUTER_API_KEY
# You can use: google/gemini-2.0-flash-exp:free (free tier)
nano .env  # or use your preferred editor

# Initialize database and seed questions
python -m app.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at: http://localhost:8000
API docs: http://localhost:8000/docs

### 3. Frontend Setup (New Terminal)

```bash
cd /Users/ethanchiou/Desktop/Programming/Projects/interviewPrepping/apps/web

# Install dependencies
npm install

# Create .env.local from example
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will be running at: http://localhost:3000

### 4. Test the Application

1. Open http://localhost:3000 in your browser
2. Select:
   - **Company Mode**: General, Google, or Meta
   - **Difficulty**: Easy, Medium, or Hard
3. Click **Start Interview**
4. You should see:
   - Interviewer greeting in the left panel
   - Question prompt in the center
   - Monaco code editor with starter code
   - Empty coach panel on the right
5. **Speak** or type to interact (if STT not available, use text input at bottom)
6. **Write code** in the editor
7. Click **Run** to execute tests
8. Watch for:
   - Interviewer responses (streaming)
   - Coach hints (severity-coded)
   - Live transcript
   - Test results

## Troubleshooting

### "Connection refused" on WebSocket
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify CORS_ORIGINS in backend .env includes http://localhost:3000

### "No questions available"
- Run database seed: `python -m app.seed`
- Check Postgres is running: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`

### STT not working
- Web Speech API only works on localhost or HTTPS
- Use the text input fallback that appears automatically
- Check browser compatibility (Chrome/Edge recommended)

### LLM errors
- Verify OPENROUTER_API_KEY is set correctly in apps/api/.env
- Check you have credits/free tier access
- Try the free model: `google/gemini-2.0-flash-exp:free`

### Code runner timeout
- 800ms limit is intentional to prevent infinite loops
- Optimize your solution for time complexity
- Check console for detailed error messages

## Environment Variables Quick Reference

### Backend (.env)
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interview_sim
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## Stopping Services

```bash
# Stop frontend (Ctrl+C in terminal)

# Stop backend (Ctrl+C in terminal, then deactivate venv)
deactivate

# Stop Docker containers
docker-compose down
```

## Next Steps for Production

1. Set up proper authentication (replace hardcoded "dev" token)
2. Add user accounts and session history
3. Implement deployment (Vercel for frontend, Railway/Render for backend)
4. Use managed Postgres and Redis (not Docker)
5. Add rate limiting on API endpoints
6. Implement proper error tracking (Sentry)
7. Add E2E tests (Playwright)

---

**🎉 Enjoy your interview practice!**
