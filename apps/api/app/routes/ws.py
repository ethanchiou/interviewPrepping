"""WebSocket endpoint for real-time interview communication."""
import json
import time
from typing import Dict
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Question
from ..services.llm_openrouter import openrouter
from ..services.session_state import session_state
from ..services.prompt_templates import (
    get_interviewer_system_prompt,
    get_coach_system_prompt,
    get_interviewer_user_prompt,
    get_coach_user_prompt
)
from ..utils.json_schema import validate_coach_output
from ..utils.id import generate_id

router = APIRouter()


async def send_message(websocket: WebSocket, msg_type: str, session_id: str, payload: dict):
    """Send a WebSocket message with proper envelope."""
    message = {
        "type": msg_type,
        "ts_ms": int(time.time() * 1000),
        "session_id": session_id,
        "payload": payload
    }
    await websocket.send_json(message)


async def handle_client_ready(websocket: WebSocket, session_id: str, payload: dict, db: Session):
    """Handle CLIENT_READY message."""
    # Get question for this session
    state = session_state.get(session_id)
    if not state or not state.get("question_id"):
        await send_message(websocket, "ERROR", session_id, {
            "code": "SESSION_NOT_FOUND",
            "message": "Session not initialized"
        })
        return
    
    question_id = state["question_id"]
    question = db.query(Question).filter(Question.id == UUID(question_id)).first()
    
    if not question:
        await send_message(websocket, "ERROR", session_id, {
            "code": "QUESTION_NOT_FOUND",
            "message": "Question not found"
        })
        return
    
    # Send initial interviewer greeting
    message_id = generate_id()
    await send_message(websocket, "INTERVIEWER_STREAM_START", session_id, {
        "message_id": str(message_id),
        "role": "interviewer"
    })
    
    system_prompt = get_interviewer_system_prompt(question.title, question.prompt)
    user_prompt = "Begin the interview by greeting the candidate and asking if they understand the problem."
    
    try:
        async for chunk in openrouter.stream_completion(system_prompt, user_prompt):
            await send_message(websocket, "INTERVIEWER_STREAM_DELTA", session_id, {
                "message_id": str(message_id),
                "delta": chunk
            })
    except Exception as e:
        await send_message(websocket, "ERROR", session_id, {
            "code": "LLM_UPSTREAM",
            "message": str(e)
        })
    
    await send_message(websocket, "INTERVIEWER_STREAM_END", session_id, {
        "message_id": str(message_id)
    })


async def handle_transcript_final(websocket: WebSocket, session_id: str, payload: dict, db: Session):
    """Handle TRANSCRIPT_FINAL message."""
    text = payload.get("text", "")
    
    # Update transcript timestamp
    session_state.update_transcript_ts(session_id)
    
    state = session_state.get(session_id)
    if not state:
        return
    
    question_id = state.get("question_id")
    question = db.query(Question).filter(Question.id == UUID(question_id)).first()
    
    # Send coach nudge (if rate limit allows)
    if session_state.can_send_coach(session_id):
        coach_id = generate_id()
        system_prompt = get_coach_system_prompt()
        user_prompt = get_coach_user_prompt(
            transcript_text=text,
            code=state.get("last_code", "")
        )
        
        try:
            response = await openrouter.get_completion(system_prompt, user_prompt, temperature=0.5)
            coach_data = validate_coach_output(response)
            
            await send_message(websocket, "COACH_NUDGE", session_id, {
                "id": str(coach_id),
                "severity": coach_data["severity"],
                "text": coach_data["text"]
            })
            
            session_state.update_coach_ts(session_id)
        except Exception as e:
            # Silent fail for coach
            pass
    
    # Send interviewer response (if gating allows)
    if session_state.can_send_interviewer(session_id) and question:
        message_id = generate_id()
        await send_message(websocket, "INTERVIEWER_STREAM_START", session_id, {
            "message_id": str(message_id),
            "role": "interviewer"
        })
        
        system_prompt = get_interviewer_system_prompt(question.title, question.prompt)
        user_prompt = get_interviewer_user_prompt(text)
        
        try:
            async for chunk in openrouter.stream_completion(system_prompt, user_prompt):
                await send_message(websocket, "INTERVIEWER_STREAM_DELTA", session_id, {
                    "message_id": str(message_id),
                    "delta": chunk
                })
        except Exception as e:
            await send_message(websocket, "ERROR", session_id, {
                "code": "LLM_UPSTREAM",
                "message": str(e)
            })
        
        await send_message(websocket, "INTERVIEWER_STREAM_END", session_id, {
            "message_id": str(message_id)
        })


async def handle_state_change(websocket: WebSocket, session_id: str, payload: dict):
    """Handle STATE_CHANGE message."""
    new_state = payload.get("to", "INTRO")
    session_state.update_state(session_id, new_state)


async def handle_code_snapshot(websocket: WebSocket, session_id: str, payload: dict):
    """Handle CODE_SNAPSHOT message."""
    code = payload.get("code", "")
    session_state.update_code(session_id, code)


async def handle_run_result(websocket: WebSocket, session_id: str, payload: dict):
    """Handle RUN_RESULT message."""
    # Just acknowledge; could be used for coach hints
    pass


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time interview communication.
    
    Query params:
    - session_id: UUID of interview session
    - token: Authentication token (hardcoded "dev" for MVP)
    """
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            msg_type = data.get("type")
            msg_payload = data.get("payload", {})
            
            # Route to handlers
            if msg_type == "CLIENT_READY":
                await handle_client_ready(websocket, session_id, msg_payload, db)
            elif msg_type == "TRANSCRIPT_FINAL":
                await handle_transcript_final(websocket, session_id, msg_payload, db)
            elif msg_type == "TRANSCRIPT_PARTIAL":
                # Just acknowledge, no action needed
                pass
            elif msg_type == "STATE_CHANGE":
                await handle_state_change(websocket, session_id, msg_payload)
            elif msg_type == "CODE_SNAPSHOT":
                await handle_code_snapshot(websocket, session_id, msg_payload)
            elif msg_type == "RUN_RESULT":
                await handle_run_result(websocket, session_id, msg_payload)
            else:
                await send_message(websocket, "ERROR", session_id, {
                    "code": "UNKNOWN_MESSAGE_TYPE",
                    "message": f"Unknown message type: {msg_type}"
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await send_message(websocket, "ERROR", session_id, {
                "code": "INTERNAL_ERROR",
                "message": str(e)
            })
        except:
            pass
