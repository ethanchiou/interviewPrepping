"""Application configuration from environment variables."""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    openrouter_api_key: str
    openrouter_model: str = "google/gemini-2.0-flash-exp:free"
    database_url: str
    redis_url: str
    cors_origins: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        # Check for .env.local first, then fall back to .env
        env_file = ".env.local" if os.path.exists(".env.local") else ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()