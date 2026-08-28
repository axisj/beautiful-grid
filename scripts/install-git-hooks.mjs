import fs from 'node:fs';
import path from 'node:path';

const gitHooksDir = path.resolve('.git/hooks');
const sourceHook = path.resolve('scripts/git-hooks/pre-push');
const targetHook = path.resolve(gitHooksDir, 'pre-push');

if (fs.existsSync(gitHooksDir) && fs.existsSync(sourceHook)) {
  fs.copyFileSync(sourceHook, targetHook);
  fs.chmodSync(targetHook, 0o755);
  console.log('Installed git pre-push hook.');
}
