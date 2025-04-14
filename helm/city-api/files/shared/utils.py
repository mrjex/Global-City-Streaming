"""Shared utility functions for city temperature services."""

import json
import logging
from typing import Any, Dict, Optional

def setup_logging(service_name: str) -> logging.Logger:
    """Configure a logger instance with consistent formatting.
    
    Args:
        service_name: Name of the service to include in log messages
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(service_name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger

def parse_json_message(message: str) -> Optional[Dict[str, Any]]:
    """Safely parse a JSON string into a dictionary.
    
    Args:
        message: JSON string to parse
        
    Returns:
        Parsed dictionary or None if parsing fails
    """
    try:
        return json.loads(message)
    except json.JSONDecodeError:
        return None

def format_temperature(temp_celsius: float) -> str:
    """Format a temperature value with proper units.
    
    Args:
        temp_celsius: Temperature value in Celsius
        
    Returns:
        Formatted temperature string with units
    """
    return f"{temp_celsius:.1f}°C"

def validate_city_data(data: Dict[str, Any]) -> bool:
    """Validate city temperature data structure and required fields.
    
    Args:
        data: Dictionary containing city temperature data
        
    Returns:
        True if data is valid, False otherwise
    """
    required_fields = {
        'city': str,
        'country': str,
        'continent': str,
        'temperature': (int, float)
    }
    
    try:
        for field, field_type in required_fields.items():
            if field not in data:
                return False
            if not isinstance(data[field], field_type):
                return False
        return True
    except Exception:
        return False 