"""Utility functions for ID generation."""
import uuid


def generate_id() -> uuid.UUID:
    """Generate a new UUID v4."""
    return uuid.uuid4()
