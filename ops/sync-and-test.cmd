@echo off
cd /d "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv"
set YARN_ENABLE_IMMUTABLE_INSTALLS=false
echo START > ops\test-run.log
call yarn.cmd install >> ops\test-run.log 2>&1
call yarn.cmd test >> ops\test-run.log 2>&1
echo EXIT %ERRORLEVEL% >> ops\test-run.log
