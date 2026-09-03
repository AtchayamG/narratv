@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo === TTS engines installed on the emulator ===
"%ADB%" -s emulator-5554 shell "pm list packages | grep -i -E 'tts|speech|synth'"
echo === default TTS synth setting ===
"%ADB%" -s emulator-5554 shell settings get secure tts_default_synth
echo === expo-speech / TTS errors in logcat ===
"%ADB%" -s emulator-5554 logcat -d -v brief TextToSpeech:* TTS:* ExpoSpeech:* SpeechService:* AudioTrack:E *:S
echo === media volume ===
"%ADB%" -s emulator-5554 shell "dumpsys audio | grep -A3 'STREAM_MUSIC'"
echo === host audio capture devices (for recording with sound) ===
ffmpeg -hide_banner -list_devices true -f dshow -i dummy 2>&1 | findstr /i "audio DirectShow"
