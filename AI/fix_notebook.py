import json
from pathlib import Path

# Read the notebook
nb_path = Path("TrainModel2_Backlog.ipynb")
with open(nb_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Read the clean code
clean_code_path = Path("step6_hardened_clean.py")
with open(clean_code_path, 'r', encoding='utf-8') as f:
    clean_code_lines = f.readlines()

# Find and replace the Step 6 cell - it's the 21st cell
target_cell_index = 20  # 0-based indexing
target_cell = nb['cells'][target_cell_index]
target_cell['source'] = clean_code_lines
print(f"✓ Updated cell 21 (id={target_cell.get('id')}) with {len(clean_code_lines)} lines")

# Write back
with open(nb_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2, ensure_ascii=False)
print(f"✓ Notebook saved: {nb_path}")
