from django.core.management.base import BaseCommand
from django.conf import settings
import json
from urllib import request as urllib_request
from urllib import error as urllib_error


def _ai_service_base_url() -> str:
    return (getattr(settings, 'AI_SERVICE_URL', '') or 'http://127.0.0.1:8002').rstrip('/')


def _ai_post(path: str, payload: dict, timeout: int = 30) -> dict:
    url = f"{_ai_service_base_url()}{path}"
    req = urllib_request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib_request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body) if body else {}
    except urllib_error.HTTPError as e:
        details = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        raise RuntimeError(f"AI service HTTP {e.code}: {details}")
    except urllib_error.URLError as e:
        raise RuntimeError(f"AI service unavailable: {e.reason}")


def _ai_get(path: str, timeout: int = 30) -> dict:
    url = f"{_ai_service_base_url()}{path}"
    req = urllib_request.Request(url, method='GET')
    try:
        with urllib_request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode('utf-8')
            return json.loads(body) if body else {}
    except urllib_error.HTTPError as e:
        details = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        raise RuntimeError(f"AI service HTTP {e.code}: {details}")
    except urllib_error.URLError as e:
        raise RuntimeError(f"AI service unavailable: {e.reason}")

class Command(BaseCommand):
    help = 'Manage LLM cache and GPU memory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['clear', 'status', 'start-auto', 'stop-auto', 'set-interval'],
            default='clear',
            help='Action to perform (default: clear)'
        )
        parser.add_argument(
            '--interval',
            type=int,
            help='Set auto-cleanup interval in seconds (use with --action set-interval)'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'clear':
            self.clear_cache()
        elif action == 'status':
            self.show_status()
        elif action == 'start-auto':
            self.start_auto_cleanup()
        elif action == 'stop-auto':
            self.stop_auto_cleanup()
        elif action == 'set-interval':
            interval = options.get('interval')
            if interval is None:
                self.stdout.write(
                    self.style.ERROR('--interval is required when using --action set-interval')
                )
                return
            self.set_cleanup_interval(interval)

    def clear_cache(self):
        """Clear LLM cache and free GPU memory."""
        result = _ai_post('/system/clear-cache', {}, timeout=60)
        before = result.get('memory_before', {})
        after = result.get('memory_after', {})
        self.stdout.write(f"Memory before cleanup: {before}")
        self.stdout.write(f"Memory after cleanup: {after}")

        memory_freed = before.get('allocated_mb', 0) - after.get('allocated_mb', 0)
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleared LLM cache and freed {memory_freed:.2f} MB of GPU memory')
        )

    def show_status(self):
        """Show current memory usage and cache status."""
        memory_info = _ai_get('/system/memory-usage', timeout=30)
        self.stdout.write("Current GPU Memory Usage:")
        self.stdout.write(f"  Allocated: {memory_info.get('allocated_mb', 0)} MB")
        self.stdout.write(f"  Reserved: {memory_info.get('reserved_mb', 0)} MB")
        self.stdout.write(f"  Available: {memory_info.get('available_mb', 0)} MB")
        
        if memory_info.get('allocated_mb', 0) > 0:
            self.stdout.write(
                self.style.WARNING("LLM models are currently loaded in GPU memory")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("No LLM models currently loaded in GPU memory")
            )

    def start_auto_cleanup(self):
        """Start the auto-cleanup background thread."""
        _ai_post('/system/start-auto-cleanup', {}, timeout=30)
        self.stdout.write(
            self.style.SUCCESS('Auto-cleanup started successfully')
        )

    def stop_auto_cleanup(self):
        """Stop the auto-cleanup background thread."""
        _ai_post('/system/stop-auto-cleanup', {}, timeout=30)
        self.stdout.write(
            self.style.SUCCESS('Auto-cleanup stopped successfully')
        )

    def set_cleanup_interval(self, interval):
        """Set the auto-cleanup interval."""
        _ai_post('/system/set-cleanup-interval', {'interval_seconds': int(interval)}, timeout=30)
        self.stdout.write(
            self.style.SUCCESS(f'Auto-cleanup interval set to {interval} seconds')
        )
