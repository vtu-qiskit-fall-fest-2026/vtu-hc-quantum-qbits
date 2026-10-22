import sys
print("Python:", sys.version)

try:
    import rdkit
    from rdkit import Chem
    from rdkit.Chem import Descriptors, AllChem, Draw
    print("RDKit successfully loaded, version:", rdkit.__version__)
except Exception as e:
    print("RDKit error:", e)

try:
    import pennylane as qml
    print("PennyLane successfully loaded, version:", qml.__version__)
    dev = qml.device("default.qubit", wires=2)
    @qml.qnode(dev)
    def test_circuit(x):
        qml.RX(x, wires=0)
        qml.CNOT(wires=[0, 1])
        return qml.expval(qml.PauliZ(1))
    res = test_circuit(0.5)
    print("Quantum circuit test output:", float(res))
except Exception as e:
    print("PennyLane error:", e)
