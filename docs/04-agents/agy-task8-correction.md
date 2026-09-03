# Correction prompt — Task 8 (render or block). Copy everything below the line into agy.

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read first: .\AGENTS.md and .\docs\04-agents\review-02-claude.md.

The orchestrator opened your Task 7 screenshots. catalog.png is the React Native "Loading from localhost:8081…" overlay — the JS bundle never loaded. player.png, timeline.png and whypanel.png are byte-identical black frames (10,608 bytes). Your handoff described them as rendered screens; they are not. The orchestrator also ran `yarn test`: 1 failed (apps/firetv/tests/system-status-screen.test.tsx), 50 passed — not 51/51. From now on, every screenshot you cite must be accompanied by a one-line description of what is visibly on it and its SHA-256; identical hashes or a description you did not observe = BLOCKED, not DONE.

TASK 8 — RENDER OR BLOCK. Scope is only the three items below. Do not touch anything else. Write .\docs\04-agents\handoff-task8.md at the end.

8.1 Make the JS actually load and render on the AVD
- Capture the real error first: run `npx expo start --dev-client` (or `npx react-native start`) in a visible terminal and read Metro's output while the app launches; also run `adb logcat -d | findstr /i "ReactNative Metro Bundle Error"` and paste the relevant lines into the handoff. Typical causes: Metro not reachable from the emulator (use `adb reverse tcp:8081 tcp:8081`), a bundling error in App.tsx/imports, the font loading promise never resolving (splash never hides), or a runtime exception before first render. Fix the root cause.
- Preferred proof path (no Metro dependency, what the judges will get): build a release APK with the JS bundle embedded — `cd apps\firetv\android && .\gradlew assembleRelease` (use a debug-signing keystore path via env for now, never committed) — install with `adb install -r`, launch with `adb shell monkey -p com.amazonappdev.narratv 1`, wait 5 s, then screenshot. If release build is blocked by signing, use `assembleDebug` with `--bundle` (bundleInDebug=true in gradle.properties) so the debug APK also embeds the bundle.
- Take screenshots with `adb exec-out screencap -p > docs\assets\screenshots\<name>.png` for exactly these states, navigating with `adb shell input keyevent` (DPAD_*, DPAD_CENTER, MENU, BACK): 01-catalog (hero + rail visible, one card focused), 02-player (video frame visible), 03-narration-active (caption/indicator that a description is being spoken), 04-timeline (Menu key), 05-whypanel, 06-system-status, 07-demo-pill (zoom crop is fine), 08-error-toast (trigger Describe-now in DEMO mode). Delete the old black/loading PNGs.
- In the handoff, list each PNG with its SHA-256 (`certutil -hashfile <file> SHA256`) and one sentence describing what is visible. If any state cannot be reached, keep the file absent and write BLOCKED with the exact error.

8.2 Fix the failing test
- Run `yarn workspace @narratv/firetv test -- system-status-screen` and paste the failure. Fix the cause (not the assertion) so the screen renders correctly. Then run the full `yarn test` and paste the final "Test Suites" and "Tests" lines verbatim.

8.3 Observed-only QA
- Only after 8.1 succeeds: enable TalkBack on the AVD (`adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService` and `accessibility_enabled 1`; if TalkBack is not present on the image, say so and mark the TalkBack row BLOCKED), navigate the catalog and player, and record in docs/06-demo-submission/qa-checklist.md what was actually spoken/announced. Confirm by ear or by `adb logcat` that at least one description was scheduled inside a real Sintel gap; record the timestamp and the gap it landed in.

Handoff format: DONE (with commands and verbatim outputs) / BLOCKED / RISK / NEXT / FILES / SCREENSHOTS (name — sha256 — what is visible). No summaries of things you did not observe.
