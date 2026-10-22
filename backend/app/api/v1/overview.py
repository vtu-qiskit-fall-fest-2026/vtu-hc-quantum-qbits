from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, SavedMolecule, ExperimentRecord
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/overview", tags=["Overview"])

@router.get("/")
def get_user_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Derive authentic research statistics strictly from user-owned database records."""
    total_saved_molecules = db.query(SavedMolecule).filter(SavedMolecule.user_id == user.id).count()
    
    experiments_q = db.query(ExperimentRecord).filter(ExperimentRecord.user_id == user.id)
    total_experiments = experiments_q.count()
    completed_experiments = experiments_q.filter(ExperimentRecord.status == "completed").count()
    
    classical_models = experiments_q.filter(
        ExperimentRecord.experiment_type == "classical",
        ExperimentRecord.status == "completed"
    ).count()
    
    quantum_experiments = experiments_q.filter(
        ExperimentRecord.experiment_type == "quantum",
        ExperimentRecord.status == "completed"
    ).count()

    # Recent experiments (latest 5)
    recent_experiments = (
        experiments_q.order_by(ExperimentRecord.created_at.desc())
        .limit(5)
        .all()
    )

    # Recent saved molecules (latest 5)
    recent_molecules = (
        db.query(SavedMolecule)
        .filter(SavedMolecule.user_id == user.id)
        .order_by(SavedMolecule.created_at.desc())
        .limit(5)
        .all()
    )

    # Performance trajectory chart data from actual completed experiments
    perf_chart = []
    for exp in experiments_q.filter(ExperimentRecord.status == "completed").order_by(ExperimentRecord.created_at.asc()).limit(10).all():
        m = exp.metrics or {}
        score = m.get("f1") or m.get("accuracy") or m.get("r2")
        perf_chart.append({
            "name": exp.name,
            "type": exp.experiment_type,
            "model": exp.model_family,
            "score": round(float(score), 3) if score is not None else 0.0,
            "runtime": exp.training_time_seconds,
            "date": exp.created_at.strftime("%b %d, %H:%M")
        })

    return {
        "stats": {
            "molecules_analyzed": total_saved_molecules,
            "experiments_completed": completed_experiments,
            "classical_models_trained": classical_models,
            "quantum_experiments_completed": quantum_experiments,
            "total_experiments_recorded": total_experiments
        },
        "recent_experiments": [
            {
                "id": exp.id,
                "name": exp.name,
                "type": exp.experiment_type,
                "model_family": exp.model_family,
                "status": exp.status,
                "metrics": exp.metrics,
                "created_at": exp.created_at.isoformat()
            } for exp in recent_experiments
        ],
        "recent_molecules": [
            {
                "id": mol.id,
                "name": mol.name,
                "smiles": mol.smiles,
                "formula": mol.formula,
                "mw": mol.molecular_weight,
                "created_at": mol.created_at.isoformat()
            } for mol in recent_molecules
        ],
        "performance_chart": perf_chart
    }
