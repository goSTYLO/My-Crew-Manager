import json
from pathlib import Path

path = Path("TrainModel2_Backlog.ipynb")
nb = json.loads(path.read_text(encoding="utf-8"))

changed = 0
for cell in nb.get("cells", []):
    if cell.get("cell_type") != "code":
        continue
    src = cell.get("source", [])
    if not isinstance(src, list):
        continue
    text = "".join(src)
    if "QUICK_RUN_MODE =" in text and "SELECTED_PROPOSAL_ROWS" in text:
        new_text = text
        new_text = new_text.replace("QUICK_RUN_MODE = False", "QUICK_RUN_MODE = True")
        new_text = new_text.replace("SELECTED_PROPOSAL_ROWS = [6, 7, 8, 9, 10]", "SELECTED_PROPOSAL_ROWS = [6]")
        new_text = new_text.replace('if len(SELECTED_PROPOSAL_ROWS) != 5:', 'if len(SELECTED_PROPOSAL_ROWS) < 1:')
        new_text = new_text.replace('"SELECTED_PROPOSAL_ROWS must contain exactly 5 row numbers "', '"SELECTED_PROPOSAL_ROWS must contain at least 1 row number "')
        if new_text != text:
            cell["source"] = [line for line in new_text.splitlines(keepends=True)]
            changed += 1

if changed == 0:
    raise RuntimeError("No Step 6 cell updated")

path.write_text(json.dumps(nb, indent=4, ensure_ascii=False), encoding="utf-8")
print(f"Updated {changed} Step 6 cell(s) for fast mode.")
