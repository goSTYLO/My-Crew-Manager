<!-- 27233190-cd42-4046-b572-ecaf7d5e30ba 5c6047bc-4ad9-4266-98ef-877c4b83fbb5 -->
# Fix Remaining Backend Import Issues

## Problem

The Django server is throwing `ModuleNotFoundError: No module named 'backend'` because several files still use absolute `backend.*` imports instead of relative paths when running from the backend directory.

## Root Cause

When running daphne from the `backend/` directory with `config.asgi:application`, Python expects relative imports like `apps.*`, `llms.*`, `core.*` instead of `backend.apps.*`, `backend.llms.*`, etc.

## Files Already Fixed

- `backend/config/asgi.py` ✓
- `backend/config/settings.py` ✓ (including ROOT_URLCONF, WSGI_APPLICATION, ASGI_APPLICATION)
- `backend/config/urls.py` ✓
- `backend/config/wsgi.py` ✓ (DJANGO_SETTINGS_MODULE)
- `backend/manage.py` ✓ (DJANGO_SETTINGS_MODULE)
- `backend/apps/*/apps.py` ✓
- `backend/apps/ai_api/views.py` ✓
- `backend/apps/ai_api/tests.py` ✓
- `backend/core/services/*.py` ✓
- `backend/llms/backlog_llm.py` ✓
- `backend/llms/project_llm.py` ✓

## Current Status

All `backend.*` import references have been systematically fixed and converted to relative imports. The server should now be able to start properly.

## Next Steps for Next Session

### 1. Test Server Startup

1. Navigate to backend directory: `cd backend`
2. Set Django settings: `$env:DJANGO_SETTINGS_MODULE="config.settings"`
3. Start daphne: `daphne -b 0.0.0.0 -p 8000 config.asgi:application`

### 2. Verify Fix

- Server should start without `ModuleNotFoundError`
- REST API endpoints should work (no 500 errors)
- CORS headers should be sent properly
- WebSocket connections should succeed

### 3. Test WebSocket Connection

- Check browser console for WebSocket connection success
- Verify "Invalid token" errors are resolved
- Test both notification polling and WebSocket functionality

## Expected Outcome

- Django server runs without `ModuleNotFoundError`
- REST API calls from web app work (no 500 errors)
- CORS errors disappear
- WebSocket connections can authenticate properly
- Both polling and WebSocket systems functional

## Why This Fixes Everything

The `backend.*` import errors were cascading:

1. Server crashes on ANY request (REST or WebSocket)
2. No CORS headers sent (server crashes before middleware runs)
3. WebSocket can't authenticate (server crashes before processing)
4. All API calls return 500 errors

Fixing the imports allows the server to:

- Process requests properly
- Send CORS headers
- Handle WebSocket authentication
- Return proper API responses

## All Changes Made

### Import Path Fixes
- Changed all `backend.apps.*` → `apps.*`
- Changed all `backend.llms.*` → `llms.*`
- Changed all `backend.core.*` → `core.*`
- Changed all `backend.config.*` → `config.*`

### Settings Configuration
- `ROOT_URLCONF = 'config.urls'`
- `WSGI_APPLICATION = 'config.wsgi.application'`
- `ASGI_APPLICATION = 'config.asgi.application'`
- `DJANGO_SETTINGS_MODULE = 'config.settings'` (in wsgi.py and manage.py)

### App Configuration
- Updated all `apps.py` files to use relative names
- Fixed import in `ai_api/apps.py` ready() method

### Service Layer
- Updated broadcast_service.py and notification_service.py imports
- Fixed all model and serializer imports

### LLM Layer
- Updated backlog_llm.py and project_llm.py imports
- Fixed task and cache imports

## Files Modified Summary

1. `backend/config/settings.py` - 3 import path fixes
2. `backend/config/wsgi.py` - 1 import path fix
3. `backend/manage.py` - 1 import path fix
4. `backend/config/urls.py` - 3 include path fixes
5. `backend/apps/users/apps.py` - 1 name fix
6. `backend/apps/chat/apps.py` - 1 name fix
7. `backend/apps/ai_api/apps.py` - 1 name fix + 1 import fix
8. `backend/apps/ai_api/views.py` - 6 import fixes
9. `backend/apps/ai_api/tests.py` - 3 import fixes
10. `backend/core/services/broadcast_service.py` - 7 import fixes
11. `backend/core/services/notification_service.py` - 1 import fix
12. `backend/llms/backlog_llm.py` - 3 import fixes
13. `backend/llms/project_llm.py` - 3 import fixes

Total: 34 import path fixes across 13 files

