# Handoff — Task 3: AWS Pipeline in TypeScript + AWS CDK v2

## DONE
1. **Lambda Handlers in TypeScript (`services/pipeline/src/lambdas/`)**:
   - `detect-gaps.ts`: Parses SRT and computes dialogue-free gaps directly using `@narratv/scheduler` (no code duplication).
   - `extract-frames.ts`: Computes midpoint sample timestamps for dialogue-free gaps and targets frame extraction keys.
   - `describe.ts`: Multimodal Bedrock Converse handler with configurable model (`amazon.nova-pro-v1:0` default), strict JSON output validation (`{text, confidence}`), ≤18 words enforcement, narrative continuity context, and fallback to `status: "skipped", skipReason: "model-invalid"`.
   - `synthesize.ts`: Amazon Polly Neural handler with deterministic idempotency hashing (`sha256(text + voice + engine)`).
   - `publish.ts`: S3/CloudFront publisher computing mathematical overlap counters (`computeTrackCounters`) and packaging the final `DescriptionTrack` JSON.
   - `api-handler.ts`: HTTP API Router with `GET /health` (returns 503 Service Unavailable when AWS credentials are unconfigured in LIVE mode; never silent fixture fallback), `POST /describe` (live on-demand Bedrock description), and CORS support.
2. **Step Functions State Machine (`services/pipeline/src/step-functions/`)**:
   - Map state over dialogue gaps with `MaxConcurrency: 4`.
   - Exponential backoff retry policies for Bedrock and Polly throttling.
   - Strict `MAX_BEDROCK_CALLS` ceiling (120) that triggers explicit `FailMaxBedrockCallsExceeded` error state rather than silent truncation.
3. **AWS CDK v2 Infrastructure (`services/pipeline/src/cdk/`)**:
   - `NarraTvPipelineStack`: S3 media storage bucket with encryption and CORS, CloudFront CDN distribution, 6 Node.js 22.x Lambda functions, IAM least-privilege policies, Step Functions State Machine, and HTTP API Gateway.
   - `cdk synth` verified: Successfully synthesized CloudFormation template.
4. **Local Pipeline Runner & Reviewer CLI (`services/pipeline/src/local/`)**:
   - `pipeline-runner.ts`: Executed `node services/pipeline/dist/local/pipeline-runner.js --title sintel --limit 3 --dry-run` producing `services/pipeline/local-manifest-sintel.json` with prompt hash (`86d9e536fa4b...`), input/output token counts, and cost estimate ($0.006 USD).
   - `review-cli.ts`: Interactive editorial review tool to approve/reject AI draft descriptions and timestamp verification.
5. **Operational Documentation (`ops/`)**:
   - `ops/deploy-runbook.md`: CDK bootstrap/deploy steps, IAM permissions, Bedrock model access enablement in `us-east-1`, and per-film cost model ($0.37 for a 90-min film, $0.06 for a 15-min film).
   - `ops/expiry-matrix.md`: Infrastructure expiry tracking for judging through November 20, 2026.
   - `ops/run-ledger.md`: Run logging and cost audit receipts.
6. **Verification**:
   - `packages/contracts`: **6 passed, 0 failed**
   - `packages/scheduler`: **19 passed, 0 failed**
   - `apps/firetv`: **11 passed, 0 failed**
   - `services/pipeline`: **9 passed, 0 failed**
   - Total test suite: **45 passed, 0 failed (14 test suites, all green)**.

## BLOCKED
- Gated on user action in Task 6 for running `cdk deploy` with live AWS credentials.

## RISK
- Amazon Bedrock model access for `amazon.nova-pro-v1:0` in `us-east-1` must be enabled once in the AWS Console by the account owner.

## NEXT
- Proceed directly to **TASK 4**: LIVE mode in Fire TV app + Bedrock Describe Live + Reviewer CLI integration + SystemStatusScreen live probe verification.

## FILES
- `services/pipeline/package.json`
- `services/pipeline/tsconfig.json`
- `services/pipeline/jest.config.js`
- `services/pipeline/cdk.json`
- `services/pipeline/src/lambdas/detect-gaps.ts`
- `services/pipeline/src/lambdas/extract-frames.ts`
- `services/pipeline/src/lambdas/describe.ts`
- `services/pipeline/src/lambdas/synthesize.ts`
- `services/pipeline/src/lambdas/publish.ts`
- `services/pipeline/src/lambdas/api-handler.ts`
- `services/pipeline/src/step-functions/pipeline-state-machine.ts`
- `services/pipeline/src/cdk/narratv-stack.ts`
- `services/pipeline/src/cdk/bin/app.ts`
- `services/pipeline/src/local/pipeline-runner.ts`
- `services/pipeline/src/local/review-cli.ts`
- `services/pipeline/local-manifest-sintel.json`
- `services/pipeline/tests/lambdas.test.ts`
- `services/pipeline/tests/step-functions.test.ts`
- `services/pipeline/tests/cdk-synth.test.ts`
- `ops/deploy-runbook.md`
- `ops/expiry-matrix.md`
- `ops/run-ledger.md`
- `docs/04-agents/handoff-task3.md`

## DEPS
- `aws-cdk-lib`, `constructs`, `aws-cdk`: AWS CDK v2 infrastructure definitions.
- `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-polly`, `@aws-sdk/client-s3`: AWS SDK v3 clients for Bedrock Converse, Polly Neural, and S3.
