const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js',
  'node_modules/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-prod.js',
  'node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js',
  'node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-prod.js'
];

for (const rel of files) {
  const file = path.resolve(__dirname, '..', rel);
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    // Replace standalone "case REACT_ELEMENT_TYPE:" with "case REACT_LEGACY_ELEMENT_TYPE:\ncase REACT_ELEMENT_TYPE:"
    const regex = /(?<!case REACT_LEGACY_ELEMENT_TYPE:\s*)case REACT_ELEMENT_TYPE:/g;
    code = code.replace(regex, 'case REACT_LEGACY_ELEMENT_TYPE:\ncase REACT_ELEMENT_TYPE:');
    fs.writeFileSync(file, code, 'utf-8');
    console.log(`Patched ${rel}`);
  }
}
