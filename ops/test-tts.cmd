@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set PKG=com.amazonappdev.narratv
echo === set a default TTS engine + max media volume on the emulator ===
"%ADB%" -s emulator-5554 shell settings put secure tts_default_synth com.google.android.tts
"%ADB%" -s emulator-5554 shell settings put secure tts_default_rate 100
"%ADB%" -s emulator-5554 shell media volume --stream 3 --set 15
"%ADB%" -s emulator-5554 shell settings get secure tts_default_synth
echo === does Google TTS have voice data? ===
"%ADB%" -s emulator-5554 shell "ls /data/data/com.google.android.tts/ 2>/dev/null | head -5"
"%ADB%" -s emulator-5554 shell "dumpsys package com.google.android.tts | grep -i -E 'versionName|enabled='" 
echo === relaunch app, play, and watch for real synthesis ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 10 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 20 127.0.0.1 >nul
echo === TTS + audio pipeline evidence ===
"%ADB%" -s emulator-5554 logcat -d -v brief TextToSpeech:* TtsService:* GoogleTTS:* AudioTrack:* AudioFlinger:I NetworkSynthesisRequest:* *:S
