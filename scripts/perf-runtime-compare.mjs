import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {
    runs: 3,
    headed: false,
    cpuThrottle: 1,
    baselineUrl: 'http://127.0.0.1:4174',
    currentUrl: 'http://127.0.0.1:4173',
    scenarios: ['virtualScroll', 'reorder', 'columnSort'],
  };

  for (const arg of argv) {
    if (arg === '--headed') args.headed = true;
    if (arg.startsWith('--runs=')) args.runs = Number(arg.split('=')[1]);
    if (arg.startsWith('--cpu=')) args.cpuThrottle = Number(arg.split('=')[1]);
    if (arg.startsWith('--baseline=')) args.baselineUrl = arg.split('=')[1];
    if (arg.startsWith('--current=')) args.currentUrl = arg.split('=')[1];
    if (arg.startsWith('--scenarios=')) args.scenarios = arg.split('=')[1].split(',').filter(Boolean);
  }

  return args;
}

async function getMetrics(page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  const data = await client.send('Performance.getMetrics');
  const map = Object.fromEntries(data.metrics.map(m => [m.name, m.value]));
  return {
    TaskDuration: map.TaskDuration || 0,
    ScriptDuration: map.ScriptDuration || 0,
    LayoutDuration: map.LayoutDuration || 0,
    RecalcStyleDuration: map.RecalcStyleDuration || 0,
    Nodes: map.Nodes || 0,
    JSHeapUsedSize: map.JSHeapUsedSize || 0,
  };
}

async function gotoRoute(page, scenario, baseUrl) {
  const pathMap = {
    virtualScroll: '/virtualScroll',
    reorder: '/reorder',
    columnSort: '/columnSort',
  };
  const route = pathMap[scenario] ?? '/';
  const navStart = Date.now();
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[role="rfdg-scroll-container"]', { timeout: 20000 });
  await page.waitForSelector('[role="rfdg-body"] tr, [role="rfdg-body-frozen"] tr', { timeout: 20000 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  return Date.now() - navStart;
}

async function runVirtualScroll(page) {
  return await page.evaluate(async () => {
    const sc = document.querySelector('[role="rfdg-scroll-container"]');
    if (!sc) throw new Error('scroll container not found');

    const marks = [];
    const start = performance.now();
    for (let i = 0; i < 160; i++) {
      sc.scrollTop = i * 220;
      marks.push(performance.now());
      await new Promise(r => requestAnimationFrame(r));
    }
    const end = performance.now();

    let worstFrameGap = 0;
    for (let i = 1; i < marks.length; i++) {
      worstFrameGap = Math.max(worstFrameGap, marks[i] - marks[i - 1]);
    }

    return {
      scenarioMs: end - start,
      avgStepMs: (end - start) / 160,
      worstFrameGap,
    };
  });
}

async function runReorder(page) {
  const handles = page.locator('.drag-handle');
  const count = await handles.count();
  if (count < 3) {
    throw new Error(`not enough drag handles: ${count}`);
  }

  const src = handles.nth(0);
  const dst = handles.nth(Math.min(4, count - 1));
  const srcBox = await src.boundingBox();
  const dstBox = await dst.boundingBox();
  if (!srcBox || !dstBox) throw new Error('drag handle bbox not found');

  const marks = [];
  const start = Date.now();
  await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
  marks.push(Date.now());
  await page.mouse.down();
  marks.push(Date.now());
  await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2, { steps: 12 });
  marks.push(Date.now());
  await page.mouse.up();
  marks.push(Date.now());

  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const end = Date.now();
  const deltas = marks.slice(1).map((v, i) => v - marks[i]);

  return {
    scenarioMs: end - start,
    avgStepMs: deltas.reduce((a, b) => a + b, 0) / deltas.length,
    worstFrameGap: Math.max(...deltas),
  };
}

async function runColumnSort(page) {
  const headerCells = page.locator('[role="rfdg-head"] td.drag-item');
  const count = await headerCells.count();
  if (count < 3) {
    throw new Error(`not enough sortable header cells: ${count}`);
  }

  const marks = [];
  const start = performance.now();
  for (let i = 0; i < 20; i++) {
    await headerCells.nth((i % (count - 1)) + 1).click();
    marks.push(performance.now());
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  }
  const end = performance.now();

  let worstFrameGap = 0;
  for (let i = 1; i < marks.length; i++) {
    worstFrameGap = Math.max(worstFrameGap, marks[i] - marks[i - 1]);
  }

  return {
    scenarioMs: end - start,
    avgStepMs: (end - start) / 20,
    worstFrameGap,
  };
}

async function runScenario(baseUrl, scenario, options) {
  const browser = await chromium.launch({ headless: !options.headed });
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  if (options.cpuThrottle > 1) {
    await client.send('Emulation.setCPUThrottlingRate', { rate: options.cpuThrottle });
  }

  const mountMs = await gotoRoute(page, scenario, baseUrl);

  const before = await getMetrics(page);
  let scenarioResult;
  if (scenario === 'reorder') scenarioResult = await runReorder(page);
  else if (scenario === 'columnSort') scenarioResult = await runColumnSort(page);
  else scenarioResult = await runVirtualScroll(page);

  const after = await getMetrics(page);
  await browser.close();

  return {
    scenario,
    mountMs,
    scenarioMs: scenarioResult.scenarioMs,
    avgStepMs: scenarioResult.avgStepMs,
    worstFrameGap: scenarioResult.worstFrameGap,
    delta: {
      TaskDuration: after.TaskDuration - before.TaskDuration,
      ScriptDuration: after.ScriptDuration - before.ScriptDuration,
      LayoutDuration: after.LayoutDuration - before.LayoutDuration,
      RecalcStyleDuration: after.RecalcStyleDuration - before.RecalcStyleDuration,
    },
    heapUsed: after.JSHeapUsedSize,
    nodes: after.Nodes,
  };
}

function mean(items, key) {
  return items.reduce((sum, item) => sum + item[key], 0) / items.length;
}

function meanDelta(items, key) {
  return items.reduce((sum, item) => sum + item.delta[key], 0) / items.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targets = {
    baseline: args.baselineUrl,
    current: args.currentUrl,
  };

  const report = {
    options: args,
    results: {},
  };

  for (const scenario of args.scenarios) {
    report.results[scenario] = {};

    for (const [name, url] of Object.entries(targets)) {
      const runs = [];
      for (let i = 0; i < args.runs; i++) {
        runs.push(await runScenario(url, scenario, args));
      }

      report.results[scenario][name] = {
        runs,
        mean: {
          mountMs: mean(runs, 'mountMs'),
          scenarioMs: mean(runs, 'scenarioMs'),
          avgStepMs: mean(runs, 'avgStepMs'),
          worstFrameGap: mean(runs, 'worstFrameGap'),
          heapUsed: mean(runs, 'heapUsed'),
          nodes: mean(runs, 'nodes'),
          deltaTask: meanDelta(runs, 'TaskDuration'),
          deltaScript: meanDelta(runs, 'ScriptDuration'),
          deltaLayout: meanDelta(runs, 'LayoutDuration'),
          deltaRecalc: meanDelta(runs, 'RecalcStyleDuration'),
        },
      };
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
