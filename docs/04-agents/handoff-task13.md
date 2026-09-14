# Task 13 Handoff — Cut the ≤3-minute Devpost Demo Video

## 1. DONE

### 13.1 Deliverable Master File
* **Full Output Path**: `D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\ops-tools\video\narratv-demo-final.mp4`
* **File Size**: 17,076,421 bytes (16.28 MB)
* **Duration**: 172.347333 seconds (2 minutes, 52.35 seconds)
  * Target was 2:40–2:55; strictly under the 3-minute hard ceiling (180.00s) with 7.65s safety headroom.
* **Video Encoding**:
  * Codec: H.264 / AVC (High Profile, Level 4.2), progressive scan
  * Resolution: 1920x1080 (16:9 full HD)
  * Frame Rate: 60.0 fps (constant frame rate matching source emulator takes)
  * Pixel Format: yuv420p (broadest hardware/platform compatibility)
* **Audio Encoding**:
  * Codec: AAC LC stereo
  * Channels: 2 (stereo channel layout)
  * Sample Rate: 48,000 Hz (broadcast standard)
  * Bitrate: ~213 kbps CBR
* **Loudness Normalization**:
  * EBU R128 integrated loudness: **-16.5 LUFS** (target: -16.0 LUFS)
  * Loudness range (LRA): **6.8 LU**
  * True peak / max volume: **-1.5 dBFS** (zero clipping, strict headroom compliance)
* **Accessibility / Subtitles**:
  * Burned-in subtitles from `captions.ass` rendered via FFmpeg `-vf ass=captions.ass` (libass).
  * Styled with 34pt Segoe UI, high-contrast obsidian background boxes (`#0B0F19` at ~80% opacity), white text for narration, and yellow/gold (`#00D4FF` BGR) for Fire TV app spoken focus.
  * Every spoken line (both narrator and in-app TTS) is captioned with exact timing.
* **CC-BY Open Cinema Attribution**:
  * Displayed on Card 6B from timestamp **161.714s to 172.347s** (**10.63 seconds continuous screen time**).
  * Exceeds the required ≥5 seconds threshold by more than double.

### 13.2 Technical Inspection Data (ffprobe & audio filters)

#### ffprobe JSON Format & Stream Summary
```json
{
  "format": {
    "filename": "ops-tools\\video\\narratv-demo-final.mp4",
    "nb_streams": 2,
    "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
    "duration": "172.347333",
    "size": "17076421",
    "bit_rate": "792651"
  },
  "streams": [
    {
      "index": 0,
      "codec_name": "h264",
      "profile": "High",
      "codec_type": "video",
      "width": 1920,
      "height": 1080,
      "r_frame_rate": "60/1",
      "avg_frame_rate": "60/1",
      "pix_fmt": "yuv420p",
      "duration": "172.266667"
    },
    {
      "index": 1,
      "codec_name": "aac",
      "profile": "LC",
      "codec_type": "audio",
      "channels": 2,
      "channel_layout": "stereo",
      "sample_rate": "48000",
      "bit_rate": "212957",
      "duration": "172.347333"
    }
  ]
}
```

#### EBU R128 Loudness Filter Measurement
```
Summary:
  Integrated loudness:
    I:         -16.5 LUFS
    Threshold: -26.9 LUFS
  Loudness range:
    LRA:         6.8 LU
    Threshold: -37.3 LUFS
    LRA low:   -20.3 LUFS
    LRA high:  -13.5 LUFS
```

#### Volume Detect Filter Measurement
```
[Parsed_volumedetect_0] max_volume: -1.5 dB
[Parsed_volumedetect_0] mean_volume: -19.9 dB
```

### 13.3 Video Structure & Segment Breakdown
The demo video follows the exact 6-segment narrative structure outlined in Task 13:
1. **The Problem (0:00 - 0:16.0)**: `card-01a-problem.png` + `vo-01a.mp3`. Focuses on the ~7% streaming audio description coverage, $15–75/min authoring cost, and 6 Feb 2026 India accessibility mandate.
2. **The Solution (0:16.0 - 0:29.0)**: `card-01b-solution.png` + `vo-01b.mp3`. Introduces NarraTV's three pillars: 0 Overlaps, AWS Multimodal pipeline, and 10-foot Fire TV UI.
3. **Catalog & Spoken Focus (0:29.0 - 0:52.27)**: `obs-broll-04-catalog-dpad-spoken-focus-1080p60.mp4` + `vo-02.mp3`. Demonstrates navigation across the movie rail, showing *Sintel* with an active AD track alongside *Big Buck Bunny* without a track. The emulator's native Google TTS speaks the cards aloud, while captions highlight the spoken focus in gold.
4. **Narration in a Real Gap [Placeholder] (0:52.27 - 1:30.27)**: `card-03-placeholder.png` + `vo-03a.mp3` + `vo-03b.mp3`. Honest placeholder detailing the 107-second opening dialogue-free interval in *Sintel*, 300ms guard bands, and 0.20s MAE synchronization.
5. **The Refusal Invariant [Placeholder] (1:30.27 - 2:01.27)**: `card-04-placeholder.png` + `vo-04a.mp3` + `vo-04b.mp3`. Honest placeholder detailing the core safety invariant: `SKIPPED · NO GAP`, pre-speech duration budgeting, zero dialogue collisions, and natural refusals in production.
6. **Honest States (2:01.27 - 2:26.77)**:
   * **Part 5A (2:01.27 - 2:13.77)**: `obs-broll-05-no-ad-track-honest-state-1080p60.mp4` (0:00–0:12.5) + `vo-05a.mp3`. *Big Buck Bunny* playing with the honest "No AD Track" banner and disabled "AD: N/A" button. Zero synthetic mock descriptions.
   * **Part 5B (2:13.77 - 2:26.77)**: `obs-broll-06-demo-mode-live-refusal-1080p60.mp4` (0:18–0:31.0) + `vo-05b.mp3`. Pressing "Describe" in DEMO mode triggers an explicit refusal toast requiring real AWS credentials.
7. **Architecture & Attribution (2:26.77 - 2:52.35)**:
   * **Part 6A (2:26.77 - 2:41.27)**: `card-06a-architecture.png` + `vo-06a.mp3`. Amazon Bedrock Nova Pro keyframe ingestion, Amazon Polly Neural speech synthesis, 19/34 unaided model accuracy, and ~$0.37/film cloud infrastructure cost.
   * **Part 6B (2:41.27 - 2:52.35)**: `card-06b-attribution.png` + `vo-06b.mp3`. CC-BY attribution for *Sintel*, *Big Buck Bunny*, and *Elephants Dream*, MIT license, 87 passing tests, and public repo URL.

---

## 2. BLOCKED

Live playback and refusal takes (Segments 3 and 4) were blocked by the OBS websocket disconnect on 2026-09-07. Per Task 13 instructions, the video was assembled using honest placeholder cards specifying the gap and refusal data from evidence.md. The orchestrator must record the live replacement take and re-run assemble-demo.cmd to produce the submission-ready live version.

---

## 3. RISK

* **Platform Re-encoding**: YouTube and Vimeo transcoders can slightly modify audio dynamics during secondary processing. The master target of -16.5 LUFS integrated with a -1.5 dBFS true peak leaves ample headroom so that neither platform will apply harsh limiter clipping or gain attenuation penalties.
* **Duration Variance on Take Swap**: If the orchestrator replaces placeholder Segments 3 and 4 with a newly recorded live take, the duration of the new take must not exceed 83.6 seconds (the combined placeholder duration of 38.0s + 31.0s = 69.0s, plus the 7.65s remaining headroom), or the master video will exceed the 3-minute hard Devpost limit.

---

## 4. NEXT

1. **Orchestrator**: Record the live replacement take for Segments 3 and 4 using the emulator (or run the one-shot recording script once OBS websocket connectivity is restored).
2. **Orchestrator**: Drop the replacement clip into `projects/01-firetv-narratv/docs/assets/clips/` (or update segment inputs in `ops-tools/video/assemble-demo.mjs`) and execute `ops-tools\video\assemble-demo.cmd`.
3. **Orchestrator**: Upload `ops-tools/video/narratv-demo-final.mp4` to YouTube (as Unlisted) or Vimeo.
4. **Orchestrator**: Copy the final public/unlisted video URL into `projects/01-firetv-narratv/docs/06-demo-submission/submission-form.md`.

---

## 5. FILES CREATED & MODIFIED

### Created Files (outside git repo in `ops-tools/video/`)
* `ops-tools/video/assemble-demo.cmd` — One-click Windows batch script to build and master the video.
* `ops-tools/video/generate-cards.mjs` — Headless browser script generating high-contrast 1920x1080 title cards.
* `ops-tools/video/generate-vo.mjs` — Neural voiceover synthesis pipeline using Microsoft Edge TTS (`en-US-AndrewNeural`).
* `ops-tools/video/assemble-demo.mjs` — Video assembly and concatenation pipeline enforcing 60fps progressive video, 48kHz audio, and libass burned-in captions.
* `ops-tools/video/finish-assembly.mjs` — Loudness mastering and packaging script.
* `ops-tools/video/captions.ass` — Timed Advanced SubStation Alpha caption file covering all narrator and in-app spoken dialogue.
* `ops-tools/video/cards/card-01a-problem.png` — Title card: The Streaming Coverage Gap.
* `ops-tools/video/cards/card-01b-solution.png` — Title card: NarraTV Core Pillars.
* `ops-tools/video/cards/card-03-placeholder.png` — Title card: Segment 3 Playback & Timing Gap Placeholder.
* `ops-tools/video/cards/card-04-placeholder.png` — Title card: Segment 4 The Refusal Invariant Placeholder.
* `ops-tools/video/cards/card-06a-architecture.png` — Title card: Bedrock Nova Pro + Polly Neural Cloud Architecture.
* `ops-tools/video/cards/card-06b-attribution.png` — Title card: Creative Commons Cinema Attribution & MIT License.
* `ops-tools/video/narratv-demo-final.mp4` — Final master video deliverable (172.35s, 1920x1080 60fps, 48kHz stereo, -16.5 LUFS).

### Created Files (in project repository)
* `projects/01-firetv-narratv/docs/04-agents/handoff-task13.md` — This handoff document.

---

## 6. VERIFICATION SCREENSHOTS (10 TOTAL)

| Timestamp | Filename | SHA-256 Hash | Plain-Word Visual Description |
|---|---|---|---|
| **0:08.0** | `still-01-problem.png` | `9C286AFD155C3EB6CEB09638D30A9876EC3B176AF09013295175A79AE59737E6` | High-contrast title card displaying "The Streaming Audio Description Gap", three metric cards showing "~7% Coverage", "$15 - 75 / min", and "6 Feb 2026 Mandate", with a burned caption box reading: *"Industry-wide, roughly seven percent of streaming content is described."* |
| **0:22.0** | `still-02-solution.png` | `BB88FB83617BFD4B0BFE9D7A8F7CF9CA68867ADB907EFE2D938F51AA54B785DB` | High-contrast title card displaying "On-Device Description Fallback", three cards showing "0 Overlaps", "AWS Multimodal Pipeline", and "10-Foot Living Room UI", with a burned caption box reading: *"NarraTV provides the fallback: synchronized audio description generated on the television, for the film in front of you."* |
| **0:38.0** | `still-03-catalog-spoken.png` | `2B11B85352B4252C1E61BC59890463ACF1CF5101EE4360569A2B7524D783594A` | Real Fire TV emulator screen on catalog rail focused on *Sintel* (amber outline). Hero spotlight displays *Sintel* synopsis, "Play with Narration (AD)", and badge "AD TRACK: AI DRAFT · 13 DESCRIPTIONS · 0 OVERLAPS". Burned caption box in gold reads: *"[Fire TV Spoken Focus] Sintel. 2010, Fantasy Animation. Audio Description track ready."* |
| **0:46.0** | `still-04-catalog-rail.png` | `B98208E79B6ED6B18A7988BE9B35EE13E6A8D776A64EE819AB7C7C9CF5917A13` | Real Fire TV emulator screen with focus moved across the rail to *Big Buck Bunny* (amber outline). Card displays badge "NO AD TRACK". Burned caption box in gold reads: *"[Fire TV Spoken Focus] Big Buck Bunny. 2008, Animation Comedy. Audio description not yet generated."* |
| **1:05.0** | `still-05-gap-placeholder.png` | `42AB4A1507D8084687F987E7D48DEC81BEDBD3EF0E2153677672E7D69141DD8D` | Segment 3 honest placeholder card titled "Narration in a Real Dialogue-Free Gap", three metric cards showing "107 Seconds Opening Silence", "300ms Guards", and "0.20s MAE Clock Sync", an honest placeholder disclaimer pill, and a burned caption box reading: *"In Sintel, the first spoken dialogue begins at one minute forty-seven."* |
| **1:40.0** | `still-06-refusal-placeholder.png` | `38009A9A75AEA6767F91A871656FFA77CF81B140E880E3DE369DEC1145FE243D` | Segment 4 honest placeholder card titled "SKIPPED · NO GAP", three metric cards showing "Zero Collisions", "Speech Budgeting", and "2 of 13 Gaps Natural Film Refusals", an honest placeholder disclaimer pill, and a burned caption box reading: *"If the gap is too short, the description is refused and displayed on screen as SKIPPED NO GAP."* |
| **2:10.0** | `still-07-honest-bbb.png` | `8D906ED3840C9AD1E80253433551E0F5FCB8B650B17762A451E032B3F6810001` | Real Fire TV emulator playing *Big Buck Bunny* under the honest "No AD Track" state. Top HUD shows "GAPS: 0 · DESCRIBED: 0 (NO AD TRACK)", center card displays "Audio Description Not Generated", bottom bar displays "AD: N/A". Burned caption box reads: *"NarraTV never invents synthetic mock text for uncataloged films."* |
| **2:22.0** | `still-08-honest-toast.png` | `72C3C024EDE16292B294CE6632946D46B38DC1E34982EB35AA77A3348581FDD7` | Real Fire TV emulator playing *Elephants Dream* (clock 0:12 / 10:53) in DEMO mode. An explicit blue toast banner across the lower screen displays: "LIVE unavailable — demo mode active. Set DEMO_MODE=false with AWS credentials to use live Bedrock inference." Burned caption box reads: *"Live inference requires real AWS credentials."* |
| **2:35.0** | `still-09-architecture.png` | `FE113DB38AF41ED257DA03614B90530A543CCF1171A883DD99CBF55D2C61402A` | High-contrast title card titled "Amazon Bedrock Nova Pro + Polly Neural", four cards showing "Nova Pro Multimodal Ingestion", "Polly Neural Natural Voice", "19 of 34 Model Accuracy", and "~$0.37 Cloud Cost / 90-Min Film", with a burned caption box reading: *"Behind the scenes, Bedrock Nova Pro analyzes real video frames from dialogue gaps, and Polly Neural synthesizes speech."* |
| **2:46.0** | `still-10-attribution.png` | `3D94C8375DA96EC8BEFB7BF193ED625284C5A212C2BD30AFBC4BDCD8A90D5D36` | High-contrast title card titled "Creative Commons Open Movie Credits", displaying explicit CC-BY copyright attribution for *Sintel*, *Big Buck Bunny*, and *Elephants Dream* (Blender Foundation), 22 test suites / 87 tests passing badge, MIT License pill, and submission repo URL (https://github.com/atchayam/narratv-firetv). Burned caption box reads: *"NarraTV is open source under the MIT license, built on Creative Commons cinema from the Blender Foundation."* |
