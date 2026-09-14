@echo off
REM Launch the CDK deploy in its OWN console so it outlives the orchestrator's
REM ~60s per-call limit. CloudFront alone takes several minutes to create.
REM All paths are absolute and literal - %CD% inside a nested `start "..." cmd /c "..."`
REM was mangling the quoting and failing with "The system cannot find the path specified".
set "OPS=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\ops"
del "%OPS%\cdk-deploy.log" 2>nul
del "%OPS%\cdk-deploy.done" 2>nul
start "NarraTV CDK Deploy" /min cmd /c ""%OPS%\cdk-deploy-inner.cmd""
echo LAUNCHED
