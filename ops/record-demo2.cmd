@echo off
setlocal
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set PKG=com.amazonappdev.narratv
set OUT=%P%\docs\assets\clips
if not exist "%OUT%" mkdir "%OUT%"
echo --- relaunch at catalog ---
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 3 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
echo --- record 50s: catalog browse -^> system status -^> back -^> play -^> describe-now toast -^> why panel ---
start /b "" "%ADB%" -s emulator-5554 shell screenrecord --time-limit 50 --size 1280x720 --bit-rate 6000000 /sdcard/narratv-demo2.mp4
ping -n 4 127.0.0.1 >nul
REM browse the rail
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 3 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 3 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_UP
ping -n 3 127.0.0.1 >nul
REM open System Status (right of the hero CTA)
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent BACK
ping -n 5 127.0.0.1 >nul
REM into the player, then Describe Now (demo refusal toast)
"%ADB%" -s emulator-5554 shell input keyevent DPAD_LEFT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 10 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 12 127.0.0.1 >nul
echo --- flush and pull ---
ping -n 10 127.0.0.1 >nul
"%ADB%" -s emulator-5554 pull /sdcard/narratv-demo2.mp4 "%OUT%\narratv-demo2.mp4"
dir "%OUT%"
endlocal
