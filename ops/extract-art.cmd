@echo off
setlocal
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
set ART=%P%\apps\firetv\assets\art
set UA=NarraTV-hackathon/1.0 (atchayamganesh@gmail.com)
echo === Official posters from Wikimedia Commons (Blender Foundation, CC-BY) ===
curl -s -L -A "%UA%" --max-time 60 -o "%ART%\sintel_poster.jpg" -w "sintel_poster HTTP %%{http_code} %%{size_download}B\n" "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg"
curl -s -L -A "%UA%" --max-time 60 -o "%ART%\big_buck_bunny_poster.jpg" -w "bbb_poster HTTP %%{http_code} %%{size_download}B\n" "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg"
curl -s -L -A "%UA%" --max-time 60 -o "%ART%\elephants_dream_poster.jpg" -w "ed_poster HTTP %%{http_code} %%{size_download}B\n" "https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_poster.jpg"
echo === 16:9 hero frames extracted from the official archive.org masters (HTTP range seek) ===
ffmpeg -y -loglevel error -user_agent "%UA%" -ss 00:02:14 -i "https://archive.org/download/Sintel/sintel-2048-surround.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 2 "%ART%\sintel.jpg"
ffmpeg -y -loglevel error -user_agent "%UA%" -ss 00:01:05 -i "https://archive.org/download/BigBuckBunny_328/BigBuckBunny_512kb.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 2 "%ART%\big_buck_bunny.jpg"
ffmpeg -y -loglevel error -user_agent "%UA%" -ss 00:03:20 -i "https://archive.org/download/ElephantsDream/ed_hd.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 2 "%ART%\elephants_dream.jpg"
echo === result ===
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; Get-ChildItem '%ART%\*.jpg' | ForEach-Object { try { $i=[System.Drawing.Image]::FromFile($_.FullName); $d=$i.Width.ToString()+'x'+$i.Height; $i.Dispose() } catch { $d='NOT-AN-IMAGE' }; $h=(Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(); $_.Name+'  '+$_.Length+'B  '+$d+'  '+$h }"
endlocal
