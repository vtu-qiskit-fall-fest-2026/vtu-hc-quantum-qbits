from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, UserSettings
from app.auth.dependencies import get_current_user
from app.api.schemas import UserSettingsResponse, UserSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/", response_model=UserSettingsResponse)
def get_user_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=user.id)
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    # Check live dependency status
    deps = {
        "rdkit": True,
        "pennylane": True,
        "scipy": True,
        "scikit_learn": True,
        "postgresql_ready": True
    }

    return {
        "default_dataset": settings_obj.default_dataset,
        "default_random_seed": settings_obj.default_random_seed,
        "default_split_ratio": settings_obj.default_split_ratio,
        "max_qubits": settings_obj.max_qubits,
        "default_circuit_template": settings_obj.default_circuit_template,
        "quantum_backend": settings_obj.quantum_backend,
        "dependency_status": deps,
        "updated_at": settings_obj.updated_at
    }

@router.put("/", response_model=UserSettingsResponse)
def update_user_settings(
    update_data: UserSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings_obj = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings_obj:
        settings_obj = UserSettings(user_id=user.id)
        db.add(settings_obj)

    if update_data.default_dataset is not None:
        settings_obj.default_dataset = update_data.default_dataset
    if update_data.default_random_seed is not None:
        settings_obj.default_random_seed = update_data.default_random_seed
    if update_data.default_split_ratio is not None:
        settings_obj.default_split_ratio = update_data.default_split_ratio
    if update_data.max_qubits is not None:
        settings_obj.max_qubits = min(max(update_data.max_qubits, 2), 12)
    if update_data.default_circuit_template is not None:
        settings_obj.default_circuit_template = update_data.default_circuit_template
    if update_data.quantum_backend is not None:
        settings_obj.quantum_backend = update_data.quantum_backend

    db.commit()
    db.refresh(settings_obj)

    deps = {
        "rdkit": True,
        "pennylane": True,
        "scipy": True,
        "scikit_learn": True,
        "postgresql_ready": True
    }

    return {
        "default_dataset": settings_obj.default_dataset,
        "default_random_seed": settings_obj.default_random_seed,
        "default_split_ratio": settings_obj.default_split_ratio,
        "max_qubits": settings_obj.max_qubits,
        "default_circuit_template": settings_obj.default_circuit_template,
        "quantum_backend": settings_obj.quantum_backend,
        "dependency_status": deps,
        "updated_at": settings_obj.updated_at
    }
