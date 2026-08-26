import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const targetCssPath = path.join(repoRoot, 'dist', 'style.css');

function checkLibraryCss() {
  if (!existsSync(targetCssPath)) {
    console.error(`Error: File not found: ${targetCssPath}`);
    process.exit(1);
  }

  const content = readFileSync(targetCssPath, 'utf8');
  const errors = [];

  // 1. Check for @tailwind directives
  if (content.includes('@tailwind')) {
    errors.push('Found "@tailwind" directive in library CSS.');
  }

  // 2. Check for Tailwind custom properties (--tw-)
  if (content.includes('--tw-')) {
    errors.push('Found Tailwind custom properties ("--tw-") in library CSS.');
  }

  // 3. Check for forbidden global selectors
  // Using regex with boundary checks so that ".bgrid-container" or ".bgrid-flex" won't match ".container" or ".flex"
  const forbiddenSelectors = [
    'container',
    'flex',
    'absolute',
    'relative',
    'border',
    'table',
    'block',
    'inline',
    'hidden',
    'opacity-0',
    'opacity-100',
  ];

  for (const selector of forbiddenSelectors) {
    const regex = new RegExp(`(^|[},;\\s])\\.${selector}(?=[\\s.{:#[>,]|$)`, 'm');
    if (regex.test(content)) {
      errors.push(`Found forbidden Tailwind global selector: .${selector}`);
    }
  }

  // 4. Check for demo-specific classes (.ant-, .demo-, .editor-)
  const demoPrefixes = ['ant-', 'demo-', 'editor-'];
  for (const prefix of demoPrefixes) {
    const regex = new RegExp(`(^|[},;\\s])\\.${prefix}`, 'm');
    if (regex.test(content)) {
      errors.push(`Found demo-specific class selector with prefix: .${prefix}`);
    }
  }

  // 5. Do not reset arbitrary consumer content rendered inside a cell/editor.
  const unsafeScopedResets = [
    "[role='grid'] table",
    "[role='grid'] thead",
    "[role='grid'] tbody",
    "[role='grid'] tfoot",
    "[role='grid'] tr",
    "[role='grid'] th",
    "[role='grid'] td",
    "[role='grid'] button",
    "[role='grid'] input",
    "[role='grid'] a",
    "[role='grid'] ul",
    "[role='grid'] ol",
    "[role='grid'] li",
    '.bgrid-toolbox-popover button',
    '.bgrid-toolbox-popover input',
    '.bgrid-toolbox-popover a',
  ];
  for (const selector of unsafeScopedResets) {
    if (content.includes(selector)) {
      errors.push(`Found unsafe descendant reset that can override consumer content: ${selector}`);
    }
  }

  if (!/--bgrid-font-size:\s*13px;/.test(content)) {
    errors.push('The legacy-compatible default grid font size must remain 13px.');
  }

  // 6. Check for keyframes without bgrid- prefix
  const keyframesMatches = content.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g);
  for (const match of keyframesMatches) {
    const name = match[1];
    if (!name.startsWith('bgrid-')) {
      errors.push(`Found keyframe animation without "bgrid-" prefix: @keyframes ${name}`);
    }
  }

  if (errors.length > 0) {
    console.error('Library CSS isolation check FAILED:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  const stat = statSync(targetCssPath);
  console.log(`Library CSS isolation check passed: dist/style.css (${stat.size} bytes)`);
}

checkLibraryCss();
