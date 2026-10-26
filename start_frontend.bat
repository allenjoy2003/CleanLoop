@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
call "C:\Program Files\nodejs\npm.cmd" run dev
