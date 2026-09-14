# Provenance — `sintel-track.json`

**Revision `v4.0`.** 44 descriptions, all 13 dialogue-free gaps covered, 42
played and 2 refused at runtime, 0 overlaps.

Every line in this file was written by looking at a frame of the real
archive.org Sintel stream at the timestamp in its own `frameRef`. No line was
written from a plot summary, a synopsis, or anybody's memory of the film. Where
that rule was broken, the break is recorded below rather than quietly fixed.

## Who wrote what

| Author (`model`) | Lines | What it means |
| --- | --- | --- |
| `amazon.nova-pro-v1:0` | 5 | Bedrock's wording, shipped exactly as written. |
| `amazon.nova-pro-v1:0 + referent-normalised` | 14 | Bedrock's observation accepted; only a character's name changed. |
| `amazon.nova-pro-v1:0 + human-corrected` | 14 | Corrected after review, with the reason recorded. |
| `amazon.nova-pro-v1:0 + human-rewritten-from-frame` | 1 | Bedrock was **wrong about the frame**. Rewritten after re-opening it. |
| `human-verified-frames` | 5 | Written by hand from an extracted frame, and still correct. |
| `human-rewritten-from-frame` | 5 | Written by hand, **found wrong**, rewritten from the frame. |

Every corrected or rewritten line keeps its previous wording in `draftText` or
`continuityFrom` with a reason attached, so the review cannot launder the
model's score.

**Of the 34 lines Bedrock wrote, 19 had their observation accepted unaided** —
5 shipped verbatim and 14 with nothing changed but a character's name.

### Why four labels and not two

These counts are derived by `apply-character-register.mjs` on every run, not
typed in, because typing them in is how they went wrong. An earlier pass
relabelled every line it *renamed* as `+ human-corrected`. Renaming a referent
makes no new observation, so that inflated the correction count: the file ended
up reporting 8 of 34 lines surviving review in its per-line labels while
`metadata.review` said 19 — two numbers for one fact, and the pessimistic one
was an artefact of sloppy labelling. The labels now distinguish *wrong about
the frame* from *reworded* from *renamed*, and 19 falls out of the data.

## The character register

An audio description track can be accurate line by line and still fail, and
this one did. Earlier revisions called the same person "a figure", "she", "a
young woman", "the young woman", "a woman with red hair", "a woman with short
red hair" and "a gaunt woman" across one film. A sighted viewer sees one
character. A listener heard seven, with no way to tell whether that was one
person or seven — the information simply was not delivered.

`v4.0` fixes that with one identity per character, introduced once by what is
visible and then held:

| Handle | Who | From |
| --- | --- | --- |
| **Sintel** | the protagonist | described as "a hooded traveller" for 36–84 s, named from the film's own title card at 96 s |
| **the warrior** | bald, black goatee, dark leathers | introduced 44 s |
| **the small dragon** | the injured dragon she rescues | 3:20 and 3:38 |
| **the shaman** | white-bearded old man, ornate headdress | 7:29 |
| **the dragon** | the adult dragon in the cave | introduced 8:20, "the dragon" thereafter |

The name is withheld until 96 s on purpose. The film puts SINTEL on screen
there, so that is the first moment a listener can have her name without being
handed something a sighted viewer does not yet have. An earlier pass withheld it
until 457.8 s — the first time dialogue speaks it — and that was a mistake: it
bought a reveal nobody asked for at the cost of seven minutes of drift.

The small dragon is deliberately **not** called Scales. The film speaks that
name at 3:48, ten seconds after the last line that shows him, and taking the
moment off the film buys nothing: he appears in only two lines, both of which
already say "the small dragon".

`ops-tools/apply-character-register.mjs` applies the register and refuses to
write the file if any banned referent survives, if the name appears before 96 s,
or if any two descriptions overlap. `apps/firetv/tests/character-continuity.test.ts`
asserts the same invariants in CI, so the drift cannot come back quietly.

## What the second review found, and it was not flattering

The first review checked Bedrock's 34 lines against their frames and corrected
15. It did not re-check the 10 lines in gap 0, because those were already
labelled `human-verified-frames` and were therefore assumed correct.

They were not. Re-extracting the frames at 36 s, 44 s, 58 s, 70 s and 96 s
showed that **four of the ten hand-written lines described a scene that is not
in the film**. A fifth, `ad-05` at 36 s, was close but led on the wrong detail
and was rewritten at the same time, which is why five lines carry
`human-rewritten-from-frame` and only four appear in this table:

| Line | Claimed | Actually on screen |
| --- | --- | --- |
| `ad-06` @ 44 s | "She wades through deep drifts past a dark stone structure." | Two people. A heavy dark-clad figure forcing a lighter-clad one off balance. No structure. |
| `ad-07` @ 58 s | "She stops in the open snow. A long spear lies behind her." | Both of them, separated across the slope in whiteout. The spear is not on the ground. |
| `ad-08` @ 70 s | "She lies face down in the snow. An old man in worn robes kneels over her and takes her hand." | The warrior from 44 s bearing down on her. She is upright, red hair loose, gripping her spear across them both. There is no old man. |
| `ad-10` @ 96 s | "The view drifts across the frozen valley." | The film's title card, the largest thing in the frame, plus her walking on with a sword drawn. |

Sintel opens on the fight that starts its story, and this track described it as
a quiet walk through snow. That is the same class of error as the fabricated
track `v1` replaced — a scene assembled from what the film *probably* looks
like — and it survived two revisions because a `human-verified` label was
treated as evidence instead of a claim. **A provenance label is a claim about
process, not a certificate of accuracy, and only a frame settles it.**

Contact sheets for the frames behind every judgement in this section are in
`ops-tools/frames-chars/` (`sheetA`–`sheetG`).

## The one identity call that rests on inference

`ad-25` at 6:41 shows a hollow-cheeked, travel-worn woman with dark hair
gripping a spear in fog. The first continuity pass explicitly protected her as
a **different character**. `v4.0` names her Sintel, on this evidence:

1. The wide shot at 396 s and the close-ups at 399–405 s are one continuous shot
   of one traveller on a foggy ridge, her spear planted beside her.
2. That spear matches the protagonist's weapon in the opening fight at 70 s.
3. The montage she sits inside — 372 s desert, 392 s red rock, 420 s snow —
   holds a single lone figure in every shot.
4. It resolves directly into the scene where the shaman addresses her by name.

Merging two characters is the worst error this pass could make, so the reasoning
is written down rather than assumed. If it is wrong, it is wrong in public.

## Refusals

Two lines are refused at runtime, not in this file: `ad-11` at 146.8 s and
`ad-28` at 449.3 s each overlap a real dialogue cue. The fixture ships them as
authored; `FixtureTrackRepository` marks them `skipped` / `no-gap` when it loads
the track and the player shows them greyed out with the reason. That is why
`metadata.describedCount` reads 44 here while the app's counter pill reads
**42 AD · 2 skipped · 13 gaps** — the file records what was written, the app
reports what will be spoken.

## Subtitles

`sintel.srt` is the official English subtitle file from Wikimedia Commons
(`TimedText:Sintel_movie_4K.webm.en.srt`, CC-BY 3.0, © Blender Foundation). The
film's first spoken word is at **00:01:47.250**; anything claiming dialogue
before that is fabricated. See `sintel.srt.PROVENANCE.md` for what shipped
before it and why it was wrong.

## The overlap counter

`overlapCount = 0` is a checked claim, not an assertion. The register script
throws if any two descriptions overlap, and the repository recomputes the
counter against the authoritative dialogue intervals at load time. An earlier
revision measured the same counter against a dialogue track that did not exist.
