@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
"%ADB%" -s emulator-5554 shell "ps -A | grep -i -E 'tts|narratv'"
echo === active audio players right now ===
"%ADB%" -s emulator-5554 shell "dumpsys media.audio_flinger | grep -i -E 'Client|active|Standby' | head -20"
