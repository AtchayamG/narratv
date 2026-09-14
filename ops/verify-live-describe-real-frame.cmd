@echo off
REM The positive half of the LIVE-mode proof: send a REAL Sintel frame to the
REM deployed endpoint and see whether the description matches the picture.
REM
REM The frame is chosen deliberately: 00:36 of the real archive.org stream, a
REM hooded figure pushing into a blizzard with an arm raised against the snow.
REM That content was verified by eye during the v4.0 track audit, so the model's
REM answer can be judged rather than just received.
setlocal
set "API=https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com"
set "SRC=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\ops-tools\frames-chars\h-36s.png"
set "WORK=%TEMP%\narratv-live-frame"
if not exist "%WORK%" mkdir "%WORK%"

echo === converting the frame to jpeg ===
ffmpeg -nostdin -v error -y -i "%SRC%" -q:v 4 "%WORK%\frame.jpg"
for %%F in ("%WORK%\frame.jpg") do echo   frame.jpg %%~zF bytes

echo === base64 + request body ===
powershell -NoProfile -Command ^
  "$b=[Convert]::ToBase64String([IO.File]::ReadAllBytes('%WORK%\frame.jpg')); $o=@{titleId='sintel';timestampSec=36.0;frameBase64=$b} | ConvertTo-Json -Compress; [IO.File]::WriteAllText('%WORK%\body.json',$o)"
for %%F in ("%WORK%\body.json") do echo   body.json %%~zF bytes

echo === POST /describe with the real frame ===
curl -s -m 90 -w "\n  <- HTTP %%{http_code} in %%{time_total}s\n" -X POST "%API%/describe" ^
  -H "Content-Type: application/json" --data-binary "@%WORK%\body.json"
endlocal
