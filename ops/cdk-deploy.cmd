@echo off
REM Deploy the NarraTV pipeline stack to us-east-1.
REM
REM Run from services/pipeline so cdk finds cdk.json; that config runs the stack
REM from SOURCE via ts-node, so there is no stale-dist trap.
REM
REM Everything here is pay-per-use and nothing is billed hourly: no VPC, no NAT
REM gateway, no RDS, no Fargate. A $20/month budget with e-mail alerts sits on
REM the account independently of this script.
setlocal
set "PKG=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\services\pipeline"
set "OPS=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\ops"
cd /d "%PKG%"

echo === account ===
aws sts get-caller-identity --query "Account" --output text

echo === deploy ===
call yarn exec cdk deploy --require-approval never --outputs-file "%OPS%\cdk-outputs.json"
echo DEPLOY-EXITCODE=%ERRORLEVEL%

echo === outputs ===
type "%OPS%\cdk-outputs.json"
endlocal
