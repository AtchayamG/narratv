@echo off
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
echo === screenshot hashes ===
powershell -NoProfile -Command "Get-ChildItem '%P%\docs\assets\screenshots\*.png' | Sort-Object Name | ForEach-Object { $_.Name+'  '+$_.Length+'B  '+$_.LastWriteTime.ToString('HH:mm')+'  '+(Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0,16) }"
echo === tests ===
powershell -NoProfile -Command "Get-Content '%P%\ops\test-run.log' | Select-String '^Tests:|^Test Suites:|EXIT' | Select-Object -Last 3 | ForEach-Object{$_.Line}"
echo === new files present? ===
powershell -NoProfile -Command "'services\pipeline\src\live-describe-adapter.ts','docs\03-architecture\live-mode-runbook.md','docs\06-demo-submission\friction-log.md','docs\06-demo-submission\product-feedback.md','docs\04-agents\handoff-task11.md' | ForEach-Object { $f=Join-Path '%P%' $_; if(Test-Path $f){ (Get-Item $f).Length.ToString()+'B  '+$_ } else { 'MISSING  '+$_ } }"
echo === real AWS SDK usage (no fake fallback)? ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -Include *.ts -File | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\' } | Select-String -Pattern 'BedrockRuntimeClient|InvokeModelCommand|SynthesizeSpeechCommand|PollyClient' | ForEach-Object { $_.Filename+':'+$_.LineNumber+': '+$_.Line.Trim() } | Select-Object -First 12"
echo === silent-fallback smell check (fixture fallback in live path) ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -Include *.ts -File | Where-Object { $_.FullName -notmatch 'node_modules|\\build\\|tests' } | Select-String -Pattern 'catch.*fixture|fallback.*fixture|fixture.*fallback' | ForEach-Object { $_.Filename+':'+$_.LineNumber+': '+$_.Line.Trim() }"
echo === aws-sdk deps declared? ===
powershell -NoProfile -Command "Get-ChildItem '%P%' -Recurse -Filter package.json -File | Where-Object { $_.FullName -notmatch 'node_modules' } | ForEach-Object { $n=$_.FullName; Select-String -Path $n -Pattern 'aws-sdk' | ForEach-Object { $n.Replace('%P%\','')+': '+$_.Line.Trim() } }"
