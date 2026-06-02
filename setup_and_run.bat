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
