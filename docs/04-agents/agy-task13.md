# Task 13 — Cut the ≤3-minute Devpost demo video

## Role and workspace
You are Antigravity ("agy"), the implementation worker on this hackathon portfolio.
Absolute workspace root: `D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon`
Project: `projects\01-firetv-narratv`
Video working directory (OUTSIDE the git repo, on purpose): `ops-tools\video`

## Read these first, in full
1. `AGENTS.md` at the project root — rule 0 is anti-fabrication and it applies to this task.
2. `HACKATHON-RULES-AND-RESOURCES.md` at the workspace root — especially the submission
   requirements and "What the hosts said scoring actually turns on".
3. `projects\01-firetv-narratv\docs\06-demo-submission\video-script.md` and `video-plan.md`.
4. `projects\01-firetv-narratv\docs\06-demo-submission\evidence.md` §7 — the b-roll takes
   already banked and what each one shows.
5. `projects\01-firetv-narratv\README.md` — the "Verified vs unverified" table is the source
   of truth for every factual claim the video is allowed to make.

## What exists already
Four verified takes in `projects\01-firetv-narratv\docs\assets\clips\` (gitignored, 1080p60,
real emulator audio, each checked for picture and sound):
- `obs-broll-04-catalog-dpad-spoken-focus-1080p60.mp4` — D-pad across the rail; *Sintel* has
  `AD TRACK`, *Big Buck Bunny* and *Elephants Dream* have `NO AD TRACK`. The app speaks each
  focused card aloud.
- `obs-broll-05-no-ad-track-honest-state-1080p60.mp4` — a film playing with no AD track and an
  honest banner instead of invented narration.
- `obs-broll-06-demo-mode-live-refusal-1080p60.mp4` — the DEMO-mode LIVE refusal toast.
- `obs-broll-07-talkback-catalog-pass-1080p60.mp4` — a real TalkBack pass.

## Deliverable
One file: `ops-tools\video\narratv-demo-final.mp4`
- **Under 3 minutes.** Not 3:00. Aim for 2:40–2:55.
- 1920x1080, H.264, stereo AAC, audio normalised so the narration is intelligible and nothing
  clips (the takes peak near -1 dBFS; target about -16 LUFS integrated).
- Burned-in captions for every spoken word, because this is an accessibility project and an
  uncaptioned accessibility demo is an own goal.
- Title cards between segments, readable at 10 feet: large type, high contrast, on screen long
  enough to read twice.
- CC-BY attribution for the Blender films on screen for at least 5 seconds, and in the
  description text you hand back.

## Structure to follow
1. **The problem (0:00–0:25).** Card + voiceover. The coverage gap: most of a catalogue has no
   audio description, and hand-authoring it does not scale. Do NOT claim a market size, a
   percentage, or a user count that is not already sourced in the README.
2. **Catalog (0:25–0:50).** Take 04. Show `AD TRACK` next to two `NO AD TRACK` titles.
3. **Narration in a real gap (0:50–1:35).** From the LIVE take once it exists (see Blocked).
   Show the description landing in silence, and the on-screen timecode.
4. **The refusal (1:35–2:10).** The `SKIPPED · NO GAP` moment. This is the most important
   twenty seconds in the video — hold on it, caption what happened and why.
5. **Honest states (2:10–2:35).** Take 05 and take 06 briefly.
6. **How it is built (2:35–2:55).** Bedrock Nova Pro from real frames, Polly neural voice,
   human review step. Close on the repo URL.

## BLOCKED — read this before starting
Segments 3 and 4 need a take that does not exist yet. OBS stopped accepting websocket
connections on 2026-09-07 and the orchestrator could not shoot it. **Do not attempt to fix OBS
and do not shoot it yourself.** Build the edit with the four existing takes and a black
placeholder of the right duration for segments 3 and 4, and say so in your handoff. The
orchestrator will shoot the missing take and drop it in.

## The four hard rules (verbatim, they apply to this task)
(a) Never invent media, data, sources, licences or test results. Reporting BLOCKED with the
exact error is acceptable; fabrication ends the task.
(b) Never replace a failing real component with a simulation. Mocks live in tests only.
(c) Build and test only via the `ops\` scripts. Run `ops\fix-tts.cmd` after any emulator
restart. Never `expo prebuild --clean`, never `taskkill node.exe`, never `timeout` inside a
script, and never create anything outside the workspace folder.
(d) No commit, no push, no deploy. No Devpost or YouTube actions. No AWS console actions.

## Additional constraints specific to this task
- Every factual claim in narration or on a card must be traceable to a row in the README's
  verified table. If you want to say something the README does not support, report it in NEXT
  and leave it out.
- Do not state or imply that live Bedrock ran inside the app. It has not. Bedrock authored the
  description track offline; the in-app LIVE path is not deployed.
- Use only the banked takes. Do not re-record, re-time or speed-ramp footage to make a claim
  look better than it is.

## Required handoff
Write `projects\01-firetv-narratv\docs\04-agents\handoff-task13.md` with:
- **DONE** — what you produced, with the output path and `ffprobe` output proving duration,
  resolution, codecs and audio channels.
- **BLOCKED** — exact blockers with exact error text.
- **RISK** — anything you are unsure of.
- **NEXT** — what the orchestrator must do.
- **FILES** — every file you created or changed.
- **SCREENSHOTS** — SHA-256 of each still you produce, and in plain words what you actually
  SEE in each one. Not what it should show. What it shows.

## How this will be reviewed
The orchestrator will re-run `ffprobe` on your output, open every still you cite, check the
duration against the 3-minute limit, verify the audio is neither silent nor clipping, and
check every spoken claim against the README's verified table. A claim that is not in that
table will be cut.
