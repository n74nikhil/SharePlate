@echo off
title SharePlate Connect Server
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or is not available in PATH.
  echo Install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://127.0.0.1:3000/'"
echo SharePlate is starting...
echo Keep this window open while using the website.
echo Press Ctrl+C to stop the server.
echo.
node server.js

echo.
echo The server stopped.
pause

