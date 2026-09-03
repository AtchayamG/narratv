@echo off
REM Turn TalkBack OFF. Leave it off for screenshots and demo recording: its green focus
REM rectangles and screen-reader speech overlay everything. Turn it on only for a11y audits.
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
"%ADB%" -s emulator-5554 shell settings delete secure enabled_accessibility_services
"%ADB%" -s emulator-5554 shell settings put secure accessibility_enabled 0
echo --- now: ---
"%ADB%" -s emulator-5554 shell settings get secure accessibility_enabled
"%ADB%" -s emulator-5554 shell settings get secure enabled_accessibility_services
