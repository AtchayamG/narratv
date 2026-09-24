# YouTube upload — NarraTV demo video

**File (v6, 2026-09-24)**: `docs/assets/narratv-demo-v6.mp4` (176.68s = 2:56.7, 1920x1080 @ 60fps,
AAC 48 kHz stereo, integrated -15.9 LUFS). It is v5 unchanged except for ONE 14.1 s insert at
1:38: an emulator recording (screen + device audio, `adb emu screenrecord`) of extended mode
handling sintel-ad-11, the same line v5 shows being skipped at 1:10. Built by
`ops-tools/video/assemble-demo-v6.mjs`; capture by `ops-tools/orch-p1-record-extended.mjs`
(logcat in the same run: pause at film 146.70 s, TTS finished 5.89 s later, resumed 12 ms after).

**Previous file (v5)**: `docs/assets/narratv-demo-v5.mp4` (33.0 MB / 34,582,315 bytes,
162.556s = 2:42.5, 1920x1080 @ 60fps, AAC 48 kHz stereo)

**Thumbnail**: `docs/assets/thumbnail-youtube.png` (484 KB)

**Audio, re-mastered 2026-09-16**: integrated **-16.0 LUFS**, true peak
**-1.3 dBTP**. The earlier master was -19.9 LUFS / -4.4 dBTP, which is 6.4 LU
quieter than project 4 and about 6 LU under YouTube's normalisation target -
and YouTube attenuates loud content but never boosts quiet content, so that gap
reached the viewer as faint narration on the project whose whole subject is
audible narration. Three causes, all measured and all fixed:

1. The edge-tts narration mp3s are MONO, and the chain widened them with
   `aformat=channel_layouts=stereo`, which applies a -3 dB per-channel power
   normalisation. Measured on vo-04a: -22.9 dB mean via aformat vs -19.9 dB via
   `pan=stereo|c0=c0|c1=c0`. The voiceover was arriving 3.0 dB under its own
   level before it ever met the film.
2. The film bed was a static `volume=0.32` - 10 dB down even where nobody
   narrates, and still losing to a loud cue where someone does. It is now ducked
   dynamically with `sidechaincompress` keyed on the narration.
3. No final loudnorm. Now `loudnorm=I=-16:TP=-1.5:LRA=11` at the caption burn.

The evidence recordings are **never muted** - the duck is a dip, not a gate,
because the device-recording audio is part of what they prove. Verified by
rendering the film bed alone with and without the sidechain (`ops-tools/video/
orch-duck-probe.cmd`): -9.9 dB at t=1s, -7.2 at 5s, -9.3 at 10s, -4.6 at 15s,
-9.7 at 22s, -7.2 at 26s, and **0.0 dB / -0.1 dB at t=19.9s / 20.1s**, the
0.6-second gap between the two narration lines - full level returns the instant
the voice stops. Across the segment the bed went -25.6 to -30.2 dB mean, only
4.6 dB of average reduction against the old flat 10 dB, so the recordings are
audibly *louder* than before while getting out of the way when it matters.

The 3:00 limit in the rules is hard. v6 is 3.3 s under it (v5 was 17.4 s under).

## Visibility

**Public.** Not "Unlisted" — the rules require a publicly viewable video, and a
judge following the Devpost link must not hit a sign-in wall.

## Title

```
NarraTV — AI audio description on Fire TV that refuses to talk over the film
```

## Description

```
NarraTV generates audio description on Amazon Fire TV for films that have no
description track — and refuses, out loud, when a line will not fit.

Only about 7% of streaming content carries audio description. Human-authored AD
costs $15-75 per minute of runtime, per language, so the original-language
release gets described and the dubs never do. A blind Tamil viewer watching a
Malayalam film with five audio tracks and one description track gets nothing.

What this demo shows, in order:
0:00  The problem: five audio languages, one audio description track
0:16  The approach, and what it refuses to do
0:29  The catalogue on a real Fire TV build, driven by D-pad
0:37  Sintel playing, descriptions landing in real dialogue silence
1:10  The refusal: "SKIPPED · NO GAP" on screen instead of talking over a cue
1:38  Extended mode (opt-in): the same line is not dropped; the film pauses and it is spoken
1:52  Big Buck Bunny has no description track, and the app says so
2:05  "Describe this frame" declined, because the app is in DEMO mode
2:15  Switched to LIVE: a real Amazon Bedrock Nova Pro description
2:31  Architecture, and how good the model actually was: 19 of 34 unaided
2:45  Credits and licences

How it works: a pure-TypeScript scheduler finds dialogue-free gaps from the real
subtitle track, applies 300ms guard bands, and budgets each line by speech rate.
Amazon Bedrock Nova Pro writes each description from a frame pulled out of the
same cut the app streams — never from a synopsis. Amazon Polly Neural voices the
pipeline output. The television calls a deployed API Gateway endpoint over plain
HTTPS, so no AWS credentials ever go on the device.

Mean sync error, logged by the app against its own video clock: 0.20s.
All 13 dialogue-free gaps described: 44 lines, 42 spoken, 2 refused at runtime.
Every Bedrock line was reviewed against its own frame: 19 of 34 observations
were right unaided, 15 were corrected. The model's self-reported confidence
correlated with nothing — two calls on one frame both said 0.95 and both missed
a blizzard filling the shot.

Amazon "Build, Ship, Shape" Developer Hackathon 2026
Track: Fire TV · Minis: AWS Builder, Open Source
Entrant: Atchayam G (solo)

Code (MIT): https://github.com/AtchayamG/narratv
Live health check: https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com/health

Media licences — Sintel, Big Buck Bunny and Elephants Dream are (c) Blender
Foundation, CC BY 3.0. Sintel subtitles from Wikimedia Commons TimedText,
CC BY 3.0. Full attribution in docs/06-demo-submission/media-licenses.md.
```

## Tags

```
audio description, accessibility, Fire TV, Amazon Bedrock, Nova Pro, Amazon Polly,
React Native, blind, low vision, assistive technology, hackathon
```

## Settings that matter

- **Audience**: "No, it's not made for kids"
- **Altered content / synthetic media**: **Yes** — disclose it. The narration
  voice in the demo and the descriptions themselves are AI-generated. Saying so
  is consistent with the entire point of the project.
- **Category**: Science & Technology
- **Comments**: leave on
- **Playlist / Shorts**: none

## After upload — THREE places

Uploaded 2026-09-21: https://youtu.be/slyluQxHFXA

Re-uploading mints a NEW video id. The old one is `Z9Vgvd5bRUs`. Paste the new
watch URL back and it goes into **three** places:

1. **The Devpost SUBMISSION record** — `/submit-to/30992-build-ship-shape-amazon-
   developer-hackathon/manage/submissions/1183969-narratv/project_details/edit`
2. **The Devpost PROJECT record** — `/software/narratv/edit`
3. The P1 README, line 4, the "Watch the 2:43 demo" line under the badges

An earlier revision of this section said **four** places and listed
`docs/06-demo-submission/evidence.md` as the fourth. That was wrong.
`evidence.md` carries no video URL — it indexes the b-roll capture masters and
only refers to "the published ≤3-minute demo video" in prose, without a link.
A repo-wide search for `Z9Vgvd5bRUs` returns exactly two files: `README.md`
line 4, and this file (below, where the old id is kept deliberately as
history). Verify with:

```
findstr /S /N /C:"Z9Vgvd5bRUs" *.md docs\*.md docs\06-demo-submission\*.md
```

Files to **commit** after an upload: `README.md` and this file. Nothing else —
the `.mp4` is gitignored on purpose so the repo stays clonable.

**(1) and (2) are separate records and do not sync.** Devpost support put it
plainly: "Once you submit, two separate items exist: your project and your
submission. If you visit your projects page, you may still see the old video URL
there." Updating only the submission is what left project 4's public page
playing the superseded cut for days while every save looked successful — four
saves across three different URL forms, all of which persisted in the field and
none of which moved the embed, because they were all hitting the wrong record.
The project record is the one the public gallery page renders.

Verify by loading the public page and reading the iframe src, not by re-reading
the edit field. A saved field is not a refreshed embed.

Then **unlist** the old video rather than deleting it — only after the public
page is confirmed showing the new id. Deleting is irreversible and buys nothing
over unlisting; unlisting keeps any already-shared link alive instead of
returning a dead frame.
