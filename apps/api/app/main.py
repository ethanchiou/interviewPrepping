"""FastAPI main application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import init_db
from .routes import health, questions, sessions, ws

# Initialize FastAPI app
app = FastAPI(
    title="Interview Simulator API",
    version="0.1.0",
    description="Backend for AI-powered technical interview simulator"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(questions.router, tags=["questions"])
app.include_router(sessions.router, tags=["sessions"])
app.include_router(ws.router, tags=["websocket"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print("🚀 Server started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Server shutting down")
