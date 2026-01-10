"""Pydantic schemas for request/response validation."""
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


# Question schemas
class SampleTest(BaseModel):
    """Sample test case."""
    input: str
    expected: str


class QuestionOut(BaseModel):
    """Question response schema."""
    id: UUID
    title: str
    difficulty: str
    company_mode: str
    prompt: str
    starter_code: Optional[str]
    sample_tests: List[SampleTest]
    
    class Config:
        from_attributes = True


class QuestionPickResponse(BaseModel):
    """Response for picking a question."""
    question: QuestionOut


# Session schemas
class SessionCreate(BaseModel):
    """Create session request."""
    question_id: UUID
    company_mode: str
    difficulty: str


class SessionCreateResponse(BaseModel):
    """Create session response."""
    session_id: UUID
    ws_token: str = "dev"


class SessionEndResponse(BaseModel):
    """End session response."""
    ok: bool = True


# WebSocket message envelope
class WSMessage(BaseModel):
    """WebSocket message envelope."""
    type: str
    ts_ms: int
    session_id: UUID
    payload: Dict[str, Any]


# Client -> Server payloads
class ClientReadyPayload(BaseModel):
    """CLIENT_READY payload."""
    client_version: str
    ui_lang: str = "en"


class TranscriptPayload(BaseModel):
    """TRANSCRIPT_PARTIAL or TRANSCRIPT_FINAL payload."""
    text: str
    is_final: bool


class StateChangePayload(BaseModel):
    """STATE_CHANGE payload."""
    from_state: str = Field(alias="from")
    to: str
    
    class Config:
        populate_by_name = True


class CodeSnapshotPayload(BaseModel):
    """CODE_SNAPSHOT payload."""
    language: str
    code: str
    cursor: Dict[str, int]


class RunResultPayload(BaseModel):
    """RUN_RESULT payload."""
    passed: bool
    results: List[Dict[str, Any]]


# Server -> Client payloads
class InterviewerStreamStartPayload(BaseModel):
    """INTERVIEWER_STREAM_START payload."""
    message_id: UUID
    role: str = "interviewer"


class InterviewerStreamDeltaPayload(BaseModel):
    """INTERVIEWER_STREAM_DELTA payload."""
    message_id: UUID
    delta: str


class InterviewerStreamEndPayload(BaseModel):
    """INTERVIEWER_STREAM_END payload."""
    message_id: UUID


class CoachNudgePayload(BaseModel):
    """COACH_NUDGE payload."""
    id: UUID
    severity: Literal["none", "low", "medium", "high"]
    text: str


class ErrorPayload(BaseModel):
    """ERROR payload."""
    code: str
    message: str
