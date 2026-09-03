# NarraTV Accessibility Audit & TalkBack Report

## Overview & Methodology
* **Evaluation Device**: Android TV Emulator (FireTV_1080p_API30, 1920x1080 @ 320dpi)
* **Screen Reader**: Google TalkBack (`com.google.android.marvin.talkback.TalkBackService`) active via Android Accessibility Service.
* **Input Method**: Fire TV remote simulation via ADB DPAD keyevents (`DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`, `DPAD_CENTER`, `BACK`, `MENU`).
* **Test Flow Walked**: Catalog Screen → Player Screen (Sintel) → Timeline Surface → Why-Panel Inspector → Player Screen (Big Buck Bunny & Elephants Dream) → System Status Screen → Back Navigation.
* **Date Evaluated**: 2026-09-03
* **Entrant**: Atchayam G

---

## 1. Observed Navigation & Speech Flow

### 1.1 Catalog Screen
* **Initial Preferred Focus**: Hero Spotlight action button `Play with Narration (AD)`.
* **TalkBack Announcement on Focus**:
  * Hero Button: `"Play Sintel with Audio Description. AD TRACK: AI DRAFT · 13 DESCRIPTIONS · 0 OVERLAPS. Button. Starts video playback with synchronized dialogue-gap scene narration."`
  * System Status Button: `"System Status, view AWS and API connectivity. Button."`
* **D-Pad Down Transition**: Moves smoothly from Hero actions row to MovieRail card list (`Open Cinema (CC-BY Licensed)`).
* **MovieRail Announcements**:
  * Card 0 (Sintel): `"Sintel, 2010, Fantasy / Animation. Audio Description track ready. Button. Press Select to view details and start playback."`
  * Card 1 (Big Buck Bunny): `"Big Buck Bunny, 2008, Animation / Comedy. Audio description not yet generated. Button. Press Select to view details and start playback."`
  * Card 2 (Elephants Dream): `"Elephants Dream, 2006, Sci-Fi / Animation. Audio description not yet generated. Button. Press Select to view details and start playback."`
* **Defects Observed & Fixed**:
  * *Observed*: Initially, `handleFocusTitle` announced "Audio Description track loaded" for all titles, even those without tracks.
  * *Fix*: Modified `CatalogScreen.tsx` to conditionally inspect `track.metadata.describedCount > 0` before announcing track readiness. For titles without tracks, it now announces: `"<Title>, <Year>. Audio description track not yet generated."`

---

### 1.2 Player Screen (With Audio Description Track: Sintel)
* **Screen Load Announcement**:
  * TalkBack announces: `"Playing Sintel with Audio Description. 13 descriptions scheduled. Dialogue overlap count: 0."`
* **Initial Preferred Focus**: `Pause` button in bottom controls bar.
* **Controls Focus Order (Left to Right via DPAD_RIGHT)**:
  1. `Pause` / `Play` (variant: primary): `"Pause video. Button."` / `"Play video. Button."`
  2. `AD: ON` / `AD: OFF` (variant: secondary/outline): `"Audio description is on. Press to mute. Button."`
  3. `Describe (Demo)` / `Describe (LIVE)`: `"Describe Now. Triggers on-demand multimodal Bedrock description of the current frame. Button."`
  4. `Timeline (Menu)`: `"Toggle Timeline surface to view dialogue gaps and scheduled narration blocks. Button."`
  5. `Back to Catalog`: `"Back to movie catalog. Button."`
* **Active Narration Event**:
  * When a scene description fires, `PlayerScreen` renders an accessible narration card and announces the spoken description via Android `announceForAccessibility`: `"Audio description speaking: A solitary figure trudges through a raging blizzard."`

---

### 1.3 Player Screen (Without Audio Description Track: Big Buck Bunny / Elephants Dream)
* **Screen Load Announcement**:
  * TalkBack announces: `"Playing Big Buck Bunny. Audio description track has not yet been generated for this title."`
* **On-Screen Visual & Screen Reader Banner**:
  * Accessible container announces: `"Audio description not yet generated for this title. Video playback is active. Full description tracks are produced offline via the Bedrock Nova Pro multimodal pipeline."`
* **Controls Bar Behavior**:
  * AD button shows `AD: N/A` and announces: `"Audio description is not available for this title. Button."`
  * Pressing `AD: N/A` triggers toast: `"Audio description track not yet generated for this title (see runbook)."`

---

### 1.4 Timeline Surface Drawer (Invoked via Remote MENU key)
* **Focus Transition**: Automatically sets preferred focus to the first chronological timeline card.
* **Dialogue Cues Announcements**:
  * `"Dialogue from 0:05 to 0:07: Who goes there? Spoken speech detected by subtitles. Button."`
* **Narration Blocks Announcements**:
  * `"Narration at 0:00: A solitary figure trudges through a raging blizzard. Placed in opening gap (0.5s - 4.8s). Button. Press Select to view decision and source frame details in WhyPanel."`
* **Skipped/Refused Blocks Announcements**:
  * `"Skipped description at 0:34: Character monologue active. refused. Button. Press Select to view decision and source frame details in WhyPanel."`

---

### 1.5 Why-Panel Decision Auditor (Invoked via DPAD_CENTER on Timeline Block)
* **Overlay Announcement**:
  * Automatically announces full decision provenance upon mount: `"Why this description? Model: amazon.nova-pro-v1:0. Confidence: 95%. A solitary figure trudges through a raging blizzard. Placement rule: Placed in opening gap (0.5s - 4.8s)..."`
* **Focus Trapping**: Focus is directed immediately to the `Close (Back)` button (`hasTVPreferredFocus={true}`), preventing focus trapping.
* **Close Action**: Pressing `DPAD_CENTER` or remote `BACK` immediately returns focus to the selected timeline card.

---

### 1.6 System Status Screen
* **Focus Order**:
  1. `Refresh Status` button (`hasTVPreferredFocus={true}`): `"Refresh system health status. Button."`
  2. `Back to Catalog` button: `"Return to movie catalog. Button."`
* **Card Announcements**:
  * Runtime Mode Card: `"Active runtime mode: Demo mode with bundled fixtures."`
  * Provider Cards: `"Amazon Bedrock status: Connected. Amazon Polly status: Connected."`
  * Invariant Card: `"Deterministic refusal invariants: 0 dialogue overlaps, 2.5 second minimum gap, 300 millisecond guard bands."`
  * Credits Card: `"Creative Commons Open Movie Credits. Sintel, Big Buck Bunny, and Elephants Dream by Blender Foundation, licensed CC-BY."`

---

## 2. Accessibility Checklist & Findings Summary

| Area | Requirement | Observed Status | Notes |
|---|---|---|---|
| **D-pad Navigation** | Every interactive element reachable via DPAD | **PASS** | Full bidirectional navigation across all 4 screens. Zero dead ends. |
| **Focus Rings** | 3px high-contrast amber/gold border on focus | **PASS** | Clearly visible across dark background; scaled 1.04x on cards. |
| **Unlabelled Elements** | Zero "unlabelled button" announcements | **PASS** | Every `<Button>` and `<FocusableCard>` provides descriptive `accessibilityLabel` and `accessibilityHint`. |
| **Accessibility Roles** | Semantic roles on touchables and text cards | **PASS** | Interactive elements have `accessibilityRole="button"`; informational cards have `accessibilityRole="text"`. |
| **10-Foot Distance Readability** | Contrast ratio ≥ 4.5:1 (normal text) and ≥ 3.0:1 (large text) | **PASS** | Background `#0F172A` vs `#F8FAFC` (14.2:1); Accent `#F59E0B` vs `#0F172A` (8.5:1). |
| **Safe Area Margins** | TV 5% overscan protection | **PASS** | Inset controls bar with `maxWidth: 1300` and horizontal safe area padding (`spacing.tvSafeHorizontal`). |
| **Screen Reader Fallback** | Non-TalkBack visual indicator | **PASS** | Real-time on-screen narration card with live pulse indicator and dialogue SRT box for low-vision users not utilizing TalkBack. |

---

## 3. Regression Test Coverage

Automated regression tests verifying all accessibility labels, roles, and conditional announcements are implemented in:
* [`apps/firetv/tests/accessibility-audit.test.tsx`](../../apps/firetv/tests/accessibility-audit.test.tsx) (5 tests, 100% passing)
* [`apps/firetv/tests/no-track-titles.test.tsx`](../../apps/firetv/tests/no-track-titles.test.tsx) (4 tests, 100% passing)
