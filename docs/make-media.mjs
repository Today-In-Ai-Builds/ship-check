// Regenerates the README's images and demo GIF from the real demo shop and a
// real ship-check-report.md. Run on the add-discount-codes branch after
// `npm run ship-check`:   node docs/make-media.mjs
// Needs Playwright's Chromium (npx playwright-core install chromium) and ffmpeg.
import { chromium } from 'playwright-core';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;
const media = join(here, 'media');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
mkdirSync(media, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a>$1</a>');

// Just enough Markdown for Ship Check's own comment format.
function commentHtml(md) {
  const body = md.split('\n').map((l) => {
    if (l.startsWith('## ')) return `<h2>${inline(l.slice(3))}</h2>`;
    if (l.startsWith('### ')) return `<h3>${inline(l.slice(4))}</h3>`;
    if (l.startsWith('- ')) return `<li>${inline(l.slice(2))}</li>`;
    if (l.startsWith('<sub>')) return `<p class="sub">${inline(l.replace(/<\/?sub>/g, ''))}</p>`;
    if (l === '---') return '<hr>';
    return l.trim() ? `<p>${inline(l)}</p>` : '';
  }).join('\n');
  return `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; padding: 28px; background: #f6f8fa; font: 15px/1.55 "Segoe UI", system-ui, sans-serif; color: #1f2328; width: 900px; }
    .card { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; }
    .head { padding: 10px 16px; background: #f6f8fa; border-bottom: 1px solid #d0d7de; border-radius: 8px 8px 0 0; color: #59636e; font-size: 14px; }
    .head b { color: #1f2328; }
    .body { padding: 6px 20px 14px; }
    h2 { font-size: 22px; margin: 14px 0 6px; } h3 { font-size: 17px; margin: 18px 0 6px; }
    li { margin: 4px 0 4px 18px; } p { margin: 6px 0; }
    code { font: 13px "Cascadia Mono", Consolas, monospace; background: #eff1f3; padding: 2px 5px; border-radius: 5px; }
    a { color: #0969da; } hr { border: 0; border-top: 1px solid #d0d7de; margin: 14px 0 8px; } .sub { font-size: 12px; color: #59636e; }
  </style><div class="card"><div class="head"><b>ship-check</b> commented on <b>Add discount codes #1</b></div><div class="body">${body}</div></div>`;
}

async function shot(browser, html, out, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.screenshot({ path: join(media, out), fullPage: true });
  await page.close();
}

async function demoClip(browser) {
  const server = spawn(process.execPath, ['demo-shop/server.mjs'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 700));
  const tmp = join(media, '.video');
  rmSync(tmp, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 900, height: 620 }, recordVideo: { dir: tmp, size: { width: 900, height: 620 } } });
  const page = await ctx.newPage();
  const say = (text, tone = 'note') => page.evaluate(([t, k]) => {
    let b = document.querySelector('#sc-caption');
    if (!b) { b = document.createElement('div'); b.id = 'sc-caption'; document.body.append(b); }
    b.textContent = t;
    b.style.cssText = 'position:fixed;left:24px;right:24px;bottom:22px;padding:14px 18px;border-radius:10px;' +
      'font:600 20px/1.3 Segoe UI,system-ui,sans-serif;color:#fff;box-shadow:0 8px 30px #0003;' +
      `background:${k === 'bad' ? '#c63d30' : '#1d1d1b'}`;
  }, [text, tone]);
  const pause = (ms) => page.waitForTimeout(ms);
  await page.goto('http://127.0.0.1:4321/');
  await say('Ship Check opens the pull request\'s app in a real browser…'); await pause(1800);
  await say('"Add a $10 mug and a $15 T-shirt"'); await pause(900);
  await page.getByRole('button', { name: 'Add Mug to cart' }).click(); await pause(700);
  await page.getByRole('button', { name: 'Add T-shirt to cart' }).click(); await pause(900);
  await page.locator('#total').evaluate((el) => { el.style.outline = '3px solid #c63d30'; el.style.outlineOffset = '4px'; });
  await say('Total: $1,015.00. Expected $25.00. Test failed.', 'bad'); await pause(2600);
  await page.fill('#code', 'SAVE-50'); await pause(500);
  await page.getByRole('button', { name: 'Apply code' }).click(); await pause(600);
  await say('And the review spots this too: code SAVE-50 raises the price.', 'bad'); await pause(2600);
  await ctx.close();
  server.kill();
  const webm = join(tmp, readdirSync(tmp).find((f) => f.endsWith('.webm')));
  const gif = join(media, 'demo.gif');
  const r = spawnSync(ffmpeg, ['-y', '-i', webm, '-vf',
    'fps=12,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
    gif], { stdio: 'ignore' });
  if (r.status !== 0) throw new Error('ffmpeg failed to make demo.gif');
  rmSync(tmp, { recursive: true, force: true });
}

const browser = await chromium.launch();
await shot(browser, readFileSync(join(here, 'src', 'banner.html'), 'utf8'), 'banner.png', { width: 1280, height: 420 });
await shot(browser, commentHtml(readFileSync('ship-check-report.md', 'utf8')), 'pr-comment.png', { width: 956, height: 400 });
// READY_REPORT: a ship-check-report.md saved from the fix-discount-codes branch.
if (process.env.READY_REPORT) {
  const ready = commentHtml(readFileSync(process.env.READY_REPORT, 'utf8')).replace('Add discount codes #1', 'Fix discount codes #2');
  await shot(browser, ready, 'pr-comment-ready.png', { width: 956, height: 300 });
}
await demoClip(browser);
await browser.close();
console.log('wrote docs/media/banner.png, pr-comment.png, demo.gif');
