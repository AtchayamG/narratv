const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf',
    dest: path.resolve(__dirname, '../apps/firetv/assets/fonts/SpaceGrotesk.ttf')
  },
  {
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf',
    dest: path.resolve(__dirname, '../apps/firetv/assets/fonts/Inter.ttf')
  }
];

fs.mkdirSync(path.resolve(__dirname, '../apps/firetv/assets/fonts'), { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved: ${dest} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const font of fonts) {
    console.log(`Downloading: ${font.url}...`);
    await download(font.url, font.dest);
  }
  console.log('All fonts downloaded successfully!');
}

run().catch(console.error);
