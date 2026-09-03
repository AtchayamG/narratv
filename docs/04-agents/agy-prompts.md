# Antigravity (agy) task prompts — NarraTV

Run in order. Open Antigravity with the workspace folder
`D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv`.
Each prompt is self-contained. After each, paste the handoff back to Claude for review before the next one.

---
## PROMPT 1 — Scaffold + deterministic scheduler + demo player

Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
First read, in this order: ./AGENTS.md, ./docs/02-product/product-brief.md, ./docs/03-architecture/architecture.md, and the four skill files listed in AGENTS.md. Follow their rules. You are a bounded worker; do not commit/push/deploy.

Task 1 — build the foundation of NarraTV, a React Native Fire TV (Fire OS/Android TV) app, on Windows.

1. Scaffold a Yarn 4 workspaces monorepo exactly as in architecture.md: apps/firetv, packages/contracts, packages/scheduler, services/pipeline (empty README only for now), docs/, ops/, LICENSE (MIT), .gitignore, .env.example. Base apps/firetv on the official AmazonAppDev pattern (react-native-tvos 0.81 + Expo SDK 54 + TypeScript + React Navigation 7 + react-tv-space-navigation, MIT-0 samples at github.com/AmazonAppDev/react-native-multi-tv-helloworld and react-native-multi-tv-app-sample). Android only; skip tvOS/web/Vega. Configure Android manifest for Fire TV: LEANBACK_LAUNCHER, touchscreen not required, TV banner, minSdk 28, targetSdk 34.
2. packages/contracts: zod schemas + TS types for Title, SubtitleCue, Gap, Description {id, tStart, tEnd, text, confidence, frameRef, model, status: "ai-draft"|"verified"|"skipped"}, DescriptionTrack, HealthResponse {mode:"demo"|"live", providers, revision}. Export JSON Schema to packages/contracts/schema/.
3. packages/scheduler: pure TypeScript, no React. `parseSrt(text)`, `findGaps(cues, minGapSec=2.5, guardMs=300)`, `placeDescriptions(gaps, drafts, wordsPerSec=2.5)` returning scheduled slots and a list of skipped items with reasons ("no-gap","too-long","low-confidence"<0.6). Add unit tests and a fast-check property test proving no scheduled slot intersects any subtitle cue. 100% of scheduler must be covered.
4. Fixtures: apps/firetv/assets/fixtures/ with metadata + real SRT subtitles for the CC-BY Blender films Big Buck Bunny, Sintel and Elephants Dream (download official subtitle files; record source URL + license in docs/06-demo-submission/media-licenses.md). Use streaming URLs from the Blender Foundation / official mirrors for video; do not bundle video files. Write a description track for Sintel so the demo works with no AWS. **Do NOT target a number of descriptions.** [CORRECTED 2026-09-03 — this line originally read "≥ 25 descriptions, realistic", and that instruction is what produced a fabricated 28-entry plot summary with invented timestamps. Asking for a quantity of "realistic" descriptions, with no requirement that they match the film, is an instruction to fabricate.] Write each description ONLY from a video frame you have actually extracted and looked at, at the timestamp you are placing it. Record that frame in `frameRef` (e.g. `sintel@01:24`) and set `model` to `human-verified-frames`. Describe as many or as few gaps as you can genuinely verify — ten true descriptions with an honest counter is a PASS; a full track you invented is a FAIL. Subtitles must come from an official published source, quoted verbatim, with the URL recorded; never transcribe from memory or a synopsis.
5. App features (clean architecture, feature-first): catalog (grid of FocusableCards, D-pad navigation, badge "AD track: <status> · N descriptions · 0 overlaps"), player (react-native-video; Scheduler hook consumes the track and speaks each slot with expo-speech device TTS; Pause/Back/Play remote keys; on-screen "AD on/off"). Config: DEMO_MODE=true default via .env; config module in src/core/config.ts.
6. Run on an Android TV emulator (create AVD "FireTV_1080p_API30", x86_64). Capture a screenshot of catalog and player into docs/assets/screenshots/. If the emulator cannot be created, report BLOCKED with the exact error.
7. Start docs/06-demo-submission/friction-logs.md and product-feedback.md now and add entries for every SDK/tool friction you hit (react-native-tvos, Expo, Android Studio, emulator, Amazon docs). These are judge-scored.
8. Write docs/04-agents/handoff-task1.md (DONE/BLOCKED/RISK/NEXT/FILES) with exact commands and test output, then paste it in chat.

Acceptance: `yarn install`, `yarn test` (contracts + scheduler green incl. property test), `yarn workspace firetv android` launches on the emulator, catalog → Sintel → play → at least one description spoken in a dialogue gap, none during dialogue.

---
## PROMPT 2 — Judge-visible surface: timeline, "Why this description?", truth badges

Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read ./AGENTS.md, ./docs/02-product/product-brief.md, ./docs/03-architecture/architecture.md, docs/04-agents/handoff-task1.md and the skill files in AGENTS.md. Bounded worker; no commits/pushes.

Task 2 — make the invisible visible on the TV screen.
1. TimelineSurface component in the player (toggle with the remote Menu key or long-press Select): a horizontal bar showing subtitle cues (green), scheduled descriptions (blue), skipped items (grey, with reason on focus), and the playhead. Must be readable at 10 ft: min 28 px text, high contrast, focus ring visible.
2. WhyPanel: when a description is focused/playing, show source frame thumbnail (fixture PNG for now), text, confidence, model, status (ai-draft / verified / skipped), and the deterministic rule that placed it ("gap 00:12.4–00:16.9, 4.5 s, fits 11 words").
3. Truth badges: top-right pill always shows runtime mode — DEMO (fixtures) / LIVE. Track cards show "Pre-generated" vs "Verified" vs "AI draft". Never render LIVE in DEMO_MODE.
4. Counters shown on the title screen and end-of-playback summary: gaps ≥2.5 s, described, skipped (by reason), overlaps (must be 0, computed from the scheduler, not hard-coded).
5. Tests: RNTL tests for TimelineSurface rendering categories and WhyPanel content; scheduler counters unit test.
6. Screenshots of timeline + WhyPanel into docs/assets/screenshots/. Append friction/product-feedback entries.
7. Handoff docs/04-agents/handoff-task2.md; paste in chat.

Acceptance: judge can see, on the TV, why each description exists and why others were refused; overlap counter reads 0 on all three titles.

---
## PROMPT 3 — AWS pipeline (Bedrock + Polly) with local runner, explicit failure, /health

Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read ./AGENTS.md, ./docs/03-architecture/architecture.md, ./packages/contracts, ./packages/scheduler and the skill files in AGENTS.md. Bounded worker; do NOT deploy to AWS and do not create AWS resources — produce code, tests and a deploy runbook only.

Task 3 — services/pipeline in TypeScript (AWS CDK v2).
1. Steps as separate, unit-tested Lambda handlers with mocked SDK clients: extract-frames (ffmpeg Lambda layer, sample 1 frame at the middle of each gap plus ±1 s), detect-gaps (re-use packages/scheduler, no duplication), describe (Bedrock Converse API, multimodal, model id configurable, default amazon.nova-pro-v1:0; strict JSON output {text, confidence} validated with contracts zod; ≤18 words; prior description passed for continuity; non-conforming → status "skipped" reason "model-invalid"), synthesize (Polly neural, one mp3 per description, idempotent key = sha256(text+voice)), publish (track JSON + mp3 to S3 under titles/{id}/; CloudFront distribution).
2. Step Functions state machine wiring the steps with Map over gaps, retries with backoff, and a max-request ceiling per run (env MAX_BEDROCK_CALLS, default 120) that stops with an explicit error — never silent truncation.
3. API: GET /titles, GET /titles/{id}/track, POST /describe (body: titleId, timestampSec → fetches the frame from S3 and calls Bedrock live, returns Description), GET /health → {mode:"live", bedrock:"ok"|"error", polly:"ok"|"error", revision}. No secrets in responses. Missing credentials → HTTP 503 with a clear message; never fixture fallback.
4. services/pipeline/local: `yarn pipeline:local --title sintel --limit 10` runs the same handlers on the dev machine (ffmpeg from PATH, real Bedrock/Polly only if AWS creds present, else `--dry-run` prints the exact requests it would make and writes a manifest with prompt hash, model id, call count, estimated cost). Do not make paid calls unless `--live` is passed explicitly; record call count in the manifest.
5. ops/deploy-runbook.md: exact `cdk bootstrap/deploy` steps, required IAM, Bedrock model-access enablement, region choice, cost estimate per 90-min film, and ops/expiry-matrix.md template (service, end date, owner) covering judging until 2026-11-20.
6. Tests: handler unit tests, state-machine definition snapshot, contracts round-trip. Append friction/product-feedback entries (CDK, Bedrock Converse, Polly, Step Functions).
7. Handoff docs/04-agents/handoff-task3.md; paste in chat.

Acceptance: `yarn test` green across workspaces; `yarn pipeline:local --title sintel --limit 3 --dry-run` produces a manifest without network calls; `cdk synth` succeeds.

---
## PROMPT 4 — LIVE mode in the app: "Describe now", Polly playback, reviewer flow

Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read ./AGENTS.md, architecture.md, handoff-task2.md, handoff-task3.md and the skill files in AGENTS.md. Bounded worker; no commits/pushes/deploys.

Task 4 — connect the app to the API without breaking DEMO_MODE.
1. Data layer: HttpTrackRepository + BedrockDescribeClient (API_URL from config) alongside FixtureTrackRepository; selection by DEMO_MODE only, in one composition root (src/core/di.ts). Domain untouched.
2. "Describe now" (long-press Play/Pause or on-screen button): sends current timestamp to POST /describe, shows a LIVE pill with elapsed ms while waiting, speaks the result, and adds it to the timeline as status "ai-draft" model "<from response>". On 503/network error show an explicit toast "LIVE unavailable: <reason>" — never a fixture substitute. In DEMO_MODE the button shows "LIVE unavailable — demo mode".
3. Audio: when the track provides mp3 URLs use them (expo-av/react-native-sound), else device TTS; audio must duck and never overlap the film's dialogue (scheduler still authoritative; cancel any narration that would run past its slot end + guard).
4. Reviewer flow (minimal, honest): `yarn review --title sintel` CLI in services/pipeline/local that lists ai-draft descriptions and lets a human mark verified/rejected, writing back to the track JSON; app shows "Verified by human · <date>" when status is verified.
5. Health screen in the app (Settings → System status) rendering /health fields and app revision.
6. Tests: repository selection, error path (503 → toast, no fallback), Describe-now hook with mocked client. Screenshots of LIVE pill and error toast. Friction/product-feedback entries.
7. Handoff docs/04-agents/handoff-task4.md; paste in chat.

Acceptance: DEMO_MODE unchanged and green; with API_URL set to a mock server (msw or a tiny express stub in tests), Describe-now round-trips and renders LIVE; with API_URL unreachable the app shows the explicit error.

---
## PROMPT 5 — Submission pack: README, evidence, video script, Devpost copy, feedback & friction logs

Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read ./AGENTS.md, all handoffs in docs/04-agents/, ../../docs/01-hackathon/rules-to-artifacts-matrix.md, and the skill files in AGENTS.md (especially submission-evidence-checklist.md and winner-calibration.md). Bounded worker; write docs only; no commits/pushes; do not touch Devpost or YouTube.

Task 5 — produce the judge-facing pack, truthfully.
1. README.md: one-sentence claim; 20-second value statement; the refusal principle; quickstart (Windows PowerShell, emulator, `DEMO_MODE=true`) that a judge can follow with no AWS; LIVE setup section; architecture diagram (render docs/03-architecture/diagram.md Mermaid); runtime truth table (pre-generated / live / demo / dev-provenance); AWS Builder section (Bedrock, Polly, Step Functions, API Gateway, CloudFront — what each does and file paths); Open Source section (MIT, contribution guide, issues); honest limitations; agent-built provenance (link AGENTS.md + handoffs).
2. docs/06-demo-submission/evidence.md: every claim → command → output (test counts, property test, overlap = 0 per title, dry-run manifest, cdk synth). Mark anything unverified as TODO/BLOCKED; never infer PASS.
3. docs/06-demo-submission/video-script.md: < 2:45 timed storyboard following product-brief golden path — person + moment (0–15 s), product working (real footage), refusal/timeline money shot, LIVE Describe-now, one measured result, close on changed outcome. Note which scenes need the Fire TV Stick vs emulator.
4. docs/06-demo-submission/devpost-copy.md: tagline (mechanism + contrast), opening with SOURCED numbers (put URLs in docs/02-product/sources.md; if a number cannot be sourced, leave a TODO, do not invent), pivot question, golden scenario beats, architecture naming each AWS/Fire TV component's job, refusal principle, challenges as named defects + fixes taken from the handoffs, accomplishments led by measurable outcome, what we learned, future work incl. current limits, links placeholders.
5. Consolidate docs/06-demo-submission/product-feedback.md (one entry per tool: react-native-tvos, Expo, Android TV emulator, Amazon Fire TV docs, Bedrock, Polly, Step Functions, CDK, Antigravity) and friction-logs.md into the exact Devpost formats from the rules.
6. docs/06-demo-submission/qa-checklist.md: 5 consecutive clean demo runs from reset state, D-pad focus audit, 10-ft readability, no credentials on screen.
7. Handoff docs/04-agents/handoff-task5.md; paste in chat.

Acceptance: a stranger can run the demo from README in < 10 minutes on Windows; every claim in devpost-copy.md maps to a line in evidence.md.
