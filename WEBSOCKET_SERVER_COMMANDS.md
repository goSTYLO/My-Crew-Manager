# WebSocket Server Commands

This document provides comprehensive instructions for starting all the servers required for WebSocket functionality in the My Crew Manager application.

## 🚀 Quick Start

For a complete WebSocket-enabled setup, you need to run **3 servers** in the correct order:

1. **Redis Server** (Required for WebSocket channel layer)
2. **Django ASGI Server** (Backend with WebSocket support)
3. **React Development Server** (Frontend)

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Redis Server
- All dependencies installed (see main README.md)

## 🔧 Server Startup Commands

### 1. Redis Server (Required First)

**Purpose**: Provides the channel layer for Django Channels WebSocket functionality.

#### Windows (Using included Redis)
```bash
# Navigate to project root
cd C:\Users\Aaron\GitHub Repos\My-Crew-Manager

# Start Redis server
redis\redis-server.exe redis\redis.windows.conf
```

#### Windows (Using Redis Service)
```bash
# If Redis is installed as a service
net start redis
```

#### Linux/macOS
```bash
# Start Redis server
redis-server

# Or with custom config
redis-server /path/to/redis.conf
```

**Verification**: Redis should show output like:
```
[1234] 01 Jan 2024 12:00:00.000 * Ready to accept connections
```

---

### 2. Django ASGI Server (Backend)

**Purpose**: Runs the Django backend with WebSocket support via ASGI.

#### Localhost Access
```bash
# Navigate to backend directory
cd backend

# Start Django with ASGI (WebSocket support)
python -m daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

#### Network Access (Multi-device)
```bash
# Navigate to backend directory
cd backend

# Start Django with ASGI for network access
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Verification**: Server should show output like:
```
2024-01-01 12:00:00,000 INFO     Starting server at 127.0.0.1:8000
2024-01-01 12:00:00,000 INFO     HTTP/2 support not enabled (install the http2 and tls Twisted extras)
2024-01-01 12:00:00,000 INFO     Configuring endpoint tcp:port=8000:interface=127.0.0.1
2024-01-01 12:00:00,000 INFO     Listening on TCP address 127.0.0.1:8000
```

---

### 3. React Development Server (Frontend)

**Purpose**: Runs the React frontend with WebSocket client integration.

#### Localhost Access
```bash
# Navigate to web directory
cd web

# Start React development server
npm run dev
```

#### Network Access (Multi-device)
```bash
# Navigate to web directory
cd web

# Start React development server with network access
npm run dev -- --host 0.0.0.0
```

**Verification**: Server should show output like:
```
  VITE v4.4.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

---

## 🔄 Complete Startup Sequence

### Option 1: Manual Startup (Recommended for Development)

Open **3 separate terminal windows** and run these commands in order:

**Terminal 1 - Redis:**
```bash
cd C:\Users\Aaron\GitHub Repos\My-Crew-Manager
redis\redis-server.exe redis\redis.windows.conf
```

**Terminal 2 - Django Backend:**
```bash
cd C:\Users\Aaron\GitHub Repos\My-Crew-Manager\backend
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Terminal 3 - React Frontend:**
```bash
cd C:\Users\Aaron\GitHub Repos\My-Crew-Manager\web
npm run dev
```

### Option 2: Batch Script (Windows)

Create a `start_websocket_servers.bat` file in the project root:

```batch
@echo off
echo Starting My Crew Manager WebSocket Servers...

echo.
echo [1/3] Starting Redis Server...
start "Redis Server" cmd /k "cd /d %~dp0 && redis\redis-server.exe redis\redis.windows.conf"

timeout /t 3 /nobreak > nul

echo.
echo [2/3] Starting Django ASGI Server...
start "Django Backend" cmd /k "cd /d %~dp0\backend && python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application"

timeout /t 3 /nobreak > nul

echo.
echo [3/3] Starting React Frontend...
start "React Frontend" cmd /k "cd /d %~dp0\web && npm run dev"

echo.
echo All servers started! Check the opened windows for status.
echo.
echo Access URLs:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api/
echo - Django Admin: http://localhost:8000/admin/
echo.
pause
```

Run the batch file:
```bash
start_websocket_servers.bat
```

---

## 🌐 WebSocket Endpoints

Once all servers are running, the following WebSocket endpoints will be available:

### Chat WebSocket
- **URL**: `ws://localhost:8000/ws/chat/{room_id}/?token={drf_token}`
- **Purpose**: Real-time messaging for specific chat rooms
- **Authentication**: DRF Token in query string

### Notification WebSocket
- **URL**: `ws://localhost:8000/ws/chat/notifications/?token={drf_token}`
- **Purpose**: Global chat notifications and mentions
- **Authentication**: DRF Token in query string

### Project Updates WebSocket
- **URL**: `ws://localhost:8000/ws/project-updates/?token={drf_token}`
- **Purpose**: Real-time project collaboration and updates
- **Authentication**: DRF Token in query string

---

## 🔍 Verification Steps

### 1. Check Redis Connection
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

### 2. Check Django ASGI Server
```bash
# Test backend API
curl http://localhost:8000/api/user/
# Should return JSON response or authentication error
```

### 3. Check React Frontend
- Open browser to `http://localhost:5173`
- Check browser console for WebSocket connection logs
- Look for: `✅ WebSocket connected for room: X`

### 4. Test WebSocket Connection
```bash
# Test WebSocket connectivity (requires authentication token)
python tests/test_websocket_simple.py
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Redis Connection Failed
```
Error: Redis connection failed
```
**Solution**: Ensure Redis server is running first before starting Django.

#### 2. Django ASGI Import Error
```
ModuleNotFoundError: No module named 'daphne'
```
**Solution**: Install daphne:
```bash
pip install daphne
```

#### 3. WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:8000/ws/...' failed
```
**Solution**: 
- Ensure Django is running with ASGI (not regular runserver)
- Check that Redis is running
- Verify authentication token is valid

#### 4. Port Already in Use
```
Error: Port 8000 is already in use
```
**Solution**: Kill existing process or use different port:
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or use different port
python -m daphne -b 0.0.0.0 -p 8001 config.asgi:application
```

#### 5. React Dev Server Issues
```
Error: Port 5173 is already in use
```
**Solution**: React will automatically use next available port, or specify:
```bash
npm run dev -- --port 5174
```

---

## 📊 Server Status Monitoring

### Check All Servers Running
```bash
# Check Redis
redis-cli ping

# Check Django (should return 200 or 401)
curl -I http://localhost:8000/api/user/

# Check React (should return 200)
curl -I http://localhost:5173
```

### WebSocket Connection Test
```bash
# Run comprehensive WebSocket test
cd C:\Users\Aaron\GitHub Repos\My-Crew-Manager
python tests/test_websocket_interactive.py
```

---

## 🔧 Configuration Files

### Environment Variables
Ensure your `.env` file contains:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
DEVICE_IP=localhost
DJANGO_HOST=0.0.0.0
DJANGO_PORT=8000

# For network access, change to your device IP:
# VITE_API_BASE_URL=http://192.168.1.100:8000
# DEVICE_IP=192.168.1.100
```

### Django Settings
Ensure `backend/config/settings.py` has:
```python
ASGI_APPLICATION = 'config.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

---

## 🎯 Production Deployment

For production deployment, consider:

1. **Redis**: Use Redis Cluster or Redis Sentinel for high availability
2. **Django**: Use Gunicorn with Uvicorn workers for ASGI
3. **Frontend**: Build and serve static files with Nginx
4. **Load Balancer**: Use Nginx or HAProxy for WebSocket proxying

### Production ASGI Command
```bash
# Using Gunicorn with Uvicorn workers
gunicorn config.asgi:application -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📚 Additional Resources

- **Django Channels Documentation**: https://channels.readthedocs.io/
- **Daphne ASGI Server**: https://github.com/django/daphne
- **Redis Documentation**: https://redis.io/documentation
- **WebSocket Testing**: Use browser dev tools → Network tab → WS filter

---

**Note**: This setup is optimized for development. For production, consider using proper process managers like PM2, Supervisor, or Docker containers.
