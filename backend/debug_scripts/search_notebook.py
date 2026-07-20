import json

notebook_path = r"D:\coding\Hackathons, Projects and other\ai ml project\CIFAKE Image Classification and Explainable Identification of AI-Generated Synthetic Images\CIFAKE.ipynb"

print("=" * 60)
print("SEARCHING NOTEBOOK")
print("=" * 60)

try:
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    for i, cell in enumerate(nb.get('cells', [])):
        source = "".join(cell.get('source', []))
        if 'testImages' in source or 'labels' in source or 'predict' in source:
            print(f"Cell {i} ({cell['cell_type']}):")
            lines = source.split('\n')
            for line in lines:
                if any(x in line for x in ['testImages', 'labels', 'predict', 'class_names']):
                    print("  ", line.strip())
                    
except Exception as e:
    print(f"ERROR: {e}")
