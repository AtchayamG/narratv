@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
"%ADB%" devices
echo === any accessibility / talkback package on this image? ===
"%ADB%" -s emulator-5554 shell "pm list packages -f | grep -i -E 'talkback|marvin|accessibility|switchaccess'"
echo === all google packages present (context) ===
"%ADB%" -s emulator-5554 shell "pm list packages | grep -i google | head -20"
echo === accessibility service settings ===
"%ADB%" -s emulator-5554 shell settings get secure enabled_accessibility_services
"%ADB%" -s emulator-5554 shell settings get secure accessibility_enabled
