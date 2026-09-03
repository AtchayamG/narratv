@echo off
setlocal
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set SHOTS=%P%\ops\verify-shots
set PKG=com.amazonappdev.narratv
if not exist "%SHOTS%" mkdir "%SHOTS%"
echo === URL CHECK (every url agy put in titles.json) ===
for %%u in (
 "https://archive.org/download/Sintel/sintel-2048-stereo_512kb.mp4"
 "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4"
 "https://archive.org/download/ElephantsDream/ed_hd_512kb.mp4"
 "https://archive.org/download/BigBuckBunny_328/big_buck_bunny_720p_surround.mp4"
 "https://durian.blender.org/wp-content/themes/orange/subtitles/sintel_en.srt"
 "https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/test.srt"
 "https://orange.blender.org/subtitles/ed_en.srt"
 "https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_poster.jpg"
 "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80"
) do curl -s -o NUL -I -L -A "Mozilla/5.0" --max-time 20 -w "%%{http_code}  %%~u\n" %%u
echo.
echo === INSTALL RELEASE APK ===
"%ADB%" -s emulator-5554 install -r "%P%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk"
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity
ping -n 9 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\a-catalog.png"
echo === PLAY ===
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 21 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\b-player-t1.png"
ping -n 26 127.0.0.1 >nul
"%ADB%" -s emulator-5554 exec-out screencap -p > "%SHOTS%\c-player-t2.png"
echo === LOGCAT (video/JS errors) ===
"%ADB%" -s emulator-5554 logcat -d -v brief ReactNativeVideo:V ExoPlayerImplInternal:E ExoPlayer:E ReactNativeJS:E AndroidRuntime:E *:S
echo === SHOTS ===
powershell -NoProfile -Command "Get-ChildItem '%SHOTS%\*.png' | ForEach-Object { $_.Name + ' ' + $_.Length + 'B ' + (Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0,12) }"
endlocal
