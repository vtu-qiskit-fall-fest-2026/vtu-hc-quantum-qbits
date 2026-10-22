from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, ExperimentRecord
from app.auth.dependencies import get_current_user
from app.api.schemas import QuantumExperimentRequest
from app.quantum.qml_service import QuantumMLService

router = APIRouter(prefix="/quantum", tags=["Quantum ML"])

@router.post("/experiment")
def run_quantum_experiment(
    req: QuantumExperimentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute real PennyLane quantum kernel classification experiment."""
    try:
        exp_result = QuantumMLService.execute_quantum_experiment(
            qubit_count=req.qubit_count,
            circuit_depth=req.circuit_depth,
            encoding_strategy=req.encoding_strategy,
            sample_size=req.sample_size,
            random_seed=req.random_seed
        )
    except Exception as e:
        # Save failure record
        fail_record = ExperimentRecord(
            user_id=user.id,
            name=f"{req.name} (Failed)",
            experiment_type="quantum",
            model_family=req.model_type,
            dataset_name=req.dataset_name,
            task_type="classification",
            status="failed",
            error_message=str(e),
            qubit_count=req.qubit_count,
            circuit_depth=req.circuit_depth,
            encoding_strategy=req.encoding_strategy,
            hyperparameters=req.dict()
        )
        db.add(fail_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quantum experiment execution failed: {str(e)}"
        )

    # Persist completed experiment
    exp = ExperimentRecord(
        user_id=user.id,
        name=req.name,
        experiment_type="quantum",
        model_family=exp_result["model_family"],
        dataset_name=exp_result["dataset_name"],
        task_type="classification",
        hyperparameters=exp_result["hyperparameters"],
        metrics=exp_result["metrics"],
        training_time_seconds=exp_result["training_time_seconds"],
        qubit_count=exp_result["qubit_count"],
        circuit_depth=exp_result["circuit_depth"],
        circuit_diagram=exp_result["circuit_diagram"],
        encoding_strategy=exp_result["encoding_strategy"],
        backend_name=exp_result["backend_name"],
        status="completed",
        finished_at=datetime.utcnow()
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    return {
        "experiment_id": exp.id,
        **exp_result
    }

@router.get("/templates")
def get_circuit_templates():
    """Educational templates for Quantum Circuit Studio."""
    return [
        {
            "id": "angle_embedding_cz",
            "name": "Angle Embedding with Controlled-Z Entanglement",
            "description": "Encodes continuous molecular PCA features into single-qubit RY rotation angles, followed by a linear CZ entanglement cascade.",
            "qubit_range": [2, 8],
            "default_depth": 2,
            "entanglement": "Linear Controlled-Z (CZ)",
            "expressibility": "Moderate",
            "recommended_for": "Continuous physicochemical molecular descriptors"
        },
        {
            "id": "zz_feature_map",
            "name": "Havlíček ZZ Feature Map (IBM Quantum)",
            "description": "Non-linear feature map with Hadamard superposition, RZ single-qubit phase rotations, and two-qubit ZZ interactions (CNOT-RZ-CNOT) designed to be classically hard to simulate.",
            "qubit_range": [2, 6],
            "default_depth": 2,
            "entanglement": "Pairwise ZZ interaction (CNOT-RZ-CNOT)",
            "expressibility": "High",
            "recommended_for": "Correlated molecular topological features"
        },
        {
            "id": "iqp_embedding",
            "name": "Instantaneous Quantum Polynomial (IQP) Embedding",
            "description": "Applies Hadamard layers followed by diagonal multi-qubit diagonal interactions. Inspired by quantum supremacy sampling arguments.",
            "qubit_range": [2, 6],
            "default_depth": 1,
            "entanglement": "Full cross-qubit product phase interactions",
            "expressibility": "High",
            "recommended_for": "High-order molecular bond interactions"
        }
    ]

@router.get("/inspect-circuit")
def inspect_circuit(
    qubit_count: int = 4,
    circuit_depth: int = 2,
    encoding_strategy: str = "angle_embedding_cz"
):
    """Retrieve detailed gate sequence and diagram for Quantum Circuit Studio."""
    gates = QuantumMLService.inspect_gates(encoding_strategy, qubit_count, circuit_depth)
    return {
        "qubit_count": qubit_count,
        "circuit_depth": circuit_depth,
        "encoding_strategy": encoding_strategy,
        "total_gates": len(gates),
        "gates": gates
    }
