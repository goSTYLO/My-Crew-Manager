import uuid
import threading
import time
from typing import Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum
import signal

class TaskStatus(Enum):
    RUNNING = "running"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class TaskInfo:
    task_id: str
    project_id: int
    task_type: str  # "analysis" or "backlog"
    status: TaskStatus
    start_time: float
    thread: Optional[threading.Thread] = None
    cancellation_event: Optional[threading.Event] = None
    timeout_seconds: int = 300  # 5 minutes default timeout

class TaskManager:
    """Thread-safe task manager for tracking LLM operations"""
    
    def __init__(self):
        self._tasks: Dict[str, TaskInfo] = {}
        self._lock = threading.Lock()
        self._timeout_thread = threading.Thread(target=self._timeout_monitor, daemon=True)
        self._timeout_thread.start()
    
    def create_task(self, project_id: int, task_type: str, timeout_seconds: int = 300) -> str:
        """Create a new task and return its ID"""
        task_id = str(uuid.uuid4())
        cancellation_event = threading.Event()
        
        task_info = TaskInfo(
            task_id=task_id,
            project_id=project_id,
            task_type=task_type,
            status=TaskStatus.RUNNING,
            start_time=time.time(),
            cancellation_event=cancellation_event,
            timeout_seconds=timeout_seconds
        )
        
        with self._lock:
            self._tasks[task_id] = task_info
        
        return task_id
    
    def get_task(self, task_id: str) -> Optional[TaskInfo]:
        """Get task info by ID"""
        with self._lock:
            return self._tasks.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task and return True if it was running"""
        with self._lock:
            task = self._tasks.get(task_id)
            if task and task.status == TaskStatus.RUNNING:
                task.status = TaskStatus.CANCELLED
                if task.cancellation_event:
                    task.cancellation_event.set()
                return True
            return False
    
    def complete_task(self, task_id: str) -> bool:
        """Mark a task as completed"""
        with self._lock:
            task = self._tasks.get(task_id)
            if task:
                task.status = TaskStatus.COMPLETED
                return True
            return False
    
    def fail_task(self, task_id: str) -> bool:
        """Mark a task as failed"""
        with self._lock:
            task = self._tasks.get(task_id)
            if task:
                task.status = TaskStatus.FAILED
                return True
            return False
    
    def remove_task(self, task_id: str) -> bool:
        """Remove a task from tracking"""
        with self._lock:
            if task_id in self._tasks:
                del self._tasks[task_id]
                return True
            return False
    
    def is_cancelled(self, task_id: str) -> bool:
        """Check if a task is cancelled"""
        with self._lock:
            task = self._tasks.get(task_id)
            return task is not None and task.status == TaskStatus.CANCELLED
    
    def cleanup_old_tasks(self, max_age_seconds: int = 3600):
        """Remove tasks older than max_age_seconds"""
        current_time = time.time()
        with self._lock:
            to_remove = []
            for task_id, task in self._tasks.items():
                if current_time - task.start_time > max_age_seconds:
                    to_remove.append(task_id)
            
            for task_id in to_remove:
                del self._tasks[task_id]
    
    def _timeout_monitor(self):
        """Background thread to monitor task timeouts"""
        while True:
            try:
                current_time = time.time()
                with self._lock:
                    to_timeout = []
                    for task_id, task in self._tasks.items():
                        if (task.status == TaskStatus.RUNNING and 
                            current_time - task.start_time > task.timeout_seconds):
                            to_timeout.append(task_id)
                
                # Timeout tasks outside the lock
                for task_id in to_timeout:
                    print(f"Task {task_id} timed out after {self._tasks[task_id].timeout_seconds} seconds")
                    self.cancel_task(task_id)
                    self.fail_task(task_id)
                
                time.sleep(10)  # Check every 10 seconds
            except Exception as e:
                print(f"Error in timeout monitor: {e}")
                time.sleep(30)  # Wait longer on error

# Global task manager instance
task_manager = TaskManager()

class TaskCancelledException(Exception):
    """Raised when a task is cancelled"""
    pass

class CancellationToken:
    """Token for checking cancellation status during LLM operations"""
    
    def __init__(self, task_id: str):
        self.task_id = task_id
    
    def check_cancelled(self):
        """Raise TaskCancelledException if task is cancelled"""
        if task_manager.is_cancelled(self.task_id):
            raise TaskCancelledException(f"Task {self.task_id} was cancelled")
    
    def is_cancelled(self) -> bool:
        """Check if task is cancelled without raising exception"""
        return task_manager.is_cancelled(self.task_id)
