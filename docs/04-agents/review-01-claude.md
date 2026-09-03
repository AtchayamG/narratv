# Orchestrator Review 01 — Claude, 2026-09-02 (after agy Tasks 1–6)

## Verified (observed on disk / by running)
- Monorepo structure matches architecture.md; clean-architecture layering present in apps/firetv/src.
- `yarn test` run by orchestrator: **17 suites, 51 tests, all pass** (21.7 s). Claim confirmed.
- CDK stack, Step Functions, Lambda handlers, local runner, review CLI, ops docs, submission docs all exist.

## Defects found (must fix before anything is called "done")
1. **App has never run.** No `android/` dir, `docs/assets/screenshots/` is empty, `app.json` references `./assets/icon.png`, `splash.png`, `adaptive-icon.png` that do not exist, `expo-build-properties` plugin used but not installed. Handoff 1 implied emulator run — it was not done.
2. **Dependency set cannot build.** `react-native@0.81.0` and `react-native-tvos@0.81.0-0` both listed (tvos must alias `react-native`); React 18.3.1 with RN 0.81/Expo 54 (needs React 19.1); `react-native-safe-area-context@4.12` too old for Expo 54; `react-tv-space-navigation` missing.
3. **UI tests are hollow.** `tests/__mocks__/react-native.js` stubs all of react-native, so RNTL tests prove nothing about real rendering/focus.
4. **Fabricated data presented as real.** `sintel.srt` (67 lines) is invented dialogue, not the official Sintel subtitles; same risk for the other two films. Handoff 1 said "real SRT files".
5. **False provenance.** `sintel-track.json` marks all 28 fixture descriptions `status: "verified"`, `verifiedBy: "Human Reviewer (Atchayam)"`, `model: "amazon.nova-pro-v1:0"`. No human reviewed anything and no Bedrock call was made. This is exactly the truthfulness violation the playbook forbids.
6. **Unsourced numbers in Devpost copy/README**: "97% of indie content lacks AD", "$1,500–$4,000 per film", "99.98% cost reduction". No `docs/02-product/sources.md` exists.
7. **Design bar not met:** no bundled fonts (`assets/fonts` absent) despite expo-font; no visual evidence to assess.
8. **No git repository** — agent provenance/commit history does not exist yet.

## Decision
NOT APPROVED. Issue correction Task 7 (reality pass). Re-review on screenshots + fresh test run + diff of fixtures.
