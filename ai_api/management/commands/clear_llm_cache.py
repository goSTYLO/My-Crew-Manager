from django.core.management.base import BaseCommand
from LLMs.llm_cache import (
    clear_cache_and_free_memory, 
    get_memory_usage, 
    start_auto_cleanup,
    stop_auto_cleanup,
    set_cleanup_interval
)

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
        # Show memory usage before
        before = get_memory_usage()
        self.stdout.write(f"Memory before cleanup: {before}")
        
        # Clear cache
        clear_cache_and_free_memory()
        
        # Show memory usage after
        after = get_memory_usage()
        self.stdout.write(f"Memory after cleanup: {after}")
        
        memory_freed = before['allocated_mb'] - after['allocated_mb']
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleared LLM cache and freed {memory_freed:.2f} MB of GPU memory')
        )

    def show_status(self):
        """Show current memory usage and cache status."""
        memory_info = get_memory_usage()
        self.stdout.write("Current GPU Memory Usage:")
        self.stdout.write(f"  Allocated: {memory_info['allocated_mb']} MB")
        self.stdout.write(f"  Reserved: {memory_info['reserved_mb']} MB")
        self.stdout.write(f"  Available: {memory_info['available_mb']} MB")
        
        if memory_info['allocated_mb'] > 0:
            self.stdout.write(
                self.style.WARNING("LLM models are currently loaded in GPU memory")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("No LLM models currently loaded in GPU memory")
            )

    def start_auto_cleanup(self):
        """Start the auto-cleanup background thread."""
        start_auto_cleanup()
        self.stdout.write(
            self.style.SUCCESS('Auto-cleanup started successfully')
        )

    def stop_auto_cleanup(self):
        """Stop the auto-cleanup background thread."""
        stop_auto_cleanup()
        self.stdout.write(
            self.style.SUCCESS('Auto-cleanup stopped successfully')
        )

    def set_cleanup_interval(self, interval):
        """Set the auto-cleanup interval."""
        set_cleanup_interval(interval)
        self.stdout.write(
            self.style.SUCCESS(f'Auto-cleanup interval set to {interval} seconds')
        )
