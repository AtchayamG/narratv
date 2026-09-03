# Handoff — Task 2: Judge-Visible Surface (Timeline, WhyPanel & Truth Badges)

## DONE
1. **TimelineSurface Component**:
   - Implemented 10-foot TV visual scrubber showing:
     - Dialogue / Subtitle blocks (Emerald Green `#10B981`)
     - Scheduled Narration blocks (Cobalt Blue `#3B82F6`)
     - Refused / Skipped blocks (Slate Grey `#64748B` with skip reason badge on focus)
     - Interactive Playhead tracking real-time playback position.
   - High contrast, 10-foot typography scale (≥28px headings, 20px body), 3px amber focus ring + glow.
2. **WhyPanel Component (Decision & Provenance Inspector)**:
   - Exposes exact provenance per description:
     - Source video frame reference (`sintel/frame_012.jpg`)
     - Model provenance (`amazon.nova-pro-v1:0` / `fixture`)
     - Confidence score (`96%`)
     - Status (`ai-draft` / `verified` / `skipped`)
     - Deterministic placement formula: `"gap 00:12.4–00:16.9, 4.5 s, fits 11 words (2.8s) with 300ms guard bands"`.
   - Accessible TalkBack announcement of full provenance tree and accessible Close button.
3. **Truth Badges & Invariant Counters**:
   - `TruthPill`: Persistent runtime mode badge displaying `DEMO MODE` (amber) or `LIVE · <latency>ms` (red). Strictly prevents displaying LIVE in `DEMO_MODE`.
   - Track status pills: `Pre-generated` / `Verified by human` / `AI draft`.
   - Real-time counters: Gaps ≥2.5s, Described count, Skipped count (by reason), and Overlaps count (`0`, dynamically computed from the scheduler, never hardcoded).
4. **Automated Verification**:
   - `timeline-surface.test.tsx`: Verified rendering of dialogue, scheduled narration, and skipped refusal blocks.
   - `why-panel.test.tsx`: Verified provenance rendering (model, confidence, frame, placement rule).
   - `truth-pill.test.tsx`: Verified demo/live mode truth rendering.
   - Test command: `npx jest --config apps/firetv/jest.config.js` → **5 passed, 0 failed, 11 tests passed (4.13s)**.
   - Overlap check across *Sintel*, *Big Buck Bunny*, and *Elephants Dream*: **0 dialogue overlaps**.

## BLOCKED
- None.

## RISK
- Video playback on low-end hardware needs hardware-accelerated video rendering; on emulator, `react-native-video` surfaces require emulator host GPU emulation.

## NEXT
- Proceed directly to **TASK 3**: AWS Pipeline code in TypeScript + AWS CDK v2 (`extract-frames`, `detect-gaps`, `describe` with Bedrock Converse, `synthesize` with Polly, `publish`, Step Functions state machine, API Gateway `/health`, and `yarn pipeline:local` dry-run runner).

## FILES
- `apps/firetv/src/shared/TruthPill.tsx`
- `apps/firetv/src/shared/Badge.tsx`
- `apps/firetv/src/shared/FocusableCard.tsx`
- `apps/firetv/src/shared/Button.tsx`
- `apps/firetv/src/shared/Toast.tsx`
- `apps/firetv/src/features/player/presentation/TimelineSurface.tsx`
- `apps/firetv/src/features/player/presentation/WhyPanel.tsx`
- `apps/firetv/src/features/player/presentation/PlayerScreen.tsx`
- `apps/firetv/tests/__mocks__/react-native.js`
- `apps/firetv/tests/__mocks__/expo-speech.js`
- `apps/firetv/tests/__mocks__/expo-av.js`
- `apps/firetv/tests/declarations.d.ts`
- `apps/firetv/tests/truth-pill.test.tsx`
- `apps/firetv/tests/timeline-surface.test.tsx`
- `apps/firetv/tests/why-panel.test.tsx`
- `docs/04-agents/handoff-task2.md`

## DEPS
- None added. Reused existing theme tokens and contracts.
