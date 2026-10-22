import os
import time
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, Optional, List
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.dummy import DummyRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from app.molecular.rdkit_engine import MolecularEngine

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "delaney_esol.csv")

class ClassicalMLService:
    """Rigorous Classical Molecular Property Prediction Service."""
    
    # In-memory registry of trained models
    _trained_models: Dict[str, Dict[str, Any]] = {}
    _cached_X: Optional[np.ndarray] = None
    _cached_y: Optional[np.ndarray] = None
    _cached_smiles: Optional[List[str]] = None

    @classmethod
    def load_delaney_data(cls) -> pd.DataFrame:
        if not os.path.exists(DATASET_PATH):
            raise FileNotFoundError(f"Delaney dataset not found at {DATASET_PATH}")
        df = pd.read_csv(DATASET_PATH)
        return df

    @classmethod
    def extract_features_and_target(cls, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        if cls._cached_X is not None and len(cls._cached_X) > 0:
            return cls._cached_X, cls._cached_y, cls._cached_smiles

        features = []
        valid_indices = []
        
        # We compute Morgan fingerprints (512-bit) + 6 normalized physicochemical descriptors
        for idx, row in df.iterrows():
            smiles = row['smiles']
            mol = MolecularEngine.parse_smiles(smiles)
            if mol is None:
                continue
            
            fp = MolecularEngine.extract_fingerprint(smiles, n_bits=512, radius=2)
            if fp is None:
                continue
                
            # Compute essential descriptors (fast 2D only, no 3D conformer optimization needed for vectorization)
            try:
                desc = MolecularEngine.calculate_descriptors(smiles, include_3d=False, include_svg=False)
                physchem = [
                    desc['molecular_weight'] / 500.0,
                    desc['logp'] / 5.0,
                    desc['tpsa'] / 150.0,
                    desc['hbd'] / 5.0,
                    desc['hba'] / 10.0,
                    desc['rotatable_bonds'] / 10.0
                ]
                feature_vec = fp + physchem
                features.append(feature_vec)
                valid_indices.append(idx)
            except Exception:
                continue

        cls._cached_X = np.array(features, dtype=np.float32)
        target_col = 'measured log solubility in mols per litre'
        cls._cached_y = df.loc[valid_indices, target_col].values.astype(np.float32)
        cls._cached_smiles = df.loc[valid_indices, 'smiles'].tolist()
        
        return cls._cached_X, cls._cached_y, cls._cached_smiles

    @classmethod
    def train_model(
        cls,
        model_type: str = "random_forest",
        test_size: float = 0.2,
        random_state: int = 42,
        n_estimators: int = 100,
        max_depth: Optional[int] = 12,
        alpha: float = 1.0
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        df = cls.load_delaney_data()
        X, y, smiles_list = cls.extract_features_and_target(df)
        
        # Strictly reproducible train/test split
        X_train, X_test, y_train, y_test, smiles_train, smiles_test = train_test_split(
            X, y, smiles_list, test_size=test_size, random_state=random_state
        )
        
        # Data leakage prevention: Fit scaler ONLY on training data
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Model selection
        if model_type == "random_forest":
            model = RandomForestRegressor(
                n_estimators=n_estimators,
                max_depth=max_depth,
                random_state=random_state,
                n_jobs=-1
            )
        elif model_type == "ridge":
            model = Ridge(alpha=alpha, random_state=random_state)
        elif model_type == "dummy":
            model = DummyRegressor(strategy="mean")
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
            
        model.fit(X_train_scaled, y_train)
        
        # Held-out test set prediction
        y_pred = model.predict(X_test_scaled)
        
        # Strict test metrics calculation
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        
        duration = round(time.time() - start_time, 3)
        
        # Prepare actual vs predicted scatter data (sample up to 100 for clean visualization)
        plot_points = []
        residuals = []
        for actual, pred, sm in zip(y_test[:100], y_pred[:100], smiles_test[:100]):
            res = float(pred - actual)
            plot_points.append({
                "actual": round(float(actual), 3),
                "predicted": round(float(pred), 3),
                "smiles": sm
            })
            residuals.append({
                "predicted": round(float(pred), 3),
                "residual": round(res, 3),
                "smiles": sm
            })
            
        model_id = f"{model_type}_{random_state}_{int(test_size*100)}"
        cls._trained_models[model_id] = {
            "model": model,
            "scaler": scaler,
            "model_type": model_type,
            "random_state": random_state,
            "test_size": test_size,
            "metrics": {
                "r2": round(r2, 4),
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "training_time_seconds": duration,
                "n_train_samples": len(X_train),
                "n_test_samples": len(X_test)
            }
        }
        
        return {
            "model_id": model_id,
            "model_type": model_type,
            "dataset_name": "Delaney ESOL (Aqueous Solubility)",
            "target_unit": "log(mols/L)",
            "metrics": {
                "r2": round(r2, 4),
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "training_time_seconds": duration,
                "n_train_samples": len(X_train),
                "n_test_samples": len(X_test)
            },
            "actual_vs_predicted": plot_points,
            "residuals": residuals,
            "hyperparameters": {
                "n_estimators": n_estimators if model_type == "random_forest" else None,
                "max_depth": max_depth if model_type == "random_forest" else None,
                "alpha": alpha if model_type == "ridge" else None,
                "test_size": test_size,
                "random_state": random_state
            }
        }

    @classmethod
    def predict_smiles(cls, smiles: str, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Predict solubility for an unseen user-supplied SMILES."""
        mol = MolecularEngine.parse_smiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES string: '{smiles}'")
            
        if not cls._trained_models:
            # If no model cached, train a default Random Forest
            cls.train_model("random_forest")
            
        active_id = model_id if model_id in cls._trained_models else next(iter(cls._trained_models))
        cached = cls._trained_models[active_id]
        model = cached["model"]
        scaler = cached["scaler"]
        
        fp = MolecularEngine.extract_fingerprint(smiles, n_bits=512, radius=2)
        desc = MolecularEngine.calculate_descriptors(smiles)
        physchem = [
            desc['molecular_weight'] / 500.0,
            desc['logp'] / 5.0,
            desc['tpsa'] / 150.0,
            desc['hbd'] / 5.0,
            desc['hba'] / 10.0,
            desc['rotatable_bonds'] / 10.0
        ]
        
        X_input = np.array([fp + physchem], dtype=np.float32)
        X_scaled = scaler.transform(X_input)
        pred_val = float(model.predict(X_scaled)[0])
        
        # Scientific interpretation
        # logS > -1: highly soluble, -1 to -3: soluble, -3 to -5: moderately soluble, < -5: poorly soluble
        if pred_val >= -1.0:
            interp = "Highly Soluble (logS >= -1.0)"
        elif pred_val >= -3.0:
            interp = "Soluble (-3.0 <= logS < -1.0)"
        elif pred_val >= -5.0:
            interp = "Moderately Soluble (-5.0 <= logS < -3.0)"
        else:
            interp = "Poorly Soluble / Hydrophobic (logS < -5.0)"
            
        return {
            "smiles": smiles,
            "predicted_solubility_logS": round(pred_val, 3),
            "interpretation": interp,
            "model_used": cached["model_type"],
            "model_id": active_id
        }
