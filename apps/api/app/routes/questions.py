"""Questions API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import get_db
from ..models import Question
from ..schemas import QuestionPickResponse, QuestionOut, SampleTest

router = APIRouter()


@router.get("/questions/pick", response_model=QuestionPickResponse)
async def pick_question(
    company_mode: str = Query(default="General"),
    difficulty: str = Query(default="Medium"),
    db: Session = Depends(get_db)
):
    """
    Pick a random question based on company_mode and difficulty.
    
    If company_mode is "General", picks from any company_mode with matching difficulty.
    Otherwise, picks from specific company_mode + difficulty.
    Falls back to General if no match found.
    """
    # Try to find matching question
    query = db.query(Question).filter(Question.difficulty == difficulty)
    
    if company_mode != "General":
        # Try specific company mode first
        question = query.filter(Question.company_mode == company_mode).order_by(func.random()).first()
        
        if not question:
            # Fallback to General with same difficulty
            question = db.query(Question).filter(
                Question.company_mode == "General",
                Question.difficulty == difficulty
            ).order_by(func.random()).first()
    else:
        # General mode: pick any question with matching difficulty
        question = query.order_by(func.random()).first()
    
    if not question:
        # Ultimate fallback: any General question
        question = db.query(Question).filter(
            Question.company_mode == "General"
        ).order_by(func.random()).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="No questions available")
    
    # Convert to response format
    question_out = QuestionOut(
        id=question.id,
        title=question.title,
        difficulty=question.difficulty,
        company_mode=question.company_mode,
        prompt=question.prompt,
        starter_code=question.starter_code,
        sample_tests=[SampleTest(**test) for test in question.sample_tests]
    )
    
    return QuestionPickResponse(question=question_out)
