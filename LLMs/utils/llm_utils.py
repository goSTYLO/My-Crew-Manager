import json
import re
from pydantic import BaseModel, ValidationError
from typing import Optional, Type

def validate_and_parse_json(section_name: str, raw_response: str, pydantic_model: Type[BaseModel]) -> Optional[BaseModel]:
    """Validate JSON response against Pydantic model and parse."""
    try:
        # Attempt to extract JSON if it's wrapped in markdown code block
        if raw_response.strip().startswith("```json") and raw_response.strip().endswith("```"): 
            json_str = raw_response.strip()[7:-3].strip()
        else:
            json_str = raw_response.strip()
            
        json_data = json.loads(json_str)
        validated_obj = pydantic_model.parse_obj(json_data)
        print(f"✅ JSON & Pydantic validation successful for {section_name}.")
        return validated_obj
    except json.JSONDecodeError as e:
        print(f"❌ JSON decoding error for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None
    except ValidationError as e:
        print(f"❌ Pydantic validation error for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred during validation for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None
