@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set PKG=com.amazonappdev.narratv
echo === Google TTS was DISABLED (enabled=0). Enabling it. ===
"%ADB%" -s emulator-5554 shell pm enable com.google.android.tts
"%ADB%" -s emulator-5554 shell "dumpsys package com.google.android.tts | grep -i 'enabled='"
"%ADB%" -s emulator-5554 shell settings put secure tts_default_synth com.google.android.tts
echo === relaunch + play, watch synthesis and audio tracks ===
"%ADB%" -s emulator-5554 shell am force-stop %PKG%
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am start -n %PKG%/.MainActivity >nul
ping -n 10 127.0.0.1 >nul
"%ADB%" -s emulator-5554 shell input keyevent DPAD_CENTER
ping -n 22 127.0.0.1 >nul
echo === evidence ===
"%ADB%" -s emulator-5554 logcat -d -v brief TextToSpeech:* TtsService:* AudioTrack:D AudioFlinger:I *:S
