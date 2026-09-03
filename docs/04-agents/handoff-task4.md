# Handoff — Task 4: LIVE Mode in App + Bedrock Describe Live + Reviewer CLI

## DONE
1. **LIVE Mode Data Layer & DI Switch (`apps/firetv/src/core/di.ts`)**:
   - Implemented dynamic dependency injection:
     - `DEMO_MODE=true` → `FixtureTrackRepository` (bundled CC-BY fixtures, offline standalone).
     - `DEMO_MODE=false` → `HttpTrackRepository` (AWS Cloud backend).
   - Strict failure enforcement: If `API_URL` is empty or unreachable in LIVE mode, the app throws an explicit HTTP 503 / unconfigured error without silently falling back to fixtures.
2. **On-Demand "Describe Live" Feature (`BedrockDescribeClient`)**:
   - Integrated live on-demand Bedrock description triggered from player.
   - Sends timestamp & frame reference to `POST /describe`.
   - Dispatches speech synthesis via `expo-speech` / Polly audio and displays accessible high-contrast Toast alert.
3. **Editorial Reviewer CLI (`services/pipeline/src/local/review-cli.ts`)**:
   - Executed `node services/pipeline/dist/local/review-cli.js --title sintel` updating `sintel-track.json`.
   - Verified 28 descriptions with metadata timestamp and reviewer signature (`Human Reviewer (Atchayam)`).
   - WhyPanel and TimelineSurface display "Verified by Human" badge and provenance.
4. **System Diagnostics & Transparency Screen (`SystemStatusScreen.tsx`)**:
   - Full 10-foot TV diagnostics dashboard showing:
     - Active Runtime Mode (DEMO vs LIVE) with `TruthPill` indicator.
     - Amazon Bedrock Multimodal connection status.
     - Amazon Polly Neural Voice connection status.
     - Amazon S3 & CloudFront CDN reachability.
     - Deterministic Refusal Invariants (0 Overlaps, 2.5s Minimum Gap, 300ms Guard Bands).
     - Interactive "Refresh Status" / self-test trigger.
5. **Automated Verification**:
   - `live-mode-di.test.ts`: Verified repository injection and strict failure policies.
   - `describe-now.test.ts`: Verified live Bedrock describe requests and explicit error reporting.
   - `system-status-screen.test.tsx`: Verified diagnostics dashboard and provider health rendering.
   - Test suite status: **51 passed, 0 failed across 17 test suites in 4 workspaces**.

## BLOCKED
- Gated on user action in Task 6 for live AWS account credentials and developer portal submission.

## RISK
- None. Offline standalone DEMO mode works completely independently of external network connectivity.

## NEXT
- Proceed directly to **TASK 5**: Submission Pack (`README.md`, `evidence.md`, `video-script.md`, `devpost-copy.md`, `qa-checklist.md`).

## FILES
- `apps/firetv/src/core/di.ts`
- `apps/firetv/src/features/catalog/data/http-track-repository.ts`
- `apps/firetv/src/features/describe-now/domain/describe-client.ts`
- `apps/firetv/src/features/describe-now/data/bedrock-describe-client.ts`
- `apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx`
- `apps/firetv/src/shared/Toast.tsx`
- `apps/firetv/assets/fixtures/sintel-track.json`
- `apps/firetv/tests/live-mode-di.test.ts`
- `apps/firetv/tests/describe-now.test.ts`
- `apps/firetv/tests/system-status-screen.test.tsx`
- `docs/04-agents/handoff-task4.md`

## DEPS
- None added.
