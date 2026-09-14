@echo off
REM Installs the current release APK and drives the app to System Status so the
REM runtime DEMO/LIVE toggle can be verified on the device rather than assumed.
REM Leaves the app STOPPED at the end.
setlocal
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set SHOTS=%ROOT%\ops\verify-shots
set PKG=com.amazonappdev.narratv
if not exist "%SHOTS%" mkdir "%SHOTS%"

echo === installing current release apk ===
"%ADB%" -s emulator-5554 install -r "%ROOT%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk"
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 10 127.0.0.1 >nul

echo === navigating to System Status ===
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 6 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\live-01-system-status-demo.png"

echo === focusing and pressing the mode toggle ===
"%ADB%" -s emulator-5554 shell input keyevent DPAD_DOWN
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\live-02-toggle-focused.png"
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\live-03-after-toggle.png"

echo === app log: did it reach the endpoint? ===
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:* AndroidRuntime:E *:S

echo === stopping the app ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
dir /b "%SHOTS%\live-*.png"
endlocal
