# Task 10 prompt — copy everything below the line into agy (NEW conversation)

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read first: .\AGENTS.md, .\docs\04-agents\review-04-claude.md (your Task 9 was NOT approved — read every line), .\docs\06-demo-submission\media-licenses.md (§3 and §4 were rewritten by the orchestrator).

HARD RULES (violations end the task):
1. Never generate, AI-create, or invent media, data, statistics, licences, sources or test results. If you cannot obtain something, write BLOCKED with the exact error. A BLOCKED item is acceptable; a fabricated one is not.
2. Do not replace a failing real component with a "simulation". If real video cannot play on the emulator, keep the real `<Video>` and report BLOCKED with logcat.
3. Only the orchestrator's scripts for build/test: `ops\build-release.cmd`, `ops\install-and-shoot.cmd`, `ops\sync-and-test.cmd` (clean install + test — this is what the orchestrator runs; your test claim must match its output). Never `expo prebuild --clean`, never `taskkill node.exe`, never `timeout` in scripts, never create anything outside the project folder.
4. No commit/push/deploy, no Devpost/YouTube.

TASK 10 — make the player real. Write .\docs\04-agents\handoff-task10.md (DONE/BLOCKED/RISK/NEXT/FILES/SCREENSHOTS with SHA-256 + what you SEE).

10.1 Stream sources
- In `apps/firetv/assets/fixtures/titles.json` replace the dead gtv-videos-bucket URLs with the archive.org URLs from media-licenses.md §4 (use the 512 kb derivatives as `streamUrl`, keep the master as `streamUrlHd`). Add `durationSec` from ffprobe (`ffprobe -v error -show_entries format=duration -of csv=p=0 <url>`; ffprobe is on PATH) — paste the three ffprobe outputs verbatim in the handoff.
- The Sintel SRT timing must match the chosen rendition (same cut, so it should); verify by checking one cue against the audio/visual at that time and say what you observed.

10.2 Real video playback in PlayerScreen
- Use `react-native-video` (already in package.json) `<Video>` as the playback surface. Delete the setInterval fake clock; `currentTimeSec` comes ONLY from `onProgress`; `durationSec` from `onLoad`; Pause/Play toggles `paused`; Back stops playback. The scheduler/narration must be driven by the real time. Keep the artwork only as `poster` while loading.
- Use the film frames in `assets/art/` as poster/hero (Big Buck Bunny hero: `big_buck_bunny_poster.jpg`). Do not add any other images.
- Emulator decoding: the 512 kb archive.org renditions are low-profile H.264 and should decode with the goldfish decoder. If playback still fails, try in order: (a) `bufferConfig`/`maxBitRate` off, (b) start the emulator with `-gpu host` via scripts\run-emulator.bat, (c) report BLOCKED with the full logcat `adb logcat -d ReactNativeVideo:* ExoPlayer*:E *:S`. Never fall back to a fake surface.
- Add an in-app attribution line on System Status ("Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation, CC-BY").
- Keep all TV controls inside a 5 % safe area (the "Back to Catalog" button currently touches the edge).

10.3 Tests
- Fix the 4 suites failing with `TypeError: actImplementation is not a function` (see ops/test-run.log). Add a test that PlayerScreen renders a `Video` element (mock `react-native-video`) and that currentTime updates only from onProgress. Run `ops\sync-and-test.cmd` and paste the final "Test Suites:" / "Tests:" lines from `ops\test-run.log` verbatim.

10.4 Evidence (release APK, via ops\build-release.cmd + ops\install-and-shoot.cmd)
- 02-player.png must show an actual video frame (not the poster) with the clock advanced past 0:10; also capture 02b-player-30s.png ~20 s later showing a different frame and a later clock. Re-capture 03-narration-active and 04-timeline against real playback. Keep 01/05/06/07/08 if unchanged (state so).
- Paste `adb logcat -d ReactNativeVideo:* ExoPlayer*:E ReactNativeJS:E *:S` output (last 30 lines) in the handoff.

ACCEPTANCE: real `<Video>` in code, no timers driving time; titles.json points at 200-responding URLs; orchestrator's `ops\sync-and-test.cmd` all green; player screenshots show two different real frames; handoff has ffprobe + logcat pasted. Anything not achieved → BLOCKED with evidence, not a workaround.
