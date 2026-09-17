import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { categoryNames, productPath, quoteUrl } from '../src/product-links.js';

const products = JSON.parse(fs.readFileSync('src/products.json', 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const home = cheerio.load(fs.readFileSync('index.html', 'utf8'));
home('[data-details]').each((_, element) => {
  const item = home(element);
  const product = products[Number(item.attr('data-details'))];
  if (!product) throw new Error('Unknown product index');
  const link = home('<a></a>');
  for (const [key, value] of Object.entries(element.attribs)) if (key !== 'type') link.attr(key, value);
  link.attr('href', productPath(product, products)).html(item.html());
  item.replaceWith(link);
});
home('.product').each((_, element) => {
  const card = home(element);
  const product = products[Number(card.find('[data-details]').attr('data-details'))];
  const url = productPath(product, products);
  if (!card.find('.product-image > a').length) card.find('.product-image img').wrap(`<a href="${url}" aria-label="${escape(product.title)}"></a>`);
  if (!card.find('h3 a').length) card.find('h3').wrapInner(`<a href="${url}"></a>`);
  card.find('[data-product]').attr('href', quoteUrl(product)).attr('target', '_blank').attr('rel', 'noopener noreferrer').removeAttr('data-product');
});
home('#product-dialog').remove();
fs.writeFileSync('index.html', home.html());

for (const product of products) {
  const $ = cheerio.load(home.html());
  $('title').text(`${product.title} | ${categoryNames[product.category]} | Metall Rack`);
  $('meta[name="description"]').attr('content', product.description);
  $('head').append('<link rel="stylesheet" href="/src/product-page.css">');
  $('head link[href="/src/responsive-motion.css"]').appendTo('head');
  $('body').attr('class', 'product-page');
  $('a[href^="#"]').each((_, element) => {
    const link = $(element);
    link.attr('href', `/${link.attr('href')}`);
  });
  $('.skip').attr('href', '#conteudo');
  const related = products.filter(item => item !== product && item.category === product.category).slice(0, 3);
  $('main').replaceWith(`<main id="conteudo" class="product-page-main">
    <div class="container">
      <nav class="breadcrumbs" aria-label="Navegação estrutural"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/#produtos">Produtos</a><span aria-hidden="true">/</span><span aria-current="page">${escape(product.title)}</span></nav>
      <section class="product-overview" aria-labelledby="product-title">
        <div class="product-photo"><img src="${escape(product.image)}" alt="${escape(product.title)}" width="600" height="600" fetchpriority="high"></div>
        <div class="product-information"><p class="eyebrow">${escape(categoryNames[product.category])}</p><h1 id="product-title">${escape(product.title)}</h1><p class="product-description">${escape(product.description)}</p>
          <div class="product-quote"><p>Vamos encontrar a configuração para o seu projeto.</p><a class="button" href="${escape(quoteUrl(product))}" target="_blank" rel="noopener noreferrer">${$('header .whatsapp-icon').toString()}Solicitar orçamento</a><small>Fale com nossa equipe pelo WhatsApp.</small></div>
          <a class="back-to-catalog" href="/#produtos">← Voltar ao catálogo</a>
        </div>
      </section>
      <section class="product-consultation" aria-labelledby="consultation-title"><div><p class="eyebrow">ATENDIMENTO PARA SEU PROJETO</p><h2 id="consultation-title">Conte o que você precisa.</h2><p>Envie as informações do seu projeto para consultar configurações, disponibilidade e prazo de entrega.</p></div><ul><li><strong>Dimensões e instalação</strong><span>Informe o espaço disponível e onde o produto será instalado.</span></li><li><strong>Quantidade e aplicação</strong><span>Conte quais equipamentos pretende organizar ou proteger.</span></li><li><strong>Entrega</strong><span>Envie seu CEP. Entregas exclusivamente em território brasileiro.</span></li></ul></section>
      ${related.length ? `<section class="related-products" aria-labelledby="related-title"><div class="related-heading"><h2 id="related-title">Veja também</h2><a href="/#produtos">Todos os produtos →</a></div><div class="related-grid">${related.map(item => `<a class="related-card" href="${productPath(item, products)}"><div><img src="${escape(item.image)}" alt="${escape(item.title)}" width="300" height="240" loading="lazy"></div><p>${escape(categoryNames[item.category])}</p><h3>${escape(item.title)} <span aria-hidden="true">↗</span></h3></a>`).join('')}</div></section>` : ''}
    </div>
  </main>`);
  const destination = path.join(process.cwd(), productPath(product, products), 'index.html');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, $.html());
}
console.log(`Generated ${products.length} product pages.`);
