# Product & Tool Feedback — Amazon Developer Hackathon 2026

> **Submission Requirement**: Comprehensive feedback for every tool, API, and SDK used in the project.  
> **Author**: Atchayam G (solo entrant)  
> **Project**: NarraTV (Fire TV Track + AWS Builder Mini-Challenge)

---

## 1. React Native TV / `react-native-tvos` (v0.81.0)

* **What Worked**:
  * **10-Foot Spatial Navigation**: Automatic D-pad focus engine correctly calculates Euclidean distance across cards and buttons.
  * **TV-Specific Focus Hooks**: `hasTVPreferredFocus={true}` allowed seamless initial focus selection on the primary CTA when opening screens.
  * **Performance**: Excellent 60 FPS rendering on Android TV with Hermès JS engine.
* **What Needs Improvement**:
  * **Leanback Module Guarding**: `useTVEventHandler` crashes with fatal exceptions when native TV modules are unlinked or missing in standard APK builds instead of degrading gracefully with a fallback or boolean check.
  * **Official TV UI Components**: Developers currently have to hand-craft TV focus rings, overscan safe padding, and D-pad navigable carousels. An official Amazon Fire TV design library for React Native would save dozens of hours.
* **Onboarding Experience**: Moderate. The Callstack TV guide was helpful, but documentation regarding monorepo integration with Yarn workspaces was sparse.
* **Would You Build With It Again?**: Yes. For cross-platform 10-foot television applications, `react-native-tvos` is the strongest declarative option available today.

---

## 2. Expo SDK 54 & Prebuild Toolchain

* **What Worked**:
  * **Module Autolinking**: Expo config plugins (`expo-build-properties`) cleanly injected `minSdkVersion = 28`, `targetSdkVersion = 34`, and Android TV intent filters (`android.intent.category.LEANBACK_LAUNCHER`).
  * **Font & Asset Bundling**: Custom Space Grotesk typography loaded reliably with zero runtime flicker.
* **What Needs Improvement**:
  * **Monorepo Root Detection**: Metro and Gradle packaging require explicit relative path wiring when Expo is placed in an `apps/firetv` workspace.
  * **React 19 Compatibility**: Upgrading to React 19 caused unit testing regressions in `react-test-renderer` requiring custom polyfills.
* **Onboarding Experience**: Smooth. `npx expo` CLI diagnostics and clear config plugin interfaces made native configuration straightforward.
* **Would You Build With It Again?**: Yes. The ability to manage native Android manifests declaratively without maintaining raw Java/Kotlin boilerplate is a major advantage.

---

## 3. `react-native-video` (v6.13.0 with ExoPlayer Media3)

* **What Worked**:
  * **Hardware Acceleration**: Video decoding leverages `MediaCodec` and host GPU virtualization smoothly.
  * **Precise Timecode Events**: Native `onProgress` callbacks provide millisecond-accurate video timestamps (`currentTime`), enabling deterministic synchronization with our audio description scheduler.
* **What Needs Improvement**:
  * **High-Bitrate Ingest Fallbacks**: When hardware decoders fail to allocate high-profile surround audio (e.g. on emulators), ExoPlayer throws fatal initialization errors rather than gracefully downmixing audio streams.
  * **Documentation for Android TV Remote Controls**: Examples for hooking Fire TV media keys (Play, Pause, Fast Forward, Rewind) directly to video player controls are missing from the README.
* **Onboarding Experience**: Good. Standard props (`paused`, `resizeMode`, `onProgress`) are intuitive and behave consistently across platforms.
* **Would You Build With It Again?**: Yes. For streaming video playback on Android TV, ExoPlayer under `react-native-video` is the industry standard.

---

## 4. Android TV Emulator (x86_64 AVD, API 30/34) & ADB Toolchain

* **What Worked**:
  * **Visual Fidelity**: Accurate 1080p rendering with host GPU acceleration (`-gpu host`) faithfully models Fire TV television screens.
  * **ADB Input Emulation**: `adb shell input keyevent DPAD_CENTER / DPAD_DOWN` enabled 100% automated regression test scripts and screenshot capture pipelines (`ops\install-and-shoot.cmd`).
* **What Needs Improvement**:
  * **Process Reliability**: Emulator QEMU child processes occasionally hang or wedge ADB sockets under rapid APK reinstall cycles, requiring hard kills (`taskkill /F /IM qemu-system-x86_64.exe`).
  * **Disabled Accessibility Services**: Shipping Google Text-to-Speech (TTS) disabled (`enabled=0`) on default Android TV system images causes accessibility-dependent apps to appear broken until manually rescued via ADB.
* **Onboarding Experience**: High friction on Windows due to path length limitations and emulator cold-boot latency.
* **Would You Build With It Again?**: Yes for local development and CI pipelines, but physical Fire TV Stick 4K hardware is recommended for final release validation.

---

## 5. Amazon Bedrock & Amazon Polly *(UNVERIFIED — Pending AWS Account Activation)*

* **What Worked (Design & SDK Integration)**:
  * **Unified Multimodal SDK**: `@aws-sdk/client-bedrock-runtime` `InvokeModelCommand` provides a clean, unified payload schema for sending Base64 video frame buffers alongside system constraints to Amazon Nova Pro (`amazon.nova-pro-v1:0`).
  * **Concise Instruction Following**: Amazon Nova Pro's prompt architecture is ideally suited for strictly bounded generation (≤18 words, JSON output schema, zero dialogue repetition).
  * **Polly Neural Voices**: Polly's `neural` engine (`Joanna`, `Matthew`) provides natural, intelligible speech pacing essential for audio description without masking background cinema audio.
* **What Needs Improvement**:
  * **Native Video Chunk Endpoint**: Having a direct video stream chunk ingestion API in Bedrock (rather than requiring frame-by-frame JPEG extraction) would dramatically simplify real-time live television AD pipelines.
  * **Polly Speech Rate Target Duration**: An option to specify a target duration (e.g. `targetDurationSec: 3.2`) to fit audio descriptions into exact dialogue gaps without manual word-budgeting would be a game-changer for accessibility developers.
* **Onboarding Experience**: Promising in terms of API design, though model access permissions in AWS console add friction for new developer accounts.
* **Would You Build With It Again?**: Yes. Amazon Nova Pro combined with Polly Neural offers the ideal cost/latency balance for real-time multimodal accessibility systems.

---

## 6. AWS CDK v2 (TypeScript)

* **What Worked**:
  * **Type-Safe Infrastructure as Code**: Defining S3 buckets, Step Functions state machines, and Lambda functions in pure TypeScript with full autocomplete and compile-time validation.
  * **Fast Local Synthesis**: `cdk synth` generated pristine CloudFormation templates in under 2 seconds without external cloud dependencies.
* **What Needs Improvement**:
  * **Cross-Workspace Asset Bundling**: Packaging Lambda functions located across a monorepo workspace can be cumbersome without Docker or esbuild plugins.
* **Onboarding Experience**: Excellent. CDK v2 consolidated constructs into a single package, eliminating the legacy dependency mismatches of v1.
* **Would You Build With It Again?**: Absolutely. It is the premier tool for reproducible serverless infrastructure on AWS.
