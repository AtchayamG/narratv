@echo off
REM Recover a wedged emulator/adb. Safe to run any time.
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo --- killing adb server (emulator keeps running) ---
"%ADB%" kill-server >nul 2>&1
taskkill /F /IM adb.exe /T >nul 2>&1
ping -n 4 127.0.0.1 >nul
"%ADB%" start-server >nul 2>&1
ping -n 3 127.0.0.1 >nul
"%ADB%" devices
echo --- can the shell answer in 15s? ---
start /b "" cmd /c ""%ADB%" -s emulator-5554 shell echo SHELL_OK > "%TEMP%\adbprobe.txt" 2>&1"
ping -n 16 127.0.0.1 >nul
type "%TEMP%\adbprobe.txt" 2>nul
findstr /c:"SHELL_OK" "%TEMP%\adbprobe.txt" >nul 2>&1
if errorlevel 1 (
  echo SHELL DEAD - emulator must be restarted: taskkill /F /IM qemu-system-x86_64.exe then scripts\run-emulator.bat
) else (
  echo SHELL ALIVE
)
del "%TEMP%\adbprobe.txt" >nul 2>&1
