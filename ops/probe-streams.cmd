@echo off
for %%u in (
 "https://archive.org/download/Sintel/sintel-1280-surround.mp4"
 "https://archive.org/download/Sintel/sintel-1024-surround.mp4"
 "https://archive.org/download/Sintel/Sintel.mp4"
 "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4"
 "https://archive.org/download/BigBuckBunny_328/BigBuckBunny.mp4"
 "https://archive.org/download/big-buck-bunny-1080p-60fps-30s/Big_Buck_Bunny_1080_10s_1MB.mp4"
 "https://archive.org/download/ElephantsDream/ed_hd.mp4"
 "https://archive.org/download/ElephantsDream/ed_1024.mp4"
) do (
  echo --- %%~u
  curl -s -o NUL -I -L -A "Mozilla/5.0" --max-time 25 -w "HTTP %%{http_code}  len %%{size_header}  type %%{content_type}  final %%{url_effective}\n" %%u
)
echo === archive.org file listings ===
curl -s -L -A "Mozilla/5.0" --max-time 25 "https://archive.org/metadata/Sintel/files" | powershell -NoProfile -Command "$j=[Console]::In.ReadToEnd() | ConvertFrom-Json; $j.result | Where-Object { $_.name -match 'mp4$|m4v$' } | ForEach-Object { $_.name + '  ' + $_.size }"
curl -s -L -A "Mozilla/5.0" --max-time 25 "https://archive.org/metadata/BigBuckBunny_328/files" | powershell -NoProfile -Command "$j=[Console]::In.ReadToEnd() | ConvertFrom-Json; $j.result | Where-Object { $_.name -match 'mp4$|m4v$' } | ForEach-Object { $_.name + '  ' + $_.size }"
curl -s -L -A "Mozilla/5.0" --max-time 25 "https://archive.org/metadata/ElephantsDream/files" | powershell -NoProfile -Command "$j=[Console]::In.ReadToEnd() | ConvertFrom-Json; $j.result | Where-Object { $_.name -match 'mp4$|m4v$' } | ForEach-Object { $_.name + '  ' + $_.size }"
