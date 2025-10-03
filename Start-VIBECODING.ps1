# VIBECODING System Launcher
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VIBECODING System Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Start Backend
Write-Host "[1/3] Starting Backend Server..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\backend && pnpm dev" -WindowStyle Normal

# Wait
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/3] Starting Frontend Server..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\frontend && pnpm dev" -WindowStyle Normal

# Wait
Start-Sleep -Seconds 5

# Open VSCode
Write-Host "[3/3] Opening VSCode Extension..." -ForegroundColor Green
code "C:\Users\ooxmi\Downloads\VIBECODING学習サポートシステム\vibecoding\extension"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Started Successfully!" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3002" -ForegroundColor Yellow
Write-Host "Press F5 in VSCode to run extension" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
