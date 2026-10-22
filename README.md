# Q-MolAI

> **Discover Molecules. Explore Quantum Intelligence.**

A hybrid quantum-classical SaaS web application for molecular property prediction, exploratory cheminformatics, quantum machine learning (QML) benchmarking, and empirical model evaluation.

---

## Key Features

- **Single-Viewport Public Landing Page**: Minimal, cinematic desktop landing page featuring a real 3D WebGL force-field molecular scaffold, subtle quantum circuit motifs, and instant research entry.
- **Persistent Left Sidebar Dashboard Shell**: 10 functional research sections with responsive collapse, mobile drawer, active states, and breadcrumbs.
- **Molecular Explorer**:
  - Deterministic RDKit property calculation (Exact MW, Wildman-Crippen LogP, TPSA, H-Bond Donors/Acceptors, Rotatable Bonds, Rings, Fraction CSP3).
  - High-contrast 2D SVG vector topological depictions.
  - Interactive WebGL 3D Ball-and-Stick conformer viewer with CPK coloring and force-field energy minimization (ETKDGv3 + MMFF94).
  - Private collection persistence with notes and tags.
- **Classical Property Prediction**:
  - Delaney ESOL benchmark dataset (1,128 compounds).
  - 512-bit Morgan Fingerprints concatenated with physicochemical descriptors.
  - Strict data leakage prevention (scaler fitted only on training data).
  - `RandomForestRegressor`, `Ridge`, and `DummyRegressor` baselines.
  - Actual-versus-predicted and residual diagnostic plots.
  - Inference tool for arbitrary user-submitted SMILES strings.
- **Genuine Quantum Machine Learning (QML)**:
  - Powered by **PennyLane 0.45** running on a local quantum state vector simulator.
  - Dimensionality reduction via PCA with $[0, \pi]$ feature encoding.
  - Parametric feature maps: Angle Embedding with CZ, Havlíček ZZ Feature Map (IBM), and IQP Polynomial Embedding.
  - Pure quantum state overlap fidelity kernel: $K(x, x') = |\langle 0^{\otimes N} | U^\dagger(x') U(x) | 0^{\otimes N} \rangle|^2$.
  - Quantum Support Vector Classifier (QSVC) with fair classical baseline comparison on the identical split.
  - Real circuit diagram and gate sequence timeline extraction.
- **Model Comparison**:
  - Side-by-side metric tables and performance trade-off charts.
  - Dynamically generated scientific interpretation based on actual results.
  - Transparent accounting of quantum simulation overhead without false advantage claims.
- **Quantum Circuit Studio**:
  - Educational template library, custom register configuration, and live simulator verification.
- **Dataset Explorer**:
  - Built-in benchmarks (Delaney ESOL, Molecular Activity Binary) and custom CSV upload with schema validation, missing-value analysis, and distribution histograms.
- **Experiment History & Saved Molecules**:
  - Multi-tenant data isolation with PostgreSQL / SQLite persistence.
  - Filter by engine type, task, date, and export to CSV.
- **Settings & System Health**:
  - Configurable simulation ceilings, research defaults, and real-time dependency status.

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Three.js WebGL.
- **Backend**: FastAPI, Python 3.11/3.14, RDKit 2026.09, PennyLane 0.45, PennyLane-Lightning, Scikit-Learn, NumPy, Pandas, SQLAlchemy 2.0.
- **Persistence**: PostgreSQL 16 (production) / SQLite (zero-friction local development).
- **Authentication**: Salted PBKDF2-HMAC-SHA256, PyJWT, HTTP-only session cookies.

---

## Quick Start (Local Development)

### 1. Run Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation available at: `http://127.0.0.1:8000/docs`

### 2. Run Automated Backend Tests
```bash
cd backend
python -m pytest tests/test_backend.py -v
```
*(All 7 core tests verify health, RDKit, user data isolation, classical ML, and PennyLane quantum execution).*

### 3. Run Frontend Server
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Docker Compose Deployment

Run the complete multi-container system (PostgreSQL 16 + FastAPI + Next.js):
```bash
docker-compose up --build -d
```

---

## Scientific Rigor & Empirical Honesty

- **No False Quantum Advantage**: Q-MolAI transparently reports classical simulation overhead on classical CPUs. Quantum kernels project features into exponentially large Hilbert spaces, but empirical performance is rigorously benchmarked against classical RBF SVM and Random Forest baselines under identical splits.
- **Cheminformatics Accuracy**: RDKit calculations provide deterministic approximations of physical parameters; they do not constitute clinical or pharmacological claims of therapeutic efficacy.
