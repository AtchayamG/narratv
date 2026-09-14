@echo off
setlocal
REM Builds the LIVE-mode release APK: demo mode off, the deployed API endpoint
REM baked in at build time. config.ts reads DEMO_MODE / API_URL from
REM process.env, which babel inlines during the release bundle, so these must be
REM set for THIS build - they are not runtime settings.
REM
REM The APK is written to a separate output name so the DEMO apk is not
REM clobbered; both are needed for the demo video.
set LONGROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ROOT=%LONGROOT%
set ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
set EXPO_NO_METRO_WORKSPACE_ROOT=1
set YARN_ENABLE_IMMUTABLE_INSTALLS=false

REM --- the whole point of this script ---
REM These MUST be EXPO_PUBLIC_ prefixed. babel-preset-expo inlines only those
REM into the release bundle; a bare DEMO_MODE never reaches the device. The
REM unprefixed copies are set too, purely so a local metro run behaves the same.
set EXPO_PUBLIC_DEMO_MODE=false
set EXPO_PUBLIC_API_URL=https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com
set EXPO_PUBLIC_MEDIA_CDN_URL=https://d2ef099dzscscm.cloudfront.net
set EXPO_PUBLIC_APP_REVISION=2026.09.14-live.v4
set DEMO_MODE=false
set API_URL=https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com
set MEDIA_CDN_URL=https://d2ef099dzscscm.cloudfront.net
set APP_REVISION=2026.09.14-live.v4

set LOG=%ROOT%\ops\gradle-release-live.log
echo START %DATE% %TIME% > "%LOG%"
echo DEMO_MODE=%DEMO_MODE% >> "%LOG%"
echo API_URL=%API_URL% >> "%LOG%"
echo APP_REVISION=%APP_REVISION% >> "%LOG%"

REM Gradle judges the JS bundle task by its INPUT FILES. Changing an
REM environment variable does not change any source file, so a second build
REM reports assembleRelease UP-TO-DATE and silently ships the previous bundle -
REM which is exactly how the first LIVE apk came out identical to the DEMO one.
REM Deleting the bundle output forces just that task to re-run, leaving the
REM cached native build alone.
echo Deleting generated bundle so the JS task cannot be UP-TO-DATE >> "%LOG%"
rmdir /s /q "%ROOT%\apps\firetv\android\app\build\generated\assets" 2>nul
rmdir /s /q "%ROOT%\apps\firetv\android\app\build\ASSETS" 2>nul
del /q "%ROOT%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk" 2>nul

cd /d "%ROOT%\apps\firetv\android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleRelease --no-daemon >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%
echo EXIT %RC% %TIME% >> "%LOG%"

if %RC%==0 (
    copy /y "%ROOT%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk" "%ROOT%\ops\app-release-LIVE.apk" >nul
    echo SAVED %ROOT%\ops\app-release-LIVE.apk >> "%LOG%"
    echo BUILD OK - LIVE apk saved to ops\app-release-LIVE.apk
) else (
    echo BUILD FAILED rc=%RC% - see ops\gradle-release-live.log
)
endlocal
