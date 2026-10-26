@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0backend"
python manage.py runserver 127.0.0.1:8000
