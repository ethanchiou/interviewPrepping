# Interview Simulator MVP

A hackathon MVP for conducting mock technical interviews with AI interviewer, real-time coaching, and AI-powered body language analysis.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Monaco Editor + Web Speech API + MediaPipe
- **Backend**: FastAPI + WebSocket + Postgres + Redis
- **LLM**: OpenRouter (Gemini 2.5 Pro) streaming from backend only
- **Code Runner**: Client-side JavaScript sandbox via Web Worker
- **Body Language AI**: MediaPipe Face Mesh for real-time eye contact and posture tracking

## Features

- 🎤 **Speech Recognition**: Real-time transcription of your interview responses
- 💻 **Live Coding**: Monaco editor with JavaScript execution sandbox
- 🤖 **AI Interviewer**: Streaming responses from Gemini 2.5 via OpenRouter
- 👁️ **Eye Contact Tracking**: Real-time detection of eye contact with camera (NEW)
- 🧍 **Posture Analysis**: Head tilt and positioning monitoring (NEW)
- 😴 **Blink Detection**: Precise eye open/closed state tracking (NEW)
- 💡 **AI Coach**: Contextual hints and nudges during the interview
- ⏱️ **Performance Metrics**: Track your interview body language in real-time

## Quickstart

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- **Webcam** (for MediaPipe face tracking)

### One-Click Setup

We have provided setup scripts that automate the entire installation and startup process. **Just run one command and you're done!**

#### Mac/Linux

Run from the project root directory:

```bash
chmod +x setup.sh
./setup.sh
```

#### Windows (PowerShell)

Run from the project root directory:

```powershell
.\setup.ps1
```

**What the scripts do automatically:**
1. ✅ Start infrastructure (Postgres + Redis via Docker)
2. ✅ Setup Backend (create venv, install dependencies, seed database)
3. ✅ Create `apps/api/.env.local` with all localhost configuration
4. ✅ Setup Frontend (install npm dependencies, **including MediaPipe packages**)
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

# Install MediaPipe dependencies
npm install @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
EOF

npm run dev
```
Frontend runs at http://localhost:3000

## MediaPipe Face Tracking

The interview simulator now includes real-time body language analysis using Google's MediaPipe Face Mesh.

### What it Tracks

- **Eye Contact**: Detects if you're looking at the camera (good eye contact) or away
- **Eye State**: Individual tracking of left/right eye open/closed state using Eye Aspect Ratio (EAR)
- **Head Posture**: Measures head tilt angle to ensure good posture
- **Face Detection**: Confirms your face is visible and centered

### How it Works

1. **Camera Permission**: On the interview page, allow camera access when prompted
2. **Real-time Analysis**: MediaPipe processes video at ~30 FPS for instant feedback
3. **Visual Feedback**: 
   - Green indicator = Good eye contact
   - Red indicator = Look at camera
   - Overlay shows Face/Eyes/Posture status
4. **Metrics Display**: Performance tracking shown in interviewer panel before interview starts

### Testing MediaPipe

Visit `http://localhost:3000/mediapipe-test` to test face tracking in isolation:
- See real-time eye detection
- View EAR (Eye Aspect Ratio) values
- Test head tilt detection
- Debug face landmark visualization

### Browser Compatibility

MediaPipe works best on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ⚠️ Safari (limited support)

**Requirements:**
- Modern browser with WebRTC support
- Working webcam
- Good lighting for accurate face detection

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

### MediaPipe / Camera Issues

**Camera not starting:**
- Make sure you allowed camera permissions in your browser
- Check browser console (F12) for errors
- Try refreshing the page
- Verify you're using `http://localhost:3000` (not `127.0.0.1`)

**Face not detected:**
- Ensure good lighting on your face
- Position yourself directly in front of the camera
- Check that camera isn't blocked or being used by another application

**Eye contact always shows red:**
- Look directly at the camera lens, not the screen
- Ensure your face is centered in the frame
- Check the debug values (L-EAR/R-EAR) on the test page

**Performance issues:**
- Close unnecessary browser tabs
- Use Chrome/Edge for best performance
- Reduce video quality if needed (edit `getUserMedia` constraints)

**MediaPipe libraries not loading:**
- Check internet connection (MediaPipe loads from CDN)
- Clear browser cache and reload
- Verify npm packages installed: `npm list @mediapipe/face_mesh`

## Project Structure

```
interview-sim/
├── apps/
│   ├── api/                      # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── requirements.txt
│   └── web/                      # Next.js frontend
│       ├── app/
│       │   ├── interview/        # Main interview page
│       │   └── mediapipe-test/   # MediaPipe test page
│       ├── components/
│       │   ├── InterviewRoom/
│       │   │   ├── WebcamPanel.tsx      # MediaPipe integration
│       │   │   ├── InterviewerPanel.tsx # Shows metrics
│       │   │   └── Layout.tsx
│       │   └── MediaPipeMonitor.tsx     # Standalone test component
│       └── package.json
├── docker-compose.yml
├── setup.sh
└── README.md
```

## How to Use

1. **Start Interview**
   - Navigate to http://localhost:3000
   - Select company mode and difficulty
   - Click "Start Interview"

2. **Allow Permissions**
   - Allow camera access for body language tracking
   - Allow microphone access for speech recognition

3. **During Interview**
   - Speak your thoughts (or type if STT unavailable)
   - Write code in the Monaco editor
   - Click "Run" to test your solution
   - Monitor your eye contact and posture in real-time

4. **Performance Feedback**
   - Eye contact indicator shows green when looking at camera
   - Posture metrics update continuously
   - AI coach provides hints when needed

## Development

### Adding New Features

**To extend MediaPipe tracking:**
- Edit `apps/web/components/InterviewRoom/WebcamPanel.tsx`
- Add new landmark calculations in `onResults()`
- Update `MediaPipeMetrics` interface

**To send metrics to backend:**
- Update `apps/web/app/interview/page.tsx`
- Send metrics via WebSocket in `handleMetricsUpdate()`
- Add backend handler in `apps/api/app/routes/ws.py`

### Testing

**Frontend:**
```bash
cd apps/web
npm run dev
# Visit http://localhost:3000/mediapipe-test
```

**Backend:**
```bash
cd apps/api
source venv/bin/activate
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs
```

## License
MIT (Hackathon MVP)

---

## Credits

- **MediaPipe**: Google's ML solution for face tracking
- **OpenRouter**: LLM API aggregator
- **Next.js**: React framework
- **FastAPI**: Python web framework
