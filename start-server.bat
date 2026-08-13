@echo off
chcp 65001 >nul
title TechStars Dev Server

echo ============================================
echo   TechStars AI - Development Server
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Checking for existing servers on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo      Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Installing dependencies...
echo      Running npm install...
call npm install

echo [3/3] Starting Vite dev server...
echo.
echo ============================================
echo   Server starting at http://localhost:3000
echo   Press Ctrl+C to stop
echo ============================================
echo.

call npx vite

pause
