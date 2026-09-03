@echo off
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
echo === art files ===
dir "%P%\apps\firetv\assets\art"
echo === image metadata (dimensions / software tag) ===
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; Get-ChildItem '%P%\apps\firetv\assets\art\*.jpg' | ForEach-Object { $i=[System.Drawing.Image]::FromFile($_.FullName); $sw=''; foreach($p in $i.PropertyItems){ if($p.Id -eq 0x0131 -or $p.Id -eq 0x010e -or $p.Id -eq 0x9286){ $sw += [System.Text.Encoding]::ASCII.GetString($p.Value).Trim([char]0) + ' | ' } }; Write-Output ($_.Name + ' ' + $i.Width + 'x' + $i.Height + ' ' + $sw); $i.Dispose() }"
echo === who references art / where did it come from (scripts, handoff) ===
findstr /s /i /n "assets/art art\\ generate_image imagen dall nano-banana gemini poster" "%P%\scripts\*" "%P%\docs\04-agents\handoff-task9.md" 2>nul | findstr /v node_modules
echo === player: poster / video usage ===
findstr /s /i /n "poster backdrop source= Video " "%P%\apps\firetv\src\features\player\presentation\PlayerScreen.tsx" 2>nul
echo === logcat: video / exoplayer errors ===
"C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 logcat -d -v raw ReactNativeVideo:* ExoPlayer:E ExoPlayerImplInternal:E ReactNativeJS:E *:S 2>nul | findstr /i "error exception fail source" | more +0
