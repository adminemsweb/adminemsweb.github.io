import fs from 'node:fs';
import * as cheerio from 'cheerio';
const $ = cheerio.load(fs.readFileSync('index.html', 'utf8'));
const products = JSON.parse(fs.readFileSync('src/products.json', 'utf8'));
const esc = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const lines = [
  {id:'rack',name:'Racks e Telecom',text:'Estrutura para servidores e redes.',product:'Rack Server'},
  {id:'energia',name:'Gabinetes e Energia',text:'Proteção e organização da infraestrutura.',product:'Gabinete com Visor'},
  {id:'acessorios',name:'Acessórios',text:'Cada detalhe do seu rack, no lugar.',product:'Bandeja Fixa'},
  {id:'fibra',name:'Linha Fibra',text:'Organização para suas conexões ópticas.',product:'Distribuidor Interno Óptico'}
];
const selected = ['Rack Server','Mini Rack','Rack Outdoor'].map(name => products.find(p=>p.title===name));
$('head').append('<link rel="stylesheet" href="/src/catalog-design.css">');
$('.topline .container').html('<span>Racks, gabinetes e acessórios para TI e Telecom</span><a href="#contato">Conte com a Metal Rack <span aria-hidden="true">↗</span></a>');
$('#navigation').html('<a href="#linhas">Nossas linhas</a><a href="#produtos">Produtos</a><a href="#sobre">A empresa</a><a href="#guia">Ajuda para escolher</a><a class="button small" href="#contato">Solicitar orçamento <span aria-hidden="true">↗</span></a>');
$('.hero-copy').html(`<p class="eyebrow"><span></span> METAL RACK</p><h1>Seu projeto conectado.<br><em>Sua estrutura<br>bem resolvida.</em></h1><p class="intro">Racks e gabinetes para TI, Telecom e energia. Encontre a solução para proteger seus equipamentos e organizar a sua infraestrutura.</p><div class="hero-actions"><a class="button" href="#produtos">Conheça os produtos <span aria-hidden="true">↗</span></a><a class="text-link" href="#contato">Converse sobre seu projeto <span aria-hidden="true">→</span></a></div><div class="hero-points"><span>Racks padrão 19”</span><span>Gabinetes e caixas</span><span>Acessórios e fibra</span></div>`);
$('.hero-visual').html(`<div class="showcase-top"><span>Conheça nossa linha</span><span class="showcase-counter">01 / 03</span></div><img id="showcase-image" src="${selected[0].image}" alt="${selected[0].title}" fetchpriority="high"><div class="showcase-caption"><div><small>ESTRUTURA PARA SUA OPERAÇÃO</small><h2 id="showcase-title">${selected[0].title}</h2></div><button type="button" class="circle-link" data-details="${products.indexOf(selected[0])}" aria-label="Ver detalhes de Rack Server">↗</button></div><div class="showcase-tabs" role="group" aria-label="Produtos em destaque">${selected.map((p,i)=>`<button type="button" data-showcase="${products.indexOf(p)}" aria-pressed="${i===0}">${p.title}</button>`).join('')}</div>`);
$('.applications').replaceWith(`<section class="lines container" id="linhas"><div class="lines-heading"><div><p class="eyebrow">UM PORTFÓLIO, DIFERENTES POSSIBILIDADES</p><h2>O que seu projeto precisa?</h2></div><a class="text-link" href="#produtos">Explorar catálogo <span aria-hidden="true">↗</span></a></div><div class="line-grid">${lines.map(l=>{const p=products.find(p=>p.title===l.product);return `<a class="line-card" href="#produtos" data-line="${l.id}"><div class="line-image"><img src="${p.image}" alt="" loading="lazy" width="250" height="210"></div><h3>${l.name}<span aria-hidden="true">↗</span></h3><p>${l.text}</p></a>`}).join('')}</div></section>`);
$('.section-heading .eyebrow').text('CATÁLOGO METAL RACK');
$('.section-heading h2').text('Encontre a estrutura certa.');
$('.section-heading>p').html('Explore os modelos, conheça os detalhes<br>e selecione o produto para seu orçamento.');
$('.product').each((i,el)=>{
 const card=$(el);card.find('.product-body a').html('Solicitar orçamento <span aria-hidden="true">↗</span>');
 card.find('.product-body a').before(`<button class="details-button" type="button" data-details="${i}">Conhecer produto <span aria-hidden="true">+</span></button>`);
 card.find('.product-number').remove();
});
$('#produtos').before(`<section class="solution-guide container" id="guia"><div><p class="eyebrow">COMECE PELA SUA NECESSIDADE</p><h2>Qual é a sua aplicação?</h2><p>Escolha uma área para explorar a linha correspondente.</p></div><div class="guide-options"><a href="#produtos" data-line="rack"><span>01</span><strong>Servidores e redes</strong><span aria-hidden="true">↗</span></a><a href="#produtos" data-line="energia"><span>02</span><strong>Energia e gabinetes</strong><span aria-hidden="true">↗</span></a><a href="#produtos" data-line="acessorios"><span>03</span><strong>Organização do rack</strong><span aria-hidden="true">↗</span></a><a href="#produtos" data-line="fibra"><span>04</span><strong>Conexões ópticas</strong><span aria-hidden="true">↗</span></a></div></section>`);
$('.about-mark').remove();
$('.about .eyebrow').text('SOBRE A METAL RACK');
$('.about h2').html('A infraestrutura por trás<br>de cada conexão.');
$('.contact .eyebrow').text('VAMOS FALAR DO SEU PROJETO');
$('.contact h2').html('Sua próxima solução<br><em>começa aqui.</em>');
$('.contact>div>p:not(.eyebrow)').text('Já encontrou o produto ou precisa de ajuda para escolher? Conte a aplicação e os detalhes do seu projeto.');
$('.contact>div').append('<a class="text-link" href="#produtos">Voltar ao catálogo <span aria-hidden="true">↗</span></a>');
const brand=$('footer .brand').prop('outerHTML');
$('footer').html(`<div class="container footer-grid"><div>${brand}<p>Estruturas para tecnologia,<br>telecomunicações e energia.</p></div><div><h3>Nossas linhas</h3>${lines.map(l=>`<a href="#produtos" data-line="${l.id}">${l.name}</a>`).join('')}</div><div><h3>Metal Rack</h3><a href="#sobre">A empresa</a><a href="#guia">Ajuda para escolher</a><a href="#contato">Solicitar orçamento</a></div><div><h3>Vamos conversar?</h3><p>Conte qual é o seu desafio.<br>Vamos encontrar a estrutura certa.</p><a class="footer-contact" href="#contato">Fale sobre seu projeto ↗</a></div></div><div class="container footer-bottom"><span>© 2026 Metal Rack</span><a href="#inicio">Voltar ao topo ↑</a></div>`);
$('body').append('<dialog id="product-dialog" aria-labelledby="detail-title"><button class="dialog-close" type="button" aria-label="Fechar detalhes">×</button><div class="dialog-grid"><div class="dialog-image"><img id="detail-image" alt=""></div><div class="dialog-copy"><p class="eyebrow" id="detail-category"></p><h2 id="detail-title"></h2><p id="detail-description"></p><p class="detail-help">Informe no orçamento as dimensões, a quantidade e os requisitos do seu projeto.</p><a class="button" id="detail-quote" href="#contato">Solicitar orçamento <span aria-hidden="true">↗</span></a></div></div></dialog>');
$('title').text('Metal Rack | Racks e Gabinetes para TI e Telecom');
fs.writeFileSync('index.html',$.html());
console.log('Updated presentation, product lines, guide and product details.');
