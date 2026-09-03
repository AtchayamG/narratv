# NarraTV — 3-minute demo video script

**Rule for this shoot: we do not say anything on camera we have not verified.**

The previous version of this script had us narrating a "96% confidence score"
(never existed), "Amazon Polly Neural" voicing the demo (demo mode uses device
TTS — Polly is the LIVE path), "28 descriptions" (that track was fabricated and
removed) and "51 tests" (it is 87). A judge who checks one of those and finds it
false discounts everything else. Every claim below is traceable to the README's
verified/unverified table.

**Two things must be visible on screen, because they are the pitch:**
the coverage gap, and a refusal.

---

## Act 1 — The gap (0:00 – 0:30)

**Visual (0:00–0:12)** — Open cold on the real streaming app audio menu (the
JioHotstar screenshot). Hold it. Highlight the language list, then the single
`Audio Description` row.

**VO** — "This film ships in five languages. Its audio description exists in
one. If you're blind and you're watching in Tamil — this evening, this film,
this app — you get nothing."

**Visual (0:12–0:22)** — Three sourced figures, plainly typeset, one at a time:

```
~7%      of streaming content has audio description
$15–75   per minute of runtime to have a human write it
6 Feb 2026   India mandates AD for OTT platforms
```

**VO** — "About seven percent of streaming content is described. Human
description runs fifteen to seventy-five dollars a minute — a couple of thousand
per film, per language. That's why the original got described and the four dubs
didn't. And as of February, Indian platforms are required to close that gap."

**Visual (0:22–0:30)** — Title card: **NarraTV**.

**VO** — "So we built the fallback. Audio description generated on the
television, for the film in front of you."

---

## Act 2 — It refuses (0:30 – 1:20)

This act is the money shot. Do not cut it for time.

**Visual (0:30–0:42)** — Fire TV catalog. D-pad across the rail. Land on *Big
Buck Bunny*, which shows **NO AD TRACK**.

**VO** — "First, what it won't do. This title has no description track, and the
app says so. It doesn't invent one."

**Visual (0:42–1:00)** — Open *Sintel*. Playback starts. The opening is
dialogue-free; the first description lands in it, caption in the lower third,
film audio ducking underneath. Let the viewer *hear* it.

**VO** — "Sintel's first spoken line is at one minute forty-seven. Everything
before it is silence — a hundred and seven seconds of it — so that's where the
description goes."

**Visual (1:00–1:20)** — Cut to a moment where a line will not fit and the
screen shows **`SKIPPED · NO GAP`**. Hold it long enough to read.

**VO** — "And when a description won't finish before the next line of dialogue,
it doesn't start. It says so, on screen, instead of talking over the film. A
describer that steps on dialogue is worse than no describer at all."

> **Shot note:** if the opening gap yields no natural refusal, do NOT stage a
> fake one. Use the Timeline surface to show a description marked skipped, or
> shorten a gap in a purpose-built fixture and say on camera that it is a test
> fixture.

---

## Act 3 — Show the working (1:20 – 2:05)

**Visual (1:20–1:38)** — Press **Menu**. TimelineSurface slides up: dialogue
cues, scheduled descriptions, skipped blocks. Top-right HUD reads
**AD 10/12 · OVERLAPS 0**.

**VO** — "Ten of twelve dialogue-free gaps are described. Not twelve — ten.
The other two are honest gaps we haven't described yet, and the counter says so."

**Visual (1:38–1:52)** — Select a description block. WhyPanel opens showing the
frame reference it was written from and its placement rule.

**VO** — "Every description records the frame it was written from. We shipped a
version that didn't — it was a plot summary with invented timestamps, narrating
firelight in a hut while the character stood alone in the snow. We caught it by
pulling frames and comparing, threw it out, and wrote the tests that fail the
build if it comes back."

**Visual (1:52–2:05)** — Terminal, live: run the sync harness, show real output.

```
[narratv] AD sintel-ad-07 audible@58.02s target=58.00s error=0.02s
```

**VO** — "The app measures its own sync against the video clock and logs the
error. Mean absolute error across the opening: two tenths of a second."

---

## Act 4 — The AWS pipeline (2:05 – 2:35)

**Visual (2:05–2:22)** — Architecture motion graphic: gap detection → **Amazon
Bedrock Nova Pro** (multimodal, frame → description) → **Amazon Polly Neural**
(description → speech) → S3 / CloudFront, orchestrated by **Step Functions**,
deployed with **CDK v2**.

**VO** — "The pipeline is AWS. Step Functions pulls a keyframe from each
dialogue-free gap, Bedrock Nova Pro describes what's actually in it, and Polly
Neural voices it."

**Visual (2:22–2:35)** — Terminal: the cost model, and the adapter tests running
green.

**VO** — "Estimated cloud cost for a ninety-minute track: thirty-seven cents.
Against roughly two to seven thousand dollars for the human equivalent. One
caveat, said plainly: our AWS account activated the day before submission, so
Bedrock and Polly are proven against mocked SDK clients, not live calls. Demo
mode throws before it can pretend otherwise."

> **If live credentials land before the shoot:** replace this beat with a real
> `Describe` press producing a live Bedrock description, and update the README
> table in the same edit. Do not narrate live execution unless it is on screen.

---

## Act 5 — Close (2:35 – 3:00)

**Visual (2:35–2:48)** — System Status screen: provider health, CC-BY
attribution for the Blender Foundation films and the Wikimedia subtitle track,
and the test badge (**22 suites / 87 tests**).

**VO** — "Open source under MIT, built on Creative Commons cinema, with the
attribution in the app itself."

**Visual (2:48–3:00)** — Return to the opening audio menu. The four undescribed
languages sit there. Then the NarraTV caption appears over the film.

**VO** — "A skilled human describer is still better than this, and we're not
claiming otherwise. But a human is never going to be paid to describe the other
four languages. That's the gap this closes."

**End card** — repository URL · MIT · Amazon Build, Ship, Shape 2026.

---

## Pre-shoot checklist

- [ ] Every number said aloud appears in the README's verified table
- [ ] No claim of live AWS execution unless it happens on screen
- [ ] Demo-mode narration described as *device TTS*, never as Polly
- [ ] A refusal is visible and legible for at least 2 seconds
- [ ] `AD 10/12` is on screen — do not crop the honest counter
- [ ] Recorded via OBS with process-scoped audio; `verify-take.cmd` passes
      (streams, loudness, **and** picture luma — one take came back black)
- [ ] No credentials, account IDs or the AWS credit code anywhere on screen
- [ ] Five clean runs from a reset emulator before the take that ships
- [ ] Under 3:00
