# Fixing Windows Firewall for Android Emulator Connection

## Problem
Mobile app shows "Connection refused" error when trying to connect to Django backend.

## Solution: Add Windows Firewall Rule

### Step 1: Run PowerShell as Administrator

1. Press `Windows + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted by User Account Control

### Step 2: Run the Firewall Script

```powershell
cd "C:\Users\Aaron\GitHub Repos\My-Crew-Manager\backend"
.\scripts\allow_port_8000_firewall.ps1
```

### Step 3: Verify Rule Was Created

```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Django*" -or $_.DisplayName -like "*8000*"} | Format-Table DisplayName, Enabled, Direction, Action
```

You should see a rule named "Django Daphne Port 8000" with `Enabled = True`.

### Alternative: Manual Firewall Configuration

If the script doesn't work, add the rule manually:

1. Open **Windows Defender Firewall with Advanced Security**
   - Press `Windows + R`, type `wf.msc`, press Enter

2. Click **Inbound Rules** → **New Rule...**

3. Select **Port** → Next

4. Select **TCP** and enter **8000** in "Specific local ports" → Next

5. Select **Allow the connection** → Next

6. Check all profiles (Domain, Private, Public) → Next

7. Name it: **"Django Daphne Port 8000"** → Finish

### Step 4: Test the Connection

After adding the firewall rule:

1. Restart the mobile app
2. Try logging in
3. Check backend console for "📥 INCOMING REQUEST:" messages
4. If you see requests with Client IP `10.0.2.2`, the fix worked! ✅

## Verification

Run this in PowerShell to test:
```powershell
Test-NetConnection -ComputerName 10.0.2.2 -Port 8000
```

**Note:** This test will fail from Windows (10.0.2.2 only works from inside the emulator), but it confirms the port is open.

The real test is when the mobile app can successfully connect.

## Still Not Working?

If you've added the firewall rule but still see "Connection refused":

1. **Check if the rule is enabled:**
   ```powershell
   Get-NetFirewallRule -DisplayName "*8000*" | Format-Table DisplayName, Enabled
   ```

2. **Check if antivirus is blocking:**
   - Some antivirus software has its own firewall
   - Temporarily disable to test (remember to re-enable!)

3. **Try using Windows actual IP:**
   - Find your IP: `ipconfig | findstr /i "IPv4"`
   - Update `mobile/mycrewmanager/lib/core/constants/constants.dart`:
     ```dart
     static const baseUrl = "http://192.168.100.117:8000/api/";
     ```

4. **Verify server is bound correctly:**
   - Server should show: `Listening on TCP address 0.0.0.0:8000`
   - If it shows `127.0.0.1:8000`, restart with: `daphne -b 0.0.0.0 -p 8000 config.asgi:application`

