@echo off
set "OPS=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\ops"
call "%OPS%\cdk-deploy.cmd" > "%OPS%\cdk-deploy.log" 2>&1
echo EXITCODE=%ERRORLEVEL% > "%OPS%\cdk-deploy.done"
