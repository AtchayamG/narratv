# YouTube upload — NarraTV demo video

**File**: `docs/assets/narratv-demo-v5.mp4` (34.6 MB, 2:42.5, 1920x1080 @ 60fps,
AAC 48 kHz stereo, mean -22.8 dB / peak -4.4 dB, no silence gap over 4s)

The 3:00 limit in the rules is hard. This cut is 17.5s under it.

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
1:38  Big Buck Bunny has no description track, and the app says so
1:51  "Describe this frame" declined, because the app is in DEMO mode
2:01  Switched to LIVE: a real Amazon Bedrock Nova Pro description
2:17  Architecture, and how good the model actually was: 19 of 34 unaided
2:31  Credits and licences

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

## After upload

Paste the watch URL back and it goes into three places:
1. The Devpost submission's video field
2. The P1 README, as a "Watch the demo" line under the badges
3. `docs/06-demo-submission/evidence.md`
