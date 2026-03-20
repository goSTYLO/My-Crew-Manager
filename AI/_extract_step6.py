import json
from pathlib import Path

nb = json.loads(Path("AI/TrainModel2_Backlog.ipynb").read_text(encoding="utf-8"))
Path("AI/_step6_cell.txt").write_text("".join(nb["cells"][20]["source"]), encoding="utf-8")
print("done", len(nb["cells"][20]["source"]))
