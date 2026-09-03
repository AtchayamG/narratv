@echo off
setlocal
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set PKG=com.amazonappdev.narratv
set OUT=%P%\docs\assets\clips
if not exist "%OUT%" mkdir "%OUT%"
echo --- relaunch app at catalog ---
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 3 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
echo --- start screen recording (50s, 720p) ---
start /b "" "%ADB%" -s emulator-5554 shell screenrecord --time-limit 50 --size 1280x720 --bit-rate 6000000 /sdcard/narratv-demo.mp4
ping -n 4 127.0.0.1 >nul
echo --- drive the UI while recording ---
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 26 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent MENU
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent MENU
ping -n 12 127.0.0.1 >nul
echo --- wait for recorder to flush, then pull ---
ping -n 8 127.0.0.1 >nul
"%ADB%" -s emulator-5554 pull /sdcard/narratv-demo.mp4 "%OUT%\narratv-demo.mp4"
dir "%OUT%"
endlocal
