# NarraTV — Clean Architecture

## Repo layout (monorepo, Yarn 4 workspaces, TypeScript everywhere)

```text
narratv/
  apps/firetv/                 React Native TV app (react-native-tvos 0.81 + Expo SDK 54, TS 5.x)
    src/
      core/                    theme, focus/spatial-navigation setup, remote-key map, config (DEMO_MODE, API_URL)
      features/
        catalog/               domain/ (Title, DescriptionTrack entities, use-cases) · data/ (repositories, fixture + http sources) · presentation/ (screens, components)
        player/                domain/ (Scheduler use-case: pure function gaps(subtitles) → slots) · data/ (tts adapter: device TTS | Polly mp3) · presentation/ (PlayerScreen, TimelineSurface, WhyPanel)
        describe-now/          domain/ (DescribeFrame use-case) · data/ (BedrockDescribeClient via API) · presentation/ (LiveBadge)
      shared/                  ui primitives (FocusableCard, Badge), utils
    assets/fixtures/           bundled CC-BY titles metadata, SRT subtitles, description tracks (JSON), thumbnails
  services/pipeline/           AWS CDK (TypeScript) — S3 ingest → Step Functions → Lambdas:
      extract-frames (ffmpeg layer) → detect-gaps (SRT parser, pure) → describe (Bedrock multimodal) → synthesize (Polly) → publish (track JSON + mp3 to S3, CloudFront)
      api/                     API Gateway + Lambda: GET /titles, GET /titles/{id}/track, POST /describe (live), GET /health {mode, providers}
      local/                   `pipeline:local` runner that executes the same steps on a dev machine (fixture generation, no AWS needed except Bedrock/Polly when LIVE)
  packages/contracts/          zod schemas + TS types: Title, Subtitle, Gap, Description{ id, tStart, tEnd, text, confidence, frameRef, model, status: "ai-draft"|"verified"|"skipped" }, HealthResponse. JSON Schema exported for README.
  packages/scheduler/          pure TS: gap detection + description placement; property-based tests prove ZERO overlap with subtitle cues. This is the deterministic guarantee.
  docs/                        01-hackathon 02-product 03-architecture 04-agents 06-demo-submission
  ops/                         expiry-matrix.md, deploy notes, smoke scripts
  AGENTS.md  README.md  LICENSE (MIT)
```

## Dependency rule
presentation → domain ← data. Domain has no React/AWS imports. AWS SDK only inside `services/` and `apps/firetv/src/features/*/data/`. Contracts shared via `packages/contracts`.

## Model roles (named, bounded)
- **Bedrock (Amazon Nova Pro or Claude 3.5 Sonnet via Bedrock)**: writes ≤ 18-word present-tense descriptions from 1–3 sampled frames + prior description for continuity. Returns JSON `{text, confidence}` validated by zod; anything non-conforming → `skipped`.
- **Deterministic scheduler** owns *when* audio may play: only inside subtitle gaps ≥ 2.5 s, description duration estimate (words × 0.4 s) must fit the gap, 300 ms guard band each side.
- **Human reviewer** (web/CLI `review` command in v1; simple JSON status flip) promotes `ai-draft` → `verified`.
- **Polly** (neural voice) renders mp3; app falls back to device TTS (expo-speech) in DEMO_MODE.

## Modes
`DEMO_MODE=true` (default): fixtures bundled; "Describe now" shows an explicit "LIVE unavailable — no API configured" toast (never a fake result).
`LIVE`: API_URL set; /health reports `{mode:"live", bedrock:"ok", polly:"ok", revision}`.

## Testing strategy
- packages/scheduler: unit + property tests (fast-check): no description interval intersects any subtitle cue.
- contracts: schema tests with fixture files.
- pipeline: Lambda handlers unit-tested with mocked Bedrock/Polly clients; one recorded real-response fixture.
- app: Jest + RNTL for Scheduler hook and WhyPanel; manual D-pad focus checklist in docs/06-demo-submission/qa-checklist.md.
- Evidence: `docs/06-demo-submission/evidence.md` lists exact commands + outputs.

## Fire TV specifics
- Target Fire OS 7/8 (Android 9/11 → minSdk 28, targetSdk 34). `android.hardware.touchscreen required=false`, `LEANBACK_LAUNCHER` intent, TV banner 320×180.
- Remote keys: D-pad, Select, Back, Menu, Play/Pause, Rewind/FF (KeyEvent) — map via `react-native-tvos` `TVEventHandler`.
- Test AVD: Android TV 1080p, API 30, x86_64. Real device: Fire TV Stick via ADB over Wi-Fi (`adb connect <ip>:5555`).

## Diagram (Mermaid, render into docs/03-architecture/diagram.md)
```mermaid
flowchart LR
  U[Viewer + Fire TV remote] --> A[NarraTV app (RN TV)]
  A -->|GET track| API[API Gateway]
  A -->|POST describe (LIVE)| API
  API --> L[Lambda]
  L --> B[Bedrock multimodal]
  L --> P[Polly]
  S3[(S3 tracks/mp3)] --> CF[CloudFront] --> A
  V[Video ingest S3] --> SF[Step Functions] --> L --> S3
  SRT[Subtitles] --> SCH[Deterministic scheduler] --> S3
```
