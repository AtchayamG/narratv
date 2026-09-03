# Agent working records — read this first

**These files are a dated log, not current documentation.**

`handoff-task*.md` and `review-*-claude.md` record what an agent reported and
what the orchestrator found **at that moment**. They are deliberately **not**
rewritten when a later finding contradicts them. The audit trail is the point:
you should be able to see what was believed, when, and how it was corrected.

For the current state of the project, read the [root README](../../README.md).
For the current standing instructions to the implementation agent, read
[`agy-unified-prompt.md`](./agy-unified-prompt.md).

---

## Claims in these files that were later found FALSE

If you are reading a handoff and it says one of the following, it is wrong. It
is left in place on purpose.

| Claim, as written in the log | Files | What is actually true |
|---|---|---|
| "28 descriptions" for Sintel | `handoff-task4/6/7` | That track was **fabricated** — a plot summary with invented timestamps. Replaced 2026-09-03 with **10 descriptions**, each written from a named frame. |
| `model: fixture-handwritten` | `handoff-task1/7/9/10/11`, `agy-task7-correction` | Now `human-verified-frames`, and every entry carries a `frameRef`. A test fails the build if it does not. |
| "0 overlaps" as a headline result | `handoff-task4/11/12`, `agy-prompts`, `agy-task12`, `review-03` | Was measured against a **fabricated subtitle track**, so it counted collisions with dialogue that does not exist. The counter only became meaningful on 2026-09-03. |
| "15 gaps / 13 described" | various | The film has **12** real dialogue-free gaps. **10** are described. |
| "51 tests" / "67 tests" / "21 suites" | `handoff-task5/6/7`, `review-01/04/07` | **22 suites / 87 tests** as of 2026-09-03. |
| "97% of streaming titles inaccessible" | `agy-task7-correction`, `review-01/02` | Unsourced when written. The sourced figure is **~7% of streaming content has audio description** (Netflix, the leader, ~40% of its library). |

## The two corrections that matter

**2026-09-03 — fabricated Sintel dialogue and description tracks.**
`sintel.srt` (and its inline twin `SINTEL_SRT`, which is what the app actually
read) claimed dialogue from 00:00:24. The film's first spoken word is at
**00:01:47.250**, and cues 11–26 were lines that **do not occur in the film at
all**. The description track was fitted to those fake gaps. Both were replaced
with verified data. Evidence: [`docs/assets/evidence/`](../assets/evidence/) and
the two `PROVENANCE.md` files beside the fixtures. Commit `f7cc518`.

**2026-09-03 — the test that rewarded it.** `di-repository.test.ts` asserted
`descriptions.length >= 25`. A quantity assertion cannot detect invented
content; it made the fabrication *pass*. Replaced with correctness assertions.

## The rule that came out of it

> Never write a description, caption, timestamp or subtitle from a plot summary,
> a synopsis, or memory of a film. Write it from a frame you have actually
> looked at, and record which frame in `frameRef`. If you cannot see the frame,
> leave it undescribed and say so.
>
> Partial and true beats complete and invented. The entire product is a trust
> claim to blind viewers.

This is now clause 1 of the standing agent prompt.
