import json

notebook_path = r"D:\coding\Hackathons, Projects and other\ai ml project\CIFAKE Image Classification and Explainable Identification of AI-Generated Synthetic Images\CIFAKE.ipynb"

print("=" * 60)
print("READING NOTEBOOK OUTPUTS")
print("=" * 60)

try:
    with open(notebook_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
        
    for i in [27, 28, 29, 30, 31, 32]:
        if i < len(nb.get('cells', [])):
            cell = nb['cells'][i]
            print(f"Cell {i} ({cell['cell_type']}):")
            print("Source:")
            print("  ", "".join(cell.get('source', [])).strip())
            print("Outputs:")
            for out in cell.get('outputs', []):
                if 'text' in out:
                    print("  ", "".join(out['text']).strip())
                elif 'data' in out and 'text/plain' in out['data']:
                    print("  ", "".join(out['data']['text/plain']).strip())
            print("-" * 40)
                    
except Exception as e:
    print(f"ERROR: {e}")
