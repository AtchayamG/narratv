@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo === DEVICES ===
"%ADB%" devices
echo === PACKAGE ===
"%ADB%" -s emulator-5554 shell pm list packages 2>&1 | findstr narratv
echo === LAUNCH ===
"%ADB%" -s emulator-5554 shell am start -n com.amazonappdev.narratv/.MainActivity 2>&1
timeout /t 8 /nobreak >nul
echo === LOGCAT (RN / crash) ===
"%ADB%" -s emulator-5554 logcat -d -t 1500 2>&1 | findstr /i "ReactNativeJS AndroidRuntime FATAL Unable Metro bundle SoLoader Hermes com.amazonappdev.narratv" > "%TEMP%\narratv-logcat.txt"
type "%TEMP%\narratv-logcat.txt" | more +0
echo === METRO PORT ===
netstat -ano | findstr :8081
echo === METRO REACHABLE FROM HOST ===
curl -s -m 5 "http://localhost:8081/status"
echo.
echo === ADB REVERSE ===
"%ADB%" -s emulator-5554 reverse --list
echo === SCREENSHOT ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%TEMP%\narratv-now.png"
dir "%TEMP%\narratv-now.png" | findstr png
