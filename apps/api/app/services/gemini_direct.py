"""Direct Gemini API service using Google's Gemini API."""
import httpx
import json
from typing import AsyncGenerator
from ..config import settings


class GeminiDirectService:
    """Service for interacting with Google Gemini API directly."""
    
    def __init__(self):
        self.api_key = settings.gemini_key
        self.model = settings.gemini_model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        
    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """
        Stream completion from Google Gemini API directly.
        
        Yields text deltas as they arrive.
        """
        # Combine system and user prompts for Gemini
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        url = f"{self.base_url}/models/{self.model}:streamGenerateContent"
        params = {"key": self.api_key}
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "temperature": temperature,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                url,
                params=params,
                json=payload
            ) as response:
                response.raise_for_status()
                
                buffer = ""
                async for chunk_bytes in response.aiter_bytes():
                    buffer += chunk_bytes.decode('utf-8', errors='ignore')
                    
                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()
                        
                        if not line:
                            continue
                        
                        try:
                            chunk = json.loads(line)
                            
                            # Gemini streaming format
                            if "candidates" in chunk and len(chunk["candidates"]) > 0:
                                candidate = chunk["candidates"][0]
                                if "content" in candidate and "parts" in candidate["content"]:
                                    for part in candidate["content"]["parts"]:
                                        if "text" in part:
                                            yield part["text"]
                        except json.JSONDecodeError:
                            continue
    
    async def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> str:
        """
        Get a non-streaming completion from Google Gemini API directly.
        
        Returns the complete response text.
        """
        # Combine system and user prompts for Gemini
        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        
        url = f"{self.base_url}/models/{self.model}:generateContent"
        params = {"key": self.api_key}
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": full_prompt
                }]
            }],
            "generationConfig": {
                "temperature": temperature,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                params=params,
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    text_parts = []
                    for part in candidate["content"]["parts"]:
                        if "text" in part:
                            text_parts.append(part["text"])
                    return "".join(text_parts)
            
            raise ValueError("No completion returned from Gemini")


# Global singleton instance
gemini = GeminiDirectService()
