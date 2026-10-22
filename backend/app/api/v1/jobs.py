from fastapi import APIRouter, Depends, HTTPException, status
from app.database.models import User
from app.auth.dependencies import get_current_user
from app.core.jobs import JobManager

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/{job_id}")
def get_job(job_id: str, user: User = Depends(get_current_user)):
    job_info = JobManager.get_job_status(job_id, user.id)
    if not job_info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job_info
