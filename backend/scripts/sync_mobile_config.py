import os
import json
from dotenv import load_dotenv

# Load root .env
load_dotenv()

# Get mobile API base URL
mobile_api_url = os.getenv('MOBILE_API_BASE_URL', 'http://localhost:8000')

# Update mobile env.json
mobile_env_path = 'mobile/mycrewmanager/env.json'
with open(mobile_env_path, 'r') as f:
    config = json.load(f)

config['api_base_url'] = mobile_api_url
config['websocket_url'] = mobile_api_url.replace('http', 'ws') + '/ws/'

with open(mobile_env_path, 'w') as f:
    json.dump(config, f, indent=2)

print(f"Mobile config updated: {mobile_api_url}")
