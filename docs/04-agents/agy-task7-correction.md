# Correction prompt — Task 7 (reality pass). Copy everything below the line into agy.

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv
Read first: .\AGENTS.md, .\docs\04-agents\review-01-claude.md (the orchestrator's review of your Tasks 1–6), .\docs\04-agents\agy-unified-prompt.md (rules, PRODUCTION BAR, DESIGN BAR still apply), and C:\Users\Atchayam\.codex\skills\hackathon-architecture-playbook\SKILL.md.

The orchestrator verified your 51 tests pass — good. But the review found the app has never been built or run, the dependency set cannot build, the UI tests mock all of react-native, the subtitle files are invented, and the fixture track claims human verification and a Bedrock model that never happened. Those are truthfulness failures; fix them first. Do not commit/push/deploy. Do not mark anything DONE that you did not observe.

TASK 7 — REALITY PASS. Do these in order and write .\docs\04-agents\handoff-task7.md at the end (DONE/BLOCKED/RISK/NEXT/FILES/DEPS) with exact commands and observed output.

7.1 Truthful fixtures (do this before anything else)
- apps/firetv/assets/fixtures/sintel-track.json: every description -> status "ai-draft", model "fixture-handwritten", remove verifiedAt/verifiedBy, top-level status "ai-draft", metadata.model "fixture-handwritten". The reviewer CLI must never write a verifiedBy name automatically; it takes --reviewer "<name>" and refuses to run without it, and prints each item for an explicit y/n.
- Replace all three .srt files with the REAL official subtitles: Sintel English subtitles from the Blender Foundation release (durian.blender.org / the official Sintel download bundle), Elephants Dream English subtitles from the official release (orange.blender.org), Big Buck Bunny has no dialogue — do not invent one; ship an empty-cue .srt plus a note, so the whole film is one gap set. Record the exact download URL, license and SHA-256 of each file in docs/06-demo-submission/media-licenses.md. If you cannot download a file, say BLOCKED and leave a clearly named placeholder; never fabricate cues.
- Regenerate the Sintel hand-written fixture descriptions against the REAL cue timings (the scheduler must place them in real gaps). Keep >= 25.

7.2 Sourced numbers only
- Create docs/02-product/sources.md. Keep only claims you can cite with a URL you actually opened: WHO vision impairment fact sheet (2.2 billion), any real statistic about audio-description availability (e.g. FCC AD rules, Ofcom AD quotas, American Council of the Blind AD project). Remove "97% of indie content", "$1,500–$4,000 per film" and "99.98% cost reduction" from README.md and docs/06-demo-submission/devpost-copy.md unless you find a citable source; replace with "TODO: source" placeholders otherwise. The cost model may state OUR estimated AWS cost per film only.

7.3 Make the app actually build and run on the emulator
- Fix dependencies for Expo SDK 54 + react-native-tvos: in apps/firetv/package.json set "react-native": "npm:react-native-tvos@~0.81.0-0" (remove the separate react-native-tvos entry), React/react-dom 19.1.x, then run `npx expo install --fix` from apps/firetv to align expo-av, expo-font, expo-speech, expo-status-bar, react-native-screens, react-native-safe-area-context, expo-build-properties (add it). Add react-tv-space-navigation (or justify using RN TV native focus only) and @react-native-tvos/config-tv plugin with {"isTV": true} in app.json.
- Create the missing assets: apps/firetv/assets/icon.png (512x512), adaptive-icon.png, splash.png, and the Fire TV banner 320x180 (tv-banner.png). Design them to the NarraTV identity (no placeholder white squares). Wire the banner via the config-tv plugin or an Expo config plugin that sets android:banner, uses-feature android.hardware.touchscreen required=false, and keeps LEANBACK_LAUNCHER.
- `npx expo prebuild --platform android --clean`, then `yarn android` against AVD FireTV_1080p_API30 (create it if missing; note the system image you used). Fix every build error until the app launches. Then capture real screenshots with `adb exec-out screencap -p > docs/assets/screenshots/<name>.png` for: catalog, player with narration active, TimelineSurface, WhyPanel, SystemStatus, DEMO pill, error toast. Screenshots are the acceptance evidence; a handoff without them is BLOCKED.
- Verify on the emulator, with DEMO_MODE=true: Sintel plays from the official stream URL, at least one description is spoken in a real gap, none during a cue. Enable TalkBack in the emulator and confirm every focusable element announces a label; write the result in docs/06-demo-submission/qa-checklist.md as observed (pass/fail per item), not as a template.

7.4 Real UI tests
- Delete tests/__mocks__/react-native.js. Use the jest-expo preset (or react-native preset from react-native-tvos) with @testing-library/react-native so components render the real RN primitives. Keep expo-speech/expo-av mocks only. Re-run; keep all suites green. Report the new counts.

7.5 Design bar
- Bundle two OFL fonts under apps/firetv/assets/fonts (one display face, one body face), load them with expo-font, and use them via the typography tokens. Update docs/02-product/design-notes.md with one note per screen that matches what the screenshots show.

7.6 Hygiene
- .gitignore must cover node_modules, android/build, android/app/build, .expo, dist, coverage, cdk.out, .env, *.keystore, services/pipeline/local-manifest-*.json. Do NOT run git init or commit; the orchestrator will.
- Update docs/04-agents/handoff-task1.md with a "CORRECTION" section stating what was not actually done originally (no emulator run, invented SRTs, false verified status). Update docs/06-demo-submission/evidence.md so every line is something you observed in this run; mark the rest TODO/BLOCKED. Append friction-log and product-feedback entries for everything you hit (Expo TV config, tvos alias, emulator, TalkBack).

ACCEPTANCE (all required): fixtures truthful (no verified/Bedrock labels on fixtures; real subtitle files with URLs + hashes); sources.md exists and no unsourced statistic remains; `yarn android` launches on the AVD; >= 7 real screenshots in docs/assets/screenshots; TalkBack pass recorded; `yarn test` green without the react-native blanket mock; fonts bundled and visible in screenshots; handoff-task7.md with observed commands/outputs.
