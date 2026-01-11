"""JSON schema validation utilities for LLM responses."""
import json
from typing import Dict, Any, Literal


def validate_coach_output(response: str) -> Dict[str, Any]:
    """
    Validate and parse coach output JSON.
    
    Args:
        response: Raw response from LLM
        
    Returns:
        Validated coach output dict with 'severity' and 'text'
        
    Raises:
        ValueError: If response is invalid
    """
    try:
        # Try to parse as JSON
        data = json.loads(response.strip())
        
        # Validate required fields
        if "severity" not in data or "text" not in data:
            raise ValueError("Missing required fields: severity or text")
        
        # Validate severity value
        valid_severities = ["none", "low", "medium", "high"]
        if data["severity"] not in valid_severities:
            raise ValueError(f"Invalid severity: {data['severity']}")
        
        # Ensure text is a string
        if not isinstance(data["text"], str):
            raise ValueError("text must be a string")
        
        return {
            "severity": data["severity"],
            "text": data["text"]
        }
        
    except json.JSONDecodeError as e:
        # If JSON parsing fails, try to extract JSON from the response
        # Sometimes LLMs add extra text around the JSON
        import re
        json_match = re.search(r'\{[^{}]*"severity"[^{}]*"text"[^{}]*\}', response)
        
        if json_match:
            try:
                data = json.loads(json_match.group(0))
                return validate_coach_output(json_match.group(0))
            except:
                pass
        
        # Fallback: return a default low-severity message
        return {
            "severity": "none",
            "text": ""
        }
    
    except Exception as e:
        # Any other error: return safe default
        return {
            "severity": "none",
            "text": ""
        }