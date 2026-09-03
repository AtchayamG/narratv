# Task 9 prompt — copy everything below the line into agy (start a NEW conversation in agy)

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read first, in order: .\AGENTS.md, .\docs\04-agents\review-03-claude.md (the orchestrator fixed the build for you — read every line), .\docs\04-agents\review-02-claude.md.

STATE OF THE WORLD (verified by the orchestrator, do not re-investigate or "rebuild to check"):
- The release APK now builds and renders. Build ONLY with `ops\build-release.cmd` (builds from the real project path — verified BUILD SUCCESSFUL 21:49; NEVER create junctions/symlinks at D:\ or anywhere outside the projects\ folder, and remove any temporary one when done; JAVA_HOME "C:\Program Files\Android\Android Studio1\jbr", EXPO_NO_METRO_WORKSPACE_ROOT=1). Install/launch/screenshot with `ops\install-and-shoot.cmd` (adjust the key sequence as needed). If adb hangs, run `ops\adb-reset.cmd`. Never run `taskkill /IM node.exe`. Never use `timeout` in scripts (use `ping -n N 127.0.0.1 >nul`). Do not run `expo prebuild --clean` (it would wipe the build.gradle fix).
- Dependencies changed: React 19.1.0; @react-navigation/*, react-native-screens and react-native-safe-area-context were REMOVED (they were unused). Do not add them back.
- Do not commit/push/deploy. Do not touch Devpost/YouTube.

TASK 9 — three bounded items. Write .\docs\04-agents\handoff-task9.md at the end with DONE/BLOCKED/RISK/NEXT/FILES/SCREENSHOTS (name — SHA-256 — one sentence of what is visible). Every screenshot must be opened by you and described from what you see; identical hashes = BLOCKED.

9.1 Fix the 4 failing UI test suites (React 19 fallout)
- Failure: `TypeError: (0, _reactTestRenderer.act) is not a function` in truth-pill, system-status-screen, timeline-surface, why-panel tests. Fix by rendering with @testing-library/react-native (`render`, `screen`, `act` from RNTL / `act` from 'react'), not react-test-renderer. Replace weak `expect(tree).toBeTruthy()` + JSON.stringify assertions with real queries (`getByText`, `getByRole`, `getByLabelText`). Run `yarn test` from the workspace root and paste the final "Test Suites:" and "Tests:" lines verbatim. Target: all green.

9.2 D-pad focus and the full screen flow, proven by screenshots from the RELEASE APK
- Add initial TV focus (`hasTVPreferredFocus` on the hero "Play with Narration (AD)" CTA; ensure every FocusableCard/Button is focusable via D-pad; Back returns to catalog). Rebuild with ops\build-release.cmd, reinstall.
- Delete every old PNG in docs\assets\screenshots (they are invalid), then capture exactly: 01-catalog (hero + rail, CTA focused), 02-player (video frame visible; wait 8 s after DPAD_CENTER), 03-narration-active (visible indicator that a description is currently spoken — add a small on-screen "AD ▶ <text>" caption if none exists), 04-timeline (MENU key), 05-whypanel, 06-system-status, 07-demo-pill (zoom crop OK), 08-error-toast (Describe-now in DEMO mode). Use `adb shell input keyevent` for navigation. Any state you cannot reach → file absent + BLOCKED with the exact logcat error (`adb logcat -d -v raw ReactNativeJS:E *:S`).

9.3 Hero artwork + design pass on the catalog (design bar)
- The hero box is an empty dark rectangle. Use the official CC-BY poster/still for each Blender film (record URL + license in docs/06-demo-submission/media-licenses.md) as hero background with a gradient scrim, bundled locally under apps/firetv/assets/art/. Apply the bundled Space Grotesk/Inter fonts to the header and title (verify in the screenshot that the display font is actually rendering, not the system font). Keep 5% safe margins. Update docs/02-product/design-notes.md to match what the screenshots show.

ACCEPTANCE: `yarn test` all green (verbatim lines pasted); 8 distinct screenshots from the release APK with hashes + descriptions; hero artwork + custom fonts visible; handoff-task9.md written. If you find yourself running the same build twice without a code change in between, STOP and report BLOCKED instead.
