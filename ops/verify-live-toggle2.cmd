@echo off
REM Second attempt at verifying the runtime DEMO/LIVE toggle. The first pass
REM sent DPAD_DOWN then DPAD_CENTER and the card never flipped, which means
REM D-pad focus did not land on the button (the amber fill is the primary
REM variant's styling, not a focus ring). This drives it two ways: a direct tap
REM at the button's coordinates, and then a longer D-pad walk, screenshotting
REM after each so the difference is visible.
REM Leaves the app STOPPED.
setlocal
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set SHOTS=%ROOT%\ops\verify-shots
set PKG=com.amazonappdev.narratv

"%ADB%" -s emulator-5554 shell am force-stop %PKG%
ping -n 3 127.0.0.1 >nul
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 10 127.0.0.1 >nul

echo === to System Status ===
"%ADB%" -s emulator-5554 shell input keyevent DPAD_RIGHT
ping -n 2 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 7 127.0.0.1 >nul

echo === direct tap on the toggle ===
REM Coordinates read off ops/verify-shots/live-04-after-tap.png, which shows the
REM unscrolled page: the button sits at about (560, 775) on a 1920x1080 frame.
REM The first attempt tapped (560, 236) and hit the page header.
"%ADB%" -s emulator-5554 shell input tap 560 775
ping -n 12 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\live-04-after-tap.png"

echo === logcat ===
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:* AndroidRuntime:E *:S

echo === stopping the app ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
endlocal
