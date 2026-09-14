@echo off
REM Runs the normal release build in its own detached console and drops a
REM .done marker, so a long Gradle run survives the calling shell exiting and
REM progress can be polled without holding a shell open.
setlocal
set OPS=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\ops
if exist "%OPS%\build.done" del /q "%OPS%\build.done"
start "NarraTV build" /min cmd /c ""%OPS%\build-release.cmd" & echo done > "%OPS%\build.done""
echo LAUNCHED - poll for %OPS%\build.done
endlocal
