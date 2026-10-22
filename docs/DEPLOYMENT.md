# Q-MolAI Deployment Guide

## 1. Local Development (Zero-Friction Mode)

Both the backend and frontend run locally without requiring any external paid cloud services or API keys.

### Prerequisites
- Python 3.11+ (Python 3.14 fully supported with verified cp314 wheels)
- Node.js 18+ and npm

### Backend Setup
1. Navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Run automated test suite:
   ```bash
   pytest tests/test_backend.py -v
   ```

### Frontend Setup
1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Access application at: `http://localhost:3000`

---

## 2. Docker Compose Production Deployment

The project includes multi-stage container definitions and a production `docker-compose.yml` with PostgreSQL 16.

### Run Containers:
```bash
docker-compose up --build -d
```

### Services Started:
- **db**: PostgreSQL 16 on port `5432` with persistent Docker volume `postgres_data`
- **backend**: FastAPI on port `8000` connected to PostgreSQL with volume `backend_storage`
- **frontend**: Next.js production build on port `3000`

---

## 3. Database Migration with Alembic

When altering schemas, run:
```bash
cd backend
alembic revision --autogenerate -m "schema update"
alembic upgrade head
```

---

## 4. Security & Production Checklist
- Replace `SECRET_KEY` in `.env` with a 256-bit entropy string (`openssl rand -hex 32`).
- Enable `secure=True` on cookies when terminating SSL/TLS behind reverse proxies (Nginx / Caddy / Cloudflare).
- Set `BACKEND_CORS_ORIGINS` to the exact production domain(s).
