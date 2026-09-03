@echo off
for %%u in (
 "https://archive.org/download/Sintel/sintel-en.srt"
 "https://archive.org/download/ElephantsDream/ed_hd.srt"
 "https://upload.wikimedia.org/wikipedia/commons/0/0c/ElephantsDreamPoster.jpg"
 "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg"
 "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg"
) do curl -s -o NUL -I -L -A "Mozilla/5.0" --max-time 20 -w "%%{http_code}  %%~u\n" %%u
