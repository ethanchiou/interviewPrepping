"""OpenRouter LLM streaming service."""
import httpx
import json
from typing import AsyncIterator, Optional
from ..config import settings


class OpenRouterService:
    """Service for calling OpenRouter streaming API."""
    
    def __init__(self):
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
    
    async def stream_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> AsyncIterator[str]:
        """
        Stream completion from OpenRouter.
        
        Yields individual delta strings from the response.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "stream": True
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", self.api_url, headers=headers, json=payload) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line or line.strip() == "":
                        continue
                    
                    if line.startswith("data: "):
                        data_str = line[6:]  # Remove "data: " prefix
                        
                        if data_str == "[DONE]":
                            break
                        
                        try:
                            data = json.loads(data_str)
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
    
    async def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> str:
        """
        Get full completion (non-streaming) from OpenRouter.
        Used for coach responses that need JSON validation.
        """
        full_response = ""
        async for chunk in self.stream_completion(system_prompt, user_prompt, temperature):
            full_response += chunk
        return full_response


# Singleton instance
openrouter = OpenRouterService()
