import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { productPath, quoteUrl } from '../src/product-links.js';

const products = JSON.parse(fs.readFileSync('src/products.json', 'utf8'));
const optimizedImages = JSON.parse(fs.readFileSync('src/optimized-images.json', 'utf8'));
const routes = products.map(product => productPath(product, products));
assert.equal(new Set(routes).size, products.length, 'Every catalog entry needs a unique URL');
const home = cheerio.load(fs.readFileSync('dist/index.html', 'utf8'));
const catalog = cheerio.load(fs.readFileSync('dist/produtos/index.html', 'utf8'));
assert.equal(catalog('.product').length, products.length);
assert.equal(home('#product-dialog').length, 0, 'Old product modal should be removed');
for (const [index, product] of products.entries()) {
  const route = routes[index];
  const $ = cheerio.load(fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8'));
  assert.equal($('#product-title').text(), product.title);
  assert.equal($('.product-description').text(), product.description);
  assert.equal($('.product-photo img').attr('src'), optimizedImages[product.image].src);
  assert.equal($('.product-quote a').attr('href'), quoteUrl(product));
  assert.equal($('header #header-search').length, 1);
  assert.equal($('footer').length, 1);
  assert.equal(catalog(`.product [data-details="${index}"]`).attr('href'), route);
  const hashes = [...$('a[href^="/#"]')].map(element => $(element).attr('href').slice(2));
  for (const id of hashes) assert.ok(home(`[id="${id}"]`).length, `Missing home target ${id}`);
  for (const element of $('img[src], script[src], link[href]')) {
    const url = $(element).attr('src') || $(element).attr('href');
    if (!url.startsWith('/')) continue;
    assert.ok(fs.existsSync(path.join('dist', url.split('?')[0])), `Missing built asset ${url}`);
  }
  for (const element of $('.related-card')) assert.ok(routes.includes($(element).attr('href')), 'Broken related product link');
}
const allRoutes = ['/', '/produtos/', '/linhas/', '/empresa/', '/ajuda/', ...routes];
for (const route of allRoutes) {
  const $ = cheerio.load(fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8'));
  assert.equal($('h1').length, 1, `Expected one page title: ${route}`);
  assert.equal($('#navigation > a[aria-current="page"]').length, 1, `Missing active navigation: ${route}`);
  for (const element of $('a[href]')) {
    const href = $(element).attr('href');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const target = new URL(href, `https://metalrack.test${route}`);
    const filename = path.join('dist', target.pathname, 'index.html');
    assert.ok(fs.existsSync(filename), `Broken internal link ${href} on ${route}`);
    if (target.hash) {
      const targetPage = cheerio.load(fs.readFileSync(filename, 'utf8'));
      assert.ok(targetPage(`[id="${target.hash.slice(1)}"]`).length, `Missing anchor ${href}`);
    }
  }
}
const responses = process.argv.includes('--static') ? [] : await Promise.all(allRoutes.map(async route => {
  const response = await fetch(`http://127.0.0.1:5174${route}`);
  assert.equal(response.status, 200, `Route unavailable: ${route}`);
  const $ = cheerio.load(await response.text());
  const expected = cheerio.load(fs.readFileSync(path.join('dist', route, 'index.html'), 'utf8'));
  assert.equal($('h1').text(), expected('h1').text(), `Wrong page returned: ${route}`);
}));
console.log(`Verified ${responses.length} live routes, unique URLs, content, quotes, all internal links, navigation and production assets.`);
