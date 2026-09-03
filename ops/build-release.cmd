@echo off
setlocal
REM Build NarraTV release APK (JS embedded, no Metro) from the real project path.
set LONGROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
REM JUNCTION policy (user directive 2026-09-02): never at D:\. If a short path is ever needed again,
REM create it under the projects\ root and remove it at the end. First try: no junction at all.
set ROOT=%LONGROOT%
set ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
set EXPO_NO_METRO_WORKSPACE_ROOT=1
set YARN_ENABLE_IMMUTABLE_INSTALLS=false
echo START %DATE% %TIME% > "%ROOT%\ops\gradle-release.log"
echo Cleaning stale .cxx dirs >> "%ROOT%\ops\gradle-release.log"
for /d %%d in ("%ROOT%\node_modules\*") do if exist "%%d\android\.cxx" rmdir /s /q "%%d\android\.cxx"
if exist "%ROOT%\apps\firetv\android\app\.cxx" rmdir /s /q "%ROOT%\apps\firetv\android\app\.cxx"
cd /d "%ROOT%"
call yarn.cmd install >> "%ROOT%\ops\gradle-release.log" 2>&1
cd /d "%ROOT%\apps\firetv\android"
call gradlew.bat --stop >nul 2>&1
call gradlew.bat assembleRelease --no-daemon >> "%ROOT%\ops\gradle-release.log" 2>&1
echo EXIT %ERRORLEVEL% %TIME% >> "%ROOT%\ops\gradle-release.log"
endlocal
