const fs = require('fs');
const path = require('path');

const fabricDir = path.resolve(__dirname, '../node_modules/react-native-screens/src/fabric');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf-8');
      if (content.includes('React.ComponentRef')) {
        content = content.replace(/React\.ComponentRef/g, 'React.ElementRef');
        fs.writeFileSync(full, content, 'utf-8');
        console.log(`Fixed ComponentRef -> ElementRef in: ${full}`);
      }
    }
  }
}

if (fs.existsSync(fabricDir)) {
  walk(fabricDir);
  console.log('Finished updating react-native-screens codegen types!');
}
