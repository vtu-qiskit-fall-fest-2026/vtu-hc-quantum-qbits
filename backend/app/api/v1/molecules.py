from typing import List, Optional
import io
import csv
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models import User, SavedMolecule
from app.auth.dependencies import get_current_user, get_current_user_optional
from app.api.schemas import (
    MoleculeInput, MoleculeDescriptors, MoleculeSaveRequest,
    SavedMoleculeResponse, MoleculeUpdateRequest
)
from app.molecular.rdkit_engine import MolecularEngine

router = APIRouter(prefix="/molecules", tags=["Molecules"])

@router.post("/descriptors", response_model=MoleculeDescriptors)
def compute_descriptors(input_data: MoleculeInput):
    """Compute verified scientific descriptors, 2D SVG depiction, and 3D conformer using RDKit."""
    try:
        results = MolecularEngine.calculate_descriptors(input_data.smiles)
        return results
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Descriptor computation failed: {str(e)}"
        )

@router.post("/save", response_model=SavedMoleculeResponse)
def save_molecule(
    req: MoleculeSaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a molecule to user's private library."""
    try:
        desc = MolecularEngine.calculate_descriptors(req.smiles)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    saved = SavedMolecule(
        user_id=user.id,
        smiles=desc["canonical_smiles"],
        name=req.name or f"Mol-{desc['formula']}",
        formula=desc["formula"],
        molecular_weight=desc["molecular_weight"],
        logp=desc["logp"],
        tpsa=desc["tpsa"],
        hbd=desc["hbd"],
        hba=desc["hba"],
        rotatable_bonds=desc["rotatable_bonds"],
        notes=req.notes or "",
        tags=req.tags or [],
        svg_depiction=desc["svg_depiction"],
        conformer_3d_json=desc["conformer_3d"]
    )
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved

@router.get("/saved", response_model=List[SavedMoleculeResponse])
def get_saved_molecules(
    query: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|molecular_weight|logp|tpsa)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List saved molecules for the authenticated user only (strictly isolated)."""
    q = db.query(SavedMolecule).filter(SavedMolecule.user_id == user.id)
    
    if query:
        search_filter = f"%{query}%"
        q = q.filter(
            (SavedMolecule.name.ilike(search_filter)) |
            (SavedMolecule.smiles.ilike(search_filter)) |
            (SavedMolecule.formula.ilike(search_filter)) |
            (SavedMolecule.notes.ilike(search_filter))
        )
        
    sort_column = getattr(SavedMolecule, sort_by)
    if order == "desc":
        q = q.order_by(sort_column.desc())
    else:
        q = q.order_by(sort_column.asc())
        
    return q.all()

@router.get("/saved/{molecule_id}", response_model=SavedMoleculeResponse)
def get_saved_molecule(
    molecule_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mol = db.query(SavedMolecule).filter(
        SavedMolecule.id == molecule_id,
        SavedMolecule.user_id == user.id
    ).first()
    if not mol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Molecule not found.")
    return mol

@router.put("/saved/{molecule_id}", response_model=SavedMoleculeResponse)
def update_saved_molecule(
    molecule_id: str,
    req: MoleculeUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mol = db.query(SavedMolecule).filter(
        SavedMolecule.id == molecule_id,
        SavedMolecule.user_id == user.id
    ).first()
    if not mol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Molecule not found.")
        
    if req.name is not None:
        mol.name = req.name
    if req.notes is not None:
        mol.notes = req.notes
    if req.tags is not None:
        mol.tags = req.tags
        
    db.commit()
    db.refresh(mol)
    return mol

@router.delete("/saved/{molecule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_molecule(
    molecule_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mol = db.query(SavedMolecule).filter(
        SavedMolecule.id == molecule_id,
        SavedMolecule.user_id == user.id
    ).first()
    if not mol:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Molecule not found.")
        
    db.delete(mol)
    db.commit()
    return None

@router.get("/export")
def export_saved_molecules(
    format: str = Query("csv", regex="^(csv|json)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    molecules = db.query(SavedMolecule).filter(SavedMolecule.user_id == user.id).all()
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Name", "SMILES", "Formula", "MolWeight", "LogP", "TPSA", "HBD", "HBA", "RotatableBonds", "Notes", "CreatedAt"])
        for m in molecules:
            writer.writerow([
                m.id, m.name, m.smiles, m.formula, m.molecular_weight,
                m.logp, m.tpsa, m.hbd, m.hba, m.rotatable_bonds, m.notes, m.created_at.isoformat()
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=qmolai_saved_molecules.csv"}
        )
    else:
        data = [{
            "id": m.id,
            "name": m.name,
            "smiles": m.smiles,
            "formula": m.formula,
            "molecular_weight": m.molecular_weight,
            "logp": m.logp,
            "tpsa": m.tpsa,
            "hbd": m.hbd,
            "hba": m.hba,
            "rotatable_bonds": m.rotatable_bonds,
            "notes": m.notes,
            "created_at": m.created_at.isoformat()
        } for m in molecules]
        return data
