const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.next');
if (path.dirname(target) !== root || path.basename(target) !== '.next') {
  throw new Error('Unsafe build directory');
}
fs.rmSync(target, { recursive: true, force: true });
