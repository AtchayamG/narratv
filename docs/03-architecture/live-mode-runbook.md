# Live Mode Runbook — Amazon Bedrock & Amazon Polly

> [!WARNING]
> **STATUS: UNVERIFIED UNTIL RUN AGAINST REAL AWS CREDENTIALS**
> As documented during the hackathon submission window, the AWS account was undergoing activation.
> The implementation in `services/pipeline/src/live-describe-adapter.ts` is fully implemented using `@aws-sdk/client-bedrock-runtime` (`amazon.nova-pro-v1:0`) and `@aws-sdk/client-polly` (`Joanna`, `neural`), and verified via unit tests with `aws-sdk-client-mock`.
> **Do not claim live mode is verified until this runbook has been executed against live AWS credentials.**

---

## 1. Prerequisites & AWS Account Setup

1. **AWS Account**: Must be on an active **Paid** plan (pay-as-you-go) to allow promo credit redemption and Amazon Bedrock model access.
2. **Target AWS Region**: `us-east-1` (N. Virginia), where Amazon Nova Pro and Polly Neural voices are generally available.
3. **Bedrock Model Access**:
   - Navigate to AWS Management Console → **Amazon Bedrock** → **Model access** in `us-east-1`.
   - Click **Modify model access**.
   - Enable **Amazon: Nova Pro** (`amazon.nova-pro-v1:0`) and submit request.
   - Status will transition from *Available to request* → *In progress* → *Access granted*.

---

## 1b. Field notes — what actually blocked this (2026-09-03)

Recorded because the failure modes were not obvious and cost hours.

**The account plan is the gate, not credentials.** Every console URL for IAM and
Bedrock silently redirects to `signup.aws.amazon.com` → *"Complete your account
setup"*, which reads: *"your account is currently on free plan… Free account
plans have limited access to certain services and features."* It looks like a
permissions or activation problem. It is a **plan** problem. The "Welcome to
AWS — your account is ready" email arrives while the account is still on the
Free plan, so that email does **not** mean services are usable.

Symptom to recognise: Console Home loads, Billing loads, but `/iam/home` and
`/bedrock/home` bounce to the setup page.

**The Claude in-app browser cannot drive the AWS console.** It renders static
pages and shells, but the console's SPA fails with:

> "We could not load the content for the page. This might be due to your
> firewall or proxy server blocking certain domains used to load this page
> content."

This happened twice — once redeeming the promotional credit, once loading
Billing. **Use the desktop browser (Edge/Chrome) for anything in the AWS
console.** Do not burn time retrying the in-app browser.

**`#/account-plan` is not a real route.** To inspect or change the plan use
`https://us-east-1.console.aws.amazon.com/account/home`.

### Fastest path to credentials: CloudShell, not the IAM console UI

CloudShell (bottom-left of the console, or the terminal icon in the top bar)
runs with the signed-in principal's permissions and avoids the IAM console
entirely. It also gives a **real error message** if the account is still gated,
instead of a silent redirect.

```bash
# 0. Does this account actually work yet? A clear error here beats a redirect.
aws sts get-caller-identity
aws iam list-users --max-items 1

# 1. Create the pipeline principal
aws iam create-user --user-name narratv-pipeline

# 2. Attach the least-privilege policy from section 2 of this runbook
#    (save it as narratv-policy.json in CloudShell first)
aws iam put-user-policy \
  --user-name narratv-pipeline \
  --policy-name NarraTvLiveInvoke \
  --policy-document file://narratv-policy.json

# 3. Mint the key INTO A FILE, never to the terminal - CloudShell scrollback
#    is shared with anyone shoulder-surfing or screen-recording the demo.
aws iam create-access-key --user-name narratv-pipeline > narratv-key.json

# 4. CloudShell -> Actions -> Download file -> narratv-key.json
```

Then, on the workstation, `ops-tools/import-aws-key.cmd <path-to-file>`
imports the profile, sets `us-east-1`, **deletes the downloaded file**, and
verifies with `sts get-caller-identity`. The secret never passes through a chat
transcript and never enters the repository.

> [!IMPORTANT]
> Never paste an access key into a chat, an issue, a commit, or a screen
> recording. If one is ever exposed, run
> `aws iam delete-access-key --user-name narratv-pipeline --access-key-id <id>`
> immediately and mint a new one.

---

## 2. Least-Privilege IAM Policy

Create an IAM User or Execution Role (e.g. `NarraTvLiveExecutionRole`) and attach the following least-privilege policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeNovaPro",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"
      ]
    },
    {
      "Sid": "PollyNeuralSynthesis",
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3AudioAndFrameCache",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::narratv-*/*"
    }
  ]
}
```

---

## 3. Environment Configuration

Set the standard AWS environment variables on the client or API host:

```powershell
# In PowerShell or .env file (NEVER commit secrets to git):
$env:AWS_REGION = "us-east-1"
$env:AWS_ACCESS_KEY_ID = "AKIA..."
$env:AWS_SECRET_ACCESS_KEY = "..."
$env:BEDROCK_MODEL_ID = "amazon.nova-pro-v1:0"
$env:DEMO_MODE = "false"
$env:API_URL = "https://api.narratv.example.com"
```

For the Fire TV app build:
- Configure `DEMO_MODE=false` in `.env` (or pass during bundling) along with the deployed `API_URL`.
- If `DEMO_MODE=false` is set without valid backend connectivity, the app fails loudly with an explicit error toast:
  `LIVE unavailable: Network request failed` / `Service Unavailable` — never silently falling back to demo fixtures and never misrepresenting mock output as live.

---

## 4. The One Command to Verify Live Mode

Once live AWS credentials have been obtained and exported into your environment, run the dedicated verification script:

```powershell
# Executes live Bedrock InvokeModel and Polly SynthesizeSpeech against real AWS endpoints
yarn workspace @narratv/pipeline test services/pipeline/tests/live-describe-adapter.test.ts
```

For an end-to-end integration test against live AWS (non-mocked), run:
```powershell
cmd /c yarn workspace @narratv/pipeline local
```

Expected live output:
1. Bedrock returns HTTP 200 with generated present-tense scene description under 18 words and confidence score ≥ 0.90.
2. Polly synthesizes speech and returns an MP3 audio buffer.
3. Verification log prints: `LIVE Bedrock & Polly verification SUCCEEDED`.
