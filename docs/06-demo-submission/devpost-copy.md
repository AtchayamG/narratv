# Devpost submission copy — NarraTV

Paste-ready. Every figure here is sourced; see **Sources** at the end. Nothing in
this document may be a number we have not verified.

---

## Name

**NarraTV**

## Tagline

> Audio description that **refuses to talk over the film** — and refuses to
> describe a scene it hasn't seen.

Alternate, if a coverage-first framing reads better on the day:

> Audio description for the 93% of films that will never get a human one.

## Elevator pitch (200 chars)

NarraTV generates audio description on Fire TV for titles that have none —
scheduling every line into real dialogue silence, and visibly refusing when it
doesn't fit.

---

## Inspiration

Open any major streaming app and look at a film's audio menu. Here is a real one,
a 2026 Indian feature on a mainstream service:

```
AUDIO                              SUBTITLES
  Tamil                        ✓    Off
  Malayalam        Original         English
  Malayalam        Audio Description English [CC]
  Hindi
  Telugu
  Kannada
```

Five languages. **One** audio description track. A blind Tamil viewer, on that
platform, on that film, gets nothing — same film, same app, same evening.

That is not an edge case, it is the normal shape of audio description:

- Only about **7%** of streaming content carries audio description industry-wide.
  Netflix, the leader, sits near **40%** of its library.
- Human-authored AD costs **$15–75 per minute of runtime** — **$2,250–11,250**
  for a 150-minute film, **per language**.
- So the original-language release gets described and the four dubs do not.
  Regional cinema, back catalogue and independent film never will.

And the clock is running. India's Ministry of Information and Broadcasting
issued **OTT accessibility guidelines on 6 February 2026** requiring audio
description, and the Delhi High Court is actively directing CBFC and the Centre
on cinema and OTT accessibility. Platforms are about to need audio description at
a scale description studios cannot staff.

We asked: **what if the missing track could be generated on the viewer's own
television, for the title in front of them, in the language they actually chose?**

Estimated cloud cost for a full 90-minute track: **~$0.37**.

---

## What it does

NarraTV is a Fire TV application that generates and speaks scene description for
films that have no description track — and is deliberately, visibly honest about
what it cannot do.

**The golden scenario, as demonstrated:**

1. Open the catalog. Two titles show an honest **NO AD TRACK** state; they are
   not silently pretended over.
2. Play *Sintel*. Real H.264 streaming, clock driven by `onProgress` — never a
   timer.
3. The film's first spoken line is at **1:47.250**. The 107 seconds before it are
   dialogue-free, and NarraTV describes that opening in real silence.
4. All **13** dialogue-free gaps in the film carry descriptions — **44 lines**,
   every one written from a frame pulled out of the same cut the app streams.
5. Each line is spoken by the best voice the device offers, with the film ducked
   to 25% underneath it, and captioned in a slim lower third that never covers
   the picture.
6. **42 of the 44 lines play. Two are refused at runtime** and the screen shows
   **`SKIPPED · NO GAP`** over the picture, because the gap is shorter than the
   line takes to speak. The refusal is the feature.
7. The HUD counts described gaps over real gaps and overlaps at zero — computed
   from the track at runtime, never a fabricated 100%.

---

## The refusal principle

An audio describer that talks over the film is worse than no describer at all.
So the interesting engineering here is what the system declines to do, and every
refusal is enforced in code and visible on screen.

| It will not… | …without / unless |
|---|---|
| Speak over dialogue | Narration is hard-cancelled the instant a cue starts |
| Start a line | It fits before the next cue with 0.4s to spare, measured from when the voice is actually audible |
| Claim a title is described | The track really exists — otherwise `NO AD TRACK` |
| Claim AI authorship | The description names the frame it was written from |
| Cover the picture | Nothing renders across the middle of the frame; chrome auto-hides in 4s |

Each of these has a named test. The build fails if a description lacks its
`frameRef`, if two descriptions overlap, or if any description collides with a
real dialogue cue — that last test names the offending line when it fails.

---

## How we built it

**Fire TV app** — React Native for TV (`react-native-tvos` 0.81, Expo SDK 54,
React 19). D-pad navigation, TalkBack-audited, auto-hiding chrome, slim
lower-third captions.

**Scheduler (`packages/scheduler`)** — pure TypeScript, no I/O. `findGaps` merges
dialogue intervals and applies 300ms guard bands; `placeDescriptions` budgets by
speech rate; counters are computed, never asserted. Verified with `fast-check`
property tests.

**Runtime timing (`useScheduler`)** — the part that turned out to matter. Device
TTS is not audible the moment you call it; latency varies by voice, device and
whether the engine is warm. So `TtsAdapter` times every utterance from dispatch
to first audible sample and feeds a rolling average back as the lead-in, seeded
from the class of voice selected. The caption is raised by the engine's real
`onStart`, so text and voice appear together.

The app logs its own sync error against the video clock:

```
[narratv] AD sintel-ad-07 audible@58.02s target=58.00s error=0.02s
```

Mean absolute error across the ten opening descriptions: **0.20s**.

**AWS pipeline (`services/pipeline`)** — CDK v2, Lambdas, Step Functions, and
`LiveDescribeAdapter` for **Amazon Bedrock Nova Pro** (multimodal frame → text)
and **Amazon Polly Neural** (text → speech). DEMO mode throws *before* any SDK
call, so a demo build cannot silently masquerade as live.

**It is deployed, and you can check it without installing anything:**

```
GET https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com/health
{"mode":"live","providers":{"bedrock":"ok","polly":"ok","s3":"ok"}}
```

`POST /describe` with a real frame returns a Nova Pro description in about two
seconds. The television reaches it over plain `fetch()`, which is the point of
the shape: **no AWS credentials ever go on the device.** On the System Status
screen, "Switch to LIVE (AWS Bedrock)" flips the running app over at runtime and
the status line reads CONNECTED / NOVA PRO — no rebuild, no env var.

---

## Challenges we ran into

**We shipped fabricated data, and caught it.** An earlier revision contained a
26-cue Sintel subtitle file in which cues 1–10 carried real script lines at
invented timestamps and cues 11–26 were dialogue **that does not occur in the
film**. The description track was a plot summary fitted to those fake gaps.

It mattered far beyond wrong captions: `findGaps` derives gaps from the subtitle
track, so every gap was fictional — and the headline **"overlaps: 0"** was
meaningless, because it counted collisions against dialogue that did not exist.

We caught it by pulling frames from the real stream and comparing. At video
01:02 the picture is Sintel alone in a snowfield while the app narrates *"the
warm firelight inside the mountain hut."* Both files were replaced: subtitles
verbatim from the official Wikimedia Commons track, descriptions written by
looking at the frames they name. Evidence images are in the repository.

**The test that should have caught it made it worse.** It asserted
`descriptions.length >= 25`. A quantity assertion cannot detect invented
content — it actively rewards it. Replaced with correctness assertions: no
description overlaps another, none overlaps a real cue, the first cue is after
107s, and every description carries a `frameRef` and an honest `model`.

**The lead-in could not be a constant.** A fixed 0.6s guess left the narration
audibly late, and a bigger constant just overshoots elsewhere. Measuring it was
the fix. A related bug fell out: the gap-fit check measured room from *now*
rather than from when the voice becomes audible, over-counting by exactly the
lead-in — so a slow engine made the safety check *looser* when it should make it
stricter.

**`adb screenrecord` captures no audio,** which made the first demos silent and
useless for judging AD. Replaced with OBS driven over websocket, using
process-scoped audio capture so nothing else on the desktop bleeds in, plus a
`verify-take` script that checks stream layout, loudness *and* picture luma —
one take came back completely black and only the luma check caught it.

**`NODE_ENV=production` in the user environment** made `react-test-renderer` load
its production build; every React Native Testing Library render threw. The test
scripts now pin `NODE_ENV=test`.

**LIVE mode had never once run, in any build we ever shipped.** The feature was
written, tested and documented; the switch was an env var read at build time.
Three separate mechanisms had to line up, and all three quietly did not:

1. `babel-preset-expo` inlines **only** variables prefixed `EXPO_PUBLIC_`. Ours
   was not, so `process.env.API_URL` compiled to `undefined` in the bundle.
2. After renaming it, still nothing. `api.cache(true)` in `babel.config.js`
   makes Babel's transform cache **insensitive to the environment**, so the
   inlined value was served from a cache keyed on a run that never had it.
3. Gradle's JS bundle task keys on **input files**. Changing an env var changes
   no file, so the task came back `UP-TO-DATE` and shipped the previous bundle.

Each layer is individually reasonable and the combination is silent: no warning,
no error, and a perfectly green test suite, because the tests read the same
`undefined` the app did. We stopped fighting it and removed env vars from the
path entirely — a committed constant plus a **runtime** toggle on the System
Status screen. The first test in `config-env-prefix.test.ts` now asserts that
`config.ts` contains no `process.env` at all.

**A control a remote cannot reach does not exist.** With the toggle finally on
screen, it was still unusable: focus landed on "Refresh Status" at the bottom of
the page, and no D-pad path walked upward into the cards. Reading the component
tree would never have shown this. Driving the emulator with real `adb` keyevents
did — the focus ring simply never arrived.

**We measured the model instead of trusting it, and it cost us.** Every one of
the 44 Bedrock-written lines was re-checked against the frame it was written
from: **19 of 34 observations were right unaided, 15 were wrong and corrected.**
The same audit turned on our own hand-written opening gap, which had been
labelled verified and then never re-checked — **4 of its 10 lines described a
scene the film does not contain.** Worth recording: the model's self-reported
confidence carried no information at all. Two calls on the same frame both
returned `0.95`, and both missed a blizzard filling the shot.

---

## Accomplishments

- **Mean sync error 0.20s**, measured and logged by the app itself rather than
  eyeballed.
- **24 suites / 117 tests** green across four workspaces.
- **Complete description coverage on a real film**: all 13 dialogue-free gaps,
  44 lines, every line written from a frame — and two of them refused on air,
  out loud, because they did not fit.
- **A live AWS path a judge can hit from a browser**, and a runtime LIVE/DEMO
  switch on the television that needs no rebuild and carries no credentials.
- Every refusal is a named test, not a comment.
- Estimated **~$0.37** in cloud cost for a full 90-minute track, against
  $1,350–6,750 for the human equivalent.
- We found and removed our own fabricated data, and wrote the tests that make
  its return a build failure.

## What we learned

That a demo can be green, tested and completely dishonest at the same time.
Twenty-one suites passed against a fabricated dialogue track, and one of those
tests was *rewarding* the fabrication by counting rows. The design change that
followed is now a rule in the repository: **never write a description, caption or
timestamp from a synopsis — write it from a frame you have actually looked at,
and record which frame.** Partial and true beats complete and invented,
especially in a product whose entire value is a trust claim to blind viewers.

## What's next

Honest current limitations, stated plainly:

- **The model is wrong often enough that a human has to read every line.**
  19 of 34 observations were right unaided. A track shipped straight out of Nova
  Pro would confidently describe things that are not on screen. Today the review
  step is a person; that is the honest state of the art, and pretending
  otherwise is the one thing this project refuses to do.
- **Voicing on device is the operating system's TTS, not Polly.** Polly Neural
  is verified as a real call and is what the pipeline synthesises with, but the
  demo speaks through the television's own engine. Swapping the playback path to
  pre-synthesised Polly audio is next.
- **One film, one language.** The track that exists is *Sintel* in English. The
  entire argument of the project is the Tamil viewer in that opening screenshot,
  and she is still silent. Per-language authoring is the next build.
- **AI description is not as good as a skilled human describer.** We are not
  claiming parity. The claim is coverage of what a human will never be paid to
  describe.
- **Not on real Fire TV hardware.** Developed and demonstrated on the Android TV
  emulator, API 30, 1080p — which the hosts confirmed is an acceptable demo
  target. Sideloading to a physical Fire TV Stick is untested.

---

## Sources

- Audio description coverage (~7% industry, ~40% Netflix) — [TestParty](https://testparty.ai/blog/media-accessibility-statistics)
- AD production cost ($15–75/min) — [3Play Media](https://www.3playmedia.com/blog/how-much-does-audio-description-cost/)
- India OTT accessibility guidelines (6 Feb 2026) and Delhi HC direction — [MediaNama, Aug 2026](https://www.medianama.com/2026/08/223-delhi-hc-cbfc-ott-differently-abled/)
- CBFC draft accessibility guidelines — [cbfcindia.gov.in (PDF)](https://www.cbfcindia.gov.in/cbfcAdmin/assets/pdf/Final_Draft_Accessibility_Guidelines_Films.pdf)
- Sintel subtitles — [Wikimedia Commons TimedText](https://commons.wikimedia.org/wiki/TimedText:Sintel_movie_4K.webm.en.srt), CC-BY 3.0
- AWS pricing basis — `docs/02-product/sources.md`
