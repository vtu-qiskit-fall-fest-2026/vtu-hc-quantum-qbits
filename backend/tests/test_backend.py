import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.molecular.rdkit_engine import MolecularEngine
from app.quantum.qml_service import QuantumMLService
from app.ml.classical_models import ClassicalMLService

client = TestClient(app)

# 1. System Health Check
def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["service"] == "Q-MolAI"

# 2. Molecular RDKit Engine Tests
def test_rdkit_valid_smiles():
    # Aspirin: CC(=O)Oc1ccccc1C(=O)O
    aspirin = "CC(=O)Oc1ccccc1C(=O)O"
    desc = MolecularEngine.calculate_descriptors(aspirin)
    assert desc["formula"] == "C9H8O4"
    assert round(desc["molecular_weight"]) == 180
    assert desc["hba"] == 3
    assert desc["hbd"] == 1
    assert "<svg" in desc["svg_depiction"]
    assert desc["conformer_3d"] is not None
    assert len(desc["conformer_3d"]["atoms"]) > 0

def test_rdkit_invalid_smiles():
    invalid_smiles = "INVALID_SMILES_STRING_123"
    with pytest.raises(ValueError):
        MolecularEngine.calculate_descriptors(invalid_smiles)

def test_api_descriptors_endpoint():
    res = client.post("/api/v1/molecules/descriptors", json={"smiles": "c1ccccc1"}) # Benzene
    assert res.status_code == 200
    data = res.json()
    assert data["formula"] == "C6H6"
    assert round(data["molecular_weight"]) == 78

# 3. Authentication & Authorization & Cross-User Isolation
def test_auth_workflow_and_isolation():
    # Register User A
    user_a_email = "fellow_a@qmolai.org"
    res_a = client.post("/api/v1/auth/register", json={
        "email": user_a_email,
        "password": "SecurePassword123!",
        "full_name": "Dr. Alice Quantum"
    })
    assert res_a.status_code in [201, 400]
    
    # Login User A
    login_a = client.post("/api/v1/auth/login", json={
        "email": user_a_email,
        "password": "SecurePassword123!"
    })
    assert login_a.status_code == 200
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register & Login User B
    user_b_email = "fellow_b@qmolai.org"
    client.post("/api/v1/auth/register", json={
        "email": user_b_email,
        "password": "SecurePassword456!",
        "full_name": "Dr. Bob Chemistry"
    })
    login_b = client.post("/api/v1/auth/login", json={
        "email": user_b_email,
        "password": "SecurePassword456!"
    })
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A saves Caffeine (CN1C=NC2=C1C(=O)N(C(=O)N2C)C)
    save_res = client.post(
        "/api/v1/molecules/save",
        json={"smiles": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "name": "Caffeine Molecule", "notes": "Private note A"},
        headers=headers_a
    )
    assert save_res.status_code == 200
    mol_a_id = save_res.json()["id"]

    # User A can see it in saved list
    list_a = client.get("/api/v1/molecules/saved", headers=headers_a)
    assert list_a.status_code == 200
    assert any(m["id"] == mol_a_id for m in list_a.json())

    # User B CANNOT see User A's molecule (Cross-user isolation test)
    list_b = client.get("/api/v1/molecules/saved", headers=headers_b)
    assert list_b.status_code == 200
    assert not any(m["id"] == mol_a_id for m in list_b.json())

    # User B CANNOT fetch User A's molecule directly
    get_unauthorized = client.get(f"/api/v1/molecules/saved/{mol_a_id}", headers=headers_b)
    assert get_unauthorized.status_code == 404

# 4. Classical ML Property Prediction Tests
def test_classical_ml_training_and_prediction():
    res = ClassicalMLService.train_model("dummy", test_size=0.2, random_state=42)
    assert "metrics" in res
    assert "mae" in res["metrics"]
    assert "r2" in res["metrics"]
    assert len(res["actual_vs_predicted"]) > 0

    # Test prediction on unseen molecule
    pred = ClassicalMLService.predict_smiles("CCO") # Ethanol
    assert "predicted_solubility_logS" in pred
    assert isinstance(pred["predicted_solubility_logS"], float)
    assert "interpretation" in pred

# 5. Genuine Quantum ML Execution Tests
def test_quantum_ml_execution():
    res = QuantumMLService.execute_quantum_experiment(
        qubit_count=2,
        circuit_depth=1,
        encoding_strategy="angle_embedding_cz",
        sample_size=16,
        random_seed=42
    )
    assert res["status"] == "completed"
    assert res["qubit_count"] == 2
    assert "accuracy" in res["metrics"]
    assert "f1" in res["metrics"]
    assert "circuit_diagram" in res
    assert len(res["gates"]) > 0
    assert "rbf_svm" in res["classical_baselines"]
