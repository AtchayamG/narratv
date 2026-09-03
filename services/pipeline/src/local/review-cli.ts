import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Description, DescriptionTrack } from '@narratv/contracts';

export interface ReviewOptions {
  title: string;
  reviewer: string;
  approveAll?: boolean;
}

export async function reviewTrack(options: ReviewOptions): Promise<{ approvedCount: number; rejectedCount: number }> {
  if (!options.reviewer || !options.reviewer.trim()) {
    console.error('ERROR: Reviewer name is strictly required. Provide --reviewer "<Your Name>".');
    process.exit(1);
  }

  const title = options.title || 'sintel';
  const trackPath = path.resolve(__dirname, `../../../../apps/firetv/assets/fixtures/${title}-track.json`);

  if (!fs.existsSync(trackPath)) {
    console.error(`Track file not found at: ${trackPath}`);
    return { approvedCount: 0, rejectedCount: 0 };
  }

  const track: DescriptionTrack = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
  console.log(`\n=== NarraTV Editorial Review CLI ===`);
  console.log(`Title: ${title}`);
  console.log(`Reviewer: ${options.reviewer}`);
  console.log(`Total Descriptions to Audit: ${track.descriptions.length}\n`);

  let approvedCount = 0;
  let rejectedCount = 0;

  const updatedDescriptions: Description[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    for (let i = 0; i < track.descriptions.length; i++) {
      const desc = track.descriptions[i];
      console.log(`[${i + 1}/${track.descriptions.length}] Item ID: ${desc.id}`);
      console.log(`Time: ${desc.tStart.toFixed(1)}s – ${desc.tEnd.toFixed(1)}s`);
      console.log(`Narration: "${desc.text}"`);
      console.log(`Placement: ${desc.placementRule || 'Scheduler calculated'}`);

      let decision = 'y';
      if (!options.approveAll) {
        const answer = await promptUser('Approve this description? [y/n/q]: ');
        if (answer.toLowerCase() === 'q') {
          console.log('Review session aborted by user.');
          break;
        }
        decision = answer.toLowerCase() === 'y' ? 'y' : 'n';
      }

      if (decision === 'y') {
        approvedCount++;
        updatedDescriptions.push({
          ...desc,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: options.reviewer
        });
        console.log(`-> APPROVED by ${options.reviewer}\n`);
      } else {
        rejectedCount++;
        updatedDescriptions.push({
          ...desc,
          status: 'skipped',
          skipReason: 'human-rejected'
        });
        console.log('-> REJECTED\n');
      }
    }
  } finally {
    rl.close();
  }

  if (updatedDescriptions.length > 0) {
    const isAllVerified = updatedDescriptions.every(d => d.status === 'verified');
    const updatedTrack: DescriptionTrack = {
      ...track,
      status: isAllVerified ? 'verified' : (approvedCount > 0 ? 'mixed' : 'ai-draft'),
      descriptions: updatedDescriptions
    };

    fs.writeFileSync(trackPath, JSON.stringify(updatedTrack, null, 2), 'utf-8');
    console.log(`\nReview completed and saved to: ${trackPath}`);
    console.log(`- Approved & Verified: ${approvedCount}`);
    console.log(`- Rejected: ${rejectedCount}`);
  }

  return { approvedCount, rejectedCount };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let title = 'sintel';
  let reviewer = '';
  let approveAll = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--reviewer' && args[i + 1]) {
      reviewer = args[i + 1];
      i++;
    } else if (args[i] === '--yes' || args[i] === '--approve-all') {
      approveAll = true;
    }
  }

  if (!reviewer) {
    console.error('ERROR: You must specify --reviewer "<Name>" to audit description tracks.');
    process.exit(1);
  }

  reviewTrack({ title, reviewer, approveAll }).catch(err => {
    console.error('Reviewer CLI error:', err);
    process.exit(1);
  });
}
