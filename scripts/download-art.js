const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const images = [
  {
    name: 'sintel.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg'
  },
  {
    name: 'big_buck_bunny.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg'
  },
  {
    name: 'elephants_dream.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_poster.jpg'
  }
];

const destDir = path.resolve(__dirname, '../apps/firetv/assets/art');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'NarraTVApp/1.0 (https://github.com/amazon-developer-hackathon; contact@example.com)'
      }
    };
    https.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status code: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const content = fs.readFileSync(dest);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          console.log(`Saved ${path.basename(dest)}: ${content.length} bytes, SHA256: ${hash}`);
          resolve({ dest, hash, bytes: content.length });
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const img of images) {
    const dest = path.join(destDir, img.name);
    console.log(`Downloading ${img.name} from ${img.url}...`);
    try {
      await download(img.url, dest);
    } catch (err) {
      console.error(`Error downloading ${img.name}:`, err.message);
    }
  }
}

main();
