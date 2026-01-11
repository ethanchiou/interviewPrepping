"""Speech analysis service using Gemini."""
from typing import Dict, Any, List
from .llm_openrouter import openrouter


class SpeechAnalyzer:
    """Analyze speech transcripts for communication quality."""
    
    SYSTEM_PROMPT = """You are an expert interview coach analyzing a candidate's speech during a technical interview.

Analyze the following transcript and provide feedback on:
1. **Clarity**: Is the explanation clear and well-structured?
2. **Confidence**: Does the candidate sound confident?
3. **Filler Words**: Count and identify excessive filler words (um, uh, like, you know, etc.)
4. **Pace**: Is the speaking pace appropriate (not too fast or slow)?
5. **Technical Communication**: Are technical concepts explained clearly?

Return your analysis as JSON with this exact structure:
{
    "clarity_score": <0-10>,
    "confidence_score": <0-10>,
    "filler_count": <number>,
    "filler_words": ["um", "uh", ...],
    "pace": "too_fast" | "good" | "too_slow",
    "feedback": "<brief constructive feedback>",
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"]
}

Be constructive and encouraging. Focus on actionable feedback."""

    async def analyze_transcript(
        self, 
        transcript: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze a speech transcript.
        
        Args:
            transcript: The speech text to analyze
            context: Optional context (e.g., question being answered)
            
        Returns:
            Analysis results as dict
        """
        if not transcript or len(transcript.strip()) < 10:
            return self._default_response()
        
        user_prompt = f"""Context: {context or 'Technical interview question'}

Transcript to analyze:
"{transcript}"

Provide your analysis as JSON."""

        try:
            response = await openrouter.get_completion(
                system_prompt=self.SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.3  # Lower temp for more consistent analysis
            )
            
            # Try to extract JSON from response
            import json
            import re
            
            # Remove markdown code blocks if present
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # Try to find JSON object in response
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    return self._default_response()
            
            analysis = json.loads(json_str)
            
            # Validate structure
            required_keys = ['clarity_score', 'confidence_score', 'filler_count', 'feedback']
            if not all(key in analysis for key in required_keys):
                return self._default_response()
            
            return analysis
            
        except Exception as e:
            print(f"Speech analysis error: {e}")
            return self._default_response()
    
    async def get_real_time_feedback(
        self,
        recent_transcripts: List[str],
        question_context: str = ""
    ) -> str:
        """
        Get quick real-time feedback on recent speech.
        Returns a brief coaching tip.
        """
        if not recent_transcripts:
            return ""
        
        combined = " ".join(recent_transcripts[-3:])  # Last 3 utterances
        
        if len(combined) < 20:
            return ""
        
        user_prompt = f"""Question context: {question_context}

Recent speech: "{combined}"

Provide ONE brief coaching tip (max 15 words) if you notice any immediate issues with:
- Excessive filler words
- Unclear explanation
- Lack of structure

If the speech is good, respond with just "OK" """

        try:
            response = await openrouter.get_completion(
                system_prompt="You are a concise interview coach. Give very brief, actionable feedback.",
                user_prompt=user_prompt,
                temperature=0.5
            )
            
            response = response.strip()
            
            if response.upper() == "OK" or len(response) > 100:
                return ""
            
            return response
            
        except Exception as e:
            print(f"Real-time feedback error: {e}")
            return ""
    
    def _default_response(self) -> Dict[str, Any]:
        """Return default response when analysis fails."""
        return {
            "clarity_score": 5,
            "confidence_score": 5,
            "filler_count": 0,
            "filler_words": [],
            "pace": "good",
            "feedback": "Keep going! Focus on explaining your thought process clearly.",
            "strengths": ["Engaging with the problem"],
            "improvements": ["Continue practicing clear communication"]
        }


# Singleton instance
speech_analyzer = SpeechAnalyzer()