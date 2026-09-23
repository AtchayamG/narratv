# P1-01 Handoff — Extended Audio Description (WCAG 2.2 SC 1.2.7)

**Task ID**: P1-01  
**Project**: NarraTV (`projects/01-firetv-narratv`, Fire TV & Smart TV track)  
**Date**: 2026-09-23  
**Status**: DONE (Criteria A through G satisfied; monorepo 34 suites / 172 tests green; typecheck 0 errors across 4 workspaces).

---

## 1. Executive Summary & Deliverables

### The Capability Implemented
WCAG 2.2 Success Criterion 1.2.7 (Extended Audio Description):
When an audio description does not fit within dialogue-free gaps, NarraTV pauses video playback at the earliest safe point outside dialogue, speaks the description, and resumes video playback automatically.

### Viewer Controls & Default State
- **Viewer Setting**: Toggle button in Player controls bar: `Extended off` / `Extended on`.
- **Default State**: Strictly **OFF**. When OFF, behavior is byte-for-byte identical to baseline (42 descriptions scheduled, 2 refused due to dialogue collision, 0 overlaps).
- **When ON**: Delivers 42 standard descriptions and 2 extended descriptions (`sintel-ad-11` paused at 152.05 s, `sintel-ad-28` paused at 456.80 s), with 0 refused and 0 overlaps.
- **Top HUD Counter**: Displays `42 AD · 2 skipped · 13 gaps` when OFF, and `42 AD · 2 extended · 13 gaps` when ON.
- **Visual & Screen-Reader Indicator**: Displays `PAUSED FOR DESCRIPTION` pill in the lower third with `accessibilityLiveRegion="assertive"`.

### Invariants Guaranteed
1. **Safety & Dialogue Inviolability**: NarraTV never pauses or speaks inside a dialogue cue. Safe points are placed at the end of the blocking dialogue cue + 300 ms guard band. If a dialogue chain extends beyond 5.0 s, the description remains refused (`skipReason: 'no-gap'`).
2. **Quality Gates Preserved**: Candidates with confidence < 0.60 or with `status === 'skipped'` & `skipReason === 'human-rejected'` are never scheduled in either mode.
3. **Viewer Never Stuck**: A dynamic watchdog derived per description (`(durationSec ?? estimateSpeechSec(text)) + 3.0 s`) resumes playback if TTS hangs or fails. For a 9.0 s line, the watchdog waits 12.0 s (never cutting off early).
4. **Viewer Interrupt Authority**: Viewer actions (play/pause or seek/back) immediately stop in-flight TTS, clear extended pause state, and return control to the viewer.

---

## 2. Monorepo Verification (Criteria A, B, C, F)

### A. Root Typecheck
```text
> narratv-monorepo@1.0.0 typecheck
> tsc --noEmit -p packages/contracts && tsc --noEmit -p packages/scheduler && tsc --noEmit -p services/pipeline && tsc --noEmit -p apps/firetv

Clean exit 0. Zero errors across all 4 workspaces.
```

### B. Full Monorepo Test Run (`ops\test-all.cmd`)
```text
PASS scheduler packages/scheduler/tests/counters.test.ts
PASS contracts packages/contracts/tests/contracts.test.ts
PASS firetv apps/firetv/tests/truth-pill.test.tsx
PASS firetv apps/firetv/tests/badge-contrast.test.tsx
PASS scheduler packages/scheduler/tests/find-gaps.test.ts
PASS scheduler packages/scheduler/tests/parse-srt.test.ts
PASS scheduler packages/scheduler/tests/place-descriptions.test.ts
PASS firetv apps/firetv/tests/extended-mode-golden.test.ts
PASS firetv apps/firetv/tests/fixture-repository-extended.test.ts
PASS scheduler packages/scheduler/tests/validate-preplaced.test.ts
PASS firetv apps/firetv/tests/extended-mode-scheduler.test.ts
PASS scheduler packages/scheduler/tests/scheduler-property.test.ts
PASS firetv apps/firetv/tests/why-panel.test.tsx
PASS firetv apps/firetv/tests/timeline-surface.test.tsx
PASS firetv apps/firetv/tests/system-status-screen.test.tsx
PASS firetv apps/firetv/tests/accessibility-audit.test.tsx
PASS firetv apps/firetv/tests/no-track-titles.test.tsx
PASS scheduler packages/scheduler/tests/extended-mode-property.test.ts
PASS firetv apps/firetv/tests/player-screen.test.tsx
PASS firetv apps/firetv/tests/extended-toggle-ui.test.tsx
PASS firetv apps/firetv/tests/dpad-navigation.test.tsx
PASS firetv apps/firetv/tests/screen-reader-state.test.tsx
PASS pipeline services/pipeline/tests/step-functions.test.ts
PASS pipeline services/pipeline/tests/lambdas.test.ts
PASS pipeline services/pipeline/tests/live-describe-adapter.test.ts
PASS pipeline services/pipeline/tests/typecheck.test.ts
PASS pipeline services/pipeline/tests/cdk-synth.test.ts

Test Suites: 34 passed, 34 total
Tests:       172 passed, 172 total
Snapshots:   0 total
Time:        80.702 s
Ran all test suites in 4 projects.
```

---

## 3. Negative Probes (Criterion E)

All 4 negative probes were executed and confirmed to fail with exit code 1, then reverted to clean passing state:

### Probe 1: Break Pause-Point Guard in Scheduler
- **Injection**: In `packages/scheduler/src/place-descriptions.ts`, forced `findEarliestSafePoint` to return the start of the blocking cue (`return cues[0].tStart`).
- **Command**: `npx jest packages/scheduler/tests/extended-mode-property.test.ts`
- **Observed Failure**: Property test failed on Run 1 with counterexample: `Expected: false, Received: true` (pause point was placed inside a dialogue cue).
- **Reversion**: Reverted. 4/4 property tests passed across 100 runs each.

### Probe 2: Remove 300 ms Guard Band
- **Injection**: In `packages/scheduler/src/place-descriptions.ts`, changed safe point calculation from `chainEnd + guardMs / 1000` (300 ms) to `chainEnd + 0.0`.
- **Command**: `npx jest apps/firetv/tests/fixture-repository-extended.test.ts`
- **Observed Failure**: `Expected: 152.05, Received: 151.75`.
- **Reversion**: Reverted. 3/3 repository tests passed.

### Probe 3: Bypass Low-Confidence Gate
- **Injection**: In `packages/scheduler/src/place-descriptions.ts`, bypassed `draft.confidence < minConfidence` gate.
- **Command**: `npx jest packages/scheduler/tests/extended-mode-property.test.ts`
- **Observed Failure**: Invariant 3 failed (`Expected scheduled count: 0, Received: 1`).
- **Reversion**: Reverted. 4/4 property tests passed.

### Probe 4: Disable Dynamic TTS Watchdog Timer
- **Injection**: In `apps/firetv/src/features/player/domain/use-scheduler.ts`, disabled the `setTimeout` watchdog in `triggerExtendedPause`.
- **Command**: `npx jest apps/firetv/tests/extended-mode-scheduler.test.ts`
- **Observed Failure**: Test Case 4b failed (`Expected resumePlayback calls: 1, Received: 0`).
- **Reversion**: Reverted. 8/8 scheduler tests passed.

---

## 4. Fire TV Emulator Verification & Telemetry (Criterion G)

### A. Environment
- **AVD**: `FireTV_1080p_API30` (Android 11, API 30, 1920x1080 resolution).
- **TTS Engine**: `com.google.android.tts` enabled via `pm enable`.
- **Narration Voice**: Selected `en-us-x-tpf-network (en-US, Enhanced)`.

### B. Captured Telemetry Logs
```text
[narratv] narration voice: en-us-x-tpf-network (en-US, Enhanced)
[narratv] initial lead-in seeded to 1.10s
[narratv] AD sintel-ad-01 dispatch@0.97s target=2.00s leadIn=1.10s
[narratv] AD sintel-ad-01 audible@1.78s target=2.00s error=-0.22s
[narratv] AD sintel-ad-02 dispatch@7.62s target=8.50s leadIn=0.99s
[narratv] AD sintel-ad-02 audible@8.12s target=8.50s error=-0.38s
...
[narratv] extended pause triggered at 152.05s for sintel-ad-11
[narratv] video paused
[narratv] TTS finished
[narratv] video resumed
```

### C. Emulator Screenshot
- Captured on live running AVD at `docs/assets/screenshots/02d-extended-mode-active.png`:
  - Sintel playing in 1080p.
  - Top HUD displaying: `DEMO MODE` | `42 AD · 2 EXTENDED · 13 GAPS`.
  - Focused control: `Extended on` with amber focus ring.
  - Accessibility state: `accessibilityState={{ checked: true }}`.

### D. Playback Teardown
- Playback was force-stopped immediately upon test completion via `adb shell am force-stop com.amazonappdev.narratv`. The emulator is silent and idle.

---

## 5. Figures Provenance Table

| Figure Stated | Meaning | Exact Source / Reference |
|---|---|---|
| **34** | Passing test suites across monorepo | `ops\test-all.cmd`: `Test Suites: 34 passed, 34 total` |
| **172** | Passing unit / property / integration tests | `ops\test-all.cmd`: `Tests: 172 passed, 172 total` |
| **0** | Overlaps between dialogue and audio description | `packages/scheduler/tests/counters.test.ts` & `apps/firetv/tests/fixture-repository-extended.test.ts` |
| **42** | Normal playable descriptions in Sintel | `sintel-track.json` metadata & `fixture-track-repository.ts` |
| **2** | Extended descriptions scheduled when ON | `sintel-ad-11` (pause at 152.05s) and `sintel-ad-28` (pause at 456.80s) |
| **0** | Refused descriptions when Extended is ON | `fixture-track-repository.ts`: `skippedCount: 0` |
| **2** | Refused descriptions when Extended is OFF | `fixture-track-repository.ts`: `skippedCount: 2` (baseline identical) |
| **300 ms** | Safety guard band after blocking dialogue cue | `findEarliestSafePoint` in `place-descriptions.ts` |
| **5.0 s** | Max dialogue cue chain for extended pause | `MAX_EXTENDED_DELAY_SEC` in `place-descriptions.ts` |
| **4** | Negative probes executed and verified | Section 3 of this document |
| **0** | Unhandled promises / open handles | Jest run with zero warnings or hung handles |

---

## 6. Git Commits Summary (Local Only, Unpushed)

1. `8a6914f`: `test(firetv): Criterion A - regression lock for Sintel, BBB, and ED with extended OFF`
2. `4e1ba32`: `feat(contracts): add isExtended and pausePoint to Description, extendedCount to TrackMetadata`
3. `1fcf889`: `feat(scheduler): add extended mode and safe point placement`
4. `b3ee9ab`: `test(scheduler): Criterion B - fast-check property tests for extended mode invariants`
5. `84e5c32`: `feat(catalog): add extended mode to track repositories and primary path tests`
6. `62b164e`: `feat(player): Criterion C - runtime extended mode pause/resume, dynamic watchdog, and interrupt handling`
7. `457857f`: `feat(player): add extended descriptions toggle, 10-foot accessibility, and paused pill UI`
8. `9a0a822`: `test: align extended mode tests with strict TypeScript and unused locals checks`
9. `c71fa0d`: `test: update dpad navigation tests for extended descriptions toggle`
10. `beceaf7`: `feat(player): add extended pause/resume telemetry logging and reactive track reload on extended toggle`
11. `435d966`: `docs(screenshots): add Fire TV emulator capture of Extended Audio Description mode in Sintel`
12. `1e47eb4`: `docs(readme): add Extended Audio Description (WCAG 2.2 SC 1.2.7) row to verified claims table`
