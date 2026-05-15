@echo off
setlocal enabledelayedexpansion

:: Get the local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
    goto :found
)
:found

echo ========================================================
echo         REC LostLink - Dynamic Runner
echo ========================================================
echo Your Local IP: %ip%
echo.
echo [Starting Backend on 0.0.0.0:8080]
start "Backend" cmd /c "cd fastapi-backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8080"

echo [Starting Admin Dashboard]
start "Admin Dashboard" cmd /c "cd admin-dashboard && npm start"

echo [Starting Mobile App (Expo) on %ip%]
echo To see the QR code for your physical device, check the new terminal.
start "Expo Frontend" cmd /c "cd frontend && npx expo start --host lan"

echo.
echo All services are starting in separate windows...
echo Backend: http://%ip%:8080
echo Admin: http://%ip%:3000
echo.
pause
