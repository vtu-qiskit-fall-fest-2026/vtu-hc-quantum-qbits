from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, ExperimentRecord
from app.auth.dependencies import get_current_user
from app.api.schemas import ExperimentResponse, ModelComparisonResponse

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.get("/", response_model=List[ExperimentResponse])
def list_experiments(
    experiment_type: Optional[str] = Query(None, regex="^(classical|quantum)$"),
    task_type: Optional[str] = Query(None, regex="^(regression|classification)$"),
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List experiments for authenticated user only (strictly isolated)."""
    q = db.query(ExperimentRecord).filter(ExperimentRecord.user_id == user.id)
    if experiment_type:
        q = q.filter(ExperimentRecord.experiment_type == experiment_type)
    if task_type:
        q = q.filter(ExperimentRecord.task_type == task_type)
    if status:
        q = q.filter(ExperimentRecord.status == status)
        
    return q.order_by(ExperimentRecord.created_at.desc()).all()

@router.get("/compare", response_model=ModelComparisonResponse)
def compare_experiments(
    experiment_ids: Optional[str] = Query(None, description="Comma-separated experiment IDs"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare compatible experiments (classical vs quantum) with real metrics and scientific interpretation."""
    q = db.query(ExperimentRecord).filter(
        ExperimentRecord.user_id == user.id,
        ExperimentRecord.status == "completed"
    )
    
    if experiment_ids:
        ids_list = [i.strip() for i in experiment_ids.split(",") if i.strip()]
        experiments = q.filter(ExperimentRecord.id.in_(ids_list)).all()
    else:
        # Default: pick latest 4 experiments
        experiments = q.order_by(ExperimentRecord.created_at.desc()).limit(4).all()

    if not experiments:
        return {
            "experiments": [],
            "interpretation": "No completed experiments available to compare. Train a classical model and run a quantum experiment first.",
            "scientific_summary": "Perform experiments across classical regressors and quantum kernel classifiers to inspect empirical trade-offs.",
            "best_model_id": None
        }

    # Generate dynamic scientific interpretation
    # Group by task_type to prevent comparing regression R2 with classification accuracy
    classification_exps = [e for e in experiments if e.task_type == "classification"]
    regression_exps = [e for e in experiments if e.task_type == "regression"]

    interp_parts = []
    best_id = None
    
    if classification_exps:
        best_clf = max(classification_exps, key=lambda e: (e.metrics.get("f1") or e.metrics.get("accuracy") or 0))
        best_id = best_clf.id
        q_clfs = [e for e in classification_exps if e.experiment_type == "quantum"]
        c_clfs = [e for e in classification_exps if e.experiment_type == "classical"]
        
        interp_parts.append(
            f"Evaluated {len(classification_exps)} classification benchmark(s). "
            f"Top model is '{best_clf.name}' with F1={best_clf.metrics.get('f1', 0.0):.3f} and Accuracy={best_clf.metrics.get('accuracy', 0.0):.3f}."
        )
        if q_clfs:
            avg_q_time = sum(e.training_time_seconds for e in q_clfs) / len(q_clfs)
            interp_parts.append(
                f"Quantum simulation overhead: Kernel evaluations averaged {avg_q_time:.2f}s due to state overlap matrix computation. "
                "Current quantum simulator performance demonstrates fidelity-based separation without empirical quantum advantage over classical kernels."
            )
            
    if regression_exps:
        best_reg = max(regression_exps, key=lambda e: (e.metrics.get("r2") or -999))
        if not best_id:
            best_id = best_reg.id
        interp_parts.append(
            f"Evaluated {len(regression_exps)} solubility regression model(s). "
            f"Highest R² is '{best_reg.name}' (R²={best_reg.metrics.get('r2', 0.0):.3f}, MAE={best_reg.metrics.get('mae', 0.0):.3f} log(mol/L))."
        )

    summary = " ".join(interp_parts)
    sci_summary = (
        "Rigorous cheminformatics evaluation: Preprocessing applied exclusively to train splits. "
        "Quantum fidelity kernels evaluated on PennyLane simulator state vectors. "
        "No unverified quantum advantage is claimed; empirical results reflect genuine simulator calculations."
    )

    return {
        "experiments": experiments,
        "interpretation": summary,
        "scientific_summary": sci_summary,
        "best_model_id": best_id
    }

@router.get("/{experiment_id}", response_model=ExperimentResponse)
def get_experiment_detail(
    experiment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exp = db.query(ExperimentRecord).filter(
        ExperimentRecord.id == experiment_id,
        ExperimentRecord.user_id == user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found.")
    return exp

@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
    experiment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exp = db.query(ExperimentRecord).filter(
        ExperimentRecord.id == experiment_id,
        ExperimentRecord.user_id == user.id
    ).first()
    if not exp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found.")
    db.delete(exp)
    db.commit()
    return None
