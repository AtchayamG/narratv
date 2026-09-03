# Provenance — `sintel.srt`

**Source:** the official English subtitle track published on Wikimedia Commons for
the Blender Foundation's *Sintel* (2010):
`TimedText:Sintel_movie_4K.webm.en.srt`
<https://commons.wikimedia.org/wiki/TimedText:Sintel_movie_4K.webm.en.srt>

Retrieved verbatim on 2026-09-03. 26 cues. First cue 00:01:47,250, last cue
00:10:29,800.

*Sintel* is released under Creative Commons Attribution 3.0
(© copyright Blender Foundation | www.sintel.org), so the subtitle text is
redistributable with attribution. Attribution is shown in-app on the credits
surface.

## Why this file was replaced

The previous `sintel.srt` in this repository was **not the film's dialogue**.
It was wrong in two separate ways, and both were verified before replacement:

1. **Fabricated timings on real lines.** Cues 1-10 carried genuine lines from
   the Sintel script but placed them between 00:00:24 and 00:01:00. In the
   actual film the first word is not spoken until **00:01:47**. Frames pulled
   from the real stream at 00:00:24 and 00:00:44 show an empty snowfield and
   Sintel crawling alone — no character is speaking at either moment.

2. **Fabricated dialogue.** Cues 11-26 were lines that **do not exist in the
   film at all**: "It was winter...", "I found him in the town square.",
   "He was wounded, shivering in the cold.", "I nursed him back to health and
   named him Scales.", "He learned to fly quickly.", "We were inseparable.",
   "Then one afternoon... a giant shadow crossed the sun.", "A massive dragon
   swept down and took him away.", "I swore I would find him...", "Across
   deserts, through ruined cities, across oceans.", "Be careful in the deep
   caverns...", "Scales? Is that you?", "No... no, it can't be!", "What have I
   done... Scales... I'm so sorry...".
   Sintel's flashback is deliberately wordless. None of this was ever spoken.

## Why it mattered

`packages/scheduler/find-gaps` derives dialogue-free gaps from this file, and
`place-descriptions` fits narration into those gaps. With a fabricated dialogue
track, every gap was fictional, so:

- narration was scheduled against dialogue that does not exist, and
- the headline **"overlaps: 0"** was meaningless — zero collisions with an
  imaginary dialogue track says nothing about collisions with the real one.

The counter is only trustworthy now that the dialogue intervals are real.

## Consequence for the description track

`sintel-track.json` was placed against the old, fictional gaps, so its
timestamps are invalid and must be re-derived from this file. See
`sintel-track.json.PROVENANCE.md`.
