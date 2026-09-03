# Task 12 prompt — copy everything below the line into agy (NEW conversation)

---
You are Antigravity on NarraTV. Workspace: D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv

Read and execute this task in full. Also read `.\AGENTS.md`, `.\docs\04-agents\review-06-claude.md` (**your Task 11 was APPROVED** — note the two things I had to fix), and `..\..\HACKATHON-RULES-AND-RESOURCES.md` (official rules and judging criteria).

HARD RULES — these override anything you infer, and they are why Tasks 10 and 11 passed:
1. Never invent media, data, statistics, licences, sources or test results. If you cannot obtain something, write BLOCKED with the exact error. **A BLOCKED item is acceptable; a fabricated one ends the task.**
2. Never replace a failing real component with a simulation. Mocks live in tests only.
3. Build/test only via `ops\build-release.cmd`, `ops\sync-and-test.cmd`, `ops\install-and-shoot.cmd`. If the device hangs: `ops\adb-reset.cmd` then `ops\restart-emulator.cmd`. **After any emulator start/restart run `ops\fix-tts.cmd`** — Google TTS ships DISABLED on this image, so without it you are testing a mute audio-description app. Never `expo prebuild --clean`, never `taskkill node.exe`, never `timeout` in scripts, never create anything outside the project folder.
4. No commit/push/deploy, no Devpost/YouTube, no AWS console actions. **Never sign a judge-facing document as the author** — the entrant is Atchayam G.

Finish with `.\docs\04-agents\handoff-task12.md` (DONE/BLOCKED/RISK/NEXT/FILES/SCREENSHOTS with SHA-256 and what you actually SEE in each image). I re-run your tests, re-fetch every URL you cite, and open every screenshot.

## TASK 12 — completeness, accessibility, and submission readiness (no AWS needed)

### 12.1 Titles without a description track (correctness gap)
Only `sintel-track.json` exists. `big-buck-bunny` and `elephants-dream` are listed in `titles.json` with no AD track, so a judge selecting them today gets an error or an empty screen.
- Find what actually happens for those two titles (open the Player for each and capture the truth), then implement an **honest** state: the film still plays, AD is clearly shown as **not yet generated for this title**, and the UI explains that the description track is produced by the Bedrock pipeline (`docs/03-architecture/live-mode-runbook.md`). Reuse the existing truth-pill/toast vocabulary.
- **Do not hand-write, invent or AI-generate description tracks for these films.** An empty state that tells the truth scores; fabricated descriptions are disqualification-class.
- Add tests: selecting a title with no track never crashes, never shows a fake description, and the scheduler reports 0 described / 0 overlaps.
- Screenshots: `10-no-track-bbb.png`, `11-no-track-ed.png`.

### 12.2 Accessibility pass (this is an accessibility product — it must be exemplary)
- Enable TalkBack on the emulator and walk the full flow: catalog → player → timeline → why-panel → system status → back.
- Report **only what you observe**: focus order, announced labels, anything unreachable by D-pad, anything announced as "unlabelled button", contrast problems at 10-foot distance.
- Fix what you can (accessibilityLabel/Role/Hint, focus order, hit targets); list what you cannot as BLOCKED/RISK with the exact symptom.
- Write `.\docs\02-product\accessibility-report.md` with observed results, and add regression tests for the labels you add.

### 12.3 Repository readiness (rules: public repo, OSS licence, runnable by judges)
- Rewrite `README.md` to match what the app **actually does today**: what it is, the deterministic no-overlap guarantee, DEMO vs LIVE, exact setup/run/build/test commands (the `ops\` scripts), architecture summary, CC-BY attribution, and an explicit "what is verified vs unverified" section (live mode is unverified).
- Verify `LICENSE` is MIT with the correct holder; verify `.gitignore` excludes `node_modules`, `android/build`, `.cxx`, `*.keystore`, `.env*`, `ops\*.log`, and anything under `docs/_to_delete/`.
- **Secret scan**: search the whole repo for AWS keys, the Devpost credit code, `SECRETS-DO-NOT-COMMIT`, tokens, and absolute personal paths. Report every hit. Do not commit anything.
- Confirm no AI-generated assets remain anywhere in shipping paths (`apps/firetv/assets/**`); anything left over goes to `docs/_to_delete/`.

### 12.4 Devpost submission copy (judged on 4 × 25%: Tech Implementation, Design, Potential Impact, Quality of Idea)
- Rewrite `.\docs\06-demo-submission\devpost-copy.md` against **verified reality only** — no claim that is not demonstrable in the app or the repo today, and each major claim annotated with where it can be seen (screenshot, file, or test).
- Cover: the problem and who it serves; how the deterministic scheduler guarantees narration never overlaps dialogue; the transparency surfaces (truth pill, why-panel, timeline refusals); the AWS Builder integration (Bedrock Nova + Polly) marked honestly as implemented-but-unverified until credentials exist; what is DEMO vs LIVE; and the CC-BY attribution.
- Include the required "what worked / what needs improvement / onboarding / would build again" pointers to `product-feedback.md`, and reference `friction-log.md` for the bonus.

ACCEPTANCE: `ops\sync-and-test.cmd` all green (paste the verbatim "Test Suites:"/"Tests:" lines); the two no-track screenshots show an honest state and a playing film; accessibility report contains only observed findings; secret scan reported; README and Devpost copy contain no unverifiable claim. Anything not achievable → BLOCKED with evidence, not a workaround.
