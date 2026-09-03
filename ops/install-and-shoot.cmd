@echo off
setlocal
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set SHOTS=%ROOT%\docs\assets\screenshots
set PKG=com.amazonappdev.narratv
"%ADB%" -s emulator-5554 uninstall %PKG% >nul 2>&1
"%ADB%" -s emulator-5554 install -r "%ROOT%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk"
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
echo === RN ERRORS ===
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:E AndroidRuntime:E *:S
echo === SHOT 01 catalog ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\01-catalog.png"

echo === START PLAYER ===
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
REM Wait for video to start and narration-card (0.5s - 4.8s) to speak
ping -n 5 127.0.0.1 >nul
echo === SHOT 03 narration-active ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\03-narration-active.png"

REM Wait for clock to advance past 0:10 (to ~0:15)
ping -n 19 127.0.0.1 >nul
echo === SHOT 02 player (clock > 0:10) ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\02-player.png"

REM Wait ~20s more to reach ~35s mark
ping -n 21 127.0.0.1 >nul
echo === SHOT 02b player ~30s ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\02b-player-30s.png"

REM Open Timeline drawer
"%ADB%" -s emulator-5554 shell input keyevent MENU
ping -n 4 127.0.0.1 >nul
echo === SHOT 04 timeline ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\04-timeline.png"

REM Cleanly relaunch app to Catalog and open System Status for CC-BY credits
echo === SHOT 09 credits (System Status CC-BY) ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 4 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\09-credits.png"

echo === SHOT 10 bbb (honest no-track state) ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 8 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\10-no-track-bbb.png"

echo === SHOT 11 ed (honest no-track state) ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 8 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\11-no-track-ed.png"

dir "%SHOTS%" | findstr png
echo === VIDEO LOGCAT ===
"%ADB%" -s emulator-5554 logcat -d ReactNativeVideo:* ExoPlayer*:E ReactNativeJS:E *:S
endlocal
