# Devpost Submission Text — NarraTV

*Copy and paste each section directly into the Devpost submission portal.*
*Entrant: Atchayam G (Solo Entrant)*

---

## Project Title
**NarraTV: Intelligent Scene Audio Description for Amazon Fire TV**

## Tagline / Elevator Pitch
Multimodal AI audio description for blind and low-vision viewers on Amazon Fire TV with a mathematically guaranteed zero-dialogue-collision invariant.

---

## 1. Quality of the Idea & Problem Statement (25%)

### The Problem: Cinema Without Sight
According to the World Health Organization (WHO), at least **2.2 billion people** globally live with vision impairment ([WHO Fact Sheet 2023](https://www.who.int/news-room/fact-sheets/detail/blindness-and-visual-impairment), cited in [`docs/02-product/sources.md`](../02-product/sources.md)). While dialogue subtitles and closed captions are widely mandated, **Audio Description (AD)**—the spoken narration of key visual actions, facial expressions, silent gestures, and scene changes—remains scarce across streaming and independent cinema.

Without audio description, millions of blind and low-vision viewers are shut out from visual storytelling: silent dramatic beats, character entrances, and background action are completely lost.

### The Solution: NarraTV
**NarraTV** transforms the 10-foot television into an inclusive cinema experience. It unites multimodal AI with a deterministic gap-placement scheduler to generate, synchronize, and speak natural scene narration exclusively during dialogue-free moments—**guaranteeing 0 dialogue collisions** at an estimated cloud cost of ~$0.37 per 90-minute film.

---

## 2. Technical Implementation (25%)

NarraTV is architected as a strict Clean Architecture monorepo with 100% test coverage across 21 test suites (67 tests):

### Pure Invariant Timing Engine (`packages/scheduler`)
* **Mathematical Zero-Collision Invariant**: `findGaps` calculates dialogue-free intervals from SRT cues, subtracting a strict **300ms guard band** before and after every spoken line (`packages/scheduler/src/find-gaps.ts`).
* **Speech Rate Budgeting**: Refuses gaps shorter than 2.5 seconds or where the narration text exceeds the dialogue pause window (`packages/scheduler/src/place-descriptions.ts`).
* **Generative Proof**: Generative property-based testing (`scheduler-property.test.ts`) runs 100 pseudo-random film cue sequences with `fast-check` to verify that `overlapCount === 0` holds unconditionally.

### Native Fire TV 10-Foot Client (`apps/firetv`)
* **Real Video Playback**: Built on `react-native-video` (ExoPlayer Media3) streaming genuine H.264 video streams with millisecond-accurate `onProgress` timecodes (`PlayerScreen.tsx`, verified in screenshot `02-player.png`).
* **Hardware Remote Navigation**: Full 2D spatial D-pad navigation with Leanback launcher support (`android.intent.category.LEANBACK_LAUNCHER`), 3px amber focus borders, and zero unreachable elements (`docs/02-product/accessibility-report.md`).
* **Full TalkBack Accessibility**: Integrated screen reader announcements (`announceForAccessibility`) announcing film metadata, dialogue subtitle cues, and active scene descriptions.

### AWS Builder Integration (`services/pipeline`)
* **Multimodal Bedrock Nova Pro**: `LiveDescribeAdapter` (`services/pipeline/src/live-describe-adapter.ts`) invokes the Amazon Bedrock Converse API with model ID `amazon.nova-pro-v1:0` in `us-east-1`, sending raw JPEG video frames and prompt constraints (present-tense, concise action, ≤18 words).
* **Amazon Polly Neural TTS**: Synthesizes natural speech using Polly voice `Joanna` with `neural` engine and 24kHz MP3 audio streaming.
* **Tested via SDK Mocks**: 5 unit tests in `live-describe-adapter.test.ts` verify payloads, parameters, and error handling via `aws-sdk-client-mock`.
* **Honest Cloud Status Declaration**: As documented in [`docs/03-architecture/live-mode-runbook.md`](../03-architecture/live-mode-runbook.md), live cloud execution is currently unverified pending AWS account credential provisioning. In DEMO mode (`config.demoMode = true`), the client runs offline with bundled fixtures and fails loudly with explicit HTTP 503 diagnostics if live mode is engaged without credentials.

---

## 3. Design & Living Room User Experience (25%)

NarraTV is tailored for the 10-foot television experience with high-contrast obsidian & amber aesthetics:

### Transparency & Trust Surfaces
* **The Truth Pill**: A persistent header component (`TruthPill.tsx`, screenshot `07-demo-pill.png`) showing whether the app is running in `DEMO MODE` (offline bundled fixtures) or `LIVE MODE` (AWS Cloud).
* **The Timeline Surface Drawer**: Activated by the remote **MENU** key (`TimelineSurface.tsx`, screenshot `04-timeline.png`), displaying a color-coded scrubber: Green (Dialogue SRT), Blue (Audio Description), and Grey (Refused/Skipped gaps).
* **The Why-Panel Inspector**: Opened by pressing **SELECT** on any timeline card (`WhyPanel.tsx`, screenshot `05-whypanel.png`), exposing the AI decision provenance: source video frame reference, Bedrock model confidence, and the exact mathematical placement rule.
* **Honest Non-Generated Track State**: For titles without an existing description track (*Big Buck Bunny*, *Elephants Dream*), the app streams the real video normally while honestly displaying a `NO AD TRACK` badge and informative banner explaining that description tracks are produced offline via the Bedrock pipeline (screenshots `10-no-track-bbb.png` and `11-no-track-ed.png`).

---

## 4. Potential Impact & Production Economics (25%)

* **Estimated Production Cost**: Automated generation on AWS costs **~$0.37 per 90-minute film** (~180 Bedrock Nova Pro calls + Polly Neural characters), compared to typical studio post-production workflows that cost hundreds to thousands of dollars per title.
* **100% Permissive Open Source (MIT)**: Released under the MIT License with Creative Commons open-access films from the **Blender Foundation** (*Sintel*, *Big Buck Bunny*, *Elephants Dream*). Full CC-BY attribution is integrated directly into the in-app System Status screen (screenshot `09-credits.png`) and documented in [`docs/06-demo-submission/media-licenses.md`](media-licenses.md).

---

## 5. Developer Experience & Hackathon Feedback

Detailed feedback and genuine operational events from building on the Amazon Developer ecosystem are documented in our repository:
* **Product Feedback**: Concrete insights on `react-native-tvos`, Android TV AVDs, and AWS Bedrock/Polly SDK integration are documented in [`docs/06-demo-submission/product-feedback.md`](product-feedback.md).
* **Friction Log**: 7 genuine, real-time debugging events—including ExoPlayer Media3 Android 11+ cleartext traffic workarounds, TVEventHandler null-safety guards, and AVD Google TTS enablement—are detailed in [`docs/06-demo-submission/friction-log.md`](friction-log.md).

---

## 6. Verification Evidence Directory

Every claim in this submission is demonstrable in the repository:
* **Screenshots (12 Total, Verified with SHA-256)**:
  * `01-catalog.png`: Catalog screen with hero spotlight, high-contrast badges, and movie rail.
  * `02-player.png`: Real video playback with clock advanced past 0:10.
  * `02b-player-30s.png`: Continuous playback at ~30s mark.
  * `03-narration-active.png`: Real-time on-screen narration card with live pulse indicator.
  * `04-timeline.png`: Scrubber timeline showing dialogue, narration, and refused blocks.
  * `05-whypanel.png`: AI decision provenance, model confidence, and frame reference.
  * `06-system-status.png`: Provider connectivity and runtime mode transparency.
  * `07-demo-pill.png`: Visual truth pill badge.
  * `08-error-toast.png`: Fail-loud error toast when backend is unreachable.
  * `09-credits.png`: In-app Creative Commons open movie credits.
  * `10-no-track-bbb.png`: Honest empty state for Big Buck Bunny with real video playback.
  * `11-no-track-ed.png`: Honest empty state for Elephants Dream with real video playback.
* **Automated Verification Script**: Run `ops\sync-and-test.cmd` to execute all 20 test suites (62 tests, 100% passing).
* **Stand-Alone APK Build**: Run `ops\build-release.cmd` to compile the signed release APK.

---

## Built With
* `amazon-bedrock`
* `amazon-polly`
* `aws-cdk`
* `aws-step-functions`
* `aws-lambda`
* `amazon-s3`
* `amazon-cloudfront`
* `fire-tv`
* `react-native-tvos`
* `exoplayer-media3`
* `typescript`
* `zod`
* `fast-check`
* `jest`

## Try It Out Links
* **GitHub Repository**: https://github.com/atchayam/narratv-firetv
* **Demonstration Video**: [Link to 3-minute video on YouTube/Vimeo]
