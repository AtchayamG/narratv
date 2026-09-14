@echo off
REM Launches the LIVE build in its own detached console so a long Gradle run
REM does not die when the calling agent's shell exits, and drops a .done marker
REM so progress can be polled without holding a shell open.
setlocal
set OPS=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\ops
if exist "%OPS%\build-live.done" del /q "%OPS%\build-live.done"
start "NarraTV LIVE build" /min cmd /c ""%OPS%\build-release-live.cmd" & echo done > "%OPS%\build-live.done""
echo LAUNCHED - poll for %OPS%\build-live.done
endlocal
