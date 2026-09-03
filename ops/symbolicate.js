// Resolve bundle (line:col) crash addresses to original source locations.
const fs = require('fs');
const path = require('path');
const { SourceMapConsumer } = require('source-map');

const ROOT = path.resolve(__dirname, '..');
const MAP = path.join(ROOT, 'apps/firetv/android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map');
const targets = [
  [1, 955573, 'effect that threw'],
  [1, 951722, 'PlayerScreen component'],
];

(async () => {
  if (!fs.existsSync(MAP)) { console.log('NO SOURCEMAP at ' + MAP); return; }
  const raw = JSON.parse(fs.readFileSync(MAP, 'utf8'));
  const run = consumer => {
    for (const [line, column, label] of targets) {
      const pos = consumer.originalPositionFor({ line, column });
      console.log(`${label}  ->  ${pos.source}:${pos.line}:${pos.column}  (${pos.name || 'anon'})`);
      if (pos.source) {
        const rel = pos.source.replace(/^.*01-firetv-narratv[\\/]/, '');
        const file = path.join(ROOT, rel);
        if (fs.existsSync(file) && pos.line) {
          const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
          for (let i = Math.max(0, pos.line - 4); i < Math.min(lines.length, pos.line + 3); i++) {
            console.log(`   ${i + 1 === pos.line ? '>>' : '  '} ${i + 1}: ${lines[i]}`);
          }
        }
      }
      console.log('');
    }
  };
  const consumer = new SourceMapConsumer(raw);
  if (typeof consumer.then === 'function') { consumer.then(c => { run(c); c.destroy && c.destroy(); }); }
  else { run(consumer); }
})();
