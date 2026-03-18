# AI Microservice (FastAPI)

Stateless LLM service for overview and backlog generation. Called by backend-node.

## Run

With venv activated, use `python -m uvicorn` so the venv's Python (and its torch) is used:

```bash
.venv\Scripts\activate
cd AI
python -m uvicorn main:app --port 8002 --reload
```

## Windows + RTX 4050: Fix WinError 193 / cublas64_11.dll

The error means PyTorch was built for CUDA 11; your GPU (RTX 4050) needs **CUDA 12.8**. Reinstall:

```bash
pip uninstall torch -y
pip install torch --index-url https://download.pytorch.org/whl/cu128
```

Then restart the AI service.
