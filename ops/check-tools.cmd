@echo off
echo === git ===
where git 2>nul && git --version
echo === gh CLI ===
where gh 2>nul && gh --version
echo === gh auth status ===
gh auth status 2>&1
echo === OBS ===
where obs64 2>nul
where obs 2>nul
if exist "C:\Program Files\obs-studio\bin\64bit\obs64.exe" echo FOUND: C:\Program Files\obs-studio\bin\64bit\obs64.exe
if exist "C:\Program Files (x86)\obs-studio\bin\64bit\obs64.exe" echo FOUND: C:\Program Files (x86)\obs-studio\bin\64bit\obs64.exe
echo === OBS websocket config (remote control) ===
if exist "%APPDATA%\obs-studio\plugin_config\obs-websocket\config.json" (type "%APPDATA%\obs-studio\plugin_config\obs-websocket\config.json") else (echo no obs-websocket config found)
echo === OBS profiles/scenes present? ===
dir /b "%APPDATA%\obs-studio\basic\scenes" 2>nul
