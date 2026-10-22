# Q-MolAI Architecture Specification

## 1. Executive Overview

**Q-MolAI** is a hybrid quantum-classical SaaS platform designed for computational chemistry and quantum machine learning (QML) molecular exploration. It bridges high-throughput deterministic cheminformatics with state-of-the-art quantum simulation.

---

## 2. System Topology

```
+------------------------------------------------------------------------+
|                          Next.js 16 Client                             |
|  - App Router, React 19, TypeScript, Tailwind CSS v4, Lucide Icons      |
|  - Three.js WebGL 3D Ball-and-Stick Conformer Viewer                   |
|  - Recharts Diagnostic Visualizations (Actual vs Predicted, Residuals) |
+-----------------------------------+------------------------------------+
                                    | REST / Bearer + Secure Cookie
                                    v
+------------------------------------------------------------------------+
|                          FastAPI Backend                               |
|  - Uvicorn Asynchronous Gateway                                        |
|  - Strict Pydantic Data Validation                                      |
|  - PBKDF2-HMAC-SHA256 Cryptographic Auth & PyJWT Session Handler        |
+----------+------------------------+--------------------+---------------+
           |                        |                    |
           v                        v                    v
+--------------------+   +---------------------+  +----------------------+
|   RDKit 2026.09    |   |   PennyLane 0.45    |  |  SQLAlchemy 2.0 ORM  |
| - Descriptors      |   | - State Vector Sim  |  | - Users & Isolation  |
| - 2D SVG Depiction |   | - Angle Embed (CZ)  |  | - Saved Molecules    |
| - 3D Force Field   |   | - ZZ Feature Map    |  | - Experiments History|
| - ETKDGv3 + MMFF   |   | - QSVC Kernel Overl.|  | - Datasets Catalog   |
+--------------------+   +---------------------+  +----------------------+
```

---

## 3. Machine Learning Pipelines

### A. Classical Property Prediction (Delaney ESOL)
- **Dataset**: Delaney Aqueous Solubility (1,128 benchmark organic molecules).
- **Features**: 512-bit Morgan Fingerprints (Radius 2) concatenated with 6 physicochemical descriptors (Molecular Weight, Wildman-Crippen LogP, Topological Polar Surface Area, HBD, HBA, Rotatable Bonds).
- **Leakage Prevention**: Feature scaling (StandardScaler) fitted exclusively on training splits.
- **Models**:
  1. `RandomForestRegressor`
  2. `Ridge` (L2 regularization)
  3. `DummyRegressor` (mean baseline)
- **Metrics**: Held-out $R^2$, Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), alongside scatter and residual diagnostic coordinates.

### B. Genuine Quantum Kernel Classification (QSVC)
- **Framework**: PennyLane `default.qubit` state vector simulator.
- **Data Reduction**: Stratified molecular benchmark projected via PCA to $N$ qubits, scaled to $[0, \pi]$.
- **Quantum Feature Maps**:
  - `angle_embedding_cz`: Hadamard superposition, $R_Y(x_i)$, linear Controlled-Z ($CZ$) entanglement.
  - `zz_feature_map`: Hadamard, $R_Z(x_i)$, and pairwise $CNOT \cdot R_Z(2(\pi - x_i)(\pi - x_j)) \cdot CNOT$ interactions (IBM Havlíček architecture).
  - `iqp_embedding`: Diagonal polynomial phase interactions.
- **Quantum Fidelity Overlap**:
  $$K(x, x') = |\langle 0^{\otimes N} | U^\dagger(x') U(x) | 0^{\otimes N} \rangle|^2$$
  Evaluated through projective measurement on $|0\dots0\rangle$.
- **Classifier**: Scikit-Learn `SVC(kernel="precomputed", C=1.0)`.
- **Fair Baseline**: Evaluated against Classical RBF SVM and Classical Random Forest on the identical train/test split.

---

## 4. Multi-Tenant Security & Data Isolation
- **Authentication**: Salted PBKDF2-HMAC-SHA256 (600,000 iterations).
- **Session Handling**: Dual-mode support using HTTP-only `qmolai_session` cookies and `Authorization: Bearer <JWT>`.
- **Database Isolation**: Every query for saved molecules, experiment records, and custom datasets filters strictly on the authenticated `user_id`. Cross-user inspection is prohibited at the database query layer.
