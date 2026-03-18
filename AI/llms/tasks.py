"""Minimal cancellation support for stateless AI service.

In the standalone FastAPI service, no task tracking is needed.
CancellationToken is a no-op when task_id is None.
"""
from typing import Optional


class TaskCancelledException(Exception):
    """Raised when a task is cancelled."""
    pass


class CancellationToken:
    """No-op token for stateless service — cancellation is not supported."""

    def __init__(self, task_id: Optional[str] = None):
        self.task_id = task_id

    def check_cancelled(self):
        """No-op in stateless service."""
        pass

    def is_cancelled(self) -> bool:
        return False
