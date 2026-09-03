const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const files = [
  {
    src: 'C:/Users/Atchayam/.gemini/antigravity/brain/ef3cee6f-057a-404d-94a5-96a47ec6207a/sintel_art_1788366629851.jpg',
    dest: path.resolve(__dirname, '../apps/firetv/assets/art/sintel.jpg')
  },
  {
    src: 'C:/Users/Atchayam/.gemini/antigravity/brain/ef3cee6f-057a-404d-94a5-96a47ec6207a/big_buck_bunny_art_1788366654189.jpg',
    dest: path.resolve(__dirname, '../apps/firetv/assets/art/big_buck_bunny.jpg')
  },
  {
    src: 'C:/Users/Atchayam/.gemini/antigravity/brain/ef3cee6f-057a-404d-94a5-96a47ec6207a/elephants_dream_art_1788366686057.jpg',
    dest: path.resolve(__dirname, '../apps/firetv/assets/art/elephants_dream.jpg')
  }
];

const destDir = path.resolve(__dirname, '../apps/firetv/assets/art');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

for (const f of files) {
  const data = fs.readFileSync(f.src);
  fs.writeFileSync(f.dest, data);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  console.log(`${path.basename(f.dest)}: ${data.length} bytes, SHA256: ${hash}`);
}
