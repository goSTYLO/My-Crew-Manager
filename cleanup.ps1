# My-Crew-Manager Cleanup Script
# This script removes build artifacts, cache files, and other generated content
# to free up disk space.

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "My-Crew-Manager Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalFreed = 0

# Function to calculate directory size
function Get-DirectorySize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem -Path $Path -Recurse -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum).Sum
        return $size
    }
    return 0
}

# Function to format size
function Format-Size {
    param([long]$Size)
    if ($Size -ge 1GB) {
        return "{0:N2} GB" -f ($Size / 1GB)
    } elseif ($Size -ge 1MB) {
        return "{0:N2} MB" -f ($Size / 1MB)
    } elseif ($Size -ge 1KB) {
        return "{0:N2} KB" -f ($Size / 1KB)
    } else {
        return "$Size bytes"
    }
}

# 1. Flutter Build Directory (Largest space saver)
Write-Host "[1/6] Cleaning Flutter build directory..." -ForegroundColor Yellow
$buildPath = "mobile/mycrewmanager/build"
if (Test-Path $buildPath) {
    $size = Get-DirectorySize -Path $buildPath
    Write-Host "  Found: $(Format-Size -Size $size)" -ForegroundColor Gray
    Remove-Item -Path $buildPath -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $buildPath)) {
        Write-Host "  [OK] Deleted Flutter build directory" -ForegroundColor Green
        $totalFreed += $size
    } else {
        Write-Host "  [ERROR] Failed to delete Flutter build directory" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] Flutter build directory not found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# 2. Python Cache Directories
Write-Host "[2/6] Cleaning Python cache files..." -ForegroundColor Yellow
$pycacheCount = 0
$pycCount = 0
$pycacheSize = 0
$pycSize = 0

Get-ChildItem -Path "backend" -Recurse -Filter "__pycache__" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $size = Get-DirectorySize -Path $_.FullName
    $pycacheSize += $size
    Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    $pycacheCount++
}

Get-ChildItem -Path "backend" -Recurse -Filter "*.pyc" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $pycSize += $_.Length
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
    $pycCount++
}

if ($pycacheCount -gt 0 -or $pycCount -gt 0) {
    $totalPySize = $pycacheSize + $pycSize
    Write-Host "  [OK] Deleted $pycacheCount __pycache__ directories and $pycCount .pyc files" -ForegroundColor Green
    Write-Host "  Freed: $(Format-Size -Size $totalPySize)" -ForegroundColor Gray
    $totalFreed += $totalPySize
} else {
    Write-Host "  [SKIP] No Python cache files found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# 3. Django Staticfiles
Write-Host "[3/6] Cleaning Django staticfiles..." -ForegroundColor Yellow
$staticfilesPath = "backend/staticfiles"
if (Test-Path $staticfilesPath) {
    $size = Get-DirectorySize -Path $staticfilesPath
    Write-Host "  Found: $(Format-Size -Size $size)" -ForegroundColor Gray
    Write-Host "  Note: Regenerate with 'python backend/manage.py collectstatic' if needed" -ForegroundColor Gray
    Remove-Item -Path $staticfilesPath -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $staticfilesPath)) {
        Write-Host "  [OK] Deleted Django staticfiles directory" -ForegroundColor Green
        $totalFreed += $size
    } else {
        Write-Host "  [ERROR] Failed to delete staticfiles directory" -ForegroundColor Red
    }
} else {
    Write-Host "  [SKIP] Staticfiles directory not found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# 4. Flutter Plugin Files
Write-Host "[4/6] Cleaning Flutter plugin files..." -ForegroundColor Yellow
$pluginFiles = @(
    "mobile/mycrewmanager/.flutter-plugins",
    "mobile/mycrewmanager/.flutter-plugins-dependencies"
)

$pluginSize = 0
$pluginCount = 0
foreach ($file in $pluginFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $pluginSize += $size
        Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
        $pluginCount++
    }
}

if ($pluginCount -gt 0) {
    Write-Host "  [OK] Deleted $pluginCount Flutter plugin files" -ForegroundColor Green
    Write-Host "  Freed: $(Format-Size -Size $pluginSize)" -ForegroundColor Gray
    $totalFreed += $pluginSize
} else {
    Write-Host "  [SKIP] No Flutter plugin files found (already clean)" -ForegroundColor Gray
}
Write-Host ""

# 5. Node Modules (if present)
Write-Host "[5/6] Checking for node_modules..." -ForegroundColor Yellow
$nodeModulesPaths = @(
    "web/node_modules",
    "node_modules"
)

$nodeModulesSize = 0
$nodeModulesCount = 0
foreach ($path in $nodeModulesPaths) {
    if (Test-Path $path) {
        $size = Get-DirectorySize -Path $path
        Write-Host "  Found: $path ($(Format-Size -Size $size))" -ForegroundColor Gray
        Write-Host "  Note: Regenerate with 'npm install' if needed" -ForegroundColor Gray
        $response = Read-Host "  Delete $path? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $path)) {
                Write-Host "  [OK] Deleted $path" -ForegroundColor Green
                $totalFreed += $size
                $nodeModulesCount++
            }
        } else {
            Write-Host "  [SKIP] Skipped $path" -ForegroundColor Gray
        }
    }
}

if ($nodeModulesCount -eq 0) {
    Write-Host "  [SKIP] No node_modules found or skipped by user" -ForegroundColor Gray
}
Write-Host ""

# 6. Old Log Files (optional - older than 30 days)
Write-Host "[6/6] Checking for old log files..." -ForegroundColor Yellow
$logsPath = "backend/logs"
if (Test-Path $logsPath) {
    $oldLogs = Get-ChildItem -Path $logsPath -Filter "*.log" -ErrorAction SilentlyContinue | 
               Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
    
    if ($oldLogs.Count -gt 0) {
        $oldLogsSize = ($oldLogs | Measure-Object -Property Length -Sum).Sum
        Write-Host "  Found $($oldLogs.Count) log files older than 30 days ($(Format-Size -Size $oldLogsSize))" -ForegroundColor Gray
        $response = Read-Host "  Delete old log files? (y/N)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            $oldLogs | Remove-Item -Force -ErrorAction SilentlyContinue
            Write-Host "  [OK] Deleted $($oldLogs.Count) old log files" -ForegroundColor Green
            $totalFreed += $oldLogsSize
        } else {
            Write-Host "  [SKIP] Skipped log file cleanup" -ForegroundColor Gray
        }
    } else {
        Write-Host "  [SKIP] No old log files found (all logs are recent)" -ForegroundColor Gray
    }
} else {
    Write-Host "  [SKIP] Logs directory not found" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total space freed: $(Format-Size -Size $totalFreed)" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Some directories can be regenerated:" -ForegroundColor Yellow
Write-Host "  - Flutter build: 'flutter build' or 'flutter run'" -ForegroundColor Gray
Write-Host "  - Django staticfiles: 'python backend/manage.py collectstatic'" -ForegroundColor Gray
Write-Host "  - Node modules: 'npm install' or 'cd web && npm install'" -ForegroundColor Gray
Write-Host "  - Flutter plugins: 'cd mobile/mycrewmanager && flutter pub get'" -ForegroundColor Gray
Write-Host ""

