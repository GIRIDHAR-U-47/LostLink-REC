@echo off
setlocal enabledelayedexpansion
title REC LostLink Setup and Runner

echo ========================================================
echo      REC LostLink - Automated Setup ^& Run Script
echo ========================================================

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.12+.
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    goto :found_ip
)
:found_ip

echo.
echo [1/3] Checking Backend (FastAPI)...
cd fastapi-backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing Python dependencies...
    pip install -r requirements.txt
    echo Seeding database...
    python seed_data.py
    deactivate
) else (
    echo Backend already set up.
)
cd ..

echo.
echo [2/3] Checking Admin Dashboard...
cd admin-dashboard
if not exist node_modules (
    echo Installing Admin Dashboard dependencies...
    call npm install
) else (
    echo Admin Dashboard already set up.
)
cd ..

echo.
echo [3/3] Checking Mobile App (Frontend)...
cd frontend
if not exist node_modules (
    echo Installing Frontend dependencies...
    call npm install
) else (
    echo Frontend already set up.
)
cd ..

echo.
echo ========================================================
echo                 STARTING SERVICES
echo ========================================================
echo Your Local IP: %ip%
echo.
echo [Starting Backend on 0.0.0.0:8080]
start "REC LostLink Backend" cmd /c "cd fastapi-backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8080"

echo [Starting Admin Dashboard]
start "REC LostLink Admin" cmd /c "cd admin-dashboard && npm start"

echo [Starting Mobile App (Expo) on %ip%]
start "REC LostLink Expo" cmd /c "cd frontend && npx expo start --host lan"

echo.
echo All services are starting in separate windows...
echo Backend: http://%ip%:8080
echo Admin: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause >nul
