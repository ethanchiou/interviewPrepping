"""Question management endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import random
from ..db import get_db
from ..models import Question
from ..schemas import QuestionOut, QuestionPickResponse

router = APIRouter(prefix="/questions")


@router.get("/pick", response_model=QuestionPickResponse)
async def pick_question(
    company_mode: str = "General",
    difficulty: str = "Medium",
    db: Session = Depends(get_db)
):
    """
    Pick a random question based on filters
    """
    query = db.query(Question)
    
    if company_mode != "General":
        query = query.filter(Question.company_mode == company_mode)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    questions = query.all()
    
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found matching criteria")
    
    # Pick random question
    question = random.choice(questions)
    
    return QuestionPickResponse(question=QuestionOut.model_validate(question))


@router.get("/{question_id}", response_model=QuestionOut)
async def get_question(question_id: str, db: Session = Depends(get_db)):
    """Get a specific question by ID"""
    question = db.query(Question).filter(Question.id == question_id).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return QuestionOut.model_validate(question)


@router.get("/", response_model=list[QuestionOut])
async def list_questions(
    company_mode: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List questions with optional filters"""
    query = db.query(Question)
    
    if company_mode:
        query = query.filter(Question.company_mode == company_mode)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    questions = query.limit(limit).all()
    
    return [QuestionOut.model_validate(q) for q in questions]