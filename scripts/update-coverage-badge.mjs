import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

try {
  console.log('Running tests to calculate coverage...');
  // Run tests and capture coverage output
  const output = execSync('npx vitest run --coverage --testTimeout 15000', { 
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'] 
  });
  
  // Find the 'All files' row in the coverage table
  const match = output.match(/All files\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)/);
  if (!match) {
    console.error('Could not parse coverage from output.');
    process.exit(1);
  }

  const linesPct = parseFloat(match[4]);
  console.log(`Extracted lines coverage: ${linesPct}%`);
  
  const readmePath = path.resolve(rootDir, 'README.md');
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  let color = 'brightgreen';
  if (linesPct < 80) color = 'yellow';
  if (linesPct < 60) color = 'red';
  
  const newBadge = `coverage-${linesPct}%25-${color}`;
  const updatedReadme = readme.replace(/coverage-[0-9.]+.*?%25-[a-z]+/, newBadge);
  
  if (readme !== updatedReadme) {
    fs.writeFileSync(readmePath, updatedReadme);
    console.log(`README.md coverage badge updated successfully to ${linesPct}%!`);
  } else {
    console.log('README.md coverage badge is already up to date.');
  }
} catch (e) {
  console.error('Failed to update coverage badge. Tests may have failed.');
  process.exit(1);
}
