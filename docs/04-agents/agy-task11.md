# Task 11 prompt — copy everything below the line into agy (NEW conversation)

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read first: .\AGENTS.md, .\docs\04-agents\review-05-claude.md (**your Task 10 was APPROVED** — read what was verified and what carried over), ..\..\HACKATHON-RULES-AND-RESOURCES.md (workspace root — the official rules, judging criteria and submission requirements).

HARD RULES (unchanged, they are why Task 10 passed):
1. Never invent media, data, statistics, licences, sources or test results. If you cannot obtain something, write BLOCKED with the exact error. **A BLOCKED item is acceptable; a fabricated one ends the task.**
2. Never replace a failing real component with a simulation or a mock in app code.
3. Build/test only via `ops\build-release.cmd`, `ops\sync-and-test.cmd`, `ops\install-and-shoot.cmd`; recover a wedged device with `ops\adb-reset.cmd` then `ops\restart-emulator.cmd`. **After any emulator start/restart, run `ops\fix-tts.cmd` first** — Google TTS ships DISABLED on this Android TV image, so without it the audio-description app is silent and you will be testing a mute product without realising it. Never `expo prebuild --clean`, never `taskkill node.exe`, never `timeout` in scripts, never create anything outside the project folder.
4. No commit/push/deploy, no Devpost/YouTube, no AWS console actions.

CONTEXT: the AWS account is still activating, so **no live AWS calls are possible yet**. This task builds the Bedrock path so that it works the moment credentials exist, and closes the submission-rule gaps that need no AWS.

TASK 11 — write `.\docs\04-agents\handoff-task11.md` (DONE/BLOCKED/RISK/NEXT/FILES/SCREENSHOTS with SHA-256 + what you SEE).

11.1 Real Bedrock + Polly path (AWS Builder mini-challenge eligibility)
- Implement the live describe path properly in `services/pipeline` and the app's DI: a real `@aws-sdk/client-bedrock-runtime` InvokeModel call (`amazon.nova-pro-v1:0`, us-east-1) that takes a captured frame + surrounding subtitle context and returns a description, and a real `@aws-sdk/client-polly` SynthesizeSpeech call for the audio. Credentials come from the standard AWS provider chain / env — never hardcoded, never committed.
- `DEMO_MODE=true` keeps today's behaviour exactly (fixtures + the honest "LIVE unavailable" toast). `DEMO_MODE=false` without credentials must fail loudly with a clear message — never silently fall back to fixtures and never label fixture output as LIVE.
- Unit-test the adapter with the AWS SDK client mocked (`aws-sdk-client-mock`): request shape, model id, region, error handling, and that DEMO mode never issues a call. **Do not mock it inside app code — mocks live in tests only.**
- Write `.\docs\03-architecture\live-mode-runbook.md`: the exact IAM policy needed, model access request steps, env vars, and the one command to verify live mode once the account is ready. State clearly it is UNVERIFIED until run against real credentials — do not claim it works.

11.2 CC-BY attribution (licence compliance — carried over from review 05)
- The films are CC-BY and we currently credit them nowhere in the app. Add a visible credits block on System Status: "Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation, licensed CC-BY (durian/peach/orange.blender.org)" plus the per-film licence versions from `docs/06-demo-submission/media-licenses.md` §3.
- Screenshot it (09-credits.png).

11.3 Safe area fix
- "Back to Catalog" is clipped at the right edge (visible in 02b-player-30s.png). Apply a real 5% inset to the player control bar and any other overscan-exposed element; re-capture 02-player.png and confirm nothing is clipped.

11.4 Submission-rule deliverables (worth real points — see HACKATHON-RULES-AND-RESOURCES.md)
- `.\docs\06-demo-submission\friction-log.md` — **worth up to +10% of the total score.** Real entries only, from what actually happened in this project: task attempted, steps taken, expected vs actual result, severity, workaround, suggested fix. You have genuine material (React 19 vs react-native-tvos, Gradle entry-file resolution in a monorepo, react-native-screens ninja failure on Windows long paths, emulator H.264 decoder failure, dead Google sample-video URLs, TVEventHandler crashing without native TV modules). Do not invent entries you did not hit.
- `.\docs\06-demo-submission\product-feedback.md` — **mandatory for every tool/API/SDK used**: React Native TV / react-native-tvos, Expo 54, react-native-video, Android TV emulator + adb, and (marked UNVERIFIED-pending-credentials) Bedrock/Polly. For each: what worked (setup, docs, testing, performance, reliability), what needs improvement, onboarding experience, would you build with it again.
- Both documents must be factual and first-person about this project. No filler.

ACCEPTANCE: `ops\sync-and-test.cmd` all green with the new adapter tests (paste the verbatim "Test Suites:"/"Tests:" lines); DEMO mode behaviour unchanged and proven by screenshots; credits block visible; no clipped controls; friction log and product feedback written from real events; runbook honest about being unverified. Anything not achievable → BLOCKED with evidence.
