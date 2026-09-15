# Task 23 — agy prompt (for the record; the code block pasted in chat is the deliverable)

You are Antigravity ("agy"), the worker agent on Atchayam G's solo entry to the
Amazon "Build, Ship, Shape" Developer Hackathon 2026.

WORKSPACE (absolute): D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon
YOUR PROJECT FOR THIS TASK (absolute, and the ONLY project you may modify):
  D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv

The earlier standing instruction that you must not touch
`projects\01-firetv-narratv` is LIFTED for this task only. The orchestrator has
finished its edits there and has pushed. Projects 02, 03 and 04 remain
off-limits.

## READ FIRST, before you write a single line

1. `projects\01-firetv-narratv\AGENTS.md` — all of it.
2. `D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\HACKATHON-RULES-AND-RESOURCES.md`
   — the Stage 2 judging criteria and the Fire TV row of the hardware table.
3. `projects\01-firetv-narratv\README.md` — including the verified/unverified
   table, which is what this task has to keep true.
4. `projects\01-firetv-narratv\docs\02-product\accessibility-report.md` — the
   existing accessibility work. This project already has 35 `accessibilityLabel`,
   18 `accessibilityRole`, 14 `accessibilityHint` and 18 `announceForAccessibility`
   calls. You are NOT adding accessibility from scratch. Read before assuming.
5. `projects\01-firetv-narratv\docs\04-agents\` — the most recent
   `review-NN-claude.md` files, so you know what has already been found and
   fixed here.

## CONTEXT: why this task exists

NarraTV is the primary-track submission and the largest prize in this hackathon.
It is already submitted, public and MIT. `npx jest` reports **24 suites, 117
tests, all passing**, and that figure is correct — the orchestrator ran it.

But `npx tsc --noEmit` inside `apps\firetv` **fails**, and it has been failing
while every test stayed green, because jest transpiles through babel and babel
strips types without checking them. The same blind spot was found in project 4
last week. Two of the errors are real defects, not lint noise:

```text
src/features/catalog/presentation/MovieRail.tsx(57,19): error TS2322:
  Type '"pre-generated" | "warning"' is not assignable to type 'BadgeVariant | undefined'.
  Type '"warning"' is not assignable to type 'BadgeVariant | undefined'.

src/features/player/data/tts-adapter.ts(59,31): error TS2694:
  Namespace '"expo-av"' has no exported member 'Sound'.

src/features/player/data/tts-adapter.ts(127,41): error TS7006:
  Parameter 'status' implicitly has an 'any' type.

App.tsx(1,8): error TS6133: 'React' is declared but its value is never read.
tests/accessibility-audit.test.tsx(1,1): error TS6133: 'React' is declared but its value is never read.
tests/accessibility-audit.test.tsx(11,9): error TS2741: Property 'license' is missing in type ...
tests/accessibility-audit.test.tsx(22,9): error TS2741: Property 'license' is missing in type ...
```

`MovieRail` is on the catalog screen, which is the first thing a judge sees.
`tts-adapter` is the audio-description playback path, which is the entire
product. And the root `typecheck` script is broken too: `package.json` runs
`tsc --build`, but there is no root `tsconfig.json` — only `tsconfig.base.json`
— so it dies with `error TS5083: Cannot read file ... tsconfig.json`.

Separately, the D-pad focus story has a hole. The codebase has 18
`hasTVPreferredFocus` and 18 `onFocus`, but **zero** `nextFocusUp` /
`nextFocusDown` / `nextFocusLeft` / `nextFocusRight`, and only one `focusable`.
A control on `SystemStatusScreen` was previously found to be unreachable by
D-pad and had to be fixed by hand. Nothing stops that recurring.

## THE TASK

Eight deliverables. Do them in this order and commit locally after each, so a
failure never costs more than one deliverable.

### D1 — Make `tsc --noEmit` pass in `apps\firetv`, properly

Fix every error above. Rules:

- **No `any`, no `@ts-ignore`, no `@ts-expect-error`, no widening a union just
  to silence the checker.** If a type is genuinely wrong, fix the type. If a
  value is genuinely wrong, fix the value.
- `MovieRail.tsx:57` — decide which is correct: does `BadgeVariant` need a
  `'warning'` member, or is `MovieRail` passing a variant that should be
  something else? Look at what the badge is communicating on screen and at the
  other `BadgeVariant` members before choosing. Say in the handoff which you
  chose and why, and what the badge now renders.
- `tts-adapter.ts:59` — check the installed `expo-av` version's actual exports
  before changing anything. `Sound` may have moved rather than vanished. Quote
  the export you found and the file you found it in.
- `tests/accessibility-audit.test.tsx` — the fixtures are missing the required
  `license` field from the contract type. Add real values consistent with
  `docs\06-demo-submission\media-licenses.md`. Do not invent a licence string.

### D2 — Make the root `typecheck` script actually run

Either add a root `tsconfig.json` with project references to the workspaces, or
change the root script to something that works. Whichever you choose,
`yarn typecheck` (or `npm run typecheck`) from the project root must exit 0 and
must actually typecheck every workspace — not silently check nothing. Prove it
by deliberately introducing a type error in one workspace, showing the script
fail, and reverting.

### D3 — A test that fails when typecheck fails

Add a test that shells out to the typechecker and asserts exit code 0. This is
the guard that stops D1 rotting again the moment someone adds a type error,
which is exactly what happened here. Keep it in its own suite, and note its
runtime in the handoff — if it makes the suite unbearably slow, say so and
propose the alternative rather than quietly leaving it out.

### D4 — Prove every interactive control is D-pad reachable

This is the important one.

Write a test that, for each screen — `CatalogScreen`, `PlayerScreen`,
`SystemStatusScreen`, and the components `HeroSpotlight`, `MovieRail`,
`TimelineSurface`, `WhyPanel` — renders it and asserts that **every** node
which is interactive (`onPress`, `onFocus`, `accessibilityRole` of button /
switch / link, or `focusable`) is reachable: it must not be simultaneously
focusable and unreachable, and exactly one node per screen may carry
`hasTVPreferredFocus`.

Then fix whatever it finds. Where the natural focus order is ambiguous, add
explicit `nextFocusUp` / `nextFocusDown` / `nextFocusLeft` / `nextFocusRight`
routing rather than relying on the platform's geometric guess — there are
currently zero of these in the codebase and a TV app with rails and overlays is
exactly where the guess goes wrong.

If the test finds nothing wrong, say so plainly and show the test failing
against a deliberately unreachable control, so the result means something.

### D5 — Screen-reader state, not just labels

`accessibilityState` appears twice in 30 source files. For an audio-description
product that is too few. Add it where state exists and a screen-reader user
would otherwise be guessing:

- the LIVE/DEMO toggle on `SystemStatusScreen` (`checked` or `selected`)
- any control that can be disabled (`disabled`)
- any control that is busy while the pipeline runs (`busy`)
- the currently selected rail item (`selected`)

`accessibilityLiveRegion` appears once. A narration starting or being refused
is a state change a blind user must hear about without moving focus — make sure
the narration status surface announces, and that a refusal announces
assertively rather than politely.

Add tests asserting the state props are present and correct, not merely that
the components render.

### D6 — Re-verify the README's verified/unverified table

Every row in that table is a claim. Re-run the command each row cites and
report, row by row, whether it still holds. If a row is now false, say so in
the handoff — **do not edit the row to match reality without flagging it**, and
do not delete a row. The test-count row should read 24 suites / 117 tests
unless your work changes it, in which case give the new figure and the command
that produced it.

### D7 — Negative probes for every new guard

For D2, D3, D4 and D5: break the invariant deliberately, run the suite, capture
the failing output verbatim including the exit code, revert, run again, capture
the pass. Append all four to `docs\04-agents\negative-probes-evidence.md`,
creating it in the format project 4 uses if it does not exist here.

A guard you have not watched fail is a guard you have not tested.

### D8 — Handoff

Write `docs\04-agents\handoff-task23.md` — see the required contents below.

## WHAT YOU MUST NOT TOUCH

- `projects\02-ring-doorstep`, `projects\03-alexa-mcp`,
  `projects\04-bee-bystander` — not one byte, for any reason.
- `docs\06-demo-submission\**` — the demo video, friction log, product
  feedback, evidence and Devpost copy are the orchestrator's. If your work
  changes something one of those documents states, write the correction in your
  handoff and let the orchestrator apply it. The one exception is reading
  `media-licenses.md` for D1's licence values.
- `ops\video\**` and any `.mp4` — do not regenerate or re-record anything.
- The `README.md` verified/unverified table — D6 is a report, not an edit.
- Anything under `docs\_to_delete\`.

## THE FOUR HARD RULES — verbatim, and they end the task if broken

1. **No invented media, data, sources, licences or test results.** If something
   fails, report BLOCKED with the exact error text. A real error is a useful
   result; a fabricated success ends the task.
2. **No simulation standing in for a failing real component.** Mocks belong in
   tests and nowhere else. DEMO_MODE must never fake a live result, and nothing
   may be labelled "live" unless a real request path exists and fails explicitly
   without keys.
3. **Scripts in `ops\` only, and never anything outside the project folder.**
   No `taskkill node.exe`. No `expo prebuild --clean`. No `timeout`. Run
   `ops\fix-tts.cmd` after any emulator restart or the audio-description app is
   silent. No writing, moving or deleting a file outside
   `projects\01-firetv-narratv`.
4. **No commit to a remote, no push, no deploy, no Devpost, no YouTube, no AWS
   console.** Local commits only; the orchestrator publishes. Never sign a
   judge-facing document as its author.

**Commit with explicit paths — never `git add -A`.** In the last task both
agents ran `git add -A` against one tree minutes apart and two commits ended up
carrying each other's work. The messages are now wrong about what they contain,
in a public repo whose whole pitch is provenance. Do not repeat it.

## SECRETS

No token, API key, AWS account id or redemption code in any file, commit, log,
screenshot or handoff. AWS config comes from env / `.env.example` only, with
placeholders. If you ever see a value that looks like a credential, do not copy
it anywhere, including into your own notes.

## REQUIRED HANDOFF

`docs\04-agents\handoff-task23.md`, containing:

- **DONE / BLOCKED / RISK / NEXT** at the top, in that order, one line each,
  before any detail.
- A section per deliverable D1–D8 with the files you changed and why.
- **Raw output, pasted, not summarised**: `npx tsc --noEmit` from
  `apps\firetv` (must be empty); the root typecheck script; the full `npx jest`
  run including the `Tests:` and `Test Suites:` lines; and each negative probe's
  failing and passing runs with exit codes.
- **SHA-256 of every file you created or changed**
  (`certutil -hashfile <path> SHA256`).
- **A figures provenance table**: every number you state anywhere, and the
  exact command or file:line that produces it.
- **For D1, the two judgement calls spelled out**: which way you resolved
  `BadgeVariant`/`MovieRail` and what the badge now renders on screen; and what
  `expo-av` actually exports in the installed version, quoted, with the file you
  read it from.
- **For D4, the reachability result**: per screen, how many interactive nodes
  were found, how many were unreachable, and what you changed. If zero were
  unreachable, the failing-probe output is what makes that credible.
- **What I actually SEE** — for each screen you touched, what is on your screen
  in the emulator, including anything wrong, empty or ugly. Not what you
  intended to build. **If you did not launch the emulator and look, say so in
  those words.** A previous task in this project reported screenshots it had not
  taken; do not describe a screen you have not seen.
- **What I could not verify** — specifically. "TalkBack" is not specific;
  "whether TalkBack announces the refusal, because I could not enable TalkBack
  on the AVD" is.

## HOW THIS WILL BE CHECKED

The orchestrator re-runs every command you cite, re-runs `tsc` and `jest`
itself, reads every diff, opens every screenshot, and writes its own probes
against your guards rather than trusting yours. The baseline it will compare
against is recorded: 24 suites, 117 tests passing, and `tsc --noEmit` failing
with the seven errors quoted above. A green suite is not evidence on its own —
that is the whole reason this task exists.

The fastest route through review is an honest BLOCKED.

Start a fresh conversation for this task. Work through D1–D8 in order.
