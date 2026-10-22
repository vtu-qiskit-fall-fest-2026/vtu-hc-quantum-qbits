import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    saved_molecules = relationship("SavedMolecule", back_populates="user", cascade="all, delete-orphan")
    experiments = relationship("ExperimentRecord", back_populates="user", cascade="all, delete-orphan")
    datasets = relationship("DatasetRecord", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("JobRecord", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class SavedMolecule(Base):
    __tablename__ = "saved_molecules"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    smiles = Column(String(1000), nullable=False, index=True)
    name = Column(String(255), nullable=True)
    formula = Column(String(100), nullable=True)
    molecular_weight = Column(Float, nullable=True)
    logp = Column(Float, nullable=True)
    tpsa = Column(Float, nullable=True)
    hbd = Column(Integer, nullable=True)
    hba = Column(Integer, nullable=True)
    rotatable_bonds = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    svg_depiction = Column(Text, nullable=True)
    conformer_3d_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="saved_molecules")


class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)  # null = system public
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    feature_columns = Column(JSON, default=list)
    target_column = Column(String(255), nullable=True)
    task_type = Column(String(50), default="regression")  # regression, classification
    is_public = Column(Boolean, default=False)
    summary_statistics = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="datasets")


class ExperimentRecord(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    experiment_type = Column(String(50), nullable=False, index=True)  # classical | quantum
    model_family = Column(String(100), nullable=False, index=True)    # random_forest | ridge | dummy | quantum_kernel_svm | vqc
    dataset_name = Column(String(255), nullable=False, index=True)
    task_type = Column(String(50), nullable=False)                    # regression | classification
    
    hyperparameters = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict)                              # r2, mae, rmse OR accuracy, precision, recall, f1, confusion_matrix
    training_time_seconds = Column(Float, default=0.0)
    
    # Quantum specific attributes
    circuit_depth = Column(Integer, nullable=True)
    qubit_count = Column(Integer, nullable=True)
    circuit_qasm = Column(Text, nullable=True)
    circuit_diagram = Column(Text, nullable=True)
    encoding_strategy = Column(String(100), nullable=True)
    backend_name = Column(String(100), default="default.qubit")
    
    status = Column(String(50), default="completed", index=True)      # queued | running | completed | failed
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    finished_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="experiments")


class JobRecord(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_type = Column(String(100), nullable=False)
    status = Column(String(50), default="queued", index=True)         # queued | running | completed | failed | cancelled
    progress = Column(Float, default=0.0)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="jobs")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    default_dataset = Column(String(100), default="Delaney / ESOL Solubility")
    default_random_seed = Column(Integer, default=42)
    default_split_ratio = Column(Float, default=0.2)
    max_qubits = Column(Integer, default=8)
    default_circuit_template = Column(String(100), default="angle_embedding_cz")
    quantum_backend = Column(String(100), default="default.qubit")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")
