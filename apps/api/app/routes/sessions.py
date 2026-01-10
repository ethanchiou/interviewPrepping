"""Session management endpoints."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from ..db import get_db
from ..models import Session as DBSession, Question
from ..schemas import SessionCreate, SessionCreateResponse, SessionEndResponse
from ..services.session_state import session_state

router = APIRouter()


@router.post("/sessions", response_model=SessionCreateResponse)
async def create_session(
    request: SessionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new interview session.
    
    Returns session_id and ws_token for WebSocket connection.
    """
    # Verify question exists
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Create session in database
    new_session = DBSession(
        question_id=request.question_id,
        company_mode=request.company_mode,
        difficulty=request.difficulty
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Initialize session state in Redis
    state = session_state.initialize(str(new_session.id))
    state["question_id"] = str(request.question_id)
    session_state.set(str(new_session.id), state)
    
    return SessionCreateResponse(
        session_id=new_session.id,
        ws_token="dev"  # Hardcoded for hackathon MVP
    )


@router.post("/sessions/{session_id}/end", response_model=SessionEndResponse)
async def end_session(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """End an interview session."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.ended_at = datetime.utcnow()
    db.commit()
    
    return SessionEndResponse(ok=True)
