# Demo video — plan and captured B-roll

## Rule constraints (from HACKATHON-RULES-AND-RESOURCES.md)
- **Maximum 3 minutes.** Judges are not required to watch beyond it, and they may score from the video alone without testing the project — so the video carries most of the score.
- Must be **public on YouTube or Vimeo** and must show the project **running on the intended device or simulator**.
- Must not contain third-party trademarks or copyrighted material without permission → the Blender films are CC-BY and **must be credited on screen**.
- English, or English subtitles.

## B-roll captured so far (`docs/assets/clips/`, `adb screenrecord`, 1280x720, 50 s each, NO AUDIO)
| File | Content | Use |
|---|---|---|
| `narratv-demo.mp4` (14.9 MB) | Catalog → Play → real Sintel playback with clock advancing 0:00→0:35+, green DIALOGUE (SRT) captions in sync ("You're lucky your blood's still flowing."), timeline drawer opened over live video and closed again | The core "it actually works" segment |
| `narratv-demo2.mp4` (9.6 MB) | Blue AD narration card firing at 0:00 ("A solitary figure in a dark tattered cloak trudges through a heavy blizzard", badged `fixture-handwritten`), then Describe Now → honest refusal toast "LIVE unavailable — demo mode active. Set DEMO_MODE=false with AWS credentials to use live Bedrock inference." | The narration + transparency segment |

Both are raw captures for editing, **not** the submission video.

## AUDIO — verified findings (2026-09-03 01:25)
**The app does produce audio; the clips are silent only because `adb screenrecord` has no audio channel.** Evidence from `dumpsys`/logcat while playing:
- `com.amazonappdev.narratv` (pid 14418) holds an active AudioTrack → the Sintel soundtrack is playing.
- `com.google.android.tts` (pid 14439) delivered synthesized frames (`stop(): called with 99240 frames delivered` ≈ 4.5 s of speech) → **the narration is actually being spoken**.

**Bug found and fixed on the AVD:** `com.google.android.tts` shipped **disabled** (`enabled=0`) on this Android TV system image, and `tts_default_synth` was `null` — so a fresh emulator would narrate nothing at all. Fixed with `ops\fix-tts.cmd` (`pm enable com.google.android.tts` + set default synth + media volume). **Any new emulator/machine must run this first**, or the audio-description product is mute.

## Known gaps to close before the real recording
1. **Capturing the audio.** `adb screenrecord` cannot record audio, and the host has **no loopback capture device** (`ffmpeg -list_devices` shows only the Realtek mic array and a Bluetooth headset mic), so ffmpeg cannot grab system sound either. Fix by one of: (a) **OBS Studio** — captures the emulator window plus desktop audio via WASAPI loopback with no extra driver (recommended); (b) enable **Stereo Mix** in Windows sound settings, then `ffmpeg -f gdigrab` + `-f dshow -i audio="Stereo Mix"`. Never dub or reconstruct audio onto a screen capture — the demo must be a real recording of the app running.
2. **No CC-BY attribution on screen yet** (Task 11.2) — required before any public video.
3. `Back to Catalog` is clipped at the right edge (Task 11.3) — visible in these clips; fix before final capture.
4. Live Bedrock path not yet real (Task 11.1 + AWS activation) — decide whether the video shows LIVE mode or honestly presents DEMO mode with the refusal toast. **Never fake LIVE.**

## Suggested 3-minute structure (draft)
- 0:00–0:20 — the problem: most content has no audio description; blind and low-vision viewers are locked out. State it plainly, no stock-footage padding.
- 0:20–1:10 — the product working: catalog → play → **audio up** as a description lands in a real dialogue-free gap.
- 1:10–1:50 — the differentiator: the Deterministic Narration Timeline, showing `SKIPPED: NO-GAP` refusals — the system declining to talk over dialogue is the trust story.
- 1:50–2:25 — transparency: Why-This-Description panel (frame, model, confidence), DEMO/LIVE truth pill, System Status.
- 2:25–2:50 — architecture in one diagram: Bedrock (Nova) → deterministic scheduler → Polly → Fire TV, and the AWS Builder integration.
- 2:50–3:00 — CC-BY credits + repo URL.
