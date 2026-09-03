@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
"%ADB%" -s emulator-5554 logcat -c
"%ADB%" -s emulator-5554 shell am force-stop com.amazonappdev.narratv
"%ADB%" -s emulator-5554 shell am start -n com.amazonappdev.narratv/.MainActivity >nul
ping -n 11 127.0.0.1 >nul
"%ADB%" -s emulator-5554 logcat -d -v raw ReactNativeJS:E *:S > "%TEMP%\rn-errors.txt"
type "%TEMP%\rn-errors.txt"
