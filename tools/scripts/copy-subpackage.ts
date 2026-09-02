const fs = require('fs');
const path = require('path');

const [packageName, subpackageName] = process.argv.slice(2);

if (!/^[a-z0-9-]+$/.test(packageName ?? '') || !/^[a-z0-9-]+$/.test(subpackageName ?? '')) {
  throw new Error('Expected safe package and subpackage names.');
}

const rootDir = path.resolve(__dirname, '..', '..');
const sourceDir = path.join(rootDir, 'packages', packageName, subpackageName);
const outputDir = path.join(rootDir, 'dist', 'packages', packageName, subpackageName);

fs.mkdirSync(outputDir, { recursive: true });
for (const fileName of ['package.json', 'README.md']) {
  fs.copyFileSync(path.join(sourceDir, fileName), path.join(outputDir, fileName));
}
