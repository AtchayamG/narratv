@echo off
set "ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk"
set "ANDROID_AVD_HOME=D:\android_avd"
set "JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%PATH%"

"%ANDROID_HOME%\emulator\emulator.exe" -avd FireTV_1080p_API30 -gpu host -no-snapshot-load
