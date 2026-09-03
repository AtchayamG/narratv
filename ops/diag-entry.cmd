@echo off
set ROOT=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
cd /d "%ROOT%\apps\firetv\android"
echo === resolveAppEntry from android dir ===
node -e "require('expo/scripts/resolveAppEntry')" "%ROOT%\apps\firetv" android absolute
echo.
echo === cwd used by gradle root ===
cd /d "%ROOT%\apps\firetv"
echo === export:embed direct test ===
npx expo export:embed --platform android --dev false --entry-file "%ROOT%\apps\firetv\index.ts" --bundle-output "%TEMP%\narratv-test.bundle" --assets-dest "%TEMP%\narratv-assets" --reset-cache 2>&1 | findstr /i /c:"error" /c:"Unable" /c:"Writing" /c:"Done" /c:"Bundle" /c:"None of these"
dir "%TEMP%\narratv-test.bundle" 2>&1 | findstr bundle
