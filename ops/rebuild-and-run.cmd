@echo off
setlocal
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
cd /d "%ROOT%"
echo === YARN INSTALL ===
call yarn.cmd install 2>&1 | findstr /v "^YN0013 ^YN0007" | findstr /r "YN0 Done error Error"
echo === VERSIONS ===
findstr /c:"\"version\"" node_modules\react\package.json
echo === GRADLE assembleDebug (bundle embedded) ===
cd /d "%ROOT%\apps\firetv\android"
call gradlew.bat assembleDebug -PbundleInDebug=true --quiet 2>&1 | findstr /i "error FAILED BUILD warning:.*deprecated" 
dir /b app\build\outputs\apk\debug\*.apk
echo === INSTALL + LAUNCH ===
"%ADB%" -s emulator-5554 install -r app\build\outputs\apk\debug\app-debug.apk
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n com.amazonappdev.narratv/.MainActivity >nul
ping -n 12 127.0.0.1 >nul
echo === RN ERRORS AFTER FIX ===
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:E *:S
echo === SCREENSHOT ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%ROOT%\docs\assets\screenshots\01-catalog.png"
dir "%ROOT%\docs\assets\screenshots\01-catalog.png" | findstr png
endlocal
