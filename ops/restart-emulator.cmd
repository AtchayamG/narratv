@echo off
REM Hard-restart the emulator and wait until its shell answers.
REM NOTE: the emulator is launched in its OWN detached console window (start "" /min),
REM NOT with `start /b`. With /b it shares the caller's console and dies when the calling
REM agent/script exits — that is what killed the AVD on 2026-09-03 02:25 and hung fix-tts.cmd.
set ADB=C:\Users\Atchayam\AppData\Local\Android\Sdk\platform-tools\adb.exe
set P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
echo --- stopping any dead emulator ---
taskkill /F /IM qemu-system-x86_64.exe /T >nul 2>&1
taskkill /F /IM emulator.exe /T >nul 2>&1
taskkill /F /IM adb.exe /T >nul 2>&1
ping -n 6 127.0.0.1 >nul
echo --- starting emulator in its own detached window ---
start "NarraTV Emulator" /min cmd /c ""%P%\scripts\run-emulator.bat""
ping -n 11 127.0.0.1 >nul
"%ADB%" start-server >nul 2>&1
echo --- waiting for boot (up to 4 min) ---
for /l %%i in (1,1,24) do (
  ping -n 11 127.0.0.1 >nul
  for /f "delims=" %%b in ('"%ADB%" -s emulator-5554 shell getprop sys.boot_completed 2^>nul') do (
    if "%%b"=="1" (
      echo BOOTED after about %%i0 seconds
      "%ADB%" devices
      echo --- enabling TTS (ships disabled on this image) ---
      "%ADB%" -s emulator-5554 shell pm enable com.google.android.tts
      "%ADB%" -s emulator-5554 shell settings put secure tts_default_synth com.google.android.tts
      echo EMULATOR READY
      goto :done
    )
  )
  echo   ...still booting ^(%%i^)
)
echo TIMED OUT waiting for boot - check the "NarraTV Emulator" window
:done
