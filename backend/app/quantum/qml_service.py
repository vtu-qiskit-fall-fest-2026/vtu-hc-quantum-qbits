import os
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List
import pennylane as qml
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from app.molecular.rdkit_engine import MolecularEngine

BINARY_DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "molecular_activity_binary.csv")

class QuantumMLService:
    """Genuine Quantum Machine Learning Service using PennyLane state overlaps and QSVC."""

    @staticmethod
    def get_feature_map(name: str, n_qubits: int, depth: int):
        """Construct parametric quantum feature map circuit."""
        def circuit(x):
            if name == "angle_embedding_cz":
                for layer in range(depth):
                    for i in range(n_qubits):
                        qml.Hadamard(wires=i)
                    for i in range(n_qubits):
                        qml.RY(float(x[i]), wires=i)
                    # Linear CZ entanglement
                    for i in range(n_qubits - 1):
                        qml.CZ(wires=[i, i + 1])
            elif name == "zz_feature_map":
                # Canonical IBM ZZ Feature Map
                for layer in range(depth):
                    for i in range(n_qubits):
                        qml.Hadamard(wires=i)
                        qml.RZ(float(x[i]), wires=i)
                    for i in range(n_qubits - 1):
                        phi = float(2.0 * (np.pi - x[i]) * (np.pi - x[i + 1]))
                        qml.CNOT(wires=[i, i + 1])
                        qml.RZ(phi, wires=i + 1)
                        qml.CNOT(wires=[i, i + 1])
            else: # iqp_embedding or default
                for layer in range(depth):
                    for i in range(n_qubits):
                        qml.Hadamard(wires=i)
                        qml.RZ(float(x[i]), wires=i)
                    for i in range(n_qubits):
                        for j in range(i + 1, n_qubits):
                            qml.CNOT(wires=[i, j])
                            qml.RZ(float(x[i] * x[j]), wires=j)
                            qml.CNOT(wires=[i, j])
        return circuit

    @classmethod
    def load_binary_dataset(cls, sample_size: int = 50, random_seed: int = 42) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        if not os.path.exists(BINARY_DATASET_PATH):
            raise FileNotFoundError(f"Binary dataset not found at {BINARY_DATASET_PATH}")
            
        df = pd.read_csv(BINARY_DATASET_PATH)
        
        # Balance classes
        df_class0 = df[df['high_solubility_class'] == 0]
        df_class1 = df[df['high_solubility_class'] == 1]
        
        half_sample = sample_size // 2
        df_sample = pd.concat([
            df_class0.sample(min(half_sample, len(df_class0)), random_state=random_seed),
            df_class1.sample(min(half_sample, len(df_class1)), random_state=random_seed)
        ]).sample(frac=1.0, random_state=random_seed).reset_index(drop=True)

        features = []
        labels = []
        valid_smiles = []

        for _, row in df_sample.iterrows():
            smiles = row['smiles']
            fp = MolecularEngine.extract_fingerprint(smiles, n_bits=256, radius=2)
            if fp is None:
                continue
            desc = MolecularEngine.calculate_descriptors(smiles)
            vec = fp + [
                desc['molecular_weight'] / 500.0,
                desc['logp'] / 5.0,
                desc['tpsa'] / 150.0,
                desc['rotatable_bonds'] / 10.0
            ]
            features.append(vec)
            labels.append(int(row['high_solubility_class']))
            valid_smiles.append(smiles)

        return np.array(features, dtype=np.float32), np.array(labels, dtype=np.int32), valid_smiles

    @classmethod
    def execute_quantum_experiment(
        cls,
        qubit_count: int = 4,
        circuit_depth: int = 2,
        encoding_strategy: str = "angle_embedding_cz",
        sample_size: int = 40,
        random_seed: int = 42,
        test_size: float = 0.25
    ) -> Dict[str, Any]:
        """Execute genuine Quantum Kernel Classifier using PennyLane state overlaps."""
        start_time = time.time()
        
        # Load balanced molecular data
        X_raw, y, smiles_list = cls.load_binary_dataset(sample_size=sample_size, random_seed=random_seed)
        
        # Split train/test
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            X_raw, y, test_size=test_size, random_state=random_seed, stratify=y
        )

        # Dimensionality reduction: PCA down to qubit_count
        pca = PCA(n_components=qubit_count, random_state=random_seed)
        X_train_pca = pca.fit_transform(X_train_raw)
        X_test_pca = pca.transform(X_test_raw)
        
        # Scale into [0, pi] for quantum angle rotation
        scaler = MinMaxScaler(feature_range=(0, np.pi))
        X_train_q = scaler.fit_transform(X_train_pca)
        X_test_q = scaler.transform(X_test_pca)

        # Build PennyLane quantum device
        dev = qml.device("default.qubit", wires=qubit_count)
        fmap = cls.get_feature_map(encoding_strategy, qubit_count, circuit_depth)

        @qml.qnode(dev)
        def kernel_node(x1, x2):
            fmap(x1)
            qml.adjoint(fmap)(x2)
            return qml.probs(wires=range(qubit_count))

        # Compute quantum Gram matrices (train-train and test-train)
        n_train = len(X_train_q)
        n_test = len(X_test_q)
        
        K_train = np.ones((n_train, n_train), dtype=np.float32)
        for i in range(n_train):
            for j in range(i + 1, n_train):
                overlap = float(kernel_node(X_train_q[i], X_train_q[j])[0])
                K_train[i, j] = overlap
                K_train[j, i] = overlap
                
        K_test = np.zeros((n_test, n_train), dtype=np.float32)
        for i in range(n_test):
            for j in range(n_train):
                overlap = float(kernel_node(X_test_q[i], X_train_q[j])[0])
                K_test[i, j] = overlap

        # Quantum Support Vector Classifier
        qsvc = SVC(kernel="precomputed", C=1.0)
        qsvc.fit(K_train, y_train)
        y_pred_q = qsvc.predict(K_test)

        # Quantum Metrics
        acc_q = float(accuracy_score(y_test, y_pred_q))
        prec_q = float(precision_score(y_test, y_pred_q, zero_division=0))
        rec_q = float(recall_score(y_test, y_pred_q, zero_division=0))
        f1_q = float(f1_score(y_test, y_pred_q, zero_division=0))
        cm_q = confusion_matrix(y_test, y_pred_q).tolist()

        # Classical baseline comparison on the EXACT SAME split & features
        classical_svm = SVC(kernel="rbf", C=1.0)
        classical_svm.fit(X_train_pca, y_train)
        y_pred_c_svm = classical_svm.predict(X_test_pca)
        
        classical_rf = RandomForestClassifier(n_estimators=50, random_state=random_seed)
        classical_rf.fit(X_train_raw, y_train)
        y_pred_c_rf = classical_rf.predict(X_test_raw)

        acc_c_svm = float(accuracy_score(y_test, y_pred_c_svm))
        f1_c_svm = float(f1_score(y_test, y_pred_c_svm, zero_division=0))
        
        acc_c_rf = float(accuracy_score(y_test, y_pred_c_rf))
        f1_c_rf = float(f1_score(y_test, y_pred_c_rf, zero_division=0))

        # Generate Circuit diagram and gate sequence
        sample_x = X_train_q[0]
        try:
            circuit_diagram_str = qml.draw(fmap, decimals=2, charset="ascii")(sample_x)
        except Exception:
            circuit_diagram_str = qml.draw(fmap)(sample_x)
        
        gate_list = cls.inspect_gates(encoding_strategy, qubit_count, circuit_depth)
        duration = round(time.time() - start_time, 3)

        return {
            "name": f"Quantum Kernel Classifier ({qubit_count}Q, depth {circuit_depth})",
            "experiment_type": "quantum",
            "model_family": "quantum_kernel_svm",
            "dataset_name": "Molecular Activity (Binary Solubility Benchmark)",
            "task_type": "classification",
            "status": "completed",
            "qubit_count": qubit_count,
            "circuit_depth": circuit_depth,
            "encoding_strategy": encoding_strategy,
            "backend_name": "default.qubit (PennyLane Simulator)",
            "training_time_seconds": duration,
            "metrics": {
                "accuracy": round(acc_q, 4),
                "precision": round(prec_q, 4),
                "recall": round(rec_q, 4),
                "f1": round(f1_q, 4),
                "confusion_matrix": cm_q,
                "n_train_samples": n_train,
                "n_test_samples": n_test
            },
            "circuit_diagram": circuit_diagram_str,
            "gates": gate_list,
            "classical_baselines": {
                "rbf_svm": {
                    "accuracy": round(acc_c_svm, 4),
                    "f1": round(f1_c_svm, 4)
                },
                "random_forest": {
                    "accuracy": round(acc_c_rf, 4),
                    "f1": round(f1_c_rf, 4)
                }
            },
            "hyperparameters": {
                "qubit_count": qubit_count,
                "circuit_depth": circuit_depth,
                "encoding_strategy": encoding_strategy,
                "sample_size": sample_size,
                "random_seed": random_seed,
                "c_regularization": 1.0
            }
        }

    @classmethod
    def inspect_gates(cls, encoding_strategy: str, n_qubits: int, depth: int) -> List[Dict[str, Any]]:
        gates = []
        for d in range(depth):
            for i in range(n_qubits):
                gates.append({"layer": d, "gate": "H", "wires": [i], "type": "superposition"})
                gates.append({"layer": d, "gate": "RY" if "angle" in encoding_strategy else "RZ", "wires": [i], "param": f"x[{i}]", "type": "rotation"})
            if "angle" in encoding_strategy or "cz" in encoding_strategy:
                for i in range(n_qubits - 1):
                    gates.append({"layer": d, "gate": "CZ", "wires": [i, i + 1], "type": "entanglement"})
            elif "zz" in encoding_strategy:
                for i in range(n_qubits - 1):
                    gates.append({"layer": d, "gate": "CNOT", "wires": [i, i + 1], "type": "entanglement"})
                    gates.append({"layer": d, "gate": "RZ", "wires": [i + 1], "param": f"2*(π-x_{i})*(π-x_{i+1})", "type": "phase"})
                    gates.append({"layer": d, "gate": "CNOT", "wires": [i, i + 1], "type": "entanglement"})
            else:
                for i in range(n_qubits):
                    for j in range(i + 1, n_qubits):
                        gates.append({"layer": d, "gate": "CNOT", "wires": [i, j], "type": "entanglement"})
                        gates.append({"layer": d, "gate": "RZ", "wires": [j], "param": f"x_{i}*x_{j}", "type": "phase"})
                        gates.append({"layer": d, "gate": "CNOT", "wires": [i, j], "type": "entanglement"})
        return gates
