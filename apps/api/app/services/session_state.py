"""Session state management using Redis."""
import json
import time
from typing import Dict, Any, Optional
import redis
from ..config import settings


class SessionStateService:
    """Manage interview session state in Redis."""
    
    # Rate limiting constants (in milliseconds)
    COACH_INTERVAL_MS = 30000  # 30 seconds between coach nudges
    INTERVIEWER_INTERVAL_MS = 5000  # 5 seconds between interviewer responses
    TRANSCRIPT_GRACE_MS = 2000  # 2 seconds grace period after transcript
    
    def __init__(self):
        """Initialize Redis connection."""
        self.redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True
        )
    
    def initialize(self, session_id: str) -> Dict[str, Any]:
        """
        Initialize a new session state.
        
        Returns the initial state dict.
        """
        now = int(time.time() * 1000)
        
        state = {
            "session_id": session_id,
            "state": "INTRO",
            "question_id": None,
            "last_code": "",
            "last_coach_ts": 0,
            "last_interviewer_ts": 0,
            "last_transcript_ts": 0,
            "created_at": now
        }
        
        self.set(session_id, state)
        return state
    
    def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session state from Redis."""
        data = self.redis_client.get(f"session:{session_id}")
        if data:
            return json.loads(data)
        return None
    
    def set(self, session_id: str, state: Dict[str, Any]):
        """Save session state to Redis."""
        self.redis_client.set(
            f"session:{session_id}",
            json.dumps(state),
            ex=3600 * 6  # Expire after 6 hours
        )
    
    def update_state(self, session_id: str, new_state: str):
        """Update the interview state (INTRO, CLARIFY, etc.)."""
        state = self.get(session_id)
        if state:
            state["state"] = new_state
            self.set(session_id, state)
    
    def update_code(self, session_id: str, code: str):
        """Update the last code snapshot."""
        state = self.get(session_id)
        if state:
            state["last_code"] = code
            self.set(session_id, state)
    
    def update_coach_ts(self, session_id: str):
        """Update the last coach nudge timestamp."""
        state = self.get(session_id)
        if state:
            state["last_coach_ts"] = int(time.time() * 1000)
            self.set(session_id, state)
    
    def update_interviewer_ts(self, session_id: str):
        """Update the last interviewer response timestamp."""
        state = self.get(session_id)
        if state:
            state["last_interviewer_ts"] = int(time.time() * 1000)
            self.set(session_id, state)
    
    def update_transcript_ts(self, session_id: str):
        """Update the last transcript timestamp."""
        state = self.get(session_id)
        if state:
            state["last_transcript_ts"] = int(time.time() * 1000)
            self.set(session_id, state)
    
    def can_send_coach(self, session_id: str) -> bool:
        """Check if enough time has passed to send a coach nudge."""
        state = self.get(session_id)
        if not state:
            return False
        
        now = int(time.time() * 1000)
        last_coach = state.get("last_coach_ts", 0)
        
        return (now - last_coach) >= self.COACH_INTERVAL_MS
    
    def can_send_interviewer(self, session_id: str) -> bool:
        """
        Check if enough time has passed to send an interviewer response.
        
        Must respect both:
        - Minimum interval between interviewer messages
        - Grace period after last transcript
        """
        state = self.get(session_id)
        if not state:
            return False
        
        now = int(time.time() * 1000)
        last_interviewer = state.get("last_interviewer_ts", 0)
        last_transcript = state.get("last_transcript_ts", 0)
        
        # Check minimum interval
        if (now - last_interviewer) < self.INTERVIEWER_INTERVAL_MS:
            return False
        
        # Check grace period after transcript
        if (now - last_transcript) < self.TRANSCRIPT_GRACE_MS:
            return False
        
        return True
    
    def delete(self, session_id: str):
        """Delete session state from Redis."""
        self.redis_client.delete(f"session:{session_id}")


# Global singleton instance
session_state = SessionStateService()