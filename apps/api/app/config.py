"""Application configuration."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""
    
    # Database - lowercase to match usage in db.py
    database_url: str = "postgresql://postgres:postgres@localhost:5432/interview_db"
    
    # Redis - lowercase to match usage
    redis_url: str = "redis://localhost:6379/0"
    
    # LLM API
    openrouter_api_key: str = ""
    openrouter_model: str = "google/gemini-2.0-flash-exp:free"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert cors_origins string to list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from .env
        case_sensitive = False  # Allow case-insensitive field matching


settings = Settings()