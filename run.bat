@echo off
title Clean Loop - Kochi Smart Waste Management System
color 0A

echo ========================================================
echo        Starting Clean Loop Platform (Kochi)
echo    Backend (Django API) + Frontend (Vite React)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/2] Launching Django REST API Server at http://127.0.0.1:8000/ ...
start "Clean Loop - Backend API" cmd /k "cd /d "%ROOT_DIR%backend" && python manage.py runserver 127.0.0.1:8000"

echo [2/2] Launching Vite React Frontend at http://localhost:5173/ ...
start "Clean Loop - Frontend App" cmd /k "set "PATH=C:\Program Files\nodejs;%PATH%" && cd /d "%ROOT_DIR%frontend" && call "C:\Program Files\nodejs\npm.cmd" run dev"

echo.
echo ========================================================
echo Clean Loop is running!
echo - Web App:    http://localhost:5173/
echo - Backend:    http://127.0.0.1:8000/
echo - API Docs:   http://127.0.0.1:8000/api/docs/
echo ========================================================
echo You can minimize this window. Close the individual windows to stop.
timeout /t 5
