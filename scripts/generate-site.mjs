import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { categoryNames, productPath, quoteUrl } from '../src/product-links.js';
import { landingHero } from './landing-content.mjs';

const products = JSON.parse(fs.readFileSync('src/products.json', 'utf8'));
const esc = text => String(text).replace(/[&<>"']/g, value => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[value]);
const base = cheerio.load(fs.readFileSync('index.html', 'utf8'));
base('head link[href="/src/site-pages.css"]').remove();
base('head').append('<link rel="stylesheet" href="/src/site-pages.css">');
base('head link[href="/src/landing-refresh.css"]').remove();
base('head').append('<link rel="stylesheet" href="/src/landing-refresh.css">');
base('head link[href="/src/responsive-motion.css"]').remove();
base('head').append('<link rel="stylesheet" href="/src/responsive-motion.css">');
base('link[rel="icon"]').attr('href', '/assets/metal-rack-favicon.svg').attr('type', 'image/svg+xml');
base('#navigation > a:not(.button)').remove();
const navigation = [['/', 'Início'], ['/linhas/', 'Nossas linhas'], ['/produtos/', 'Produtos'], ['/empresa/', 'A empresa'], ['/ajuda/', 'Ajuda para escolher']];
base('#navigation').prepend(navigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join(''));
base('header .brand, footer .brand').attr('href', '/');
base('header .brand img').attr('src', '/assets/metal-rack-signature.svg').attr('width', '210').attr('height', '58');
base('footer .brand img').attr('src', '/assets/metal-rack-signature-light.svg').attr('width', '245').attr('height', '67');
base('a[data-line]').each((_, element) => { const item = base(element); item.attr('href', `/produtos/?linha=${item.attr('data-line')}`).removeAttr('data-line'); });
const routeMap = {'#inicio':'/', '#produtos':'/produtos/', '#linhas':'/linhas/', '#sobre':'/empresa/', '#guia':'/ajuda/', '#contato':'https://wa.me/5511921047460'};
base('footer a').each((_, element) => { const item=base(element); const href=item.attr('href'); if (routeMap[href]) item.attr('href', routeMap[href]); });
const whatsapp = base('header .whatsapp-icon').toString();
const contact = 'https://wa.me/5511921047460?text=' + encodeURIComponent('Olá! Gostaria de conversar sobre um projeto com a Metal Rack.');
const lineInfo = {
  rack: ['Estrutura para sua rede.', 'Organize servidores, telecomunicações e equipamentos de TI em um só lugar.', 1, 'Redes corporativas · TI · Telecom'],
  energia: ['Proteção para cada instalação.', 'Gabinetes e caixas para acomodar equipamentos e componentes do seu projeto.', 8, 'Energia · Instalações · Infraestrutura'],
  acessorios: ['Os detalhes que completam.', 'Bandejas, organização de cabos, distribuição elétrica e componentes para racks.', 19, 'Organização · Montagem · Complementos'],
  fibra: ['Conectividade bem organizada.', 'Soluções para distribuição e organização de infraestrutura óptica e energia.', 28, 'Fibra óptica · Distribuição · Redes'],
};
const button = (label, href, extra='') => `<a class="button ${extra}" href="${esc(href)}">${label}<span aria-hidden="true">↗</span></a>`;
const crumb = label => `<div class="site-breadcrumb"><a href="/">Início</a><span>/</span><span aria-current="page">${label}</span></div>`;
const intro = (eyebrow, title, copy) => `<section class="page-intro"><div class="container">${crumb(eyebrow)}<p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-intro-copy">${copy}</p></div></section>`;
const cta = () => `<section class="project-cta container"><div><p class="eyebrow">VAMOS CONVERSAR?</p><h2>Seu próximo projeto<br>começa por uma boa estrutura.</h2></div><a class="button" href="${contact}" target="_blank" rel="noopener noreferrer">${whatsapp}Falar com a Metal Rack</a></section>`;
function card(product) {
  const index = products.indexOf(product);
  return `<article class="product" data-category="${product.category}" data-search="${esc(product.title+' '+product.description)}"><div class="product-image"><a href="${productPath(product, products)}"><img src="${esc(product.image)}" alt="${esc(product.title)}" loading="lazy" width="400" height="400"></a></div><div class="product-body"><p class="product-category">${categoryNames[product.category]}</p><h3><a href="${productPath(product, products)}">${esc(product.title)}</a></h3><p>${esc(product.description)}</p><a class="details-button" data-details="${index}" href="${productPath(product, products)}">Conhecer produto <span aria-hidden="true">↗</span></a><a href="${esc(quoteUrl(product))}" target="_blank" rel="noopener noreferrer">Solicitar orçamento <span aria-hidden="true">↗</span></a></div></article>`;
}
function lineCards() {
  return Object.entries(lineInfo).map(([key, [title, copy, index]], order) => `<a class="range-card" href="/produtos/?linha=${key}"><div class="range-image"><span class="range-index">0${order+1}</span><img src="${products[index].image}" alt="${categoryNames[key]}" width="300" height="260" loading="lazy"></div><p>${products.filter(p=>p.category===key).length} produtos</p><h3>${categoryNames[key]}<span>↗</span></h3><p>${copy}</p></a>`).join('');
}
function writePage(route, title, description, content, bodyClass='') {
  const $ = cheerio.load(base.html());
  $('title').text(route === '/' ? 'Metal Rack' : `${title} | Metal Rack`);
  $('meta[name="description"]').attr('content', description);
  $('body').attr('class', bodyClass);
  $('main').replaceWith(`<main id="conteudo">${content}</main>`);
  if (route === '/') {
    $('.studio-stage').attr('role', 'region').attr('aria-roledescription', 'carrossel').attr('aria-label', 'Vitrine de produtos');
    $('.stage-count').wrap('<div class="stage-top-controls"></div>');
    $('.stage-top-controls').append('<button class="stage-pause" type="button" aria-pressed="false" aria-label="Pausar animações da vitrine" hidden>Ⅱ Pausar</button>');
    $('.studio-stage').append('<div class="stage-progress" aria-hidden="true"><span></span></div>');
  }
  $('.skip').attr('href', '#conteudo');
  $('#navigation > a').removeAttr('aria-current').each((_, element) => { if ($(element).attr('href')===route) $(element).attr('aria-current','page'); });
  const output = path.join(process.cwd(), route, 'index.html');
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output,$.html());
}

writePage('/', 'Racks, gabinetes e infraestrutura', 'Conheça as linhas de racks, gabinetes, acessórios e fibra da Metal Rack. Encontre produtos e solicite um orçamento para o seu projeto.', `
${landingHero(products)}
<div class="service-strip"><div class="container"><div><strong>04</strong><span>Linhas para seu projeto</span></div><div><strong>${products.length}</strong><span>Produtos no catálogo</span></div><div><strong>Brasil</strong><span>Entregas em território nacional</span></div><div><strong>Atendimento</strong><span>Converse direto pelo WhatsApp</span></div></div></div>
<section class="container home-ranges"><div class="editorial-heading"><div><p class="eyebrow">NOSSO PORTFÓLIO</p><h2>Uma linha para cada necessidade.</h2></div><a href="/linhas/">Conheça nossas linhas ↗</a></div><div class="range-grid">${lineCards()}</div></section>
<section class="featured-section"><div class="container"><div class="editorial-heading"><div><p class="eyebrow">EXPLORE O CATÁLOGO</p><h2>Encontre a sua estrutura.</h2></div><a href="/produtos/">Ver todos os produtos ↗</a></div><div class="featured-grid">${[products[0],products[4],products[8],products[19]].map(card).join('')}</div></div></section>
<section class="container company-teaser"><div class="company-art"><img src="${products[0].image}" alt="Rack Standard" loading="lazy" width="400" height="500"><span>METAL<br>RACK.</span></div><div><p class="eyebrow">A EMPRESA</p><h2>Tecnologia precisa<br>de uma boa base.</h2><p>Conheça a Metal Rack e nosso portfólio para organizar e proteger os equipamentos que fazem parte do seu negócio.</p><p>De Sorocaba para projetos em todo o Brasil, com atendimento para entender a sua necessidade.</p>${button('Conheça a empresa','/empresa/','outline-button')}</div></section>${cta()}`, 'home-page');

writePage('/produtos/', 'Produtos', 'Explore o catálogo completo Metal Rack. Filtre racks, gabinetes, acessórios e fibra, e consulte os detalhes de cada produto.', `${intro('CATÁLOGO DE PRODUTOS','A estrutura certa.<br>Para o seu projeto.','Explore as linhas, compare as opções e converse com nossa equipe sobre o que você precisa.')}<section id="produtos" class="catalog container"><div class="catalog-top"><h2>Todos os produtos</h2><p class="result-count" aria-live="polite">${products.length} produtos</p></div><div class="catalog-layout"><aside class="catalog-tools"><p class="filter-label">FILTRAR POR LINHA</p><div class="filters" role="group" aria-label="Filtrar por categoria"><button class="active" data-filter="all" aria-pressed="true">Todos os produtos <span>${products.length}</span></button>${Object.entries(categoryNames).map(([key,name])=>`<button data-filter="${key}" aria-pressed="false">${name}<span>${products.filter(p=>p.category===key).length}</span></button>`).join('')}</div><div class="catalog-assistance"><strong>Precisa de ajuda?</strong><p>Veja por onde começar a escolha do seu produto.</p><a href="/ajuda/">Guia de escolha →</a></div></aside><div><div class="search-summary" hidden><span></span><button type="button" id="clear-search">Limpar busca ×</button></div><div class="product-grid">${products.map(card).join('')}</div><p class="empty" hidden>Nenhum produto encontrado. Tente outro termo ou escolha outra linha.</p></div></div></section>${cta()}`, 'catalog-page');

writePage('/linhas/', 'Nossas linhas', 'Conheça as quatro linhas de produtos Metal Rack: racks, energia, acessórios e fibra.', `${intro('NOSSAS LINHAS','Quatro linhas.<br>Infinitas possibilidades.','Conheça o portfólio e escolha a linha que faz sentido para a sua instalação.')}<section class="container line-sections">${Object.entries(lineInfo).map(([key,[title,copy,index,applications]],i)=>`<article class="line-feature"><div class="line-feature-image"><span>0${i+1}</span><img src="${products[index].image}" alt="${categoryNames[key]}" loading="lazy" width="500" height="430"></div><div><p class="eyebrow">${categoryNames[key]}</p><h2>${title}</h2><p>${copy}</p><p class="line-applications">${applications}</p><div class="line-examples">${products.filter(p=>p.category===key).slice(0,3).map(p=>`<a href="${productPath(p,products)}">${esc(p.title)} <span>↗</span></a>`).join('')}</div>${button(`Ver linha completa (${products.filter(p=>p.category===key).length})`,`/produtos/?linha=${key}`)}</div></article>`).join('')}</section>${cta()}`, 'lines-page');

writePage('/empresa/', 'A empresa', 'Conheça a Metal Rack, em Sorocaba: racks, gabinetes e acessórios para TI, telecom e energia. Atendimento e entregas no Brasil.', `${intro('A EMPRESA','Estrutura que aproxima.<br>Tecnologia que conecta.','A Metal Rack reúne soluções para a infraestrutura que sustenta o dia a dia do seu negócio.')}<section class="container company-story"><div><p class="eyebrow">CONHEÇA A METAL RACK</p><h2>Seu projeto começa<br>com a escolha certa.</h2><p>Nosso catálogo reúne racks, gabinetes, caixas, acessórios e soluções para fibra. Uma seleção para apoiar a organização de equipamentos em projetos de tecnologia, telecomunicações e energia.</p><p>O atendimento parte do que você precisa: aplicação, espaço disponível, quantidade e local de entrega. Com essas informações, você pode consultar as opções e solicitar uma proposta.</p>${button('Conheça nossos produtos','/produtos/')}</div><div class="company-product-composition"><img src="${products[1].image}" alt="Rack Server" width="450" height="450"><img src="${products[8].image}" alt="Gabinete com Visor" width="280" height="280"><span>TI / TELECOM / ENERGIA</span></div></section><section class="container company-values"><article><span>01 / PORTFÓLIO</span><h3>Uma visão completa.</h3><p>Quatro linhas para encontrar desde a estrutura principal até os acessórios do projeto.</p></article><article><span>02 / ATENDIMENTO</span><h3>Conversa direta.</h3><p>Fale pelo WhatsApp comercial e envie as informações da sua instalação.</p></article><article><span>03 / ALCANCE</span><h3>Do projeto à entrega.</h3><p>Atendimento em Sorocaba, com entregas exclusivamente em território brasileiro.</p></article></section><section class="container company-address"><div><p class="eyebrow">ONDE ESTAMOS</p><h2>Sorocaba, São Paulo.</h2><address>Rua Cabreúva · CEP 18085-340<br>Sorocaba - SP</address></div><div><h3>Fale com a Metal Rack</h3><a href="https://wa.me/5511921047460">WhatsApp: +55 11 92104-7460 ↗</a><a href="mailto:comercial@metalrack.com.br">comercial@metalrack.com.br</a><p>SMARTFLOW TECNOLOGIA EIRELI<br>CNPJ 19.252.656/0001-20</p></div></section>${cta()}`, 'company-page');

writePage('/ajuda/', 'Ajuda para escolher', 'Encontre um ponto de partida para escolher racks, gabinetes, acessórios e fibra. Tire dúvidas e solicite orientação para o seu projeto.', `${intro('AJUDA PARA ESCOLHER','Vamos encontrar<br>um bom ponto de partida.','Conte qual é a necessidade do seu projeto e explore as linhas relacionadas.')}<section class="container selection-guide"><div><p class="eyebrow">01 / SUA APLICAÇÃO</p><h2>O que você precisa organizar?</h2><div class="guide-choices">${[['rack','Servidores e rede','Racks para equipamentos de TI e telecom.'],['energia','Equipamentos e energia','Gabinetes e caixas para sua instalação.'],['acessorios','Completar meu rack','Organização, montagem e distribuição.'],['fibra','Fibra e distribuição','Infraestrutura óptica e conexões.']].map(([key,title,copy],i)=>`<button type="button" data-guide="${key}" aria-pressed="${i===0}"><strong>${title}</strong><span>${copy}</span><b aria-hidden="true">↗</b></button>`).join('')}</div></div><div id="guide-result" class="guide-result" aria-live="polite"><p class="eyebrow">SUA LINHA PARA EXPLORAR</p><h3>Racks e Telecom</h3><p>Veja estruturas para organizar equipamentos de TI e telecomunicações.</p><a class="button" href="/produtos/?linha=rack">Explorar esta linha <span>↗</span></a><small>A definição do modelo depende das dimensões, do ambiente e dos equipamentos da instalação.</small></div></section><section class="container checklist-section"><div><p class="eyebrow">02 / PREPARE SEU ORÇAMENTO</p><h2>Tenha estas informações em mãos.</h2></div><div class="checklist-grid"><article><span>01</span><h3>Equipamentos</h3><p>Liste o que será instalado e suas dimensões.</p></article><article><span>02</span><h3>Ambiente</h3><p>Indique se a instalação será interna, externa, no piso ou na parede.</p></article><article><span>03</span><h3>Quantidade</h3><p>Informe quantas unidades você precisa para o projeto.</p></article><article><span>04</span><h3>Entrega</h3><p>Envie a cidade e o CEP para consultar as condições.</p></article></div></section><section class="container faq-section"><p class="eyebrow">DÚVIDAS FREQUENTES</p><h2>Antes de escolher.</h2><details><summary>Como saber qual tamanho de rack preciso?</summary><p>Reúna as dimensões e a quantidade dos equipamentos, o espaço disponível e a necessidade de expansão. Envie essas informações no orçamento para consultar os modelos compatíveis.</p></details><details><summary>Posso usar qualquer gabinete em área externa?</summary><p>A escolha depende das condições do local. Consulte a aplicação e o grau de proteção do modelo antes de confirmar o produto para uma área externa.</p></details><details><summary>Como consultar preço e prazo?</summary><p>Abra o produto e clique em “Solicitar orçamento”. O WhatsApp será aberto com o nome do item. Acrescente quantidade e CEP para consultar a proposta.</p></details><details><summary>Vocês entregam fora do Brasil?</summary><p>As entregas são realizadas exclusivamente em território brasileiro.</p></details></section>${cta()}`, 'help-page');

await import('./generate-product-pages.mjs');
for (const product of products) {
  const filename=path.join(process.cwd(),productPath(product,products),'index.html');
  const $=cheerio.load(fs.readFileSync(filename,'utf8'));
  $('#navigation > a').removeAttr('aria-current');
  $('#navigation > a[href="/produtos/"]').attr('aria-current','page');
  $('a[href="/#produtos"]').attr('href','/produtos/');
  $('.breadcrumbs').find('[aria-current]').before(`<a href="/produtos/?linha=${product.category}">${categoryNames[product.category]}</a><span aria-hidden="true">/</span>`);
  $('.product-photo img').wrap('<button class="product-zoom" type="button" aria-label="Ampliar imagem do produto"></button>');
  $('.product-photo').append('<span class="zoom-hint">Clique na imagem para ampliar ⤢</span>');
  $('.product-information .eyebrow').after(`<p class="product-reference">REF. MR-${String(products.indexOf(product)+1).padStart(3,'0')}</p>`);
  $('.product-information h1').after('<span class="product-availability">Consulte configurações e disponibilidade</span>');
  $('.product-quote').before(`<div class="product-facts"><div><span>Linha</span><strong>${categoryNames[product.category]}</strong></div><div><span>Atendimento</span><strong>Orçamento pelo WhatsApp</strong></div><div><span>Entrega</span><strong>Território brasileiro</strong></div></div>`);
  $('.product-overview').after(`<section class="product-details-section"><div class="product-section-heading"><p class="eyebrow">CONHEÇA O PRODUTO</p><h2>Informações para sua escolha.</h2></div><div class="product-detail-columns"><article><h3>Sobre ${esc(product.title)}</h3><p>${esc(product.description)}</p></article><article><h3>Antes de solicitar</h3><p>Informe as dimensões necessárias, a quantidade, o local de instalação e o CEP. Consulte com nossa equipe as configurações e a compatibilidade com os equipamentos do projeto.</p><a href="/ajuda/">Preciso de ajuda para escolher →</a></article></div></section>`);
  $('body').append(`<dialog class="image-dialog" aria-label="Imagem ampliada de ${esc(product.title)}"><button class="image-dialog-close" type="button" aria-label="Fechar imagem">×</button><img src="${esc(product.image)}" alt="${esc(product.title)}" width="800" height="800"><p>${esc(product.title)}</p></dialog>`);
  fs.writeFileSync(filename,$.html());
}
console.log('Generated home, catalog, lines, company, guide and 31 detailed product pages.');
await import('./generate-seo.mjs');
