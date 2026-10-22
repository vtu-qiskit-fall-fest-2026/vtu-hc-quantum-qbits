import os
import io
import pandas as pd
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, DatasetRecord
from app.auth.dependencies import get_current_user
from app.api.schemas import DatasetResponse
from app.core.config import settings
from app.molecular.rdkit_engine import MolecularEngine

router = APIRouter(prefix="/datasets", tags=["Datasets"])

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

def get_builtin_datasets() -> List[Dict[str, Any]]:
    return [
        {
            "id": "delaney_esol",
            "name": "Delaney ESOL (Aqueous Solubility)",
            "description": "Standard benchmark of 1,128 low-molecular-weight compounds with experimentally measured log aqueous solubility in mol/L.",
            "file_path": os.path.join(DATA_DIR, "delaney_esol.csv"),
            "row_count": 1128,
            "column_count": 10,
            "feature_columns": ["Molecular Weight", "Polar Surface Area", "Number of H-Bond Donors", "Number of Rings", "Number of Rotatable Bonds"],
            "target_column": "measured log solubility in mols per litre",
            "task_type": "regression",
            "is_public": True,
            "summary_statistics": {
                "mean_target": -3.05,
                "min_target": -11.6,
                "max_target": 1.58,
                "std_target": 2.09
            },
            "created_at": "2026-01-01T00:00:00"
        },
        {
            "id": "molecular_activity_binary",
            "name": "Molecular Solubility Activity (Binary Classification)",
            "description": "Balanced binary classification benchmark derived from Delaney ESOL (High Solubility: logS > -3.0 vs Low Solubility: logS <= -3.0).",
            "file_path": os.path.join(DATA_DIR, "molecular_activity_binary.csv"),
            "row_count": 1128,
            "column_count": 6,
            "feature_columns": ["Molecular Weight", "Polar Surface Area"],
            "target_column": "high_solubility_class",
            "task_type": "classification",
            "is_public": True,
            "summary_statistics": {
                "class_0_count": 546,
                "class_1_count": 582,
                "balance_ratio": 1.06
            },
            "created_at": "2026-01-01T00:00:00"
        }
    ]

@router.get("/")
def list_datasets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List built-in public datasets plus user's uploaded datasets."""
    builtins = get_builtin_datasets()
    user_datasets = db.query(DatasetRecord).filter(DatasetRecord.user_id == user.id).all()
    
    user_list = []
    for ud in user_datasets:
        user_list.append({
            "id": ud.id,
            "name": ud.name,
            "description": ud.description,
            "row_count": ud.row_count,
            "column_count": ud.column_count,
            "feature_columns": ud.feature_columns or [],
            "target_column": ud.target_column,
            "task_type": ud.task_type,
            "is_public": False,
            "summary_statistics": ud.summary_statistics or {},
            "created_at": ud.created_at.isoformat()
        })
        
    return builtins + user_list

@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Provide schema, head records, statistics, missing values, duplicates, and distributions."""
    file_path = None
    target_col = None
    
    if dataset_id == "delaney_esol":
        file_path = os.path.join(DATA_DIR, "delaney_esol.csv")
        target_col = "measured log solubility in mols per litre"
    elif dataset_id == "molecular_activity_binary":
        file_path = os.path.join(DATA_DIR, "molecular_activity_binary.csv")
        target_col = "high_solubility_class"
    else:
        ud = db.query(DatasetRecord).filter(
            DatasetRecord.id == dataset_id,
            DatasetRecord.user_id == user.id
        ).first()
        if not ud:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
        file_path = ud.file_path
        target_col = ud.target_column

    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset file missing on server.")

    df = pd.read_csv(file_path)
    
    # Missing values & duplicate detection
    missing_counts = df.isnull().sum().to_dict()
    duplicate_rows = int(df.duplicated().sum())
    
    # Preview rows
    preview_records = df.head(15).fillna("").to_dict(orient="records")
    columns_info = [{"name": col, "dtype": str(df[col].dtype)} for col in df.columns]
    
    # Summary statistics for numeric columns
    numeric_df = df.select_dtypes(include=["number"])
    stats_dict = {}
    distributions = []
    
    for col in numeric_df.columns[:5]:
        series = numeric_df[col].dropna()
        stats_dict[col] = {
            "mean": round(float(series.mean()), 3),
            "std": round(float(series.std()), 3),
            "min": round(float(series.min()), 3),
            "max": round(float(series.max()), 3),
            "median": round(float(series.median()), 3)
        }
        # Distribution histogram buckets
        counts, bin_edges = pd.cut(series, bins=8, retbins=True)
        freq = counts.value_counts(sort=False).tolist()
        bin_labels = [f"{round(bin_edges[i], 1)}" for i in range(len(bin_edges) - 1)]
        distributions.append({
            "column": col,
            "bins": bin_labels,
            "frequencies": freq
        })

    return {
        "dataset_id": dataset_id,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": columns_info,
        "missing_values": missing_counts,
        "duplicate_rows": duplicate_rows,
        "preview": preview_records,
        "statistics": stats_dict,
        "distributions": distributions,
        "target_column": target_col
    }

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    target_column: Optional[str] = Form(None),
    task_type: str = Form("regression"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload custom molecular or tabular CSV dataset with strict validation."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files are supported.")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds maximum limit of 10MB.")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Corrupt CSV file: {str(e)}")

    if len(df) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dataset must contain at least 5 rows.")

    # Save to user storage
    user_storage = os.path.join(settings.DATASET_DIR, user.id)
    os.makedirs(user_storage, exist_ok=True)
    saved_path = os.path.join(user_storage, f"{int(pd.Timestamp.now().timestamp())}_{file.filename}")
    
    with open(saved_path, "wb") as f:
        f.write(content)

    feature_cols = [c for c in df.columns if c != target_column]

    record = DatasetRecord(
        user_id=user.id,
        name=name,
        description=description or f"User uploaded dataset '{file.filename}'",
        file_path=saved_path,
        row_count=len(df),
        column_count=len(df.columns),
        feature_columns=feature_cols,
        target_column=target_column or (df.columns[-1] if len(df.columns) > 1 else None),
        task_type=task_type,
        is_public=False,
        summary_statistics={"rows": len(df), "cols": len(df.columns)}
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "name": record.name,
        "row_count": record.row_count,
        "column_count": record.column_count,
        "message": "Dataset successfully uploaded and validated."
    }
