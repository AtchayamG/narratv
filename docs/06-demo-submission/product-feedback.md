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
  * **Nothing warns you about an unreachable control, and this is the defect most likely to ship.** We had a working LIVE/DEMO toggle that no television remote could ever reach: `hasTVPreferredFocus` sat on a button at the bottom of the same screen, and no D-pad path walked upward into the cards above it. The component tree was correct, the tests passed, the control rendered — and it did not exist as far as a viewer was concerned. Two things would have caught it: a dev-mode warning when more than one element on a screen claims `hasTVPreferredFocus`, and a way to assert reachability ("from initial focus, is every focusable element reachable by D-pad?") in a test rather than only by driving `adb shell input keyevent` against a running emulator, which is how we eventually found it.
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
  * **Build-time env vars fail silently three different ways, and they compound.** This cost us more time than any other issue in the project, and the end state was that a fully implemented, fully tested feature had never once executed in any build we shipped. In order:
    1. `babel-preset-expo` inlines **only** `EXPO_PUBLIC_`-prefixed variables. `process.env.API_URL` compiles to `undefined`. No warning — and the docs mention the prefix without saying that an unprefixed variable is silently erased rather than left to resolve at runtime.
    2. After renaming it, still nothing: `api.cache(true)` in `babel.config.js` makes the transform cache **insensitive to the environment**, so the newly-inlined value came from a cache keyed on a run that never had it. A cache that ignores the input that decides the output is a correctness bug, not a performance tradeoff. Either key the cache on the `EXPO_PUBLIC_*` set, or warn when `api.cache(true)` is combined with env inlining.
    3. Gradle's JS bundle task keys on **input files**. An env var change touches no file, so the task reports `UP-TO-DATE` and packages the previous bundle. The build log looks like a successful build of the new code.
    Each layer is individually defensible. Together they produce a green test suite (the tests read the same `undefined` the app did), a clean build, and a shipped binary in which the feature does not exist. **Suggestion**: one line in the build output naming the `EXPO_PUBLIC_*` variables actually inlined into this bundle would have collapsed two days into two minutes. We ended up abandoning build-time configuration entirely for a committed constant plus a runtime toggle, and added a test asserting that our config file contains no `process.env` at all.
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

## 5. Amazon Bedrock (Nova Pro) & Amazon Polly

Basis for this section: every line of the shipped description track was authored
by real `InvokeModel` calls on `amazon.nova-pro-v1:0` in `us-east-1`, one call
per frame, 44 lines; a real `SynthesizeSpeech` call on Polly Neural (`Joanna`);
and a deployed `/describe` endpoint the Fire TV app calls at runtime. Then every
model output was checked by hand against the frame it came from. The numbers
below are from that audit, not from impressions.

* **What worked**
  * **`InvokeModelCommand` with a base64 frame is genuinely simple.** One JSON
    body, image plus instructions, no separate upload step. Round trip from the
    device through API Gateway and Lambda is about two seconds, which is well
    inside what a television interaction tolerates.
  * **Nova Pro holds a hard word budget.** Told "≤18 words, no dialogue, no plot
    inference", it complies far more reliably than it gets the content right.
    For a system that must fit speech into a measured silence, a model that
    respects a length constraint is worth more than a more eloquent one.
  * **Polly Neural is intelligible under a film bed.** At 25% ducking, `Joanna`
    stays legible where the device's own TTS engine muddies.
  * **Keeping credentials off the device.** Nothing about Bedrock forced the
    key onto the television — the app calls plain HTTPS and the Lambda holds the
    role. This should be the documented pattern for any device integration.

* **What needs improvement**
  * **The biggest issue: confidence is not a signal, and the docs treat it as
    one.** We asked for a `confidence` field and got well-formed numbers that
    mean nothing. Two calls on the *same frame* both returned `0.95`, and both
    described a scene without mentioning the blizzard filling it. Across the
    whole track, **19 of 34 observations were right unaided; 15 were wrong.**
    A developer who trusts a self-reported score will ship confident fiction.
    Either give us a calibrated uncertainty, or say plainly in the model docs
    that the number carries no information.
  * **Failure mode is invention, not abstention.** Shown a procedurally-drawn
    or low-information frame, the model does not decline — it produces a
    plausible description of something else. We had to build the refusal
    ourselves. A supported "insufficient visual evidence" response for
    multimodal calls would matter to every accessibility use of this model.
  * **A post-activation hold with no visible state.** For about 40 minutes
    after the account activated, calls failed while the console showed model
    access granted. Nothing anywhere said "provisioning". See friction-log
    entry 11.
  * **No video-chunk ingestion.** Frame-by-frame JPEG extraction is our own
    pipeline step; a short-clip endpoint would remove it, and would also give
    the model motion, which is exactly the information a describer needs and a
    still frame cannot carry.
  * **Polly has no target-duration synthesis.** Audio description is
    fit-into-a-gap by nature. `targetDurationSec: 3.2` — synthesise to fit, or
    tell me it cannot — would replace our word-budget arithmetic outright.

* **Onboarding**: API design is good and the SDK is easy. The friction is all
  account state: model access, the silent hold, and no single page that says
  whether this account can call this model right now.

* **Would you build with it again?** Yes, with a human review step designed in
  from the start rather than added after an audit. The cost/latency shape suits
  this workload; the accuracy does not yet suit unattended use.

---

## 6. AWS CDK v2 (TypeScript)

* **What Worked**:
  * **Type-Safe Infrastructure as Code**: Defining S3 buckets, Step Functions state machines, and Lambda functions in pure TypeScript with full autocomplete and compile-time validation.
  * **Fast Local Synthesis**: `cdk synth` generated pristine CloudFormation templates in under 2 seconds without external cloud dependencies.
* **What Needs Improvement**:
  * **Cross-Workspace Asset Bundling**: Packaging Lambda functions located across a monorepo workspace can be cumbersome without Docker or esbuild plugins.
* **Onboarding Experience**: Excellent. CDK v2 consolidated constructs into a single package, eliminating the legacy dependency mismatches of v1.
* **Would You Build With It Again?**: Absolutely. It is the premier tool for reproducible serverless infrastructure on AWS.
