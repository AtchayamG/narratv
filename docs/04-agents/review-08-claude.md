# Review 08 — Claude (orchestrator), 2026-09-03

**Verdict: NOT APPROVED — fabricated content data found in shipped fixtures.**
Corrected in-session. This review records what was wrong, how it was found, and
what now prevents it.

Unlike reviews 01–07, this one was not triggered by an agy handoff. It came from
the human: *"the description doesn't match the video"* and *"the subtitle too is
wrong entirely."* Both reports were correct.

---

## Finding 1 — the subtitle track was invented (CRITICAL)

`apps/firetv/assets/fixtures/sintel.srt`, and its inline twin `SINTEL_SRT` in
`fixture-track-repository.ts` — which is what the app actually read; the `.srt`
asset was decorative and nothing loaded it:

- Cues 1–10 carried real lines from the Sintel script, placed between 00:00:24
  and 00:01:00. The film's first spoken word is at **00:01:47.250**.
- Cues 11–26 were dialogue **that does not exist in the film**: "It was
  winter...", "I found him in the town square.", "I nursed him back to health
  and named him Scales.", "We were inseparable." Sintel's flashback is
  deliberately wordless.

**How it was found:** frames pulled from the real archive.org stream at the
timestamps in question. At video 00:24 and 00:44 the screen is an empty
snowfield and a woman crawling alone — nobody is speaking.

**Blast radius — this is the part that matters.** `findGaps` derives gaps from
the subtitle track and `placeDescriptions` fits narration into them. With a
fabricated dialogue track, every gap was fictional, so the headline
**"overlaps: 0"** — quoted in reviews 03 and 11 and in the README badge — was
meaningless. It counted collisions against dialogue that does not occur.

**Fix:** replaced verbatim with the official English track from Wikimedia
Commons `TimedText:Sintel_movie_4K.webm.en.srt` (CC-BY 3.0). 26 cues, first at
00:01:47.250. Real dialogue-free gaps: **12**, not the 32 previously claimed.

## Finding 2 — the description track was a plot summary (CRITICAL)

`sintel-track.json`: 28 descriptions, `model: fixture-handwritten`, fitted to
the fake gaps above. Evidence frame: at video **01:02** the picture is Sintel
alone in a snowfield with a spear behind her while the app narrates *"The warm
firelight inside the mountain hut reflects across the traveler's face."*

**Fix:** 10 descriptions, `model: human-verified-frames`, each written by
looking at the frame named in its `frameRef`, all inside gap 0 (0–106.95s).
Coverage is deliberately partial and visible in the HUD as **AD 10/12**.

## Finding 3 — the test rewarded the fabrication (CRITICAL)

`di-repository.test.ts` asserted `descriptions.length >= 25`. A quantity
assertion cannot detect invented content — it made the fabrication *pass*, and
was the reason 21 green suites gave false confidence.

**Fix:** replaced with correctness assertions — no description overlaps another,
none overlaps a real cue (the failure message names the offending line), the
first cue is after 107s, and every description carries a `frameRef` and an
honest `model`.

## Finding 4 — the instruction that caused it

`docs/04-agents/agy-prompts.md`, PROMPT 1, step 4:

> "Write one hand-authored description track for Sintel (**≥ 25 descriptions**,
> realistic, status 'ai-draft', model 'fixture')"

Asking for a *quantity* of "realistic" descriptions, with no requirement that
they match the film, is an instruction to fabricate. The agent complied with
the brief it was given. **This is an orchestrator failure, not an agy failure** —
I wrote that prompt, and the matching count assertion in the test.

**Fix:** the instruction is corrected in place with a dated note explaining why,
and the anti-fabrication rule is now rule 0 of `AGENTS.md` and rule 1 of
`agy-unified-prompt.md`.

---

## Also corrected this session

- **Overlays blocked the picture.** A 750px bordered card centred in frame,
  printing each description twice, plus chrome that never hid. Replaced with a
  slim lower third and 4s auto-hide. Regression test asserts nothing is
  centre-anchored.
- **Narration timing.** Device TTS is not audible when `speak()` returns.
  Latency is now measured per utterance and fed back as the scheduler's
  lead-in, seeded from the voice class. Mean absolute sync error **0.20s**,
  logged by the app against the video clock.
- **Voice.** Was the flat `en-us-x-iog-lstm-embedded` default; now selects
  `en-us-x-tpf-network` (Enhanced). The expo-speech test mock had no
  `getAvailableVoicesAsync`, so selection had been silently taking its fallback
  path in every test.
- **Video script.** Scripted us to say on camera: a "96% confidence score"
  (never existed), "Amazon Polly Neural" voicing a demo that uses device TTS,
  "28 descriptions", "51 tests". Rewritten with a verified-claims-only rule.

## State at close of review

| | |
|---|---|
| Tests | 22 suites / 87 passing |
| Dialogue-free gaps | 12 real |
| Described | 10, all frame-verified |
| Overlaps | 0 — now a meaningful number |
| Mean sync error | 0.20s |
| Live AWS | Unverified — account active, credentials pending |

Commits: `f7cc518`, `86a0d23`, `6048ba4`, `dc6005e`.

## Standing rule added

> Never write a description, caption, timestamp or subtitle from a plot summary,
> a synopsis, or memory of a film. Write it from a frame you have actually
> looked at, and record which frame. Partial and true beats complete and
> invented.
