import { load } from 'cheerio';

export function applyBranding(html) {
  const $ = load(html.replace(/Rack Solutions/gi, 'Metall Rack'));
  $('title').text('Metall Rack | Racks e Acessórios');
  $('meta[property="og:title"], meta[name="twitter:title"]').attr('content', 'Metall Rack | Racks e Acessórios');
  $('meta[name="twitter:site"],meta[name="msapplication-TileImage"],link[rel="icon"],link[rel="apple-touch-icon"]').remove();
  $('img[src*="racklogo"], .brand-wordmark').replaceWith('<img class="brand-logo" src="/brand/rack-metal-life-logo.png" alt="Metall Rack" width="2038" height="772">');
  return $.html();
}
