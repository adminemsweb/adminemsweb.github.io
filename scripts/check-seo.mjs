import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import config from '../src/site-config.json' with {type:'json'};
const origin=new URL(process.env.SITE_URL||config.url).origin;
const xml=cheerio.load(fs.readFileSync('dist/sitemap.xml','utf8'),{xmlMode:true});
const urls=xml('loc').map((_,element)=>xml(element).text()).get();
assert.equal(urls.length,36); assert.equal(new Set(urls).size,36);
const descriptions=new Set();const titles=new Set();
for(const url of urls) {
  const parsed=new URL(url);assert.equal(parsed.origin,origin);assert.equal(parsed.search,'');
  const $=cheerio.load(fs.readFileSync(path.join('dist',parsed.pathname,'index.html'),'utf8'));
  assert.equal($('link[rel="canonical"]').length,1);assert.equal($('link[rel="canonical"]').attr('href'),url);
  assert.equal($('meta[name="description"]').length,1);
  const description=$('meta[name="description"]').attr('content');assert.ok(description.length>60&&description.length<=165);
  assert.ok(!descriptions.has(description),'Duplicate description');descriptions.add(description);
  assert.ok(!titles.has($('title').text()),'Duplicate title');titles.add($('title').text());
  assert.ok(!$('meta[name="robots"]').attr('content').includes('noindex'));
  assert.equal($('meta[property="og:url"]').attr('content'),url);
  assert.equal($('meta[name="keywords"]').length,0);
  assert.equal($('script[type="application/ld+json"]').length,1);
  const schema=JSON.parse($('script[type="application/ld+json"]').text());
  assert.ok(schema['@graph'].some(item=>item['@type']==='BreadcrumbList'));
  for(const product of schema['@graph'].filter(item=>item['@type']==='Product')) {assert.ok(!product.offers);assert.ok(!product.aggregateRating);}
  for(const image of $('img[srcset]')) for(const candidate of $(image).attr('srcset').split(',')) assert.ok(fs.existsSync(path.join('dist',candidate.trim().split(' ')[0])));
  assert.ok(fs.existsSync(path.join('dist',$('link[rel="alternate"][type="text/markdown"]').attr('href'))));
}
assert.ok(fs.readFileSync('dist/robots.txt','utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(fs.readFileSync('dist/llms.txt','utf8').startsWith('# Metall Rack'));
console.log('SEO checks passed: 36 canonical URLs, unique descriptions and titles, sitemap, robots, llms, Markdown, structured data and responsive images.');
