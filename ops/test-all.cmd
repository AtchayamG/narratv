@echo off
REM Whole-workspace test run. NODE_ENV pinned - see ops/test.cmd for why.
set "NODE_ENV=test"
set "P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv"
cd /d "%P%"
call yarn test 2>&1
