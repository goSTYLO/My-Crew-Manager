# PowerShell script to allow port 8000 through Windows Firewall
# Run this as Administrator: Right-click PowerShell -> "Run as Administrator"

Write-Host "Adding Windows Firewall rule for port 8000..." -ForegroundColor Yellow

# Add inbound rule for port 8000
New-NetFirewallRule -DisplayName "Django Daphne Port 8000" `
    -Direction Inbound `
    -LocalPort 8000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any `
    -Description "Allow Django/Daphne server on port 8000 for Android emulator access" `
    -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host "Port 8000 is now accessible from Android emulator (10.0.2.2)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not add firewall rule automatically." -ForegroundColor Yellow
    Write-Host "Please add it manually:" -ForegroundColor Yellow
    Write-Host "1. Open Windows Defender Firewall" -ForegroundColor Cyan
    Write-Host "2. Advanced Settings -> Inbound Rules -> New Rule" -ForegroundColor Cyan
    Write-Host "3. Port -> TCP -> 8000 -> Allow connection" -ForegroundColor Cyan
    Write-Host "4. Apply to all profiles" -ForegroundColor Cyan
}

Write-Host "`nVerifying rule..." -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "*8000*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table

