# Alternative Connection Method: Using Windows IP Address

## When to Use This Method

If `10.0.2.2` (Android emulator's default host IP) continues to fail even after:
- Adding Windows Firewall rule for port 8000
- Verifying server is bound to `0.0.0.0:8000`
- Ensuring backend is running

Try using your Windows machine's actual IP address instead.

## Step 1: Find Your Windows IP Address

Run in PowerShell:
```powershell
ipconfig | findstr /i "IPv4"
```

You should see something like:
```
IPv4 Address. . . . . . . . . . . . : 192.168.100.117
```

## Step 2: Update Mobile App Constants

**File**: `mobile/mycrewmanager/lib/core/constants/constants.dart`

**Change**:
```dart
static const baseUrl = "http://10.0.2.2:8000/api/";
```

**To**:
```dart
static const baseUrl = "http://192.168.100.117:8000/api/";  // Use your actual IP from Step 1
```

## Step 3: Update Backend ALLOWED_HOSTS

**File**: `backend/config/settings.py`

Ensure your IP is in `ALLOWED_HOSTS`:
```python
ALLOWED_HOSTS = ['*', '10.0.2.2', '192.168.100.117', 'localhost', '127.0.0.1']
```

Replace `192.168.100.117` with your actual IP from Step 1.

## Step 4: Restart Services

1. Restart the Django backend server
2. Hot reload or restart the mobile app

## Step 5: Test Connection

Try logging in from the mobile app. You should see:
- Backend logs showing requests from IP `192.168.x.x` (your network IP)
- Login either succeeds or shows authentication error (not connection error)

## Advantages of Using Windows IP

1. **More reliable** - Direct network connection, bypasses emulator's virtual network
2. **Easier debugging** - Can test connectivity from Windows PowerShell
3. **Works for physical devices** - Same IP works for physical Android devices on same network

## Disadvantages

1. **Network dependent** - Only works if mobile device/emulator and Windows are on same network
2. **IP may change** - If your network changes, you'll need to update the IP
3. **Less portable** - Each developer needs their own IP configured

## Note

If your Windows IP changes frequently, you may want to:
- Set a static IP for your development machine, OR
- Use a script to automatically detect and update the IP

## Testing Connectivity from Windows

To verify the IP is reachable:
```powershell
Test-NetConnection -ComputerName 192.168.100.117 -Port 8000
```

This should succeed (unlike `10.0.2.2` which fails from Windows).

