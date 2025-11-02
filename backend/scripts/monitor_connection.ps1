# Real-time monitoring script for backend and mobile connection issues
# Run this while attempting login from mobile app

Write-Host "=== Connection Monitoring Started ===" -ForegroundColor Cyan
Write-Host "This will monitor backend logs for incoming requests" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring`n" -ForegroundColor Yellow

$logFile = "backend\logs\django.log"
$lastPosition = (Get-Item $logFile).Length

Write-Host "Waiting for requests... (Try logging in from mobile app now)`n" -ForegroundColor Green

while ($true) {
    Start-Sleep -Seconds 1
    
    $currentLength = (Get-Item $logFile).Length
    
    if ($currentLength -gt $lastPosition) {
        $newContent = Get-Content $logFile -Tail 50 | Select-String -Pattern "INCOMING|RESPONSE|Login|POST|10\.0\.2\.2|Client IP" -Context 1
        
        if ($newContent) {
            Write-Host "`n=== NEW LOG ENTRIES ===" -ForegroundColor Cyan
            $newContent | ForEach-Object { Write-Host $_ }
            Write-Host "`n" -ForegroundColor Cyan
        }
        
        $lastPosition = $currentLength
    }
}

