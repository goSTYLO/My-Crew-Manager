# Django Server Commands

## ⚠️ Important: WebSocket Support Required

**For WebSocket functionality (notifications, chat), you MUST use daphne (ASGI server):**

### WebSocket-Enabled Server (Recommended)
```bash
# Install daphne first (if not already installed)
pip install daphne

# Navigate to backend directory
cd backend

# Start with WebSocket support
# PowerShell:
$env:DJANGO_SETTINGS_MODULE="config.settings"
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# Or in one line (PowerShell):
$env:DJANGO_SETTINGS_MODULE="config.settings"; daphne -b 0.0.0.0 -p 8000 config.asgi:application
```
Access at: http://YOUR_DEVICE_IP:8000/admin/

### Legacy Server (WSGI - No WebSocket Support)
```bash
# Local development (localhost only)
python manage.py runserver

# Network access (all devices on network)
python manage.py runserver 0.0.0.0:8000
```
**Note:** This will NOT support WebSocket connections for notifications/chat.

## Quick Start with Environment Variables
1. Update `.env` in project root with your device IP
2. Run: `cd backend && $env:DJANGO_SETTINGS_MODULE="config.settings"; daphne -b 0.0.0.0 -p 8000 config.asgi:application` (for WebSocket support)
3. Run: `python scripts/sync_mobile_config.py` (to update mobile)
4. All components now use the same IP

## Prerequisites for WebSocket Support
- Redis server must be running: `redis-server` (or `.\redis-server.exe` on Windows)
- daphne must be installed: `pip install daphne`

## WebSocket Reimplementation Changes (2025-10-26)

### Import Path Fixes (Latest Session - 2025-10-26)

Fixed all `backend.*` import references to use relative paths when running from the backend directory:

**Configuration Files:**
- `backend/config/settings.py`: Fixed ROOT_URLCONF, WSGI_APPLICATION, ASGI_APPLICATION
- `backend/config/wsgi.py`: Fixed DJANGO_SETTINGS_MODULE
- `backend/manage.py`: Fixed DJANGO_SETTINGS_MODULE

**App Configuration:**
- `backend/apps/users/apps.py`: Changed name from 'backend.apps.users' to 'apps.users'
- `backend/apps/chat/apps.py`: Changed name from 'backend.apps.chat' to 'apps.chat'
- `backend/apps/ai_api/apps.py`: Changed name and fixed import in ready() method

**Service Layer:**
- `backend/core/services/broadcast_service.py`: Fixed all model and serializer imports
- `backend/core/services/notification_service.py`: Fixed model imports

**LLM Layer:**
- `backend/llms/backlog_llm.py`: Fixed task, model, and cache imports
- `backend/llms/project_llm.py`: Fixed model, task, and cache imports

**Views and Tests:**
- `backend/apps/ai_api/views.py`: Fixed all LLM and service imports
- `backend/apps/ai_api/tests.py`: Fixed service import paths

**Total Changes:** 34 import path fixes across 13 files

### Problem Solved
The WebSocket connection was failing because:
1. Django's `runserver` uses WSGI, which doesn't support WebSockets
2. No ASGI server (daphne) was installed
3. **NEW:** `backend.*` import errors were causing server crashes
3. WebSocket URL was hardcoded to `localhost` instead of using centralized config
4. Django app configurations used absolute paths that didn't work when running from backend directory

### Files Modified During Reimplementation

#### 1. Backend Dependencies
**File:** `backend/requirements.txt`
```diff
+ daphne>=4.0.0
```

#### 2. WebSocket URL Configuration
**File:** `web/src/contexts/WebSocketContext.tsx`
```diff
+ import { API_BASE_URL } from '../config/api';
- const wsUrl = `ws://localhost:8000/ws/notifications/`;
+ const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/notifications/`;
```

#### 3. ASGI Configuration
**File:** `backend/config/asgi.py`
- Fixed import order to initialize Django before importing custom modules
- Changed imports from `backend.apps.*` to `apps.*` for relative paths
- Updated settings module path to `config.settings`

#### 4. Django Settings
**File:** `backend/config/settings.py`
```diff
- 'backend.apps.users.apps.UsersConfig',
- 'backend.apps.chat.apps.ChatConfig',
- 'backend.apps.ai_api.apps.AiApiConfig',
+ 'apps.users.apps.UsersConfig',
+ 'apps.chat.apps.ChatConfig',
+ 'apps.ai_api.apps.AiApiConfig',
```

#### 5. App Configurations
**Files:** `backend/apps/*/apps.py`
- Updated all app config `name` attributes from `backend.apps.*` to `apps.*`
- Fixed import in `ai_api/apps.py` from `backend.llms.llm_cache` to `llms.llm_cache`

#### 6. URL Configuration
**File:** `backend/config/urls.py`
```diff
- path('api/user/', include('backend.apps.users.urls')),
- path('api/chat/', include('backend.apps.chat.urls')),
- path('api/ai/', include('backend.apps.ai_api.urls')),
+ path('api/user/', include('apps.users.urls')),
+ path('api/chat/', include('apps.chat.urls')),
+ path('api/ai/', include('apps.ai_api.urls')),
```

#### 7. Core Services
**Files:** `backend/core/services/*.py`
- Updated imports from `backend.apps.*` to `apps.*`
- Fixed imports from `backend.core.services.*` to `core.services.*`

#### 8. App Views and Tests
**Files:** `backend/apps/ai_api/views.py`, `backend/apps/ai_api/tests.py`
- Updated imports from `backend.llms.*` to `llms.*`
- Updated imports from `backend.apps.*` to `apps.*`
- Updated imports from `backend.core.services.*` to `core.services.*`

### WebSocket Endpoints Available
After successful implementation, these WebSocket endpoints are available:
- `ws://YOUR_IP:8000/ws/notifications/` - Real-time notifications
- `ws://YOUR_IP:8000/ws/chat/{room_id}/` - Chat room connections
- `ws://YOUR_IP:8000/ws/chat/notifications/` - Chat notifications

### Troubleshooting
If you encounter issues:

1. **"Apps aren't loaded yet" error:**
   - Ensure you're running from the `backend` directory
   - Check that all app configs use relative paths (`apps.*` not `backend.apps.*`)

2. **"ModuleNotFoundError: No module named 'backend'":**
   - Verify you're using the correct command from backend directory
   - Check that `DJANGO_SETTINGS_MODULE` is set to `config.settings`

3. **WebSocket connection fails:**
   - Ensure Redis is running: `redis-server` (or `.\redis-server.exe` on Windows)
   - Verify daphne is installed: `pip install daphne`
   - Check that you're using daphne, not `python manage.py runserver`

## Notes
- Database (PostgreSQL) always runs locally, no network config needed
- Web app automatically uses IP from .env
- Mobile app needs sync script run after .env changes
- **WebSocket connections require daphne (ASGI) - regular runserver won't work**
- **All WebSocket URLs now use centralized API_BASE_URL configuration**
