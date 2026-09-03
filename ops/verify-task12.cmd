@echo off
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo === IS TALKBACK EVEN INSTALLED ON THIS AVD? ===
"%ADB%" -s emulator-5554 shell "pm list packages | grep -i -E 'talkback|marvin|accessibility'"
echo === enabled accessibility services (what actually ran) ===
"%ADB%" -s emulator-5554 shell settings get secure enabled_accessibility_services
"%ADB%" -s emulator-5554 shell settings get secure accessibility_enabled
echo === screenshot hashes ===
powershell -NoProfile -Command "Get-ChildItem '%P%\docs\assets\screenshots\*.png' | Sort-Object Name | ForEach-Object { $_.Name+'  '+$_.Length+'B  '+$_.LastWriteTime.ToString('HH:mm')+'  '+(Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0,16) }"
echo === tests ===
powershell -NoProfile -Command "Get-Content '%P%\ops\test-run.log' | Select-String '^Tests:|^Test Suites:|EXIT' | Select-Object -Last 3 | ForEach-Object{$_.Line}"
echo === the removed fake-description generator: any trace left? ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -Include *.ts,*.tsx -File | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\' } | Select-String -Pattern 'Scene action continues|placeholder desc|synthetic' | ForEach-Object { $_.Filename+':'+$_.LineNumber+': '+$_.Line.Trim() }"
echo === no-track handling present? ===
powershell -NoProfile -Command "Get-ChildItem '%P%\apps\firetv\src' -Recurse -Include *.ts,*.tsx -File | Select-String -Pattern 'NO AD TRACK|Not Generated|hasTrack|descriptions: \[\]' | ForEach-Object { $_.Filename+':'+$_.LineNumber+': '+$_.Line.Trim() } | Select-Object -First 10"
echo === secret scan (independent) ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -File -Include *.ts,*.tsx,*.js,*.json,*.md,*.cmd,*.gradle | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\|_to_delete' } | Select-String -Pattern 'credit-code|promo-code|AKIA[0-9A-Z]{16}|aws_secret_access_key' | ForEach-Object { $_.Path.Replace('%P%\','')+':'+$_.LineNumber }"
echo === ai posters gone from shipping assets? ===
powershell -NoProfile -Command "if(Test-Path '%P%\apps\firetv\assets\_to_delete_ai_posters'){'STILL PRESENT in assets'}else{'removed from assets'}; Get-ChildItem '%P%\apps\firetv\assets\art' | ForEach-Object { $_.Name }"
