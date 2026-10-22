from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, ExperimentRecord
from app.auth.dependencies import get_current_user
from app.api.schemas import (
    ClassicalTrainRequest, ClassicalPredictRequest, ClassicalPredictResponse
)
from app.ml.classical_models import ClassicalMLService

router = APIRouter(prefix="/classical", tags=["Classical ML"])

@router.post("/train")
def train_classical_model(
    req: ClassicalTrainRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Train classical regressor on Delaney ESOL dataset and record results in user's experiments."""
    try:
        result = ClassicalMLService.train_model(
            model_type=req.model_type,
            test_size=req.test_size,
            random_state=req.random_state,
            n_estimators=req.n_estimators or 100,
            max_depth=req.max_depth or 12,
            alpha=req.alpha or 1.0
        )
    except Exception as e:
        # Record failed experiment in DB as well to preserve audit trail
        exp_failed = ExperimentRecord(
            user_id=user.id,
            name=f"Classical {req.model_type.replace('_', ' ').title()} (Failed)",
            experiment_type="classical",
            model_family=req.model_type,
            dataset_name=req.dataset_name,
            task_type="regression",
            status="failed",
            error_message=str(e),
            hyperparameters=req.dict()
        )
        db.add(exp_failed)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )

    # Persist completed experiment
    exp = ExperimentRecord(
        user_id=user.id,
        name=f"Delaney ESOL - {req.model_type.replace('_', ' ').title()}",
        experiment_type="classical",
        model_family=req.model_type,
        dataset_name=result["dataset_name"],
        task_type="regression",
        hyperparameters=result["hyperparameters"],
        metrics=result["metrics"],
        training_time_seconds=result["metrics"]["training_time_seconds"],
        status="completed",
        finished_at=datetime.utcnow()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    return {
        "experiment_id": exp.id,
        "model_type": result["model_type"],
        "dataset_name": result["dataset_name"],
        "target_unit": result["target_unit"],
        "metrics": result["metrics"],
        "actual_vs_predicted": result["actual_vs_predicted"],
        "residuals": result["residuals"],
        "hyperparameters": result["hyperparameters"]
    }

@router.post("/predict", response_model=ClassicalPredictResponse)
def predict_solubility(req: ClassicalPredictRequest):
    """Predict log aqueous solubility (logS) for an arbitrary SMILES."""
    try:
        pred = ClassicalMLService.predict_smiles(req.smiles, model_id=req.model_id)
        return pred
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
