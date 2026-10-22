import threading
import uuid
import time
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from app.database.session import SessionLocal
from app.database.models import JobRecord

class JobManager:
    """Thread-safe background job execution system with status persistence."""
    
    _lock = threading.Lock()
    _active_threads: Dict[str, threading.Thread] = {}

    @classmethod
    def submit_job(
        cls,
        user_id: str,
        job_type: str,
        task_func: Callable[..., Any],
        *args,
        **kwargs
    ) -> str:
        job_id = str(uuid.uuid4())
        
        # Persist initial record in DB
        db = SessionLocal()
        try:
            job_rec = JobRecord(
                id=job_id,
                user_id=user_id,
                job_type=job_type,
                status="running",
                progress=0.1
            )
            db.add(job_rec)
            db.commit()
        finally:
            db.close()

        def runner():
            db_thread = SessionLocal()
            try:
                # Execute task
                result = task_func(*args, **kwargs)
                rec = db_thread.query(JobRecord).filter(JobRecord.id == job_id).first()
                if rec:
                    rec.status = "completed"
                    rec.progress = 1.0
                    rec.result = result if isinstance(result, dict) else {"output": str(result)}
                    db_thread.commit()
            except Exception as e:
                rec = db_thread.query(JobRecord).filter(JobRecord.id == job_id).first()
                if rec:
                    rec.status = "failed"
                    rec.error_message = str(e)
                    db_thread.commit()
            finally:
                db_thread.close()
                with cls._lock:
                    cls._active_threads.pop(job_id, None)

        thread = threading.Thread(target=runner, daemon=True)
        with cls._lock:
            cls._active_threads[job_id] = thread
        thread.start()

        return job_id

    @classmethod
    def get_job_status(cls, job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        db = SessionLocal()
        try:
            rec = db.query(JobRecord).filter(
                JobRecord.id == job_id,
                JobRecord.user_id == user_id
            ).first()
            if not rec:
                return None
            return {
                "id": rec.id,
                "job_type": rec.job_type,
                "status": rec.status,
                "progress": rec.progress,
                "result": rec.result,
                "error_message": rec.error_message,
                "created_at": rec.created_at.isoformat(),
                "updated_at": rec.updated_at.isoformat()
            }
        finally:
            db.close()
