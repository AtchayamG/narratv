@echo off
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo === APK ===
powershell -NoProfile -Command "Get-Item '%P%\apps\firetv\android\app\build\outputs\apk\release\app-release.apk' -ErrorAction SilentlyContinue | ForEach-Object { $_.Length.ToString() + 'B  built ' + $_.LastWriteTime.ToString('HH:mm:ss') }"
echo === installed on emulator? ===
"%ADB%" -s emulator-5554 shell pm list packages narratv
echo === foreground activity ===
"%ADB%" -s emulator-5554 shell "dumpsys window | grep mCurrentFocus"
echo === last gradle log line ===
powershell -NoProfile -Command "$l=Get-Content '%P%\ops\gradle-release.log' -ErrorAction SilentlyContinue; if($l){ ($l | Select-String 'BUILD |EXIT ' | Select-Object -Last 2 | ForEach-Object{$_.Line}) }"
echo === recently modified source files (last 40 min) ===
powershell -NoProfile -Command "Get-ChildItem '%P%\apps' -Recurse -File -Include *.tsx,*.ts,*.json -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\' -and $_.LastWriteTime -gt (Get-Date).AddMinutes(-40) } | ForEach-Object { $_.LastWriteTime.ToString('HH:mm') + '  ' + $_.FullName.Replace('%P%\','') }"
