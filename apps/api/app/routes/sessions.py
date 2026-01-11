"""Session management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from ..db import get_db
from ..models import Session as DBSession, Question
from ..schemas import SessionCreate, SessionCreateResponse, SessionEndResponse

router = APIRouter(prefix="/sessions")


@router.post("/create", response_model=SessionCreateResponse)
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new interview session
    """
    # Verify question exists
    question = db.query(Question).filter(Question.id == session_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Create session
    session = DBSession(
        id=uuid.uuid4(),
        question_id=session_data.question_id,
        company_mode=session_data.company_mode,
        difficulty=session_data.difficulty,
        created_at=datetime.utcnow()
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return SessionCreateResponse(
        session_id=session.id,
        ws_token="dev"  # In production, generate a real JWT token
    )


@router.post("/end/{session_id}", response_model=SessionEndResponse)
async def end_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    End an interview session
    """
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Mark session as ended
    session.ended_at = datetime.utcnow()
    db.commit()
    
    return SessionEndResponse(ok=True)


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get session details"""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": str(session.id),
        "question_id": str(session.question_id),
        "company_mode": session.company_mode,
        "difficulty": session.difficulty,
        "created_at": session.created_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None
    }