# NarraTV — 3-Minute Demonstration Video Script & Storyboard

This script outlines the exact visual cues, camera transitions, voiceover timing, and on-screen actions for the 3-minute Devpost submission video.

---

### Act 1: The Accessibility Void (0:00 – 0:25)

* **Visual (0:00 - 0:10)**: Screen fades to completely black with only faint background ambient music and sound effects playing. Subtitles flash on screen: *[Footsteps crunch in snow... heavy breathing]*.
* **Voiceover (0:00 - 0:12)**: "Close your eyes for ten seconds. A character is walking through a blizzard. Who are they? What did they just discover in the snow? Without Audio Description, over two billion blind and low-vision viewers worldwide are completely locked out of visual cinema."
* **Visual (0:12 - 0:25)**: Cut to title card: **NarraTV: Intelligent Scene Audio Description for Amazon Fire TV**. Split screen showing current manual AD costs ($2,500/film) vs. NarraTV ($0.37/film).
* **Voiceover (0:12 - 0:25)**: "Traditional audio description requires expensive studio narration, leaving 97% of streaming titles inaccessible. Today, we built NarraTV—an AI-driven audio description system built specifically for Amazon Fire TV."

---

### Act 2: The Fire TV 10-Foot Experience (0:25 – 1:15)

* **Visual (0:25 - 0:45)**: Camera cuts to full 1080p Fire TV UI on TV screen. Focus moves seamlessly across the catalog rail using remote DPAD with amber glow and 1.06x card expansion. The user selects *Sintel*.
* **Voiceover (0:25 - 0:45)**: "Designed from the ground up for the Fire TV living room experience, NarraTV features high-contrast typography, seamless DPAD remote navigation, and built-in TalkBack accessibility. Let's start watching *Sintel*."
* **Visual (0:45 - 1:15)**: Video begins playing. A silent opening scene appears. Amazon Polly Neural narrator speaks clearly: *"A solitary figure in a dark tattered cloak trudges through a heavy blizzard."* When dialogue starts ("What brings you to the mountains?"), the narration pauses immediately with a 300ms guard band.
* **Voiceover (0:45 - 1:15)**: "Notice how the narration speaks naturally during visual pauses, but the second a character speaks, the narration yields. Dialogue is never interrupted."

---

### Act 3: The Judge Surface & Deterministic Proof (1:15 – 1:55)

* **Visual (1:15 - 1:35)**: User presses the **Menu** button on the Fire TV remote. The **TimelineSurface** slides up from the bottom, displaying color-coded bars: Emerald Green for dialogue, Cobalt Blue for Audio Description, and Slate Grey for skipped gaps.
* **Voiceover (1:15 - 1:35)**: "For judges and viewers who want total transparency, pressing Menu opens the TimelineSurface. Green bars are dialogue cues; blue bars are scheduled narration. At the top right, our live auditor verifies zero dialogue overlaps across the entire film."
* **Visual (1:35 - 1:55)**: User clicks on a blue description block. The **WhyPanel** slides in, displaying the source video frame, the AI model (`amazon.nova-pro-v1:0`), 96% confidence score, and the exact placement rule: *"Gap 00:12.4–00:16.9, 4.5s, fits 11 words"*.
* **Voiceover (1:35 - 1:55)**: "Clicking any narration opens the WhyPanel—revealing the exact video frame analyzed, the Bedrock confidence score, and the mathematical rule that placed it."

---

### Act 4: AWS Cloud Architecture & Bedrock Pipeline (1:55 – 2:30)

* **Visual (1:55 - 2:15)**: Motion graphic of the AWS CDK architecture diagram: Subtitle gap detection → Amazon Bedrock Converse (Nova Pro) → Amazon Polly Neural → S3/CloudFront. Terminal window shows `yarn pipeline:local --dry-run` running locally.
* **Voiceover (1:55 - 2:15)**: "Under the hood, NarraTV is powered by AWS. Our Step Functions pipeline extracts keyframes during dialogue pauses, passes them to Amazon Bedrock Nova Pro via the Converse API, synthesizes neural voice tracks with Amazon Polly, and publishes to CloudFront."
* **Visual (2:15 - 2:30)**: Terminal demonstrates `yarn review --title sintel`, approving 28 descriptions and syncing back to the Fire TV app with *Verified by Human* badges.
* **Voiceover (2:15 - 2:30)**: "Our CLI allows human editors to review and verify AI drafts in seconds, giving content creators total quality control."

---

### Act 5: Impact & Open Source Call to Action (2:30 – 3:00)

* **Visual (2:30 - 2:45)**: Show the **System Diagnostics** screen with green provider health pills and 100% test passing badge (51 tests).
* **Voiceover (2:30 - 2:45)**: "NarraTV is 100% open source under the MIT license, backed by 51 passing automated tests and property-based mathematical proofs."
* **Visual (2:45 - 3:00)**: Final screen showing NarraTV logo, GitHub link, and Devpost submission details.
* **Voiceover (2:45 - 3:00)**: "At 37 cents per feature film, NarraTV makes universal accessibility a reality for every filmmaker and every viewer on Amazon Fire TV. Build, ship, shape—thank you!"
