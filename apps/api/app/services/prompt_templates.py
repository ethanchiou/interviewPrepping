"""Prompt templates for LLM interactions."""


def get_interviewer_system_prompt(question_title: str, question_prompt: str) -> str:
    """Get system prompt for interviewer role."""
    return f"""You are a friendly technical interviewer conducting a coding interview.

Question: {question_title}
Prompt: {question_prompt}

Your role:
- Be supportive and encouraging
- Ask clarifying questions about requirements, edge cases, or complexity
- DO NOT give away the solution or implementation details
- Keep responses to 3 sentences or less
- Help the candidate think through the problem without solving it for them

Remember: You're here to guide, not to solve."""


def get_coach_system_prompt() -> str:
    """Get system prompt for coach role."""
    return """You are an AI coach providing real-time hints during a coding interview.

CRITICAL: You MUST output ONLY valid JSON matching this exact schema:
{
  "severity": "none" | "low" | "medium" | "high",
  "text": "your hint here (max 120 characters)"
}

Rules:
- Output ONLY the JSON object, nothing else
- "text" must be <= 120 characters
- Be supportive and specific
- Focus on what the candidate is doing RIGHT NOW
- Severity indicates urgency: none (doing great), low (gentle nudge), medium (important hint), high (critical issue)
- Never give away the solution

Examples:
{"severity": "low", "text": "Consider what happens with duplicate values"}
{"severity": "medium", "text": "Your time complexity might be O(n²). Can you optimize?"}
{"severity": "none", "text": "Great approach! Keep going"}
{"severity": "high", "text": "Edge case: what if the array is empty?"}"""


def get_interviewer_user_prompt(transcript_text: str) -> str:
    """Get user prompt for interviewer based on candidate's speech."""
    return f"The candidate just said: '{transcript_text}'\n\nRespond as the interviewer."


def get_coach_user_prompt(
    transcript_text: str,
    code: str,
    run_result: dict = None
) -> str:
    """Get user prompt for coach based on current state."""
    prompt = f"Candidate's recent words: '{transcript_text}'\n\n"
    
    if code:
        prompt += f"Current code:\n```javascript\n{code}\n```\n\n"
    
    if run_result:
        prompt += f"Test result: {'PASSED' if run_result.get('passed') else 'FAILED'}\n"
    
    prompt += "Provide a coaching hint as JSON."
    return prompt
