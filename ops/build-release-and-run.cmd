@echo off
setlocal
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
set ADB=%ANDROID_HOME%\platform-tools\adb.exe
echo === KILL METRO + CLEAR CACHES ===
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr :8081') do taskkill /PID %%p /T /F >nul 2>&1
rmdir /s /q "%TEMP%\metro-cache" 2>nul
rmdir /s /q "%ROOT%\node_modules\.cache" 2>nul
rmdir /s /q "%ROOT%\apps\firetv\.expo" 2>nul
del /q "%ROOT%\apps\firetv\android\app\src\main\assets\index.android.bundle" 2>nul
echo === JAVA ===
java -version 2>&1 | findstr version
echo === GRADLE assembleRelease ===
cd /d "%ROOT%\apps\firetv\android"
call gradlew.bat assembleRelease --quiet 2>&1 | findstr /i /c:"error" /c:"FAILED" /c:"BUILD" /c:"What went wrong" /c:"Execution failed"
dir app\build\outputs\apk\release\*.apk 2>&1 | findstr /i "apk"
echo === INSTALL + LAUNCH (no Metro) ===
"%ADB%" -s emulator-5554 uninstall com.amazonappdev.narratv >nul 2>&1
"%ADB%" -s emulator-5554 install -r app\build\outputs\apk\release\app-release.apk
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n com.amazonappdev.narratv/.MainActivity >nul
ping -n 12 127.0.0.1 >nul
echo === RN ERRORS ===
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:E AndroidRuntime:E *:S
echo === SCREENSHOT ===
"%ADB%" -s emulator-5554 exec-out screencap -p > "%ROOT%\docs\assets\screenshots\01-catalog.png"
dir "%ROOT%\docs\assets\screenshots\01-catalog.png" | findstr png
endlocal
