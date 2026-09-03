# Friction Log — NarraTV Developer Experience & Platform Toolchain

> **Amazon Developer Hackathon (Build, Ship, Shape 2026)**  
> **Project**: NarraTV (Fire TV Track + AWS Builder Mini-Challenge)  
> **Bonus Category**: Tool & SDK Friction Log (Assessed at Stage 1, up to +10% score bonus)  
> **Author**: Atchayam G (solo entrant)  
> **Rules Compliance**: 100% genuine issues encountered and resolved on Windows 11 + Fire TV (API 30/34) + React Native TV + AWS CDK v2. Zero fabricated entries.

---

### Entry 1: React 19 vs `react-native-tvos` & React Native Testing Library
* **Task Attempted**: Running unit and component integration tests with `@testing-library/react-native` (RNTL v13) and `react-test-renderer` on React 19.1.0.
* **Steps Taken**: Executed `yarn test` across Fire TV UI components (`TruthPill`, `PlayerScreen`, `SystemStatusScreen`).
* **Expected vs Actual**: Expected tests to mount and assert UI state cleanly. Instead, test execution crashed fatally with `TypeError: actImplementation is not a function`. In React 19, internal testing fibers were refactored, and `react-test-renderer` no longer exposed the legacy `actImplementation` callback that RNTL's environment hook expected.
* **Severity**: High (blocked all automated UI regression testing).
* **Workaround**: Added a defensive polyfill fallback in `apps/firetv/tests/setup.ts` that bridges `React.act` to `actImplementation` if undefined, allowing RNTL to execute safely against React 19.
* **Suggested Fix**: The `react-native-tvos` and `@testing-library/react-native` teams should coordinate on official React 19 peer-dependency support and export a forward-compatible `act` shim.

---

### Entry 2: Gradle Monorepo Bundle Entry-File Resolution
* **Task Attempted**: Compiling standalone release APK with `./gradlew assembleRelease` inside `apps/firetv/android`.
* **Steps Taken**: Executed `ops\build-release.cmd` to bundle JavaScript and compile native binaries.
* **Expected vs Actual**: Expected the React Native Gradle plugin to locate `apps/firetv/index.ts`. Instead, the bundle task defaulted to searching the monorepo root workspace (`projects/01-firetv-narratv/index.js`), which did not exist, causing the build to fail with `The file ... index.js does not exist`.
* **Severity**: Critical (completely blocked APK generation).
* **Workaround**: Explicitly configured `entryFile = file("../../index.ts")` in `apps/firetv/android/app/build.gradle` and mapped the root directory correctly to ensure Hermès / Metro packaged the application bundle.
* **Suggested Fix**: The React Native Gradle plugin (`@react-native/gradle-plugin`) should detect Yarn/npm workspace layouts and support a top-level `entryFile` configuration without brittle relative directory traversing.

---

### Entry 3: `react-native-screens` Ninja C++ Compilation on Windows MAX_PATH Limits
* **Task Attempted**: Native compilation of C++ libraries for `react-native-screens` and Expo modules on Windows 11.
* **Steps Taken**: Ran standard Gradle build from `D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv\apps\firetv\android`.
* **Expected vs Actual**: CMake and Ninja aborted during C++ link phase with `The command line is too long` when constructing paths exceeding Windows' 260-character `MAX_PATH` inside nested `.cxx/Debug/` and object file directories.
* **Severity**: Critical (prevented native compilation on Windows development environments).
* **Workaround**: Enabled Windows long-path support via registry (`LongPathsEnabled = 1`) and shortened directory structures where possible.
* **Suggested Fix**: The Android NDK Gradle plugin and Ninja generator should unconditionally use response files (`@args.rsp`) on Windows host machines to bypass CLI length constraints.

---

### Entry 4: Android TV Emulator Goldfish Hardware H.264 Decoder Profile Limits
* **Task Attempted**: Playing master video streams inside `react-native-video` (ExoPlayer) on the Android TV emulator (API 30/34 x86_64).
* **Steps Taken**: Streamed Sintel and Big Buck Bunny 1080p MP4s encoded in H.264 High Profile (Level 4.1/4.2) with 6-channel (5.1) surround sound.
* **Expected vs Actual**: Video surface remained black or threw `MediaCodecRenderer$DecoderInitializationException`. The emulator's host-bridge hardware decoder (`c2.goldfish.h264.decoder`) failed to initialize for 5.1 multichannel audio and High Profile Level 4.2 macroblocks.
* **Severity**: Critical (threatened to prevent real video playback in the TV app).
* **Workaround**: Replaced high-bitrate surround streams with official Blender Foundation 512 kb Baseline Profile MP4 derivatives (`sintel-2048-stereo_512kb.mp4`, `BigBuckBunny_512kb.mp4`) with stereo AAC, which decode with 0 errors on `c2.goldfish.h264.decoder`.
* **Suggested Fix**: The Android TV emulator team should upgrade the Goldfish MediaCodec bridge to automatically downmix 5.1 surround to stereo and support High Profile H.264 decoding when running with `-gpu host`.

---

### Entry 5: Decommissioned Google TV Sample Video Bucket URLs (HTTP 403)
* **Task Attempted**: Using widely referenced Google TV sample video URLs (`commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4`) for streaming fixtures.
* **Steps Taken**: Executed HTTP requests and video player buffering against the Google Cloud Storage bucket.
* **Expected vs Actual**: Expected HTTP 200 video stream. In reality, the bucket returned HTTP 403 Forbidden (Google closed or permission-restricted the public sample bucket without notice).
* **Severity**: High (caused silent playback failure on clean installs).
* **Workaround**: Migrated all catalog entries to permanent, immutable Internet Archive (`archive.org`) master collections with verified HTTP 200 OK responses and proper Creative Commons licensing.
* **Suggested Fix**: Public developer samples and documentation should avoid transient cloud storage buckets and standardize on permanent open repositories like Wikimedia Commons or Internet Archive.

---

### Entry 6: `TVEventHandler` Native Module Crash in Standard Release APK
* **Task Attempted**: Subscribing to Fire TV remote keys (D-pad and Menu) in `PlayerScreen.tsx` using `useTVEventHandler` from `react-native-tvos`.
* **Steps Taken**: Invoked `useTVEventHandler` to listen for the remote `menu` key to open the timeline drawer.
* **Expected vs Actual**: The app crashed immediately upon entering the player screen with a fatal exception in logcat: `TypeError: undefined is not a function`. The underlying native Android TV modules were not linked in the standard APK build, and the bare hook threw an unhandled exception.
* **Severity**: Critical (crashed the app on user interaction).
* **Workaround**: Replaced bare `useTVEventHandler` with defensive subscription using `import * as RN from 'react-native'`, wrapped in a `try/catch` block with optional chaining: `(RN as any).TVEventHandler?.addListener?.(...)`.
* **Suggested Fix**: The `react-native-tvos` package should provide an `isTVSupported` check or internal try/catch so that missing Leanback native modules degrade gracefully rather than crashing the application.

---

### Entry 7: Google Text-to-Speech (TTS) Engine Shipped Disabled on Android TV AVD
* **Task Attempted**: Listening to synthesized scene descriptions using the built-in Android Text-to-Speech engine (`expo-speech`) during demo mode on the TV emulator.
* **Steps Taken**: Launched fresh Android TV emulator AVD and played a video with audio description enabled.
* **Expected vs Actual**: The UI indicated audio description was speaking, but the emulator produced zero audio. Inspection via `adb logcat` and `dumpsys package com.google.android.tts` revealed that `com.google.android.tts` ships in state `enabled=0` (disabled) on default Android TV system images!
* **Severity**: High (the accessibility audio description product was completely mute).
* **Workaround**: Created an automated recovery script `ops\fix-tts.cmd` that executes `adb shell pm enable com.google.android.tts` and configures `settings put secure tts_default_synth com.google.android.tts` after emulator boot.
* **Suggested Fix**: The Android TV emulator system image should ship with the default Google TTS package enabled (`enabled=1`) by default, ensuring accessibility features work out-of-the-box.
