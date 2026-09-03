@echo off
if not exist D:\android_avd mkdir D:\android_avd
set "ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk"
set "ANDROID_AVD_HOME=D:\android_avd"
set "JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\emulator;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"

echo Creating AVD on D:\android_avd...
echo no | "%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat" create avd -n FireTV_1080p_API30 -k "system-images;android-34;android-tv;x86" --device "tv_1080p" --force
echo AVD created successfully!
