# Clean Loop All-in-One Launcher
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================================" -ForegroundColor Green
Write-Host "       Starting Clean Loop Platform (Kochi)" -ForegroundColor Yellow
Write-Host "    Backend (Django API) + Frontend (Vite React)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

# Ensure Node.js is in PATH for this session and children
$env:Path = "C:\Program Files\nodejs;" + $env:Path

Write-Host "[1/2] Starting Django REST Backend on http://127.0.0.1:8000/..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; Write-Host '--- Clean Loop Backend Server ---' -ForegroundColor Green; python manage.py runserver 127.0.0.1:8000"

Write-Host "[2/2] Starting Vite React Frontend on http://localhost:5173/..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; cd '$rootDir\frontend'; Write-Host '--- Clean Loop Frontend Server ---' -ForegroundColor Yellow; npm run dev"

Write-Host ""
Write-Host "Clean Loop is launching in separate dedicated processes!" -ForegroundColor Green
Write-Host "- Frontend App: http://localhost:5173/" -ForegroundColor Yellow
Write-Host "- API Base:     http://127.0.0.1:8000/api/" -ForegroundColor Cyan
Write-Host "- Swagger Docs: http://127.0.0.1:8000/api/docs/" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
