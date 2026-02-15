@echo off
setlocal
title REC LostLink Setup

echo ========================================================
echo      REC LostLink - Automated Setup Script (Windows)
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

echo.
echo [1/4] Setting up Backend (FastAPI)...
cd fastapi-backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

echo.
echo Seeding database...
python seed_data.py
if %errorlevel% neq 0 (
    echo [WARNING] Database seeding failed. Ensure MongoDB is running.
)

deactivate
cd ..

echo.
echo [2/4] Setting up Admin Dashboard...
cd admin-dashboard
if not exist node_modules (
    echo Installing Admin Dashboard dependencies...
    call npm install >nul 2>&1
)
cd ..

echo.
echo [3/4] Setting up Mobile App...
cd frontend
if not exist node_modules (
    echo Installing Mobile App dependencies...
    call npm install >nul 2>&1
)
cd ..

echo.
echo ========================================================
echo                 SETUP COMPLETE!
echo ========================================================
echo.
echo To run the project, open 3 separate terminals:
echo.
echo [Terminal 1 - Backend]
echo cd fastapi-backend
echo venv\Scripts\activate
echo uvicorn main:app --reload --host 0.0.0.0 --port 8080
echo.
echo [Terminal 2 - Admin Dashboard]
echo cd admin-dashboard
echo npm start
echo.
echo [Terminal 3 - Mobile App]
echo cd frontend
echo npx expo start
echo.
echo Press any key to exit...
pause >nul
