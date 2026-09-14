@echo off
REM Prove the DEPLOYED endpoint works - not the unit tests, the real thing.
REM
REM This script exists because the unit suite was green while every deployed
REM route returned HTTP 500: the handler read API Gateway payload format 1.0
REM (httpMethod/path) and the HTTP API sends 2.0 (rawPath/requestContext).
REM Only a real request over the wire catches that class of bug.
setlocal
set "API=https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com"

echo === GET /health ===
curl -s -m 25 -w "  <- HTTP %%{http_code} in %%{time_total}s\n" "%API%/health"
echo.
echo === POST /describe  (real Bedrock Nova Pro round trip) ===
curl -s -m 60 -w "  <- HTTP %%{http_code} in %%{time_total}s\n" -X POST "%API%/describe" ^
  -H "Content-Type: application/json" ^
  -d "{\"titleId\":\"sintel\",\"tSec\":2.0,\"frameRef\":\"sintel@00:02\"}"
echo.
echo === POST /describe with a deliberately bad body (must refuse, not invent) ===
curl -s -m 30 -w "  <- HTTP %%{http_code}\n" -X POST "%API%/describe" ^
  -H "Content-Type: application/json" -d "{\"nonsense\":true}"
echo.
echo === unknown route (must 404 with the real method, not 'undefined') ===
curl -s -m 25 -w "  <- HTTP %%{http_code}\n" "%API%/definitely-not-a-route"
endlocal
