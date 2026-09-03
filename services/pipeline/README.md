# @narratv/pipeline — AWS Cloud Pipeline & Local Runner

AWS CDK v2 infrastructure and Lambda handlers for automated audio-description generation from video streams and subtitle files.

## Architecture
1. **`extract-frames`**: FFmpeg layer sampling frames at dialogue gap midpoints (±1.0s).
2. **`detect-gaps`**: Reuses `@narratv/scheduler` to compute dialogue-free intervals.
3. **`describe`**: Amazon Bedrock Converse multimodal API (`amazon.nova-pro-v1:0`), returning structured JSON descriptions with confidence scores.
4. **`synthesize`**: Amazon Polly neural speech synthesis producing cached MP3 audio clips.
5. **`publish`**: Publishes description tracks and MP3s to S3 and CloudFront CDN.
6. **`api`**: HTTP API Gateway with `/titles`, `/titles/{id}/track`, `POST /describe` (live on-demand), and `/health`.

Full CDK stack and tests implemented in Task 3.
