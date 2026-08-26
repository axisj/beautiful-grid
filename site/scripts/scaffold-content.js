import fs from 'node:fs';
import path from 'node:path';

const learnDirectory = path.resolve('src/content/learn');
if (!fs.existsSync(learnDirectory)) {
  throw new Error('src/content/learn is missing. Learn is the canonical content source.');
}

console.log('Learn content is already managed in src/content/learn; no legacy Docs/Examples files were generated.');
