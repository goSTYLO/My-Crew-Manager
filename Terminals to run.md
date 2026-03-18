# Terminals to Run

## Quick reference for current setup (MERN + FastAPI + Mobile)

### 1. MongoDB

```bash
mongod
```

Port: **27017** — Always required.

---

### 2. backend-node (REST API + WebSocket)

```bash
cd backend-node && npm run dev
```

Port: **8001** — Main API for web and mobile.

---

### 3. FastAPI AI service (optional)

```bash
.venv\Scripts\activate
cd AI && python -m uvicorn main:app --port 8002 --reload
```

Port: **8002** — Only needed for AI (overview/backlog generation). First request loads the model (~60s).

---

### 4. Web app

```bash
cd web && npm run dev
```

Port: **5173** — React frontend.

---

### 5. Mobile app (Flutter)

```bash
cd mobile/mycrewmanager && flutter run
```

Uses `http://10.0.2.2:8001/api/` (Android emulator → localhost:8001).

---

## Order to start (minimum for web)

1. `mongod`
2. `cd backend-node && npm run dev`
3. `cd web && npm run dev`

## With AI generation

Add terminal 3: activate venv, then `cd AI && python -m uvicorn main:app --port 8002 --reload`

## With mobile

Ensure backend-node is running, then `cd mobile/mycrewmanager && flutter run`.