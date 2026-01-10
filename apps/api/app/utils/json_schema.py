"""JSON schema validation utilities."""
import json
from typing import Any, Dict


def validate_coach_output(output: str) -> Dict[str, Any]:
    """
    Validate coach LLM output matches required schema.
    
    Expected schema:
    {
        "severity": "none" | "low" | "medium" | "high",
        "text": "string <= 120 chars"
    }
    
    Returns validated dict or fallback on error.
    """
    try:
        data = json.loads(output)
        
        # Validate required fields
        if "severity" not in data or "text" not in data:
            raise ValueError("Missing required fields")
        
        # Validate severity
        if data["severity"] not in ["none", "low", "medium", "high"]:
            raise ValueError(f"Invalid severity: {data['severity']}")
        
        # Validate text length
        if len(data["text"]) > 120:
            data["text"] = data["text"][:120]
        
        return {
            "severity": data["severity"],
            "text": str(data["text"])
        }
    except Exception as e:
        # Fallback to safe default
        return {
            "severity": "none",
            "text": "Keep going, you're doing great!"
        }
