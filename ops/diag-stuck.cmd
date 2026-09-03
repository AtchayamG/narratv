@echo off
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
echo === time ===
time /t
echo === adb devices ===
"%ADB%" devices
echo === processes ===
tasklist | findstr /i "qemu emulator adb.exe java.exe node.exe"
echo === how long has fix-tts been running? ===
wmic process where "name='cmd.exe'" get ProcessId,CreationDate,CommandLine /format:list 2>nul | findstr /i "fix-tts install-and-shoot build-release sync-and-test"
