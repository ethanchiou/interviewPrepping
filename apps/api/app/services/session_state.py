"""Redis-based session state management."""
import json
import time
from typing import Dict, Any, Optional
import redis
from ..config import settings


class SessionState:
    """Manage session state in Redis."""
    
    def __init__(self):
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
    
    def _key(self, session_id: str) -> str:
        """Generate Redis key for session."""
        return f"session:{session_id}"
    
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session state from Redis."""
        data = self.redis.get(self._key(session_id))
        if data:
            return json.loads(data)
        return None
    
    def set(self, session_id: str, state: Dict[str, Any]):
        """Set session state in Redis with 24h expiry."""
        self.redis.setex(
            self._key(session_id),
            86400,  # 24 hours
            json.dumps(state)
        )
    
    def initialize(self, session_id: str):
        """Initialize a new session state."""
        initial_state = {
            "state": "INTRO",
            "last_transcript_ts": 0,
            "last_coach_ts": 0,
            "last_code": "",
            "question_id": None
        }
        self.set(session_id, initial_state)
        return initial_state
    
    def update_transcript_ts(self, session_id: str):
        """Update last transcript timestamp."""
        state = self.get(session_id) or {}
        state["last_transcript_ts"] = int(time.time() * 1000)
        self.set(session_id, state)
    
    def update_coach_ts(self, session_id: str):
        """Update last coach timestamp."""
        state = self.get(session_id) or {}
        state["last_coach_ts"] = int(time.time() * 1000)
        self.set(session_id, state)
    
    def update_state(self, session_id: str, new_state: str):
        """Update interview state (INTRO, CLARIFY, PROBLEM, CODING, etc.)."""
        state = self.get(session_id) or {}
        state["state"] = new_state
        self.set(session_id, state)
    
    def update_code(self, session_id: str, code: str):
        """Update last code snapshot."""
        state = self.get(session_id) or {}
        state["last_code"] = code
        self.set(session_id, state)
    
    def can_send_coach(self, session_id: str) -> bool:
        """Check if coach can send a nudge (rate limit: 1 per 3s)."""
        state = self.get(session_id)
        if not state:
            return True
        
        last_ts = state.get("last_coach_ts", 0)
        now = int(time.time() * 1000)
        return (now - last_ts) >= 3000  # 3 seconds
    
    def can_send_interviewer(self, session_id: str) -> bool:
        """Check if interviewer should respond."""
        state = self.get(session_id)
        if not state:
            return True
        
        current_state = state.get("state", "INTRO")
        last_transcript_ts = state.get("last_transcript_ts", 0)
        now = int(time.time() * 1000)
        
        # Interviewer responds if:
        # 1. Not in CODING state, OR
        # 2. User silent for 12 seconds
        if current_state != "CODING":
            return True
        
        if (now - last_transcript_ts) >= 12000:  # 12 seconds
            return True
        
        return False


# Singleton instance
session_state = SessionState()
