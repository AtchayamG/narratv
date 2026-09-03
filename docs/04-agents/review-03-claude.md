# Orchestrator Review 03 — Claude took over from agy (2026-09-02, 21:00–21:40 IST)

agy looped on "rebuild debug APK → install" for Task 8 without reading the runtime error. Claude stopped it and debugged directly on the machine.

## Root causes found (all verified by observation)
1. **React version mismatch.** `apps/firetv/package.json` pinned react/react-dom/react-test-renderer 18.3.1 while `react-native-tvos@0.81.0-0rc5` requires `react ^19.1.0`. Symptom in logcat: `The value prop is required for <Context.Provider>` + `Functions are not valid as a React child … ImageAnalyticsTagContext.Provider`, later `Cannot read property 'ReactCurrentDispatcher' of undefined`. FIX: bumped to 19.1.0 (+ @types/react ~19.1.0).
2. **Gradle JS bundling used the wrong entry/root** in this monorepo: Expo set Metro's server root to the workspace root, so the relative entry `index.ts` was resolved from `01-firetv-narratv/`. FIX: `android/app/build.gradle` now pins `entryFile = file("${projectRoot}/index.ts")` and `root = file(projectRoot)`; builds run with `EXPO_NO_METRO_WORKSPACE_ROOT=1`.
3. **Native C++ build of react-native-screens failed** (`ninja: mkdir … Hackathon_Projects/Amazon_Developer_Hackathon …`) — Windows path with spaces / length. The app never used React Navigation. FIX: removed `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`. Builds also run through a junction `D:\narratv -> <long path>` (`mklink /J`) to keep native paths short.
4. **Stale Metro cache + stale embedded bundle** kept serving React-18 modules. FIX: kill Metro, clear `%TEMP%\metro-cache`, `node_modules\.cache`, delete old `android/app/src/main/assets/index.android.bundle`.
5. **adb server wedged** after process kills. FIX: `taskkill adb.exe` + `adb start-server`.

## Result
- `ops/build-release.cmd` → `BUILD SUCCESSFUL in 4m 37s`, `apps/firetv/android/app/build/outputs/apk/release/app-release.apk` (73 MB, JS embedded, no Metro needed).
- Installed on AVD; **no ReactNativeJS errors**; screenshot `docs/assets/screenshots/02-player.png` (111,154 bytes) shows the rendered catalog: NarraTV header, DEMO MODE pill, System Status button, Sintel hero with "AD TRACK: AI DRAFT · 13 DESCRIPTIONS · 0 OVERLAPS", "Play with Narration (AD)". (File is misnamed — it is the catalog; DPAD_CENTER did not navigate because nothing has initial TV focus.)

## Open items for the next agy task (Task 9)
- No initial focus on TV (`hasTVPreferredFocus` on the hero CTA) → D-pad flow into Player must be verified with real screenshots.
- Hero area has no artwork (empty dark box); design bar not yet met.
- `01-catalog.png` (10,608 B, captured too early) and all pre-Task-8 PNGs are invalid → delete; re-capture the 8 required states from the RELEASE APK.
- 1 failing test (system-status-screen) as of review 02 — re-verify after dependency change (see ops/test-run.log).
- Build scripts to keep: `ops/build-release.cmd`, `ops/install-and-shoot.cmd`, `ops/adb-reset.cmd`. Document them in README "Windows build notes".
