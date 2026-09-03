@echo off
set "ANDROID_HOME=C:\Users\Atchayam\AppData\Local\Android\Sdk"
set "JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

cd apps\firetv\android
call gradlew.bat assembleDebug
