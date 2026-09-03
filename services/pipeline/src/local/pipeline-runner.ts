import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseSrt, findGaps } from '@narratv/scheduler';
import { SYSTEM_PROMPT } from '../lambdas/describe';

export interface LocalRunnerOptions {
  title: string;
  limit?: number;
  dryRun?: boolean;
  live?: boolean;
}

export interface CostManifest {
  title: string;
  generatedAt: string;
  mode: 'dry-run' | 'live';
  modelId: string;
  promptHash: string;
  totalGapsFound: number;
  candidateDescriptions: number;
  plannedBedrockCalls: number;
  plannedPollyCalls: number;
  estimatedCostUsd: {
    bedrockInputTokens: number;
    bedrockOutputTokens: number;
    bedrockCostUsd: number;
    pollyCharacters: number;
    pollyCostUsd: number;
    totalEstimatedCostUsd: number;
  };
  samplePlannedRequests: Array<{
    gapId: string;
    timestampSec: number;
    durationSec: number;
    promptPreview: string;
  }>;
}

export async function runLocalPipeline(options: LocalRunnerOptions): Promise<CostManifest> {
  const title = options.title || 'sintel';
  const limit = options.limit ?? 10;
  const isLive = Boolean(options.live);
  const isDryRun = options.dryRun !== false && !isLive;

  console.log(`\n=== NarraTV Local Pipeline Runner ===`);
  console.log(`Title: ${title}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (zero network calls, cost simulation)' : 'LIVE (AWS Bedrock & Polly)'}`);
  console.log(`Limit: ${limit} items\n`);

  // Load subtitle file from fixtures
  const fixturePath = path.resolve(__dirname, `../../../../apps/firetv/assets/fixtures/${title === 'sintel' ? 'sintel' : (title === 'big-buck-bunny' ? 'big_buck_bunny' : 'elephants_dream')}.srt`);
  let srtContent = '';
  if (fs.existsSync(fixturePath)) {
    srtContent = fs.readFileSync(fixturePath, 'utf-8');
  } else {
    srtContent = `1\n00:00:24,000 --> 00:00:26,500\nHello\n\n2\n00:00:40,000 --> 00:00:43,000\nWorld`;
  }

  const cues = parseSrt(srtContent);
  const allGaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });
  const selectedGaps = allGaps.slice(0, limit);

  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
  const promptHash = crypto.createHash('sha256').update(SYSTEM_PROMPT).digest('hex');

  // Estimate token and character usage
  const avgInputTokensPerCall = 850; // includes prompt + image embedding
  const avgOutputTokensPerCall = 35;  // ~14 words description JSON
  const avgCharsPerDescription = 75;

  const totalInputTokens = selectedGaps.length * avgInputTokensPerCall;
  const totalOutputTokens = selectedGaps.length * avgOutputTokensPerCall;
  const totalPollyChars = selectedGaps.length * avgCharsPerDescription;

  // Pricing: Amazon Nova Pro: $0.0008 / 1K input tokens, $0.0032 / 1K output tokens. Polly Neural: $16.00 / 1M chars
  const bedrockCost = (totalInputTokens / 1000) * 0.0008 + (totalOutputTokens / 1000) * 0.0032;
  const pollyCost = (totalPollyChars / 1000000) * 16.00;
  const totalCost = Math.round((bedrockCost + pollyCost) * 10000) / 10000;

  const sampleRequests = selectedGaps.map(gap => ({
    gapId: gap.id,
    timestampSec: gap.tStart,
    durationSec: gap.duration,
    promptPreview: `Describe visual scene at ${gap.tStart.toFixed(1)}s (gap: ${gap.duration.toFixed(1)}s)`
  }));

  const manifest: CostManifest = {
    title,
    generatedAt: new Date().toISOString(),
    mode: isDryRun ? 'dry-run' : 'live',
    modelId,
    promptHash,
    totalGapsFound: allGaps.length,
    candidateDescriptions: selectedGaps.length,
    plannedBedrockCalls: selectedGaps.length,
    plannedPollyCalls: selectedGaps.length,
    estimatedCostUsd: {
      bedrockInputTokens: totalInputTokens,
      bedrockOutputTokens: totalOutputTokens,
      bedrockCostUsd: Math.round(bedrockCost * 10000) / 10000,
      pollyCharacters: totalPollyChars,
      pollyCostUsd: Math.round(pollyCost * 10000) / 10000,
      totalEstimatedCostUsd: totalCost
    },
    samplePlannedRequests: sampleRequests
  };

  const outManifestPath = path.resolve(__dirname, `../../local-manifest-${title}.json`);
  fs.writeFileSync(outManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`Total Gaps Detected: ${allGaps.length}`);
  console.log(`Processing Batch Size: ${selectedGaps.length}`);
  console.log(`Prompt Hash (SHA-256): ${promptHash.substring(0, 16)}...`);
  console.log(`Estimated Cost: $${totalCost.toFixed(4)} USD`);
  console.log(`Manifest written to: ${outManifestPath}\n`);

  return manifest;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let title = 'sintel';
  let limit = 10;
  let isDryRun = true;
  let isLive = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--live') {
      isLive = true;
      isDryRun = false;
    } else if (args[i] === '--dry-run') {
      isDryRun = true;
    }
  }

  runLocalPipeline({ title, limit, dryRun: isDryRun, live: isLive }).catch(err => {
    console.error('Pipeline runner failed:', err);
    process.exit(1);
  });
}
