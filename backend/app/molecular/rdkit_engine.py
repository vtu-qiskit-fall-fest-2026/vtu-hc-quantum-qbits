from typing import Optional, Dict, Any, Tuple, List
import json
from rdkit import Chem, rdBase
from rdkit.Chem import Descriptors, AllChem, Draw, rdMolDescriptors, rdFingerprintGenerator
from rdkit.Chem.Draw import rdMolDraw2D

# Suppress RDKit terminal deprecation chatter
rdBase.DisableLog('rdApp.warning')
rdBase.DisableLog('rdApp.info')

class MolecularEngine:
    """Scientific RDKit engine for molecular parsing, descriptor calculation, 
    2D SVG rendering, and 3D conformer optimization."""

    @staticmethod
    def parse_smiles(smiles: str) -> Optional[Chem.Mol]:
        if not smiles or not isinstance(smiles, str):
            return None
        cleaned_smiles = smiles.strip()
        mol = Chem.MolFromSmiles(cleaned_smiles)
        return mol

    @staticmethod
    def calculate_descriptors(smiles: str, include_3d: bool = True, include_svg: bool = True) -> Dict[str, Any]:
        mol = MolecularEngine.parse_smiles(smiles)
        if mol is None:
            raise ValueError(f"Invalid SMILES string: '{smiles}'. Please provide a valid chemical representation.")

        # Canonical SMILES
        canonical_smiles = Chem.MolToSmiles(mol, canonical=True)

        # Formula & Molecular Properties
        formula = rdMolDescriptors.CalcMolFormula(mol)
        mw = float(Descriptors.MolWt(mol))
        logp = float(Descriptors.MolLogP(mol))
        tpsa = float(Descriptors.TPSA(mol))
        hbd = int(Descriptors.NumHDonors(mol))
        hba = int(Descriptors.NumHAcceptors(mol))
        rotatable_bonds = int(Descriptors.NumRotatableBonds(mol))
        atom_count = int(mol.GetNumAtoms())
        heavy_atoms = int(mol.GetNumHeavyAtoms())
        ring_count = int(rdMolDescriptors.CalcNumRings(mol))
        formal_charge = int(Chem.GetFormalCharge(mol))
        fraction_csp3 = float(Descriptors.FractionCSP3(mol))

        # Generate 2D depiction SVG
        svg = MolecularEngine.generate_svg(mol) if include_svg else ""

        # Generate 3D conformer coordinates
        conformer_3d = MolecularEngine.generate_3d_conformer(mol) if include_3d else None

        # Fingerprint density
        fp = MolecularEngine.extract_fingerprint(smiles, n_bits=512, radius=2)
        on_bits = sum(fp) if fp else 0
        fp_density = round(on_bits / 512.0, 4)

        return {
            "smiles": smiles,
            "canonical_smiles": canonical_smiles,
            "formula": formula,
            "molecular_weight": round(mw, 3),
            "logp": round(logp, 3),
            "tpsa": round(tpsa, 2),
            "hbd": hbd,
            "hba": hba,
            "rotatable_bonds": rotatable_bonds,
            "atom_count": atom_count,
            "heavy_atom_count": heavy_atoms,
            "ring_count": ring_count,
            "formal_charge": formal_charge,
            "fraction_csp3": round(fraction_csp3, 3),
            "fingerprint_density": fp_density,
            "svg_depiction": svg,
            "conformer_3d": conformer_3d
        }

    @staticmethod
    def generate_svg(mol: Chem.Mol, width: int = 380, height: int = 300) -> str:
        """Render high-contrast, dark-mode-optimized SVG vector depiction."""
        try:
            drawer = rdMolDraw2D.MolDraw2DSVG(width, height)
            opts = drawer.drawOptions()
            opts.clearBackground = False  # Transparent background
            # Set sleek colors suitable for dark themes
            opts.bondLineWidth = 2
            opts.padding = 0.08
            
            # Prepare mol with coordinates for 2D depiction
            mol_copy = Chem.Mol(mol)
            AllChem.Compute2DCoords(mol_copy)
            drawer.DrawMolecule(mol_copy)
            drawer.FinishDrawing()
            svg = drawer.GetDrawingText()
            return svg
        except Exception as e:
            # Fallback simple drawer
            return f"<svg width='{width}' height='{height}'><text x='20' y='50' fill='#F2F6FC'>SVG generation fallback: {str(e)}</text></svg>"

    @staticmethod
    def generate_3d_conformer(mol: Chem.Mol) -> Optional[Dict[str, Any]]:
        """Generate 3D coordinates using Distance Geometry and MMFF/UFF force-field optimization."""
        try:
            # Add hydrogens for accurate 3D geometry
            mol_3d = Chem.AddHs(mol)
            params = AllChem.ETKDGv3()
            params.randomSeed = 42
            embed_result = AllChem.EmbedMolecule(mol_3d, params)
            
            if embed_result != 0:
                # Retry with random coordinates fallback
                embed_result = AllChem.EmbedMolecule(mol_3d, useRandomCoords=True, randomSeed=42)
                if embed_result != 0:
                    return None

            # Energy minimize with MMFF94 force field or UFF
            try:
                AllChem.MMFFOptimizeMolecule(mol_3d, maxIters=500)
            except Exception:
                AllChem.UFFOptimizeMolecule(mol_3d, maxIters=500)

            conf = mol_3d.GetConformer()
            atoms_list = []
            for i, atom in enumerate(mol_3d.GetAtoms()):
                pos = conf.GetAtomPosition(i)
                atoms_list.append({
                    "index": i,
                    "element": atom.GetSymbol(),
                    "atomic_num": atom.GetAtomicNum(),
                    "x": round(float(pos.x), 4),
                    "y": round(float(pos.y), 4),
                    "z": round(float(pos.z), 4),
                    "is_aromatic": atom.GetIsAromatic()
                })

            bonds_list = []
            for bond in mol_3d.GetBonds():
                bonds_list.append({
                    "source": int(bond.GetBeginAtomIdx()),
                    "target": int(bond.GetEndAtomIdx()),
                    "order": float(bond.GetBondTypeAsDouble()),
                    "is_aromatic": bond.GetIsAromatic()
                })

            return {
                "atoms": atoms_list,
                "bonds": bonds_list,
                "conformer_id": 0,
                "optimization_method": "ETKDGv3 + MMFF94",
                "energy_minimized": True
            }
        except Exception:
            return None

    @staticmethod
    def extract_fingerprint(smiles: str, n_bits: int = 1024, radius: int = 2) -> Optional[List[int]]:
        mol = MolecularEngine.parse_smiles(smiles)
        if mol is None:
            return None
        gen = rdFingerprintGenerator.GetMorganGenerator(radius=radius, fpSize=n_bits)
        fp = gen.GetFingerprint(mol)
        return list(fp)
