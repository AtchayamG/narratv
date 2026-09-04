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

---

### Entry 8: `NODE_ENV=production` in the developer's shell silently breaks every React Native Testing Library suite
* **Task Attempted**: Running the Jest suite (`yarn test`) for the Fire TV app after a routine refactor of the narration scheduler.
* **Steps Taken**: `yarn test` from `apps/firetv` on a Windows 11 machine where `NODE_ENV` happened to be set to `production` at the user level (a leftover from an unrelated build tool).
* **Expected vs Actual**: Expected the component suites to mount normally. Instead **every** RNTL suite failed with `Can't access .root on unmounted test renderer`, with no mention of `NODE_ENV` anywhere in the output. The cause is that `react-test-renderer` resolves its production build when `NODE_ENV=production`, and that build does not retain the test instance the way the development build does. The failure was initially — and wrongly — attributed to our own refactor; only a `git stash` back to a known-good commit, which failed identically, isolated it.
* **Severity**: High (a full day of misdirected debugging; would silently red-wash CI for anyone with that variable set).
* **Workaround**: Added `ops/test.cmd` and `ops/test-all.cmd`, which pin `NODE_ENV=test` before invoking Jest, and made those the documented entry points so no contributor depends on ambient shell state.
* **Suggested Fix**: `react-test-renderer` (or the RNTL wrapper) should emit an explicit, actionable error when it is loaded under `NODE_ENV=production` — e.g. *"react-test-renderer was loaded in production mode; set NODE_ENV=test"* — instead of surfacing a downstream unmount error. Better still, `jest-preset` for React Native should force `NODE_ENV=test` the way `react-scripts` does.

---

### Entry 9: AWS "Free" account plan silently blocks IAM, Bedrock, CloudShell and promotional-credit redemption — with no plan-level error message
* **Task Attempted**: Standing up the live path for the AWS Builder mini-challenge: redeem the $150 Devpost promotional credit, create an IAM access key, enable Amazon Bedrock (`amazon.nova-pro-v1:0`) in `us-east-1`, and deploy a small CDK stack.
* **Steps Taken**: Created an AWS account during the hackathon window (which now defaults to the **Free** account plan), signed in as root, and navigated to Billing → Credits, then IAM, then Bedrock, then CloudShell.
* **Expected vs Actual**: Expected the standard console. Instead:
  * Billing → Credits offered no way to redeem the promotional code; AWS documentation states a free account plan "is ineligible for other promotional credits or incentive offers", but the console gives no such message at the point of failure.
  * IAM and Bedrock both **redirect to a generic "Complete your account setup" interstitial** rather than reporting that the account plan is the blocker.
  * CloudShell fails with `Unable to create the environment` and no diagnostic.
  * The console itself failed to render at all inside two embedded/managed browsers, reporting a firewall or proxy block, forcing a switch to a standalone browser.
  None of these four surfaces names the account plan as the cause, so the developer has no way to connect the symptom to the fix.
* **Severity**: **Critical** — it blocks an entire hackathon mini-challenge, and it blocks it *silently*. AWS Support case **178846263500398** was raised 2026-09-03 (severity: low) and was still unassigned with no reply after 24 hours. The project's DEMO path was built to be fully functional without AWS precisely so this could not become a single point of failure, but the LIVE path remains gated.
* **Workaround**: None available to the developer. The app ships a deterministic on-device DEMO path (device TTS + a pre-verified, human-checked description track) that exercises the identical scheduler and UI, so the product is demonstrable end-to-end while the account is gated; the Bedrock-authored path is feature-flagged behind `DEMO_MODE` and switches on with a config change once the account clears.
* **Suggested Fix**:
  1. When an account on the Free plan opens IAM, Bedrock, CloudShell or Credit redemption, say so at the point of failure — *"This service requires the paid (pay-as-you-go) account plan. Upgrade here."* — instead of redirecting to a generic setup page.
  2. Surface plan eligibility **before** a promotional code is issued, or have Devpost/AWS credit emails state plainly that the Free plan cannot redeem them.
  3. Consider auto-provisioning hackathon credit recipients onto a plan that can actually spend the credit; a credit that cannot be redeemed on the account it was issued for is worse than no credit.
  4. Give account-activation Support cases a published SLA distinct from the general low-severity queue — an account that cannot use IAM cannot do anything, so it is not a low-severity condition regardless of the ticket's category.
