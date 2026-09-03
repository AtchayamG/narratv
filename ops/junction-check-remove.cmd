@echo off
echo === Is D:\narratv a junction? ===
dir /AL D:\ | findstr /i narratv
echo === Real folder still intact? ===
dir /b "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv" | find /c /v ""
echo === Removing the LINK only (rmdir without /s never touches the target) ===
rmdir D:\narratv
if exist D:\narratv (echo STILL EXISTS) else (echo D:\narratv removed)
echo === Real folder after removal ===
dir /b "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv" | find /c /v ""
dir /b "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\apps\firetv\android\app\build\outputs\apk\release"
