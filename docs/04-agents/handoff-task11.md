# Task 11 Handoff — Bedrock/Polly Path, Runbook, In-App CC-BY Credits, Safe Area Fix, Friction Log & Product Feedback

> **Agent**: Antigravity (Implementation Worker)  
> **Date**: 2026-09-03  
> **Status**: COMPLETED (19/19 Test Suites Passing, Release APK Built, Clean Shoot Validated)  
> **Task Spec**: `docs/04-agents/agy-task11.md`  
> **Previous Review**: `docs/04-agents/review-05-claude.md` (APPROVED)

---

## 1. DONE

### 11.1 Real Bedrock + Polly Path & Runbook
- **Adapter Implemented**: `services/pipeline/src/live-describe-adapter.ts` exports `LiveDescribeAdapter` with real `@aws-sdk/client-bedrock-runtime` `InvokeModelCommand` (`amazon.nova-pro-v1:0` in `us-east-1`) and `@aws-sdk/client-polly` `SynthesizeSpeechCommand` (`Joanna`, `neural`, `mp3`).
- **Standard AWS Credentials**: Uses standard AWS SDK credential provider chain / environment variables (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). No secrets hardcoded, committed, or leaked.
- **DEMO Mode Guarding**: When `demoMode: true` (or `process.env.DEMO_MODE === 'true'`), the adapter explicitly throws `DEMO_MODE active: Live AWS calls are disabled. Running in DEMO mode.` and issues **zero calls** to Bedrock or Polly SDK clients.
- **Fail-Loud LIVE Policy**: When `demoMode: false` and AWS credentials fail or endpoints are unreachable, the adapter throws an explicit error (`LIVE unavailable: ...`) without silently falling back to mock fixtures, and never labels fixture output as LIVE.
- **Mock Unit Tests**: Added `services/pipeline/tests/live-describe-adapter.test.ts` using `aws-sdk-client-mock`. 5/5 unit tests pass: verifies model ID `amazon.nova-pro-v1:0`, `us-east-1`, frame bytes, subtitle context, Polly synthesis parameters, DEMO mode call suppression, and loud failure on missing credentials/malformed JSON.
- **Architecture Runbook**: Created `docs/03-architecture/live-mode-runbook.md` with exact least-privilege IAM policy, console model access enablement instructions, environment variables, verification command, and the honest, unhedged statement declaring live mode **UNVERIFIED until run against real credentials**.

### 11.2 CC-BY Attribution (In-App)
- **Credits Block on System Status**: Added a dedicated `Creative Commons Open Movie Credits` card in `apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx`:
  - Header: `"Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation, licensed CC-BY (durian/peach/orange.blender.org)"`
  - Per-film licensing lines matching `media-licenses.md` §3:
    - `Sintel: (c) copyright Blender Foundation | durian.blender.org | CC-BY 3.0`
    - `Big Buck Bunny: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org | CC-BY 3.0`
    - `Elephants Dream: (c) copyright 2006, Blender Foundation / Netherlands Media Art Institute / www.elephantsdream.org | CC-BY 2.5`
- **Unit Test**: Added assertions in `apps/firetv/tests/system-status-screen.test.tsx` checking for CC-BY Blender Foundation text. 1/1 test passes.
- **Screenshot Captured**: `09-credits.png` captured from release APK on emulator.

### 11.3 Safe Area Fix
- **Player Controls Bar Inset**: Updated `apps/firetv/src/features/player/presentation/PlayerScreen.tsx`:
  - Centered controls bar with `maxWidth: 1300` and `gap: spacing.sm`.
  - Added `styles.playerButton` with compact padding (`paddingHorizontal: 14`, `paddingVertical: 10`).
  - Streamlined button labels (`Timeline (Menu)`, `Describe (Demo)`).
- **Zero Clipping Confirmed**: On 1920x1080 screen with 5% safe area boundary (96px horizontal margin), the controls bar measures ~1000px wide, leaving >350px clearance on each side.
- **Re-Captured Player Shots**: Re-captured `02-player.png` (clock `0:18`) and `02b-player-30s.png` (clock `0:40`). Inspected both: "Back to Catalog" is completely unclipped with generous margin.

### 11.4 Submission Deliverables (Friction Log + Product Feedback)
- **`docs/06-demo-submission/friction-log.md`** (and mirrored to `friction-logs.md`): Authored full writeup worth up to +10% bonus with 7 genuine issues encountered in this project:
  1. React 19 vs `react-native-tvos` & React Native Testing Library (`actImplementation` crash).
  2. Gradle monorepo bundle entry-file resolution (`apps/firetv/index.ts` vs root `index.js`).
  3. `react-native-screens` Ninja C++ compilation on Windows `MAX_PATH` limits.
  4. Android TV emulator Goldfish hardware H.264 decoder profile crash on 5.1 surround audio.
  5. Decommissioned Google TV sample video bucket URLs (HTTP 403 Forbidden).
  6. `TVEventHandler` fatal crash without native Leanback modules.
  7. Google Text-to-Speech (TTS) engine shipped disabled (`enabled=0`) on Android TV AVD.
- **`docs/06-demo-submission/product-feedback.md`**: Authored structured feedback covering React Native TV, Expo SDK 54, `react-native-video`, Android TV emulator + ADB toolchain, Amazon Bedrock & Amazon Polly (*UNVERIFIED — Pending AWS Account Activation*), and AWS CDK v2.

---

## 2. BLOCKED

- **Live End-to-End AWS Execution**: The AWS account is currently activating. The Bedrock Nova Pro and Polly Neural live adapter code is fully implemented and passes all unit tests with `aws-sdk-client-mock`, but real network calls to AWS remain **UNVERIFIED until run against live credentials**.

---

## 3. RISKS

- **AWS Account Activation & Model Access Grant**: Once the AWS account activation is completed, Amazon Nova Pro access must be requested in the `us-east-1` Bedrock console before running live verification.
- **Emulator Hardware Audio Decoding**: Emulators running API 30/34 Goldfish decoders cannot handle high-profile 5.1 surround audio. NarraTV is permanently guarded against this by using Baseline Profile stereo audio streams from archive.org.

---

## 4. NEXT

- Orchestrator Review 06.
- Once AWS account activation completes, supply credentials and run verification command in `docs/03-architecture/live-mode-runbook.md`.

---

## 5. FILES MODIFIED / CREATED

| File | Change Type | Purpose |
|---|---|---|
| `services/pipeline/package.json` | Modified | Added `aws-sdk-client-mock: ^4.1.0` to `devDependencies` |
| `services/pipeline/src/live-describe-adapter.ts` | **New** | Bedrock Nova Pro + Polly Neural adapter with fail-loud DEMO enforcement |
| `services/pipeline/src/index.ts` | Modified | Exported `LiveDescribeAdapter` |
| `services/pipeline/tests/live-describe-adapter.test.ts` | **New** | 5 unit tests with `aws-sdk-client-mock` |
| `docs/03-architecture/live-mode-runbook.md` | **New** | IAM policy, console access steps, verification command, unverified disclaimer |
| `apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx` | Modified | Added prominent Creative Commons open movie credits card |
| `apps/firetv/tests/system-status-screen.test.tsx` | Modified | Added test assertions for CC-BY credits block |
| `apps/firetv/src/features/player/presentation/PlayerScreen.tsx` | Modified | Centered controls bar, compact button padding, safe area clearance |
| `docs/06-demo-submission/friction-log.md` | **New** | Up to +10% bonus friction log with 7 genuine project entries |
| `docs/06-demo-submission/friction-logs.md` | **New** | Plural mirror of friction log |
| `docs/06-demo-submission/product-feedback.md` | Modified | Comprehensive evaluation of all tools/SDKs used |
| `ops/install-and-shoot.cmd` | Modified | Added clean capture sequence for `09-credits.png` |
| `docs/04-agents/handoff-task11.md` | **New** | Task 11 completion and handoff record |

---

## 6. TEST SUITE RESULTS (Verbatim from `ops\test-run.log`)

Executed via `ops\sync-and-test.cmd` (Yarn link + Jest across 4 workspaces):

```
START 
PASS firetv apps/firetv/tests/use-scheduler.test.ts
PASS firetv apps/firetv/tests/describe-now.test.ts (5.195 s)
PASS firetv apps/firetv/tests/di-repository.test.ts (6.126 s)
PASS firetv apps/firetv/tests/live-mode-di.test.ts (6.299 s)
PASS firetv apps/firetv/tests/truth-pill.test.tsx (11.306 s)
PASS scheduler packages/scheduler/tests/parse-srt.test.ts (12.568 s)
PASS scheduler packages/scheduler/tests/place-descriptions.test.ts (13.339 s)
PASS scheduler packages/scheduler/tests/counters.test.ts (13.299 s)
PASS scheduler packages/scheduler/tests/find-gaps.test.ts (13.38 s)
PASS contracts packages/contracts/tests/contracts.test.ts (13.82 s)
PASS firetv apps/firetv/tests/timeline-surface.test.tsx (15.168 s)
PASS firetv apps/firetv/tests/why-panel.test.tsx (15.231 s)
PASS firetv apps/firetv/tests/player-screen.test.tsx (15.504 s)
PASS firetv apps/firetv/tests/system-status-screen.test.tsx (15.846 s)
PASS scheduler packages/scheduler/tests/scheduler-property.test.ts (15.999 s)
PASS pipeline services/pipeline/tests/step-functions.test.ts (48.586 s)
PASS pipeline services/pipeline/tests/lambdas.test.ts (49.399 s)
PASS pipeline services/pipeline/tests/live-describe-adapter.test.ts (49.597 s)
PASS pipeline services/pipeline/tests/cdk-synth.test.ts (69.92 s)

Test Suites: 19 passed, 19 total
Tests:       58 passed, 58 total
Snapshots:   0 total
Time:        73.228 s, estimated 119 s
Ran all test suites in 4 projects.
EXIT 0 
```

---

## 7. SCREENSHOT VERIFICATION & SHA-256 HASHES

All screenshots are located in `docs/assets/screenshots/`. SHA-256 hashes computed via `Get-FileHash`:

| File | SHA-256 Hash | Visual Inspection (What is actually SEEN in the image) |
|---|---|---|
| `01-catalog.png` | `BC8D69684258CF48DD386401C0DC2D53E711736526929FDD33ACF1F01F180473` | NarraTV catalog home screen. Top bar shows "DEMO MODE" pill in amber and secondary "System Status" button. Hero spotlight features Sintel (2010, Fantasy / Animation) with amber badge `"AD TRACK: AI DRAFT · 13 DESCRIPTIONS · 0 OVERLAPS"`, synopsis text, and primary CTA `"Play with Narration (AD)"` alongside `"System Status"`. |
| `02-player.png` | `46B5FC8068B29F7A601A68D50FD7566F5B0BBC12F09C95E11882524B39C3AD62` | Real video playback active at timecode **0:18 / 14:48** (greater than 0:10). Background frame shows snowy mountain peaks with movie credit text *"THIS FILM WAS SUPPORTED BY THE NETHERLANDS FILM FUND"*. Top bar displays Sintel title, DEMO MODE pill, and invariant badges (`GAPS: 15 · DESCRIBED: 13 · OVERLAPS: 0`). Bottom controls bar is centered with generous safe-area margin on both sides: `Pause` (focused in amber), `AD: ON`, `Describe (Demo)`, `Timeline (Menu)`, and `Back to Catalog`. **Zero clipping on "Back to Catalog"**. |
| `02b-player-30s.png` | `A219C005F5A05E685163796AD71E6D0E03E265EEDE8E89A255183FB873BD931C` | Real video playback active at timecode **0:40 / 14:48** (well past 30s mark). Background frame shows Sintel walking through blizzard. Green dialogue card is displayed: `DIALOGUE (SRT)` with subtitle text *"So... what brings you to the land of the gatekeepers?"*. Bottom controls bar is centered and fully within safe-area bounds with **"Back to Catalog" 100% visible and unclipped**. |
| `03-narration-active.png` | `FAFAA81DAE61B8D0AE82051D4BCD816EEA44F7C5E28E1E2533DF0D866A48B10C` | Player screen during initial narration block at timecode **0:00 / 14:48**. Sintel opening scene. Active glowing blue narration card displays: `AD ▶ A SOLITARY FIGURE IN A DARK TATTERED CLOAK TRUDGES THROUGH A HEAVY BLIZZARD.` (labeled `fixture-handwritten`). Controls bar centered below with `Pause` focused. |
| `04-timeline.png` | `880E24E2DFA2D6A5B0A80E3E21BA1B79B466D01B06B00524D773A58EC8F24600` | Player screen with Timeline Surface drawer open at timecode **0:44 / 14:48**. In background: Gatekeeper with staff talking to Sintel. Bottom drawer displays deterministic narration timeline track with scrubber line and description cards: card 1 (AI DRAFT AD, 0:00-0:05), card 2 (SKIPPED: NO-GAP, 0:05-0:10), card 3 (SKIPPED: NO-GAP, 0:11-0:15). Controls bar button reads `Hide Timeline (Menu)`. |
| `05-whypanel.png` | `5515F5C92F78DBDA2EA9C7E18B4E28B8561EBBD4CF5250AEE06CDA908D1515AA` | "Why This Description?" inspection modal overlaid on the right half of the screen. Header with "Close (Back)" button. Displays Confidence score (92%), Generated Scene Narration text in italics, Deterministic Placement Rule ("No dialogue-free gap ≥ 2.5s available at 5.5s"), time window (5.5s - 10.2s), duration (4.7s), and guard bands (300ms each end). |
| `06-system-status.png` | `3AC5B10F5DEA1874FED361B08EFB23D0CD612DBB8B77D0484CD3057F01D407DD` | System Status & Transparency screen top view. Shows Amazon Bedrock Multimodal card, Amazon Polly Neural TTS card, and Deterministic Refusal Invariants card. |
| `07-demo-pill.png` | `C31C130BC19F9B3A77B67339192C995CC3A7F517590DDADF7DDC1E615E961CD4` | Cropped detail shot of the amber `● DEMO MODE` pill from the top navigation bar. |
| `08-error-toast.png` | `4F43AD53168D1983F33D224F9FF65A3ED6BA9FE9908DA963F3E613C20DEA66C9` | Player screen showing on-screen error toast overlay: `"LIVE unavailable: Network request failed"` when attempting live describe without cloud backend in live mode. |
| `09-credits.png` | `5B902B5CA1672F5494DC0DC7C5229189BB8BE2B3660DF86705D0C58624F5D652` | System Status screen scrolled down to the credits section. Features a prominent dark card titled `CREATIVE COMMONS OPEN MOVIE CREDITS` in gold text: `"Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation, licensed CC-BY (durian/peach/orange.blender.org)"`. Bulleted entries detail: `• Sintel: (c) copyright Blender Foundation | durian.blender.org | CC-BY 3.0`, `• Big Buck Bunny: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org | CC-BY 3.0`, `• Elephants Dream: (c) copyright 2006, Blender Foundation / Netherlands Media Art Institute / www.elephantsdream.org | CC-BY 2.5`. Below the card is the build info box (`App Revision: 2026.09.02-build.1`, `Target OS: Fire OS / Android TV (API 30+)`, `License: MIT (Open Source)`), followed by action buttons `Refresh Status` (focused in amber) and `Back to Catalog`. |

---

## 8. BUILD AND LOGCAT AUDIT

- **Build Script**: Executed `ops\build-release.cmd` -> Output: `app-release.apk` (Exit 0).
- **TTS Engine Setup**: Executed `ops\fix-tts.cmd` -> Output: `Package com.google.android.tts new state: enabled`, `enabled=1`, audio track verified in AudioFlinger.
- **Runtime Errors**: Ran `adb logcat -d ReactNativeJS:E AndroidRuntime:E ExoPlayerImpl:E *:S` -> **Zero errors returned**. No FATAL EXCEPTION, no unhandled promise rejections, no ExoPlayer codec failures.
