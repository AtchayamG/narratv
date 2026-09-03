@echo off
"C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices
tasklist | findstr /i "emulator qemu adb.exe"
