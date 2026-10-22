from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password at least 8 characters")
    full_name: Optional[str] = "Research Fellow"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ----------------- Molecular Schemas -----------------
class MoleculeInput(BaseModel):
    smiles: str = Field(..., description="Canonical or valid SMILES string")

class MoleculeDescriptors(BaseModel):
    smiles: str
    canonical_smiles: str
    formula: str
    molecular_weight: float
    logp: float
    tpsa: float
    hbd: int
    hba: int
    rotatable_bonds: int
    atom_count: int
    heavy_atom_count: int
    ring_count: int
    formal_charge: int
    svg_depiction: str
    conformer_3d: Optional[Dict[str, Any]] = None
    fingerprint_density: float

class MoleculeSaveRequest(BaseModel):
    smiles: str
    name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = []

class MoleculeUpdateRequest(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class SavedMoleculeResponse(BaseModel):
    id: str
    smiles: str
    name: Optional[str] = None
    formula: Optional[str] = None
    molecular_weight: Optional[float] = None
    logp: Optional[float] = None
    tpsa: Optional[float] = None
    hbd: Optional[int] = None
    hba: Optional[int] = None
    rotatable_bonds: Optional[int] = None
    notes: Optional[str] = None
    tags: List[str] = []
    svg_depiction: Optional[str] = None
    conformer_3d_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- Classical ML Schemas -----------------
class ClassicalTrainRequest(BaseModel):
    dataset_name: str = "delaney_esol"
    model_type: str = "random_forest"  # random_forest | ridge | dummy
    test_size: float = 0.2
    random_state: int = 42
    n_estimators: Optional[int] = 100
    max_depth: Optional[int] = 12
    alpha: Optional[float] = 1.0

class ClassicalPredictRequest(BaseModel):
    smiles: str
    model_id: Optional[str] = None

class ClassicalPredictResponse(BaseModel):
    smiles: str
    predicted_solubility_logS: float
    interpretation: str
    model_used: str

class ExperimentMetrics(BaseModel):
    # Regression metrics
    r2: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    # Classification metrics
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    
    # Detailed plot points
    actual_vs_predicted: Optional[List[Dict[str, float]]] = None
    residuals: Optional[List[Dict[str, float]]] = None


# ----------------- Quantum ML Schemas -----------------
class QuantumExperimentRequest(BaseModel):
    name: str = "Quantum Kernel Classification Experiment"
    dataset_name: str = "molecular_activity_binary" # or "esol_classification"
    qubit_count: int = Field(4, ge=2, le=8, description="Number of qubits (2-8 for simulator)")
    circuit_depth: int = Field(2, ge=1, le=4, description="Depth / repetitions of quantum feature map")
    encoding_strategy: str = "angle_embedding_cz" # angle_embedding_cz | zz_feature_map | iqp_embedding
    model_type: str = "quantum_kernel_svm" # quantum_kernel_svm | vqc
    sample_size: int = Field(40, ge=10, le=100, description="Fair training sample size for quantum simulator evaluation")
    random_seed: int = 42

class QuantumCircuitSpec(BaseModel):
    qubit_count: int
    circuit_depth: int
    encoding_strategy: str
    gates: List[Dict[str, Any]]
    circuit_diagram_text: str
    qasm: Optional[str] = None
    entanglement_pattern: str


# ----------------- Experiment History & Comparison Schemas -----------------
class ExperimentResponse(BaseModel):
    id: str
    name: str
    experiment_type: str
    model_family: str
    dataset_name: str
    task_type: str
    hyperparameters: Dict[str, Any]
    metrics: Dict[str, Any]
    training_time_seconds: float
    circuit_depth: Optional[int] = None
    qubit_count: Optional[int] = None
    circuit_qasm: Optional[str] = None
    circuit_diagram: Optional[str] = None
    encoding_strategy: Optional[str] = None
    backend_name: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ModelComparisonResponse(BaseModel):
    experiments: List[ExperimentResponse]
    interpretation: str
    scientific_summary: str
    best_model_id: Optional[str] = None


# ----------------- Dataset Schemas -----------------
class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    row_count: int
    column_count: int
    feature_columns: List[str]
    target_column: Optional[str] = None
    task_type: str
    is_public: bool
    summary_statistics: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- Settings Schemas -----------------
class UserSettingsUpdate(BaseModel):
    default_dataset: Optional[str] = None
    default_random_seed: Optional[int] = None
    default_split_ratio: Optional[float] = None
    max_qubits: Optional[int] = None
    default_circuit_template: Optional[str] = None
    quantum_backend: Optional[str] = None

class UserSettingsResponse(BaseModel):
    default_dataset: str
    default_random_seed: int
    default_split_ratio: float
    max_qubits: int
    default_circuit_template: str
    quantum_backend: str
    dependency_status: Dict[str, bool]
    updated_at: datetime

    class Config:
        from_attributes = True
