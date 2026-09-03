# NarraTV — AWS & Fire TV Production Deployment Runbook

This guide covers building the Fire TV production release APK and deploying the AWS backend infrastructure using AWS CDK v2.

---

## 1. Prerequisites
- **AWS CLI**: Configured with credentials possessing administrative permissions for S3, CloudFront, Lambda, Step Functions, API Gateway, and IAM.
- **Node.js**: Version 20.x or 22.x.
- **Java**: OpenJDK 17 or 21 (`JAVA_HOME` configured).
- **Android SDK**: API 30+ with `ANDROID_HOME` configured.
- **AWS Region**: `us-east-1` (N. Virginia) for Amazon Bedrock Nova Pro access.

---

## 2. Amazon Bedrock Model Access Enablement
1. Open the **Amazon Bedrock Console** in `us-east-1`.
2. In the navigation sidebar, select **Model access**.
3. Click **Modify model access**.
4. Check **Amazon Nova Pro** (`amazon.nova-pro-v1:0`) and **Amazon Nova Lite**.
5. Click **Next** and **Submit**. Approval is granted immediately.

---

## 3. AWS CDK Backend Deployment

### Step 1: Bootstrap CDK Environment (One-time per account/region)
```bash
npx cdk bootstrap aws://<YOUR_AWS_ACCOUNT_ID>/us-east-1
```

### Step 2: Synthesize and Inspect CloudFormation Template
```bash
yarn workspace @narratv/pipeline run synth
```

### Step 3: Deploy the Stack
```bash
npx cdk deploy NarraTvPipelineStack --require-approval broadening
```

### Step 4: Capture Outputs & Configure App Environment
Copy `ApiEndpoint` and `CloudFrontUrl` from the deployment output to `apps/firetv/.env`:
```env
DEMO_MODE=false
API_URL=https://<API_ID>.execute-api.us-east-1.amazonaws.com
CLOUDFRONT_URL=https://<DISTRIBUTION_ID>.cloudfront.net
```

---

## 4. Building the Fire TV Release APK

### Step 1: Generate Release Keystore (If not already created)
```bash
keytool -genkey -v -keystore narratv-release-key.keystore -alias narratv-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Environment Signing Variables
In `apps/firetv/.env`:
```env
KEYSTORE_PATH=./narratv-release-key.keystore
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=narratv-key-alias
KEY_PASSWORD=your_key_password
```

### Step 3: Assemble Release APK
```bash
cd apps/firetv/android
./gradlew assembleRelease
```
The signed APK will be located at:
`apps/firetv/android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Sideload & Test on Fire TV Device
```bash
adb connect <FIRE_TV_IP_ADDRESS>:5555
adb install -r apps/firetv/android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Production Cost Model per 90-Minute Feature Film

| Service | Metric per 90-min Film | Unit Cost | Estimated Cost per Film |
|---|---|---|---|
| **Amazon Bedrock (Nova Pro)** | ~180 dialogue gaps × 850 input tokens = 153K in; 180 × 35 output tokens = 6.3K out | $0.0008 / 1K in, $0.0032 / 1K out | **$0.142 USD** |
| **Amazon Polly (Neural)** | 180 descriptions × 75 chars = 13.5K characters | $16.00 / 1M chars | **$0.216 USD** |
| **AWS Lambda** | 720 invocations (Node.js 22.x) | $0.0000083 / GB-s | **$0.008 USD** |
| **AWS Step Functions** | ~180 state transitions | $0.025 / 1K transitions | **$0.005 USD** |
| **Amazon S3 & CloudFront** | 180 audio files (5 MB) + 180 frames (15 MB) | $0.023 / GB storage, $0.085 / GB egress | **$0.003 USD** |
| **TOTAL PER 90-MIN FILM** | | | **~$0.37 USD** |

---

## 6. Teardown
To destroy all deployed cloud resources and prevent recurring charges:
```bash
npx cdk destroy NarraTvPipelineStack
```
