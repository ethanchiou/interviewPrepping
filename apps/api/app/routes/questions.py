"""Questions API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..db import get_db
from ..models import Question
from ..schemas import QuestionPickResponse, QuestionOut, SampleTest

router = APIRouter()


@router.get("/questions/pick", response_model=QuestionPickResponse)
async def pick_question(
    company_mode: str = Query(default="General"),
    difficulty: str = Query(default="Medium"),
    data_structure: str = Query(default="Random"),
    db: Session = Depends(get_db)
):
    """
    Pick a random question based on company_mode, difficulty, and data_structure.
    
    If company_mode is "General", picks from any company_mode with matching difficulty.
    If data_structure is "Random", picks from any data structure.
    Otherwise, picks from specific filters.
    Falls back to General if no match found.
    """
    # Build base query
    query = db.query(Question).filter(Question.difficulty == difficulty)
    
    # Apply data structure filter if not Random
    if data_structure != "Random":
        query = query.filter(Question.data_structure == data_structure)
    
    if company_mode != "General":
        # Try specific company mode first
        question = query.filter(Question.company_mode == company_mode).order_by(func.random()).first()
        
        if not question:
            # Fallback: try same difficulty and data_structure but General company
            fallback_query = db.query(Question).filter(
                Question.company_mode == "General",
                Question.difficulty == difficulty
            )
            if data_structure != "Random":
                fallback_query = fallback_query.filter(Question.data_structure == data_structure)
            question = fallback_query.order_by(func.random()).first()
    else:
        # General mode: pick any question with matching difficulty (and data_structure if specified)
        question = query.order_by(func.random()).first()
    
    if not question:
        # Ultimate fallback: any question with matching difficulty, ignore data_structure
        question = db.query(Question).filter(
            Question.difficulty == difficulty
        ).order_by(func.random()).first()
    
    if not question:
        # Last resort: any General question
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
        data_structure=question.data_structure,
        prompt=question.prompt,
        starter_code=question.starter_code,
        sample_tests=[SampleTest(**test) for test in question.sample_tests]
    )
    
    return QuestionPickResponse(question=question_out)