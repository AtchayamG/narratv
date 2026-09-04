# NarraTV — Hackathon Evidence & Calibration Matrix

This document provides exact file paths, line references, test commands, and architectural proofs demonstrating compliance with all evaluation criteria for the **Amazon "Build, Ship, Shape" Developer Hackathon 2026**.

---

## 1. Fire TV & 10-Foot Experience Evidence

| Evaluation Criterion | Implementation Details | Exact Repository Evidence |
|---|---|---|
| **Android TV / Fire OS Manifest** | `LEANBACK_LAUNCHER` intent filter, `touchscreen: false`, API 30+ SDK compliance. | [`apps/firetv/app.json`](../../apps/firetv/app.json#L10-L28) |
| **10-Foot Design System** | Named theme *Cinematic Obsidian & Amber*, min 28px heading typography, 3px high-contrast amber focus borders with 1.06x scale animation and shadow glow. | [`apps/firetv/src/core/theme/colors.ts`](../../apps/firetv/src/core/theme/colors.ts)<br/>[`apps/firetv/src/core/theme/typography.ts`](../../apps/firetv/src/core/theme/typography.ts)<br/>[`apps/firetv/src/shared/FocusableCard.tsx`](../../apps/firetv/src/shared/FocusableCard.tsx) |
| **Remote DPAD Navigation** | Native Fire TV remote keys (`DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`, `DPAD_CENTER`, `MENU`, `MEDIA_PLAY_PAUSE`). | [`apps/firetv/src/core/remote-keys.ts`](../../apps/firetv/src/core/remote-keys.ts) |
| **TalkBack Screen Reader Support** | High-fidelity audio announcements (`announceForAccessibility`) on screen transitions, focus changes, and WhyPanel provenance inspector. | [`apps/firetv/src/core/accessibility.ts`](../../apps/firetv/src/core/accessibility.ts)<br/>[`apps/firetv/src/features/player/presentation/WhyPanel.tsx`](../../apps/firetv/src/features/player/presentation/WhyPanel.tsx#L14-L20) |
| **Judge-Visible Proof Surface** | `TimelineSurface` rendering color-coded dialogue (green), narration (blue), and skipped refusal blocks (grey) with interactive playhead. | [`apps/firetv/src/features/player/presentation/TimelineSurface.tsx`](../../apps/firetv/src/features/player/presentation/TimelineSurface.tsx) |

---

## 2. Deterministic Scheduler & Invariant Proofs

| Invariant / Rule | Proof & Implementation | Verification Command |
|---|---|---|
| **Zero Dialogue Collisions** | Mathematical guarantee that `[desc.tStart, desc.tEnd] ∩ [cue.tStart, cue.tEnd] = ∅` across all speech channels. | Fast-Check Property Test (100 random generative runs):<br/>[`packages/scheduler/tests/scheduler-property.test.ts`](../../packages/scheduler/tests/scheduler-property.test.ts)<br/>`yarn workspace @narratv/scheduler test` |
| **300ms Guard Bands** | Ensures 300ms silence before dialogue begins and after dialogue ends. | [`packages/scheduler/src/find-gaps.ts`](../../packages/scheduler/src/find-gaps.ts#L22-L35) |
| **Speech Rate Budgeting** | Words-per-second budget (2.5 words/sec) with refusal reason `too-long` for oversized text. | [`packages/scheduler/src/place-descriptions.ts`](../../packages/scheduler/src/place-descriptions.ts#L30-L55) |
| **Dynamic Invariant Auditor** | Real-time counter calculating gaps, described count, and verifying `overlapCount === 0`. | [`packages/scheduler/src/counters.ts`](../../packages/scheduler/src/counters.ts#L10-L45) |

---

## 3. AWS Cloud Architecture Evidence

| AWS Service | Architectural Role | Source File Reference |
|---|---|---|
| **AWS CDK v2** | Infrastructure-as-code deploying S3, CloudFront, 6 Node.js 22.x Lambdas, Step Functions, and HTTP API Gateway. | [`services/pipeline/src/cdk/narratv-stack.ts`](../../services/pipeline/src/cdk/narratv-stack.ts) |
| **Amazon Bedrock Converse** | Multimodal LLM scene analysis (`amazon.nova-pro-v1:0`), strict Zod JSON output validation, ≤18 word ceiling. | [`services/pipeline/src/lambdas/describe.ts`](../../services/pipeline/src/lambdas/describe.ts) |
| **Amazon Polly** | Neural TTS voice synthesis with deterministic `sha256(text+voice+engine)` caching. | [`services/pipeline/src/lambdas/synthesize.ts`](../../services/pipeline/src/lambdas/synthesize.ts) |
| **AWS Step Functions** | Orchestrates gap detection, frame extraction, Map state over gaps, backoff retries, and `MAX_BEDROCK_CALLS` ceiling. | [`services/pipeline/src/step-functions/pipeline-state-machine.ts`](../../services/pipeline/src/step-functions/pipeline-state-machine.ts) |
| **Amazon S3 & CloudFront** | OAC-secured media asset storage and global low-latency CDN delivery. | [`services/pipeline/src/cdk/narratv-stack.ts`](../../services/pipeline/src/cdk/narratv-stack.ts#L16-L35) |

---

## 4. Open Source & Reproducibility Evidence

| Feature | Details | Repository Location |
|---|---|---|
| **Open Source License** | Permissive MIT License covering all monorepo code. | [`LICENSE`](../../LICENSE) |
| **Creative Commons Media** | Blender Open Movies (*Sintel*, *Big Buck Bunny*, *Elephants Dream*) with documented licenses. | [`docs/06-demo-submission/media-licenses.md`](media-licenses.md) |
| **Zero-Cloud Dry Run** | Local pipeline simulator computing prompt hashes, token usage, and cost receipts without making network calls. | [`services/pipeline/src/local/pipeline-runner.ts`](../../services/pipeline/src/local/pipeline-runner.ts)<br/>Command: `yarn pipeline:local --title sintel --limit 3 --dry-run` |
| **Editorial Review CLI** | Human-in-the-loop verification script updating track statuses and metadata signatures. | [`services/pipeline/src/local/review-cli.ts`](../../services/pipeline/src/local/review-cli.ts)<br/>Command: `yarn review --title sintel` |

---

## 5. Fire TV Live Emulator & UI Verification

| Verification Item | Target / Environment | Observed Evidence |
|---|---|---|
| **Android TV AVD Emulator** | Android TV (API 34 / API 30+ 1080p, x86) | AVD `FireTV_1080p_API30` online via `adb devices` (`emulator-5554`) |
| **APK Build & Install** | Debug APK (`app-debug.apk`, 135 MB) | Installed via `adb install -r`, launched `com.amazonappdev.narratv/.MainActivity` |
| **Screen 1: Catalog** | 10-foot catalog rail, D-pad focus | [`01-catalog.png`](../assets/screenshots/01-catalog.png) |
| **Screen 2: Player** | Playback with synchronised narration | [`02-player.png`](../assets/screenshots/02-player.png), [`02b-player-30s.png`](../assets/screenshots/02b-player-30s.png), [`03-narration-active.png`](../assets/screenshots/03-narration-active.png) |
| **Screen 3: TimelineSurface** | Interactive track auditor (Menu key) | [`04-timeline.png`](../assets/screenshots/04-timeline.png) |
| **Screen 4: WhyPanel** | Provenance inspector (model, confidence, frame) | [`05-whypanel.png`](../assets/screenshots/05-whypanel.png) |
| **Screen 5: System Status** | Cloud transparency dashboard | [`06-system-status.png`](../assets/screenshots/06-system-status.png) |
| **Pill & error states** | Runtime status and toast alerts | [`07-demo-pill.png`](../assets/screenshots/07-demo-pill.png), [`08-error-toast.png`](../assets/screenshots/08-error-toast.png) |
| **CC-BY credits card** | In-app attribution for the Blender films | [`09-credits.png`](../assets/screenshots/09-credits.png) |
| **Honest empty state** | Titles with no generated AD track | [`10-no-track-bbb.png`](../assets/screenshots/10-no-track-bbb.png), [`11-no-track-ed.png`](../assets/screenshots/11-no-track-ed.png) |

---

## 6. Test Suite Summary Table

Run with `ops\test-all.cmd` (which pins `NODE_ENV=test` — see friction-log entry 8). Last full run 2026-09-04:

| Workspace | Suites | Passed | Failed | Coverage highlights |
|---|---|---|---|---|
| `@narratv/contracts` | 1 | 6 | 0 | Schema validation |
| `@narratv/scheduler` | 5 | — | 0 | Gap finding, placement, counters, `fast-check` property tests |
| `@narratv/firetv` | 12 | — | 0 | Real RN primitives (no blanket mocks); scheduler hook, voice selection, no-track titles, a11y audit |
| `@narratv/pipeline` | 4 | — | 0 | Lambdas, Step Functions, CDK synth, live Bedrock/Polly adapter |
| **TOTAL** | **22 suites** | **87 tests** | **0** | all green |

---

## 7. Demo b-roll takes (recorded 2026-09-04, OBS + emulator process audio)

Every take was captured with OBS bound to the emulator window and to the emulator's **process-scoped** audio (`wasapi_process_output_capture`), with all other OBS audio sources muted, and each was machine-verified afterwards for picture and sound rather than eyeballed. `YAVG` is mean luma — a flat value near 16 would mean a black capture; `mean_volume` near −91 dB would mean a silent one.

> These are capture masters, not repository artefacts: `docs/assets/clips/` is gitignored so the repo stays clonable, and the published ≤3-minute demo video is what these are cut into. The filenames below are the masters on the build machine.

| Take | File | Shows | Verified |
|---|---|---|---|
| 04 | `obs-broll-04-catalog-dpad-spoken-focus-1080p60.mp4` | D-pad navigation across the catalog rail; *Sintel* carries `AD TRACK`, *Big Buck Bunny* and *Elephants Dream* carry `NO AD TRACK` — the coverage gap in one frame. The app speaks each focused card via `announceForAccessibility`, so the take is audibly navigable with the screen off. | 24 s · YAVG 39→68 · mean −19.8 dB |
| 05 | `obs-broll-05-no-ad-track-honest-state-1080p60.mp4` | *Big Buck Bunny* plays normally with the `NO AD TRACK` badge, the `AD n/a` control disabled, and the banner "Film plays normally · audio description not generated for this title". No invented narration. | 26 s · YAVG 60→202 · mean −19.9 dB |
| 06 | `obs-broll-06-demo-mode-live-refusal-1080p60.mp4` | Pressing **Describe** in DEMO mode: "LIVE unavailable — demo mode active. Set DEMO_MODE=false with AWS credentials to use live Bedrock inference." The app refuses rather than faking a result. | 32 s · YAVG 18→89 · picture never black |
| 07 | `obs-broll-07-talkback-catalog-pass-1080p60.mp4` | A real TalkBack pass over the catalog — green focus rectangles on the cards, screen-reader speech, hero updating to "Play Video (No AD Track)". TalkBack is switched back off immediately after; it is never on for any other capture. | 33 s · YAVG 39→68 · mean −18.0 dB |

**Capture caveat worth keeping.** OBS ships with "Desktop Audio" enabled, which mixes *everything playing on the machine* into a take. That was live when this session started, so any recording made before 2026-09-04 13:35 IST may contain unrelated desktop audio and must be re-checked before it goes near the published video. `ops-tools/obs-isolate-audio.mjs` mutes every source except the emulator and prints the scene contents; `ops-tools/obs-mixer.mjs` reports the mixer state without changing it. Run one of them before any take.
