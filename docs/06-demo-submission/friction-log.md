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
* **It came back, and the workaround is why.** Later in the project a plain `yarn test` — the obvious command, and the one in every README on earth — hit this again: eight suites red, same misleading `Can't access .root on unmounted test renderer`, and another detour spent proving the cause was ambient rather than ours (`git stash`, clear the Jest cache, diff `node_modules` mtimes, check the Node version) before `echo %NODE_ENV%` said `production`. A wrapper script only protects the person who knows to use the wrapper. The guard now lives in `jest.config.js` and in `apps/firetv/tests/setup.ts` — the root config for the main process, the setup file for each worker, because a worker chooses React's dev-or-production bundle at `require` time. `yarn test` is now correct no matter what the caller's shell exports, which is where the fix should have gone the first time. **Lesson recorded on purpose: a fix that lives beside the broken path instead of on it is not a fix, it is a note.**
* **Suggested Fix**: `react-test-renderer` (or the RNTL wrapper) should emit an explicit, actionable error when it is loaded under `NODE_ENV=production` — e.g. *"react-test-renderer was loaded in production mode; set NODE_ENV=test"* — instead of surfacing a downstream unmount error. Better still, `jest-preset` for React Native should force `NODE_ENV=test` the way `react-scripts` does.

---

### Entry 9: AWS "Free" account plan silently blocks IAM, Bedrock, CloudShell and promotional-credit redemption — with no plan-level error message
* **Task Attempted**: Standing up the live path for the AWS Builder mini-challenge: redeem the $150 Devpost promotional credit, create an IAM access key, enable Amazon Bedrock (`amazon.nova-pro-v1:0`) in `us-east-1`, and deploy a small CDK stack.
* **Steps Taken**: Created an AWS account during the hackathon window (which now defaults to the **Free** account plan), signed in as root, and navigated to Billing → Credits, then IAM, then Bedrock, then CloudShell.
* **Expected vs Actual**: Expected the standard console. Instead:
  * The $150 hackathon credit sat on the account as **Active** the whole time (verified later on the Credits page: $150 valid to 2028-08-31, $0 used) while every service it could have paid for was unreachable — and AWS documentation says a free account plan "is ineligible for other promotional credits or incentive offers", so the state was self-contradictory and nothing in the console explained it.
  * IAM and Bedrock both **redirect to a generic "Complete your account setup" interstitial** rather than reporting that the account plan is the blocker.
  * CloudShell fails with `Unable to create the environment` and no diagnostic.
  * The console itself failed to render at all inside two embedded/managed browsers, reporting a firewall or proxy block, forcing a switch to a standalone browser.
  None of these four surfaces names the account plan as the cause, so the developer has no way to connect the symptom to the fix.
* **Resolution (2026-09-07, 3 days 19 hours after the account was created)**: AWS Support replied on 2026-09-06 with the actual cause, which none of the console surfaces had hinted at: **the UPI payment mandate went inactive after AISPL identity verification completed**, and that stalled the final activation step. Their words: *"your UPI payment mandate became inactive after verification completed… this prevents the final activation step from completing — which is why the console shows 'free plan' even though your account has been upgraded."* The fix was to attach a payment method that needs no mandate: adding a credit card was not enough on its own — the account only activated once the card was **set as the default payment method**, at which point IAM, Bedrock and the rest became reachable within minutes. Note also that the console's own **"Upgrade plan"** button (the one remedy the failing pages *do* offer) links to `billing/home#/freetier/upgrade`, which **silently redirects to Console Home** on an AISPL account and does nothing — so the single affordance presented to the user is a dead end.
* **Severity**: **Critical** — it blocks an entire hackathon mini-challenge, and it blocks it *silently*. AWS Support case **178846263500398** was raised 2026-09-03 (severity: low), went unanswered for 63 hours against a 24-hour target, and was resolved only after a support engineer inspected the account by hand. Four days of a five-week build were spent on an account state no console surface described. The project's DEMO path was built to be fully functional without AWS precisely so this could not become a single point of failure — which is the only reason the schedule survived it.
* **Workaround**: None that the console offers. The AWS Billing user guide documents a self-service upgrade at `billing/home#/freetier/upgrade`, and the blocked pages themselves surface it as an **"Upgrade plan"** button — but on this AISPL account that link **redirects to Console Home and does nothing**, which was verified by following it twice. So the developer is presented with exactly one remedy and it is inert. The real fix (set a non-mandate payment method as the default) is discoverable only from a support engineer. Meanwhile the app ships a deterministic on-device DEMO path (device TTS + a pre-verified, human-checked description track) that exercises the identical scheduler and UI, so the product is demonstrable end-to-end while the account is gated; the Bedrock-authored path is feature-flagged behind `DEMO_MODE` and switches on with a config change once the account clears.
* **Suggested Fix**:
  1. **Name the real cause at the point of failure.** When activation is stalled on an inactive payment mandate, IAM/Bedrock/CloudShell should say *"Your account is not fully activated: your payment mandate is inactive. Add or set a default payment method here."* — not "Complete your account setup", which sends the developer to re-do registration steps that were already complete.
  2. **Detect the mandate lapse and tell the customer.** AWS knew the mandate had gone inactive — the support engineer read it off the account in minutes. Nothing emailed the customer, and the "Welcome to AWS — your account is ready" message went out anyway. An automated notice at the moment the mandate lapses would have removed all four days.
  3. **Fix or hide the dead "Upgrade plan" button.** On an AISPL account it links to a page that redirects to Console Home. Offering a broken remedy is worse than offering none, because it convinces the developer the problem is elsewhere.
  4. **Make "added" versus "default" explicit.** A payment method that is attached but not set as default does not satisfy activation, and nothing on the Payment Preferences page says so. A warning on the card row would be enough.
  5. **Give account-activation cases their own SLA.** This one sat 63 hours against a 24-hour target in the general low-severity queue. An account that cannot open IAM cannot do anything at all, so severity should be derived from account state, not from the ticket category the customer happened to pick.

---

### Entry 10: `aws configure import` requires a CSV format the IAM console no longer produces
* **Task Attempted**: Importing a newly created IAM access key into the local credentials file so the pipeline could authenticate, using the documented one-liner `aws configure import --csv file://<downloaded>.csv`.
* **Steps Taken**: IAM console → Users → `narratv-pipeline` → Security credentials → Create access key → **Download .csv file**, then ran `aws configure import --csv` against exactly that file, unmodified, on AWS CLI v2.
* **Expected vs Actual**: Expected the credentials to be imported. Instead: `aws: [ERROR]: Expected header "User Name" not found`. The IAM console now emits a two-column file — `Access key ID,Secret access key` — while `aws configure import` still expects the legacy three-column layout that included `User Name`. **The AWS CLI cannot read the CSV that the AWS console just produced**, with no hint in the error that the format itself is the problem rather than the file being wrong or corrupt.
* **Severity**: Medium. Not a blocker once diagnosed, but it lands at the exact moment a new developer is least equipped to debug it — first credential setup — and the natural next move is to paste the secret somewhere manually, which is the outcome the import command exists to prevent.
* **Workaround**: Replaced the import call in `ops-tools/import-aws-key.cmd` with a small PowerShell step that reads the two columns itself and passes them to `aws configure set`, then deletes the CSV. The secret still never leaves the machine and never reaches a terminal transcript.
* **Suggested Fix**: `aws configure import` should accept both layouts and derive the profile name from the filename or a `--profile-name` flag when `User Name` is absent. Failing that, the error should name the mismatch — *"this CSV has columns X, Y; expected User Name, Access key ID, Secret access key"* — so the reader knows it is a format change and not a bad download.

---

### Entry 11: Amazon Bedrock returns AccessDenied for up to 2 hours after account activation, with no signal beforehand
* **Task Attempted**: The first real `InvokeModel` call to `amazon.nova-pro-v1:0` in `us-east-1`, immediately after the account finished activating and IAM credentials were confirmed working.
* **Steps Taken**: `aws sts get-caller-identity` (succeeded, correct user ARN) → `aws bedrock-runtime invoke-model --model-id amazon.nova-pro-v1:0`.
* **Expected vs Actual**: Expected either a completion or a clear quota error. Instead: `AccessDeniedException: Your account is currently being verified. Verification normally takes less than 2 hours.` Nothing in the Bedrock console says this — the Model access page has been retired and now states that serverless models "are automatically enabled… so you can start using them instantly", which is true of model access but not of account verification. **Amazon Polly, called with the same credentials seconds later, worked immediately** and returned a valid neural MP3, so the credentials and region were demonstrably fine; the gate is specific to Bedrock.
* **Severity**: Low-to-medium. The message is honest, bounded, and gives an escalation address (`aws-verification@amazon.com`) — everything the earlier account-activation failure lacked. This is what a good blocking error looks like. It is logged only because the console actively suggests the opposite is true.
* **Workaround**: Wait. The rest of the LIVE path was verified around it in the meantime, which is how we know the credentials are sound.
* **Suggested Fix**: Surface pending account verification in the Bedrock console itself — a banner on the Model catalog or Playground page — rather than only in the runtime API response. A developer reading "you can start using them instantly" and then getting AccessDenied will reasonably conclude they have an IAM problem and go rewrite policies that were never wrong.

---

### Entry 12: `babel-preset-expo` silently erases an unprefixed env var, and `api.cache(true)` then hides the fix
* **Task Attempted**: Ship a build in which the app's LIVE mode points at the deployed API Gateway endpoint, selected by an environment variable at build time (`API_URL`), exactly as the Expo docs describe for build-time configuration.
* **Steps Taken**: Set `API_URL` in the Gradle build environment → `assembleRelease` → installed the APK → System Status still reported no endpoint. Unpacked the APK and read the Hermes bundle back (`ops-tools/inspect-apk-bundle.ps1`): the value in the shipped bundle was the literal `undefined`.
* **Expected vs Actual**: Expected either the value to be inlined, or `process.env.API_URL` to remain a runtime lookup returning `undefined` — either of which is debuggable. What actually happens is that `babel-preset-expo` inlines **only** `EXPO_PUBLIC_`-prefixed variables and *replaces* every other `process.env.X` reference with `undefined` at compile time. So the code reads correct, compiles clean, and can never see the value. Then, after renaming the variable to `EXPO_PUBLIC_API_URL`, the build *still* shipped `undefined`: `api.cache(true)` in `babel.config.js` makes the transform cache insensitive to the environment, so the newly-inlined value was served from a cache entry created by a run in which the variable did not exist.
* **Severity**: **Critical, and the worst kind.** The end state was a feature that was implemented, unit-tested, documented and demoed — and had never executed once in any build we ever shipped. The test suite was green throughout, because the tests read the same compile-time `undefined` the app did. There is no warning, no error, and no line anywhere in the build output that would tell you.
* **Workaround**: Abandoned build-time configuration for this value entirely. The endpoint is now a committed constant in `apps/firetv/src/core/config.ts` and LIVE/DEMO is a **runtime** toggle on the System Status screen with a listener-based mode change — no rebuild, no env var. `apps/firetv/tests/config-env-prefix.test.ts` asserts that `config.ts` contains no `process.env` at all, so this cannot come back.
* **Suggested Fix**:
  1. **Print what was inlined.** One line in the build output — *"inlined EXPO_PUBLIC_API_URL, EXPO_PUBLIC_MEDIA_URL"* — would have ended this in two minutes instead of two days. The information is already in the transform; it is simply not surfaced.
  2. **Warn on the near-miss.** When the preset rewrites `process.env.FOO` to `undefined` and `EXPO_PUBLIC_FOO` exists in the environment, that is almost certainly a mistake and deserves a build warning.
  3. **Make the cache honest.** `api.cache(true)` combined with environment-dependent inlining is a correctness bug, not a performance tradeoff. Key the cache on the `EXPO_PUBLIC_*` set, or warn when both are in play.

---

### Entry 13: The React Native Gradle bundle task reports `UP-TO-DATE` after an environment change, and ships the previous bundle
* **Task Attempted**: Rebuild the release APK after changing a build-time environment variable, expecting a new JS bundle.
* **Steps Taken**: `assembleRelease` with the new value set. Read the task summary: the bundle task came back `UP-TO-DATE`; only 4 tasks executed.
* **Expected vs Actual**: Expected a bundle rebuild, since the bundle's *contents* depend on the environment. Gradle's up-to-date check is correctly keyed on declared **input files**, and an environment variable is not a file — so from Gradle's point of view nothing changed, and it packaged the previously built bundle. The build log reads as a successful build of the new configuration. Confirmed by deleting `app/build/generated/assets` and rebuilding: 8 tasks executed and the bundle changed.
* **Severity**: High. It compounds Entry 12 into something nearly undiagnosable — after fixing the prefix, the build *still* produced the old output, which strongly suggests the fix was wrong. Two independent silent-staleness mechanisms in series is what turned a typo-class problem into a multi-day one.
* **Workaround**: `ops/build-release-live.cmd` deletes the generated assets directory before building, so the bundle task can never be considered up to date.
* **Suggested Fix**: The bundle task should declare the `EXPO_PUBLIC_*` environment (or a hash of it) as a Gradle task input via `@Input`. That is a few lines in the plugin and it makes the up-to-date check correct rather than merely fast. Failing that, log the resolved bundle inputs when the task is skipped.

---

### Entry 14: `hasTVPreferredFocus` on the wrong control silently makes another control unreachable by D-pad
* **Task Attempted**: Use the new LIVE/DEMO toggle on the System Status screen with a television remote (`adb shell input keyevent`), as a viewer would.
* **Steps Taken**: Opened System Status, pressed DPAD_DOWN, DPAD_UP, DPAD_LEFT, DPAD_RIGHT in every combination from the initial focus position, screenshotting after each.
* **Expected vs Actual**: Expected to reach the toggle. The focus ring never arrived at it. Initial focus was on "Refresh Status" near the bottom of the page, DOWN from there reaches "Back to Catalog", and no path walks *upward* into the status cards where the toggle lives. The toggle rendered correctly, passed its component test, and was — for a person holding a remote — not present.
* **Severity**: High. This is a whole-feature outage that is invisible to every form of testing we had. A component test asserts the element exists; it cannot assert that a viewer can get to it. And on a television there is no pointer fallback: unreachable means absent.
* **Workaround**: Moved `hasTVPreferredFocus` to the toggle and removed it from "Refresh Status" — only one element per screen should claim it — then re-verified on the emulator with real keyevents.
* **Suggested Fix**:
  1. **A dev-mode warning when more than one mounted element claims `hasTVPreferredFocus`.** Today the behaviour is undefined and silent.
  2. **A reachability assertion for tests.** Something equivalent to *"from initial focus, every focusable element on this screen is reachable by D-pad"* would catch this class of bug in CI. Right now the only way to find it is to drive a running emulator and look at screenshots, which is exactly what a solo entrant skips when short on time.

---

### Entry 15: Nova Pro's self-reported confidence carries no information, and nothing says so
* **Task Attempted**: Use the model's own `confidence` value to decide which generated descriptions needed human review, so review effort could be spent where the model was unsure.
* **Steps Taken**: Authored all 44 description lines with one `InvokeModel` call per frame, asking for a confidence score alongside each description. Then reviewed every line against the frame it was written from, and compared the review outcome to the reported score.
* **Expected vs Actual**: Expected the score to correlate with correctness at least weakly. It did not correlate at all. Across the track, **19 of 34 observations were correct unaided and 15 were wrong**, and the scores did not separate the two groups. The sharpest case: two calls on the *same frame* both returned `0.95`, and both descriptions omitted the blizzard that fills the shot. Related and more serious for accessibility: shown a low-information or procedurally-drawn frame, the model does not abstain — it produces a confident description of something else.
* **Severity**: Medium for us, high for the pattern. We had the review budget to catch it. A team that ships "only review below 0.8" — an obvious and sensible-looking design — ships confident fiction to blind viewers, which is worse than shipping nothing.
* **Workaround**: Discarded the score entirely. Every line is reviewed by a human against its own frame, and the review outcome is recorded per line in the track's provenance file; the published accuracy figure is derived from those labels by script, never typed in.
* **Suggested Fix**: Either expose a calibrated uncertainty for multimodal outputs, or state plainly in the model documentation that a self-reported confidence field is unvalidated and must not be used for routing. Separately, a first-class "insufficient visual evidence" response — a way for the model to decline a frame instead of inventing against it — would be the single most valuable addition to Nova Pro for accessibility work.
