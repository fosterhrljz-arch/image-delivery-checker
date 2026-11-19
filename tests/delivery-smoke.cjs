// Optional delivery QA only. The application has no dependency on Playwright.
// Usage: node tests/delivery-smoke.cjs [project-directory] [evidence-directory]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(playwrightModule);
const project = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const output = path.resolve(process.argv[3] || path.join(project, 'evidence'));
const manifest = JSON.parse(fs.readFileSync(path.join(project, 'samples/manifest.json'), 'utf8'));
const readme = fs.readFileSync(path.join(project, 'README.md'), 'utf8');
const labels = { JPEG: 'JPG', PNG: 'PNG', WEBP: 'WebP' };
fs.mkdirSync(output, { recursive: true });

function parseCSV(text) {
  let quoted = false, cell = '', row = [], rows = [];
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (c === '\r' && !quoted && text[i + 1] === '\n') { row.push(cell); rows.push(row); cell = ''; row = []; i++; }
    else cell += c;
  }
  return rows;
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const context = await browser.newContext({ offline: true, acceptDownloads: true, viewport: { width: 1536, height: 1024 } });
  const page = await context.newPage();
  const tests = [], errors = [], httpRequests = [];
  const record = async (name, fn) => { await fn(); tests.push({ name, status: 'PASS' }); console.log('PASS: ' + name); };
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) httpRequests.push(request.url()); });
  const ready = () => page.waitForFunction(() => document.querySelectorAll('#results tr').length > 0 && !Array.from(document.querySelectorAll('#results .status')).some(node => node.textContent.includes('Checking')));
  const row = name => page.locator('#results tr').filter({ has: page.locator('.file-name', { hasText: name }) });
  const url = pathToFileURL(path.join(project, 'index.html')).href;
  try {
    await record('Offline file URL: identity, visible content and empty state', async () => {
      await page.goto(url);
      assert.equal(page.url(), url);
      assert.equal(await page.title(), 'Image Delivery Checker');
      assert.equal(await page.locator('h1').innerText(), 'Ready for delivery?');
      assert.ok(await page.locator('#empty').isVisible());
      assert.ok(await page.locator('#export').isDisabled());
    });
    await record('Six decoded samples agree with README, manifest and actual file bytes', async () => {
      await page.locator('#samples').click(); await ready();
      assert.equal(await page.locator('#passed').innerText(), '2 passed');
      assert.equal(await page.locator('#failed').innerText(), '4 need attention');
      assert.equal(await page.locator('#results img').count(), 6);
      assert.ok(await page.locator('#results img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
      for (const m of manifest) {
        assert.equal(fs.statSync(path.join(project, 'samples', m.name)).size, m.bytes);
        assert.equal(await row(m.name).locator('.dimensions-td').innerText(), `${m.width} × ${m.height} px`);
        assert.equal(await row(m.name).locator('.size').getAttribute('title'), `${m.bytes.toLocaleString('en-US')} bytes`);
        assert.ok((await row(m.name).locator('.format-td').innerText()).startsWith(labels[m.format]));
        assert.ok(readme.includes(`| \`${m.name}\` | ${m.width} × ${m.height} | ${m.bytes.toLocaleString('en-US')} |`));
      }
    });
    await record('Original presets and documented 2-to-4 MB edit produce expected outcomes', async () => {
      await page.locator('#max-size').fill('4'); assert.equal(await page.locator('#passed').innerText(), '3 passed');
      await page.locator('#reset').click();
      for (const [preset, expected] of [['product', 'product-detail.jpg'], ['banner', 'website-banner.webp']]) {
        await page.locator('#preset').selectOption(preset);
        assert.equal(await page.locator('#passed').innerText(), '1 passed');
        assert.equal(await row(expected).locator('.passed').count(), 1);
      }
      await page.locator('#preset').selectOption('social');
    });
    await record('Actual filtered CSV download contains all six correct records', async () => {
      await page.locator('[data-filter="passed"]').click(); assert.equal(await page.locator('#results tr').count(), 2);
      const downloadEvent = page.waitForEvent('download'); await page.locator('#export').click();
      const download = await downloadEvent;
      assert.equal(download.suggestedFilename(), 'image-delivery-report.csv');
      const reportPath = path.join(output, 'sample-report.csv'); await download.saveAs(reportPath);
      const rows = parseCSV(fs.readFileSync(reportPath, 'utf8'));
      assert.equal(rows.length, 7); assert.equal(rows[0].length, 16);
      assert.equal(rows.filter(r => r[6] === 'PASS').length, 2); assert.equal(rows.filter(r => r[6] === 'FAIL').length, 4);
      for (const [i, m] of manifest.entries()) {
        const r = rows[i + 1]; assert.equal(r[0], m.name); assert.equal(Number(r[1]), m.width); assert.equal(Number(r[2]), m.height);
        assert.equal(r[3], labels[m.format]); assert.equal(Number(r[4]), m.bytes); assert.equal(r[8], 'Square social post');
        assert.equal(r[9], 'Exactly'); assert.equal(r[10], '1080'); assert.equal(r[11], '1080');
        assert.equal(r[12], 'JPG; PNG'); assert.equal(r[13], '2000000'); assert.equal(r[14], '2'); assert.ok(!Number.isNaN(Date.parse(r[15])));
      }
      await page.locator('[data-filter="all"]').click();
    });
    await record('Desktop/mobile screenshots and five viewport overflow checks', async () => {
      for (const width of [320, 390, 768, 1024, 1536]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 1024 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}`);
        if (width === 390 || width === 1536) await page.screenshot({ path: path.join(output, width === 390 ? 'mobile.png' : 'desktop.png'), fullPage: true });
      }
    });
    await record('All six supplied invalid/unsupported files fail with the documented reasons', async () => {
      await page.locator('#clear').click();
      const invalid = path.join(project, 'samples/invalid');
      await page.locator('#file-input').setInputFiles(fs.readdirSync(invalid).map(name => path.join(invalid, name))); await ready();
      assert.equal(await page.locator('#failed').innerText(), '6 need attention');
      for (const [name, reason] of [['empty.png', /Empty file/], ['not-an-image.jpg', /Unrecognized/], ['damaged.jpg', /Invalid or damaged/], ['damaged.png', /Invalid or damaged/], ['damaged.webp', /Invalid or damaged/], ['unsupported.gif', /Unsupported format: GIF/]]) assert.match(await row(name).innerText(), reason);
      const downloadEvent = page.waitForEvent('download'); await page.locator('#export').click();
      await (await downloadEvent).saveAs(path.join(output, 'invalid-report.csv'));
      const rows = parseCSV(fs.readFileSync(path.join(output, 'invalid-report.csv'), 'utf8'));
      assert.equal(rows.length, 7); assert.ok(rows.slice(1).every(r => r[6] === 'FAIL' && r[7]));
    });
    await record('No app page errors, console warnings/errors or HTTP requests', async () => {
      assert.deepEqual(errors, []); assert.deepEqual(httpRequests, []);
    });
    const result = { date: '2026-11-06', browser: 'Chrome ' + browser.version(), playwright: require(path.join(path.dirname(require.resolve(playwrightModule)), 'package.json')).version, node: process.version, url, offline: true, viewports: [320, 390, 768, 1024, 1536], tests, console: errors, httpRequests };
    fs.writeFileSync(path.join(output, 'delivery-browser-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`${tests.length} groups passed; ${errors.length} console/runtime errors; ${httpRequests.length} HTTP requests.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
