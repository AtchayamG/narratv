@echo off
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
echo === screenshots (name, bytes) ===
for %%f in ("%P%\docs\assets\screenshots\*.png") do @echo %%~nxf %%~zf
echo === hashes ===
powershell -NoProfile -Command "Get-ChildItem '%P%\docs\assets\screenshots\*.png' | Get-FileHash -Algorithm SHA256 | ForEach-Object { $_.Path.Split('\')[-1] + ' ' + $_.Hash.ToLower().Substring(0,16) }"
echo === any junctions on D:\ or projects\ ===
dir /AL D:\ 2>nul | findstr "<JUNCTION>"
dir /AL "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects" 2>nul | findstr "<JUNCTION>"
echo === matroska / mkv files anywhere in project (excluding node_modules) ===
dir /s /b "%P%\*.mkv" "%P%\*matroska*" 2>nul | findstr /v node_modules
echo === files modified in last 90 minutes outside node_modules/android build ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\|\\.cxx|\\.gradle' -and $_.LastWriteTime -gt (Get-Date).AddMinutes(-90) } | ForEach-Object { $_.FullName.Replace('%P%\','') }"
