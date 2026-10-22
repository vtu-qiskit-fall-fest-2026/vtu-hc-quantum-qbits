# Quantum Qbits
**VTU-QFF-HC-0083  |  Tier: Online**

| | |
|---|---|
| **Team** | Quantum Qbits |
| **Team ID** | VTU-QFF-HC-0083 |
| **Tier** | Online |
| **Repository** | `vtu-hc-quantum-qbits` |
| **Organisation** | `vtu-qiskit-fall-fest-2026` |
| **Event** | VTU-QFF Hackathon — VTU-Qiskit Fall Fest 2026 |
| **Project** | **Q-MolAI** — *Discover Molecules. Explore Quantum Intelligence.* |

## 📌 Table of Contents
- [Team Members](#-team-members-github-ids)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Approach & Architecture](#-approach--architecture)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [How to Run](#-how-to-run)
- [How to Push Code](#-how-to-push-code)
- [Scientific Rigor & Empirical Honesty](#-scientific-rigor--empirical-honesty)
- [Submission Checklist](#-submission-checklist)
- [Resources](#-resources)
- [License](#-license)

---

## 👥 Team Members (GitHub IDs)

> Members are added to this repository as collaborators and must accept the GitHub invitation before they can push. Add your GitHub username below.

| # | Name | GitHub Username | Role |
|---|------|-----------------|------|
| 1 | Pallavi Pathak | [@pallavipthk](https://github.com/pallavipthk) | Team Lead |
| 2 | Srushti Palav | [@srushti0878](https://github.com/srushti0878) | Developer |

---

## ❓ Problem Statement

**Problem:** Molecular property prediction is central to drug discovery and materials research, but researchers have no single, honest environment to compare classical machine learning against quantum machine learning (QML) on the same molecular data. Existing tools either skip rigorous benchmarking or make unsupported "quantum advantage" claims.

**Why it matters:** Quantum kernels map features into exponentially large Hilbert spaces, which is promising for chemistry. Whether they actually help is an empirical question that needs fair, leakage-free, reproducible comparison on identical data splits.

**Track / Category:** Online · Quantum Machine Learning for Cheminformatics

---

## 💡 Proposed Solution

**Solution:** Q-MolAI is a hybrid quantum-classical SaaS web application. Users explore molecules (SMILES → properties, 2D and 3D views), train classical baselines, and run quantum kernel models, then compare everything side by side under identical splits.

**Key idea:** A pure-state fidelity quantum kernel `K(x, x') = |⟨0ⁿ| U†(x') U(x) |0ⁿ⟩|²` fed into a Quantum SVC, benchmarked against classical RBF SVM and Random Forest baselines.

**Why this works:** Every result comes from real computation: deterministic RDKit descriptors, real quantum circuits executed on a state-vector simulator, strict train/test separation, and dynamically generated interpretations. The app reports quantum simulation overhead openly and never claims advantage the data doesn't show.

---

## 🧩 Approach & Architecture

```
Input → Preprocessing → (Quantum: PCA → Feature Map → Fidelity Kernel → QSVC | Classical: RF / Ridge / RBF SVM) → Model Comparison
```

- **Input** — SMILES strings, built-in benchmarks (Delaney ESOL, Molecular Activity Binary), or custom CSV upload with schema validation
- **Preprocessing** — RDKit descriptors, 512-bit Morgan fingerprints, scaler fitted on training data only
- **Quantum core** — PCA-reduced features encoded into parametric circuits: Angle Embedding with CZ, Havlíček ZZ Feature Map, IQP Polynomial Embedding
- **Post-processing** — Fidelity kernel matrix, QSVC training, metrics, residual and actual-vs-predicted plots
- **Output** — Metric tables, trade-off charts, circuit diagrams, and generated scientific interpretation

---

## ✨ Key Features

- **Single-viewport landing page** with a 3D WebGL force-field molecular scaffold and quantum circuit motifs.
- **Persistent sidebar dashboard** with 10 research sections, responsive collapse, mobile drawer, and breadcrumbs.
- **Molecular Explorer**
  - Deterministic RDKit properties: exact MW, Wildman-Crippen LogP, TPSA, HBD/HBA, rotatable bonds, rings, Fraction CSP3
  - 2D SVG depictions and interactive 3D ball-and-stick viewer (ETKDGv3 + MMFF94 minimization)
  - Private collections with notes and tags
- **Classical Property Prediction**
  - Delaney ESOL dataset (1,128 compounds), Morgan fingerprints + descriptors
  - `RandomForestRegressor`, `Ridge`, `DummyRegressor` baselines
  - Diagnostic plots and inference on arbitrary SMILES
- **Quantum Machine Learning**
  - PennyLane 0.45 on a local state-vector simulator
  - Three feature maps, fidelity kernel, QSVC vs. classical baseline on the identical split
  - Real circuit diagram and gate-sequence timeline
- **Model Comparison** — side-by-side metrics, trade-off charts, dynamic interpretation, transparent overhead accounting
- **Quantum Circuit Studio** — template library, custom registers, live simulator verification
- **Dataset Explorer** — built-in benchmarks, CSV upload, missing-value analysis, histograms
- **Experiment History & Saved Molecules** — multi-tenant isolation, filtering, CSV export
- **Settings & System Health** — simulation ceilings, research defaults, dependency status

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.11+ (backend), TypeScript (frontend) |
| Quantum SDK | PennyLane 0.45, PennyLane-Lightning (state-vector simulation); Havlíček ZZ map follows the IBM/Qiskit formulation |
| Cheminformatics | RDKit 2026.09 |
| Classical ML | Scikit-Learn, NumPy, Pandas |
| Backend | FastAPI, SQLAlchemy 2.0 |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Recharts, Three.js, Lucide Icons |
| Persistence | PostgreSQL 16 (production) / SQLite (local) |
| Authentication | PBKDF2-HMAC-SHA256, PyJWT, HTTP-only session cookies |
| Deployment | Docker Compose |
| Version control | Git + GitHub |

---

## 📁 Project Structure

```
vtu-hc-quantum-qbits/
├── README.md              # This file
├── docker-compose.yml     # PostgreSQL + FastAPI + Next.js
├── .gitignore
├── backend/
│   ├── app/
│   │   └── main.py        # FastAPI entry point
│   ├── tests/
│   │   └── test_backend.py
│   └── requirements.txt   # Python dependencies
├── frontend/              # Next.js application
│   └── package.json
├── data/                  # Datasets (use Git LFS for large files)
└── docs/                  # Notes, diagrams, reports
```

> Adjust folder names to match your actual repository layout.

---

## 🚀 How to Run

### Prerequisites
- Python 3.11 or newer
- Node.js (for the frontend)
- Git
- A GitHub account (you need collaborator access to this repo)

### 1. Clone the repository
```bash
git clone https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-qbits.git
cd vtu-hc-quantum-qbits
```

### 2. Create a virtual environment and install backend dependencies
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows (PowerShell)
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Run the backend
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs: `http://127.0.0.1:8000/docs`

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

### 5. Run the tests
```bash
cd backend
python -m pytest tests/test_backend.py -v
```
All 7 core tests verify health, RDKit, user data isolation, classical ML, and PennyLane quantum execution.

### Alternative: Docker Compose
```bash
docker-compose up --build -d
```

---

## 🔁 How to Push Code

> Full walkthrough: **[Git & Collaboration Handbook](#)** — collaboration workflow, branches, pull requests, reviews and conflict resolution.

### Configure Git (first time only)
```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### Everyday workflow
```bash
# 1. Get the latest changes
git checkout main
git pull origin main

# 2. Create a branch for your work
git checkout -b feature/my-task

# 3. Commit your work
git add .
git commit -m "feat: add ZZ feature map kernel for QSVC"

# 4. Push the branch
git push -u origin feature/my-task

# 5. Open a Pull Request on GitHub and request a review
#    https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-quantum-qbits/compare/main...feature/my-task

# 6. After approval, merge into main
git checkout main
git pull origin main
git branch -d feature/my-task
```

### Commit message convention

| Prefix | Meaning |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code restructure, no behaviour change |
| `chore:` | Build/config/dependency changes |

### Useful commands
```bash
git status              # what changed
git log --oneline -10   # recent commits
git diff                # review changes before committing
git stash               # shelve changes temporarily
git pull --rebase       # update your branch on top of main
```

### Collaborating on the same repo
- Never push directly to `main`; open a Pull Request.
- Pull before you push to avoid rejected commits.
- Commit often with clear messages.
- Resolve conflicts locally: `git pull --rebase`, fix the files, then `git add` + `git rebase --continue`.
- Ask for a review before merging.

---

## 🔬 Scientific Rigor & Empirical Honesty

- **No false quantum advantage:** Q-MolAI transparently reports classical simulation overhead. Quantum kernel performance is benchmarked against classical RBF SVM and Random Forest baselines under identical splits.
- **Leakage prevention:** Scalers are fitted on training data only.
- **Cheminformatics accuracy:** RDKit values are deterministic approximations of physical parameters. They are not clinical or pharmacological claims of therapeutic efficacy.

---

## ✅ Submission Checklist

- [ ] Repository created and **public**
- [ ] All team members added as collaborators and invitations accepted
- [ ] `README.md` updated with project details, problem statement and solution
- [ ] Team members listed under **Team Members**
- [ ] `requirements.txt` committed and project runs from a clean clone
- [ ] Code pushed to `main` and the latest `main` builds successfully
- [ ] Notebooks committed with cleared outputs (or use `nbstrip`)
- [ ] README includes a demo screenshot / video link
- [ ] Short project summary submitted on the hackathon portal

---

## 📚 Resources

| Resource | Link |
|----------|------|
| 🔁 Git & collaboration handbook | Git & Collaboration Handbook |
| ❓ Problem statements, solutions & terms | Problem Statements, Solutions & Terms |
| 📄 README writing guide | README Guide & Template |
| ⚛️ Qiskit documentation | https://docs.quantum.ibm.com/ |
| ⚛️ Qiskit Runtime & primitives | https://quantum.cloud.ibm.com/docs/ |
| 🧪 Qiskit Aer simulator | https://docs.quantum.ibm.com/guides/simulator |
| 💻 IBM Quantum Platform | https://quantum.cloud.ibm.com/ |
| 🎓 Qiskit textbook | https://qiskit.qotlabs.org/learning/ |
| ⚛️ PennyLane documentation | https://pennylane.ai/ |
| 🧬 RDKit documentation | https://www.rdkit.org/docs/ |
| 📋 GitHub Docs | https://docs.github.com/ |

---

## 📄 License

Released under the MIT License. See `LICENSE` for details.

---

<p align="center">
  <b>Quantum Qbits</b> · Team ID <code>VTU-QFF-HC-0083</code> · Tier <code>Online</code> · Built with ⚛️ for the VTU-QFF Hackathon
</p>

<p align="right"><a href="#quantum-qbits">⬆ Back to Top</a></p>
