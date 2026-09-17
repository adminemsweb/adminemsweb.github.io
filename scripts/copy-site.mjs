import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { load } from 'cheerio';
import { applyBranding } from './branding.mjs';

const origin = 'https://racksolutions.com.br/';
const $ = load(await fs.readFile('original.html', 'utf8'));
const assets = new Map();
const failures = [];
await fs.mkdir('public/assets', { recursive: true });

async function download(raw, base = origin) {
  if (!raw || /^(data:|#|mailto:|tel:)/.test(raw)) return raw;
  const url = new URL(raw, base).href;
  if (assets.has(url)) return assets.get(url).local;
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || '.css';
  const name = path.basename(parsed.pathname, ext).replace(/[^a-z0-9_-]/gi, '-');
  const local = `/assets/${name}-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 10)}${ext}`;
  assets.set(url, { local });
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let content = Buffer.from(await response.arrayBuffer());
    if (ext === '.css') content = await rewriteCss(content.toString(), url);
    await fs.writeFile(`public${local}`, content);
  } catch (error) {
    failures.push({ url, error: error.message });
  }
  return local;
}

async function rewriteCss(css, base) {
  const matches = [...css.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g)];
  for (const match of matches) {
    if (match[2].startsWith('data:') || match[2].startsWith('#')) continue;
    css = css.replace(match[0], `url("${await download(match[2], base)}")`);
  }
  return css;
}

// Keep the published markup and styling, without the WordPress runtime or tracking.
$('script,link[rel="alternate"],link[rel="profile"],link[rel="canonical"]').remove();
$('html').attr('lang', 'pt-BR');
$('title').text('Rack Solutions | Racks e Acessórios');
$('meta[name="robots"]').attr('content', 'noindex, nofollow');
$('meta[property="og:url"],meta[name="twitter:url"]').remove();
const tasks = [];
$('link[rel="stylesheet"],link[rel="icon"],link[rel="apple-touch-icon"],img,source,video').each((_, element) => {
  const node = $(element);
  for (const attr of ['href', 'src', 'poster']) if (node.attr(attr)) {
    tasks.push(async () => node.attr(attr, await download(node.attr(attr))));
  }
  if (node.attr('srcset')) tasks.push(async () => {
    const entries = [];
    for (const item of node.attr('srcset').split(',')) {
      const [url, descriptor] = item.trim().split(/\s+/);
      entries.push(`${await download(url)}${descriptor ? ` ${descriptor}` : ''}`);
    }
    node.attr('srcset', entries.join(', '));
  });
});
$('style').each((_, element) => tasks.push(async () => $(element).text(await rewriteCss($(element).text(), origin))));
$('[style]').each((_, element) => tasks.push(async () => $(element).attr('style', await rewriteCss($(element).attr('style'), origin))));
for (let i = 0; i < tasks.length; i += 8) await Promise.all(tasks.slice(i, i + 8).map(task => task()));

$('a[href]').each((_, element) => {
  const node = $(element), href = node.attr('href');
  if (href === origin || href === origin.slice(0, -1)) node.attr('href', '#content');
  if (href === '#' || href === 'http://Conhe') node.attr('href', '#contato');
});
$('body').attr('id', 'content');
$('form').first().closest('.e-con.e-parent').attr('id', 'contato');
if (!$('#contato').length) $('form').first().attr('id', 'contato');
$('#rack').before('<span id="produtos" aria-hidden="true"></span>');
// The original duplicates the about anchor between desktop and mobile layouts.
$('[id="sobre"]').each((index, element) => $(element).attr('id', index ? 'sobre-mobile' : 'sobre'));
$('.elementor-invisible').removeClass('elementor-invisible');
$('.e-con.e-parent').addClass('e-lazyloaded');
$('input[type="hidden"]').remove();
$('form').removeAttr('method').removeAttr('action');
$('input,textarea,select').each((_, element) => {
  const node = $(element);
  node.attr('aria-label', node.attr('placeholder') || 'Produto de interesse');
});
$('input[type="tel"]').removeAttr('pattern').removeAttr('title');
$('select option').each((index, element) => { if (index) $(element).attr('value', $(element).text()); });
$('.elementor-slide-button').each((_, element) => {
  const node = $(element);
  node.replaceWith(`<a class="${node.attr('class')}" href="#contato">${node.html()}</a>`);
});
const swiper = await download('https://racksolutions.com.br/wp-content/plugins/elementor/assets/lib/swiper/v8/swiper.min.js?ver=8.4.5');
$('head').append('<link rel="stylesheet" href="/src/local.css">');
$('body').append(`<script src="${swiper}"></script><script type="module" src="/src/main.js"></script>`);
await fs.writeFile('index.html', applyBranding($.html()));
await fs.writeFile('asset-manifest.json', JSON.stringify({ source: origin, assets: Object.fromEntries(assets), failures }, null, 2));
console.log(`Copied ${assets.size} assets; ${failures.length} failures.`);
if (failures.length) { console.error(failures); process.exitCode = 1; }
