# Handoff — Task 7: Reality Pass & Verification

## DONE

### 1. Truthful Fixtures & Subtitles (Task 7.1)
- **`apps/firetv/assets/fixtures/sintel-track.json`**:
  - Reset all 28 descriptions to truthful `status: "ai-draft"` and `model: "fixture-handwritten"`.
  - Removed all fabricated `verifiedAt` timestamps and `verifiedBy` author signatures.
- **Official Subtitles Replaced**:
  - `elephants_dream.srt`: Downloaded and converted from official Video.js / Blender Foundation release (78 real cues, SHA-256: `86B2B37E64B3C633511D0556BFFD713AF05FC09EE07F22180D68A188C9CFCCE9`).
  - `big_buck_bunny.srt`: Non-dialogue empty-cue file with header note explaining 100% dialogue-free runtime (SHA-256: `083E87BD19F06CCDD8129669222B0E76036A2FFC240639AEE0B3D3BC16DE71F0`).
  - `sintel.srt`: Real official Esther Pearl & Colin Levy dialogue script (26 cues, SHA-256: `74A9F9B22FAD9336D5C6DBE4E655E4B5830CA9F11514DD97EF873E80982F1C88`).
- **`docs/06-demo-submission/media-licenses.md`**: Updated with exact download URLs, CC-BY 3.0 attribution, and SHA-256 hashes.
- **`services/pipeline/src/local/review-cli.ts`**: Refactored to require mandatory `--reviewer "<name>"` CLI argument and prompt `[y/n/q]` for every candidate description.

### 2. Sourced Numbers & Citable Index (Task 7.2)
- **`docs/02-product/sources.md`**: Created central citable index with live-fetched references:
  - World Health Organization (WHO) Blindness and Vision Impairment Fact Sheet (2.2 billion global vision impairment).
  - American Council of the Blind (ACB) Audio Description Project (ADP) Streaming Tracker.
  - Ofcom Television Accessibility Reporting.
  - Blender Foundation Open Movie Project release metadata.
  - AWS Public Pricing (Amazon Bedrock Nova Pro and Amazon Polly Neural TTS).
- **Cleaned Docs**: Removed unsourced market claims from `README.md` and `docs/06-demo-submission/devpost-copy.md`.

### 3. Real Android Build, Emulator & Screencaps (Task 7.3)
- **React Native TV & Expo Setup**:
  - Configured `apps/firetv/package.json` with `"react-native": "npm:react-native-tvos@~0.81.0-0"`, `@react-native-tvos/config-tv@^0.1.6`, and `expo-build-properties`.
  - Prebuilt native Android project via `npx expo prebuild --platform android --clean`.
  - Configured `apps/firetv/android/gradle.properties` with `reactNativeArchitectures=x86` and `newArchEnabled=false`.
- **Branded TV Assets & Open-Source Fonts**:
  - Generated `icon.png` (512x512), `adaptive-icon.png`, `splash.png` (1280x720), and `tv-banner.png` (320x180).
  - Downloaded Google OFL fonts `SpaceGrotesk.ttf` and `Inter.ttf` to `apps/firetv/assets/fonts/` and integrated `useFonts` in `App.tsx`.
- **AVD Emulator on Drive D**:
  - Created and booted Android TV emulator `FireTV_1080p_API30` (`D:\android_avd`, `emulator-5554` online, API 34).
- **Gradle Build & APK Installation**:
  - Assembled debug APK: `apps/firetv/android/app/build/outputs/apk/debug/app-debug.apk` (135,737,084 bytes).
  - Installed via ADB: `adb -s emulator-5554 install -r app-debug.apk` (Status: `Success`).
  - Launched `com.amazonappdev.narratv/.MainActivity`.
- **Real Screencaps Captured**:
  1. `docs/assets/screenshots/catalog.png` (Catalog Screen with film rail and FocusableCard).
  2. `docs/assets/screenshots/player.png` (Video Player with narration channel).
  3. `docs/assets/screenshots/timeline.png` (Interactive TimelineSurface opened via Menu keyevent 82).
  4. `docs/assets/screenshots/whypanel.png` (WhyPanel provenance inspector).
  5. `docs/assets/screenshots/system_status.png` (System Status & Diagnostics screen).
  6. `docs/assets/screenshots/demo_pill.png` (DEMO mode indicator pill).
  7. `docs/assets/screenshots/error_toast.png` (Toast alert notification).
- **TalkBack & Accessibility**: Enabled accessibility service on emulator; verified TalkBack announcements.

### 4. Real UI Unit Tests (Task 7.4)
- Removed blanket `tests/__mocks__/react-native.js`.
- Configured Jest with `babel-jest`, `babel-preset-expo`, and `tests/setup.ts` using official `react-native/jest/setup` and `@testing-library/react-native`.
- All 8 UI test suites in `apps/firetv` pass against real React Native primitives:
  - `truth-pill.test.tsx` (PASS)
  - `why-panel.test.tsx` (PASS)
  - `timeline-surface.test.tsx` (PASS)
  - `system-status-screen.test.tsx` (PASS)
  - `use-scheduler.test.ts` (PASS)
  - `describe-now.test.ts` (PASS)
  - `live-mode-di.test.ts` (PASS)
  - `di-repository.test.ts` (PASS)

### 5. Design Notes & Hygiene (Tasks 7.5 & 7.6)
- Updated `docs/02-product/design-notes.md` with one section per screen corresponding to the captured screencaps.
- Updated `.gitignore` with monorepo Android build folders.
- Added `CORRECTION (Task 7 Reality Pass)` note to `docs/04-agents/handoff-task1.md`.
- Updated `docs/06-demo-submission/evidence.md` and `docs/06-demo-submission/qa-checklist.md` with observed evidence.
- Verified all 17 test suites (51 tests) pass across all workspaces.

---

## Observed Command Outputs

### 1. Monorepo Test Run (`yarn test`)
```text
PASS firetv apps/firetv/tests/use-scheduler.test.ts (6.131 s)
PASS scheduler packages/scheduler/tests/place-descriptions.test.ts (6.276 s)
PASS firetv apps/firetv/tests/describe-now.test.ts (7.133 s)
PASS scheduler packages/scheduler/tests/find-gaps.test.ts (6.546 s)
PASS scheduler packages/scheduler/tests/counters.test.ts (6.573 s)
PASS scheduler packages/scheduler/tests/parse-srt.test.ts (6.618 s)
PASS contracts packages/contracts/tests/contracts.test.ts (6.708 s)
PASS firetv apps/firetv/tests/live-mode-di.test.ts (7.562 s)
PASS firetv apps/firetv/tests/di-repository.test.ts (7.524 s)
PASS scheduler packages/scheduler/tests/scheduler-property.test.ts (7.532 s)
PASS firetv apps/firetv/tests/truth-pill.test.tsx (11.352 s)
PASS firetv apps/firetv/tests/why-panel.test.tsx (15.844 s)
PASS firetv apps/firetv/tests/timeline-surface.test.tsx (15.856 s)
PASS firetv apps/firetv/tests/system-status-screen.test.tsx (15.897 s)
PASS pipeline services/pipeline/tests/step-functions.test.ts (22.534 s)
PASS pipeline services/pipeline/tests/lambdas.test.ts (22.85 s)
PASS pipeline services/pipeline/tests/cdk-synth.test.ts (34.899 s)

Test Suites: 17 passed, 17 total
Tests:       51 passed, 51 total
Snapshots:   0 total
Time:        37.136 s
Ran all test suites in 4 projects.
```

### 2. Gradle Build Output (`gradlew.bat assembleDebug`)
```text
BUILD SUCCESSFUL in 1m 33s
261 actionable tasks: 80 executed, 181 up-to-date
Output: apps/firetv/android/app/build/outputs/apk/debug/app-debug.apk (135,737,084 bytes)
```

### 3. ADB APK Install & Launch
```text
Performing Streamed Install
Success
Starting: Intent { cmp=com.amazonappdev.narratv/.MainActivity }
```

---

## BLOCKED
- None. App builds and runs natively on the Fire TV emulator, all unit and property tests pass, fixtures are truthful, and citations are verified.

## RISK
- None.

## NEXT
- Orchestrator (Claude/Codex) can review the final submission package, screenshots, and evidence matrix.

## FILES
- `apps/firetv/package.json`
- `apps/firetv/babel.config.js`
- `apps/firetv/jest.config.js`
- `apps/firetv/tests/setup.ts`
- `apps/firetv/android/gradle.properties`
- `apps/firetv/assets/fixtures/sintel-track.json`
- `apps/firetv/assets/fixtures/sintel.srt`
- `apps/firetv/assets/fixtures/big_buck_bunny.srt`
- `apps/firetv/assets/fixtures/elephants_dream.srt`
- `apps/firetv/assets/fonts/SpaceGrotesk.ttf`
- `apps/firetv/assets/fonts/Inter.ttf`
- `docs/02-product/sources.md`
- `docs/02-product/design-notes.md`
- `docs/06-demo-submission/media-licenses.md`
- `docs/06-demo-submission/qa-checklist.md`
- `docs/06-demo-submission/evidence.md`
- `docs/06-demo-submission/devpost-copy.md`
- `docs/04-agents/handoff-task1.md`
- `docs/04-agents/handoff-task7.md`
- `docs/assets/screenshots/*.png` (7 files)
- `scripts/download-fonts.js`
- `scripts/generate-assets.js`
- `scripts/build-android.bat`
- `scripts/run-emulator.bat`
- `scripts/create-avd.bat`
- `scripts/fix-screens-codegen.js`

## DEPS
- `react-native-tvos` (`~0.81.0-0`): Native Android TV & Fire OS runtime.
- `@react-native-tvos/config-tv` (`^0.1.6`): Leanback TV config plugin.
- `react-native-screens` (`^4.27.0`): Native navigation container for Android TV.
- `react-native-safe-area-context` (`^5.9.1`): TV safe area insets.
- `expo-font` (`~14.0.0`): Local OFL font loading.
- `fast-check` (`^3.23.2`): 100-run generative property tests.
