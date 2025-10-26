from django.apps import AppConfig


class AiApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_api'

    def ready(self):
        """
        Initialize auto-cleanup when Django starts up.
        """
        try:
            from LLMs.llm_cache import start_auto_cleanup
            start_auto_cleanup()
        except Exception as e:
            # Don't fail Django startup if LLM cache fails
            print(f"Warning: Could not start LLM auto-cleanup: {e}")


