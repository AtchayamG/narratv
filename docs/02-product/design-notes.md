# Design Notes & 10-Foot TV UI Architecture

This document specifies the design rationale, visual hierarchy, focus interaction model, typography, and accessibility treatments for each Fire TV screen in NarraTV.

---

### Design System Foundations
* **Named Palette**: *Cinematic Obsidian & Amber*
  * Background: Obsidian `#0B0E14` (deep black, preventing OLED glare).
  * Surfaces: Dark Slate `#151A23` / `#242E3E` with 1px translucent borders (`rgba(255, 255, 255, 0.1)`).
  * Primary / Focus CTA: Electric Amber `#F59E0B` with 3px border and 0.45 opacity shadow glow.
  * Audio Description Channel: Cobalt Blue `#3B82F6`.
  * Dialogue Channel: Emerald Green `#10B981`.
  * Skipped / Refused Blocks: Slate Grey `#64748B`.
* **Typography**:
  * Headings & Brand: `SpaceGrotesk` (Bold display typeface with geometric letterforms).
  * Body & Captions: `Inter` (High-legibility neutral sans-serif designed for 10-foot TV viewing).
  * Scale: 14px (badges/metadata), 16px (captions), 20px (body), 28px (section headers), 40px (hero titles).
* **Safe Margins & 1080p Layout**:
  * Horizontal safe area: 48px (~5% TV safe area).
  * Vertical safe area: 28px.
* **Artwork & Visual Polish**:
  * Bundled 1080p CC-BY cinematic artwork for Blender Open Movie titles (`assets/art/sintel.jpg`, `assets/art/big_buck_bunny.jpg`, `assets/art/elephants_dream.jpg`).
  * Seamless horizontal & vertical gradient scrims to ensure AAA text contrast against bright film stills.

---

### Screen State Breakdown

#### 1. Catalog Screen (`01-catalog.png`)
* **Intent**: Provide a distraction-free 10-foot media browser showcasing titles with ready audio description tracks.
* **Hierarchy**: Top header with NarraTV logo in Space Grotesk, "Audio-Described Cinema" tagline, DEMO MODE Truth Pill, and System Status shortcut. Sintel Hero Spotlight with high-res artwork, gradient scrim, genre/rating badges, synopsis, and primary CTA.
* **Focus Flow**: "Play with Narration (AD)" has initial TV focus (`hasTVPreferredFocus={true}`). D-pad Right transitions to "System Status". D-pad Down navigates to the movie rail cards. Focused cards scale smoothly with an amber glow border.
* **Accessibility**: TalkBack announcements convey film title, rating, year, genre, and audio description status.

#### 2. Player Screen (`02-player.png`)
* **Intent**: Deliver immersive full-screen video playback with synchronized neural audio description.
* **Hierarchy**: Full-width 16:9 video viewport overlaid with top-bar title metadata, live status pill, bottom scrubber timeline, and contextual playback controls.
* **Focus Flow**: "Pause" button has initial TV focus. D-pad Right moves across "AD: ON", "Describe Now", "Show Timeline", and "Back to Catalog". DPAD Center toggles Play/Pause.

#### 3. Active Narration HUD (`03-narration-active.png`)
* **Intent**: Provide real-time visual proof of spoken scene descriptions synchronized during dialogue gaps.
* **Hierarchy**: Centered glowing blue card featuring the pulsing `AD ▶ <text>` indicator, model provenance (`fixture-handwritten`), and complete spoken script.
* **Invariants**: Appears strictly during dialogue-free intervals; disappears 300ms before spoken dialogue resumes.

#### 4. Timeline Surface Drawer (`04-timeline.png`)
* **Intent**: Transparent visual proof surface auditing subtitle cues, scheduled descriptions, and skipped items.
* **Hierarchy**: Sliding bottom drawer with interactive playhead, color-coded legend (Emerald Green dialogue, Cobalt Blue AD, Slate Grey skipped), and horizontal description cards.
* **Focus Flow**: When opened, the first description card automatically receives preferred TV focus. Pressing DPAD Center on any card inspects its AI decision provenance in WhyPanel.

#### 5. WhyPanel Provenance Inspector (`05-whypanel.png`)
* **Intent**: Disclose the exact AI decision provenance and mathematical placement formula for any narration block.
* **Hierarchy**: Sliding right-side drawer displaying the source video keyframe reference (`sintel/frame_001.jpg`), model badge, confidence percentage (e.g. 94%), full narration text, and the placement rule formula (`"Gap 0.0–24.2s (24.2s) fits 13 words (5.5s)"`).
* **Focus Flow**: "Close (Back)" button has default focus. Pressing DPAD Center or Remote Back dismisses the panel.

#### 6. System Status & Diagnostics (`06-system-status.png`)
* **Intent**: Real-time transparency dashboard probing cloud provider connectivity (Amazon Bedrock, Amazon Polly) and runtime architecture invariants.
* **Hierarchy**: 2x2 grid of diagnostic cards: Active Runtime Mode (Demo Mode), Amazon Bedrock Multimodal (`amazon.nova-pro-v1:0`), Amazon Polly Neural TTS, and Deterministic Refusal Invariants (0 Overlaps, 2.5s Minimum Gap, 300ms Guard Bands).
* **Focus Flow**: D-pad navigable with Back button returning directly to Catalog.

#### 7. Truth Pill Close-up (`07-demo-pill.png`)
* **Intent**: Detail view of the persistent truthfulness indicator.
* **Design**: High-contrast pill badge with amber status indicator dot explicitly stating runtime status ("DEMO MODE" vs "LIVE").

#### 8. Explicit Error / Live Fallback Toast (`08-error-toast.png`)
* **Intent**: Honest runtime feedback when unconfigured live services are invoked in offline/demo mode.
* **Design**: Floating translucent card with blue/red left accent bar stating: *"LIVE unavailable — demo mode active. Set DEMO_MODE=false with AWS credentials to use live Bedrock inference."*
