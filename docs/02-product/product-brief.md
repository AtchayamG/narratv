# NarraTV — Product Brief (Fire TV track)

## One-sentence claim
A blind or low-vision viewer presses Play on Fire TV and hears AI-written scene descriptions **in the gaps between dialogue — never over it** — with every description traceable to the frame, model and reviewer that produced it.

## Tagline (mechanism + contrast)
"Describes the scene, never the dialogue. AI drafts, timing is deterministic, humans verify."

## Refusal principle (say it first)
NarraTV will **not** speak while anyone on screen is speaking (subtitle timing is the law, not a heuristic), will **not** play a description it is not confident about (below-threshold descriptions are skipped and logged, not guessed), and will **not** call a track "verified" until a human reviewer has approved it.

## Who / painful moment / outcome
- **Who:** blind and low-vision viewers (WHO: ~2.2B people live with vision impairment; India has the largest blind population), plus families watching together.
- **Painful moment:** most streaming catalogs — especially indie, regional and kids content — ship **no audio-description (AD) track**. The viewer hears music and silence and asks "what's happening?"
- **Outcome:** the same film, now narrated in the silences. Measured: % of dialogue-free gaps ≥2.5 s that receive a description; 0 overlaps with dialogue (deterministic guarantee, tested).
- Numbers in the Devpost opening MUST be sourced (WHO fact sheet, FCC/ACB AD statistics, Ofcom AD quotas). agy: collect citations in `docs/02-product/sources.md`; do not invent.

## Golden path (demo, < 3 min)
1. Fire TV home → NarraTV app. Catalog of CC-BY Blender films (Big Buck Bunny, Sintel, Elephants Dream — licensed for redistribution).
2. Select *Sintel*. Badge shows **"AD track: AI draft · 41 descriptions · 0 overlaps"**.
3. Play. In the first silence a description is spoken. Dialogue starts → narration is not scheduled there (show the timeline surface: green dialogue blocks, blue description blocks, grey "skipped: low confidence").
4. Press the remote's **Menu** button → "Why this description?" panel: source frame thumbnail, model (Bedrock), confidence, reviewer status.
5. Press **Play/Pause** long-press (or an on-screen "Describe now" button) → **live** Bedrock multimodal call on the current frame → spoken with a "LIVE" badge. (This is the sponsor-platform-visibly-executing moment.)
6. Close: "Every gap ≥2.5 s narrated, zero dialogue collisions, 90-min film processed in N minutes for $X."

## Fire TV priority-area fit
AI-enhanced viewing ✔ · computer vision ✔ · multi-modal UX (audio + timeline + remote) ✔ · family entertainment ✔ · accessibility (caretaking).

## Runtime truth labels (must appear in UI + README)
- **Pre-generated:** description tracks + Polly audio built by the pipeline before playback.
- **Live:** "Describe now" → Bedrock call at request time (fails explicitly if no key; never silently falls back).
- **Demo/fixture:** `DEMO_MODE=true` bundles tracks so judges need no AWS keys.
- **Dev provenance:** Antigravity/Claude/Codex built the code (AGENTS.md, handoffs in docs/04-agents).

## Not building (say so)
No live TV/DRM content (apps cannot read protected frames); no on-device CV (Fire TV Stick is too weak); no speech recognition when subtitles are missing (v2: Amazon Transcribe gap detection, labeled hybrid).
