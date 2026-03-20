from django.apps import AppConfig
from urllib import request as urllib_request
from urllib import error as urllib_error
import json
import os


class AiApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_api'

    def ready(self):
        """
        Initialize auto-cleanup when Django starts up.
        """
        try:
            base_url = os.getenv('AI_SERVICE_URL', 'http://127.0.0.1:8002').rstrip('/')
            req = urllib_request.Request(
                f"{base_url}/system/start-auto-cleanup",
                data=json.dumps({}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib_request.urlopen(req, timeout=5):
                pass
        except urllib_error.URLError as e:
            print(f"Warning: Could not reach AI service during startup: {e}")
        except Exception as e:
            # Don't fail Django startup if AI service is unavailable
            print(f"Warning: Could not start AI auto-cleanup: {e}")


