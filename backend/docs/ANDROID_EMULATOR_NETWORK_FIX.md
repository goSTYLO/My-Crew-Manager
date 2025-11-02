# Android Emulator Connection Fix

## Problem
Mobile app cannot connect to Django backend when running on Android emulator.

## Root Cause
Windows Firewall is blocking incoming connections on port 8000, preventing the Android emulator from reaching the Django server.

## Solution

### Option 1: Add Firewall Rule (Recommended)

**Run as Administrator:**
```powershell
# Navigate to backend directory
cd backend

# Run the firewall script (as Administrator)
.\scripts\allow_port_8000_firewall.ps1

# OR manually add the rule:
New-NetFirewallRule -DisplayName "Django Daphne Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Any
```

### Option 2: Verify Server is Bound to 0.0.0.0

Ensure daphne is started with:
```powershell
cd backend
$env:DJANGO_SETTINGS_MODULE="config.settings"
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Important:** The server MUST show:
```
Listening on TCP address 0.0.0.0:8000
```
NOT `127.0.0.1:8000`

### Option 3: Use Windows IP Address (Alternative)

If `10.0.2.2` still doesn't work, try using your actual Windows IP:

1. Find your Windows IP:
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```
   (Shows: `192.168.100.117` on your machine)

2. Update mobile app:
   ```dart
   // In mobile/mycrewmanager/lib/core/constants/constants.dart
   static const baseUrl = "http://192.168.100.117:8000/api/";
   ```

3. Update backend ALLOWED_HOSTS:
   ```python
   # In backend/config/settings.py
   ALLOWED_HOSTS = ['*', '192.168.100.117', '10.0.2.2', 'localhost', '127.0.0.1']
   ```

### Verification

1. **Test from Windows:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/api/user/login/" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@test.com","password":"test"}'
   ```
   Should return: `{"message":"Invalid email or password"}` (server is working)

2. **Test from Emulator:**
   - Try logging in from mobile app
   - Check backend console for: `📥 INCOMING REQUEST:` messages
   - If you see requests: Problem solved! ✅
   - If you don't see requests: Firewall is still blocking

3. **Check Firewall Rules:**
   ```powershell
   Get-NetFirewallRule -DisplayName "*8000*" | Format-Table DisplayName, Enabled, Direction, Action
   ```

## Expected Behavior After Fix

When mobile app attempts login:
- **Backend console** should show:
  ```
  📥 INCOMING REQUEST:
     Method: POST
     Path: /api/user/login/
     Client IP: 10.0.2.2 (or 192.168.x.x)
  
  🔐 Login attempt from IP: 10.0.2.2, Email: user@example.com
  ```

- **Mobile logs** should show:
  ```
  🔐 Login attempt for email: user@example.com
  📡 Base URL: http://10.0.2.2:8000/api/
  📡 HTTP: --> POST http://10.0.2.2:8000/api/user/login/
  ```

## Still Not Working?

1. **Check if server is running:**
   ```powershell
   netstat -an | findstr ":8000"
   ```
   Should show: `TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING`

2. **Check firewall status:**
   ```powershell
   Get-NetFirewallProfile | Select-Object Name, Enabled
   ```

3. **Try disabling firewall temporarily** (for testing only):
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
   ```
   **Remember to re-enable it after testing!**

