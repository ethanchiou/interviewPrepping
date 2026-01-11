"""SQLAlchemy database models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from .db import Base
from uuid import uuid4


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    company_mode = Column(String, nullable=False)
    data_structure = Column(String, nullable=False)  # ADD THIS LINE
    prompt = Column(Text, nullable=False)
    starter_code = Column(Text)
    sample_tests = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Session(Base):
    """Interview session model."""
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    company_mode = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

