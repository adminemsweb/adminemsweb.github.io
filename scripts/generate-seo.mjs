import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import config from '../src/site-config.json' with {type:'json'};
import products from '../src/products.json' with {type:'json'};
import images from '../src/optimized-images.json' with {type:'json'};
import {categoryNames,productPath} from '../src/product-links.js';

const origin=new URL(process.env.SITE_URL || config.url).origin;
if (!origin.startsWith('https://')) throw new Error('SITE_URL must use HTTPS');
const absolute=route=>new URL(route,origin).href;
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const description=text=>text.length<=165?text:text.slice(0,161).replace(/\s+\S*$/,'')+'…';
const mainPages=[
  {route:'/',title:'Metall Rack | Racks e Gabinetes para TI e Telecom',description:'Racks, gabinetes, acessórios e soluções para fibra. Conheça a Metall Rack em Sorocaba e solicite orçamento para seu projeto de TI, telecom e energia.',keywords:['racks para TI','racks telecom','gabinetes para equipamentos','Metall Rack']},
  {route:'/produtos/',title:'Produtos | Racks, Gabinetes e Acessórios | Metall Rack',description:'Explore 31 produtos Metall Rack: racks, gabinetes, bandejas, acessórios e fibra. Filtre por linha e solicite orçamento com atendimento em Sorocaba.',keywords:['catálogo de racks','gabinetes','acessórios para rack']},
  {route:'/linhas/',title:'Linhas de Racks, Energia, Acessórios e Fibra | Metall Rack',description:'Conheça as quatro linhas Metall Rack: racks e telecom, gabinetes e energia, acessórios e fibra. Encontre a estrutura para a sua instalação.',keywords:['linhas de racks','gabinetes de energia','acessórios e fibra']},
  {route:'/empresa/',title:'Metall Rack em Sorocaba | Conheça a Empresa',description:'Conheça a Metall Rack em Sorocaba, SP. Portfólio de racks, gabinetes e acessórios para TI, telecom e energia, com entregas em território brasileiro.',keywords:['Metall Rack Sorocaba','racks em Sorocaba','empresa de racks']},
  {route:'/ajuda/',title:'Como Escolher Racks e Gabinetes | Guia Metall Rack',description:'Precisa escolher um rack ou gabinete? Explore nosso guia por aplicação e saiba quais informações enviar para consultar o modelo e solicitar orçamento.',keywords:['como escolher rack','qual rack comprar','escolher gabinete']},
];
const pages=[...mainPages,...products.map(product=>({route:productPath(product,products),title:`${product.title} | ${categoryNames[product.category]} | Metall Rack`,description:description(`${product.title} na linha ${categoryNames[product.category]} da Metall Rack. ${product.description} Consulte configurações e orçamento.`),keywords:[product.title,categoryNames[product.category],`${product.title} orçamento`],product}))];

const logo=fs.readFileSync('public/assets/metal-rack-signature.svg','utf8');
const share=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#eef3f6"/><rect x="0" y="590" width="1200" height="40" fill="#20394d"/>${logo.replace('<svg ','<svg x="75" y="45" width="340" height="105" ')}<text x="75" y="295" font-family="Arial,sans-serif" font-size="66" font-weight="700" fill="#192c3d">Sua tecnologia.</text><text x="75" y="380" font-family="Arial,sans-serif" font-size="66" font-weight="700" fill="#396f9f">Bem estruturada.</text><text x="78" y="470" font-family="Arial,sans-serif" font-size="28" fill="#5c7283">Racks · Gabinetes · Acessórios · Fibra</text></svg>`;
await sharp(Buffer.from(share)).png().toFile('public/assets/metal-rack-social.png');
const organization={'@type':'Organization','@id':absolute('/#organization'),name:config.name,legalName:config.legalName,taxID:config.taxID,url:origin,logo:{'@type':'ImageObject',url:absolute('/assets/metal-rack-signature.svg')},telephone:config.phone,email:config.email,address:{'@type':'PostalAddress',streetAddress:config.streetAddress,addressLocality:config.city,addressRegion:config.region,postalCode:config.postalCode,addressCountry:config.country},areaServed:{'@type':'Country',name:'Brasil'}};
const website={'@type':'WebSite','@id':absolute('/#website'),url:origin,name:config.name,inLanguage:'pt-BR',publisher:{'@id':organization['@id']}};
for(const page of pages) {
  const file=path.join(process.cwd(),page.route,'index.html');
  const $=cheerio.load(fs.readFileSync(file,'utf8'));
  $('[data-seo], link[rel="canonical"], meta[name="description"], meta[name="keywords"], meta[name="robots"], meta[name="google-site-verification"], meta[property^="og:"], meta[name^="twitter:"]').remove();
  $('html').attr('lang','pt-BR');
  $('title').text(page.title);
  const add=(name,value,property=false)=>$('head').append(`<meta data-seo="true" ${property?'property':'name'}="${name}" content="${esc(value)}">`);
  add('description',page.description);
  add('robots','index, follow, max-image-preview:large');
  add('theme-color','#20394d');
  const verification=process.env.GOOGLE_SITE_VERIFICATION || config.googleSiteVerification;
  if(verification) add('google-site-verification',verification);
  $('head').append(`<link data-seo="true" rel="canonical" href="${absolute(page.route)}"><link data-seo="true" rel="describedby" type="text/plain" href="/llms.txt"><link data-seo="true" rel="alternate" type="text/markdown" href="${page.route}index.md">`);
  const socialImage=page.product ? images[page.product.image].src : '/assets/metal-rack-social.png';
  for(const [key,value] of Object.entries({title:page.title,description:page.description,url:absolute(page.route),type:'website',site_name:config.name,locale:'pt_BR',image:absolute(socialImage),'image:alt':page.product?.title || 'Metall Rack: racks, gabinetes, acessórios e fibra'})) add(`og:${key}`,value,true);
  add('twitter:card','summary_large_image'); add('twitter:title',page.title); add('twitter:description',page.description); add('twitter:image',absolute(socialImage));
  const crumbs=[{name:'Início',item:absolute('/')}];
  if(page.product) crumbs.push({name:'Produtos',item:absolute('/produtos/')});
  if(page.route!=='/') crumbs.push({name:page.product?.title || $('h1').text().replace(/\s+/g,' ').trim(),item:absolute(page.route)});
  const breadcrumb={'@type':'BreadcrumbList','@id':absolute(page.route+'#breadcrumb'),itemListElement:crumbs.map((item,index)=>({'@type':'ListItem',position:index+1,...item}))};
  const graph=[organization,website,{'@type':page.route==='/empresa/'?'AboutPage':page.route==='/produtos/'?'CollectionPage':'WebPage','@id':absolute(page.route+'#webpage'),url:absolute(page.route),name:page.title,description:page.description,inLanguage:'pt-BR',isPartOf:{'@id':website['@id']},breadcrumb:{'@id':breadcrumb['@id']}},breadcrumb];
  if(page.product) graph.push({'@type':'Product','@id':absolute(page.route+'#product'),name:page.product.title,description:page.product.description,image:[absolute(socialImage)],category:categoryNames[page.product.category],brand:{'@type':'Brand',name:config.name},url:absolute(page.route)});
  $('head').append(`<script data-seo="true" type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`);
  $('link[href="/assets/rubik-0a82a7167b.css"],link[href="/assets/fonts-pt.css"]').remove();
  $('head').prepend('<link rel="stylesheet" href="/assets/fonts-pt.css">');
  $('head').append('<link data-seo="true" rel="preload" href="/assets/rubik-ijwkbxyifdniv7nbrxw-db939b4901.woff2" as="font" type="font/woff2" crossorigin>');
  $('img').each((_,element)=>{
    const img=$(element); const mapped=images[img.attr('src')];
    img.attr('decoding','async');
    if(!mapped) return;
    img.attr('src',mapped.src).attr('srcset',mapped.srcset);
    const big=img.is('.stage-product-image') || img.closest('.product-photo').length;
    img.attr('sizes',big?'(max-width: 700px) 85vw, (max-width: 900px) 600px, 500px':img.closest('.stage-selector').length?'44px':'(max-width: 379px) 90vw, (max-width: 700px) 45vw, 320px');
    if(big) img.attr('fetchpriority','high').removeAttr('loading');
  });
  const hero=$('.stage-product-image, .product-photo img').first();
  if(hero.length) $('head').append(`<link data-seo="true" rel="preload" as="image" href="${hero.attr('src')}" imagesrcset="${hero.attr('srcset')}" imagesizes="${hero.attr('sizes')}">`);
  const markdown=[`# ${page.product?.title || page.title}`,`> ${page.description}`,`Página: ${absolute(page.route)}`];
  $('main').find('h2,h3,p,li').each((_,element)=>{const text=$(element).text().replace(/\s+/g,' ').trim();if(text)markdown.push((element.tagName==='h2'?'## ':element.tagName==='h3'?'### ':'')+text);});
  markdown.push(`Contato comercial: ${config.phone}. E-mail: ${config.email}.`, 'Preços, configurações, disponibilidade e entrega devem ser consultados no atendimento.');
  const mdFile=path.join('public',page.route,'index.md'); fs.mkdirSync(path.dirname(mdFile),{recursive:true});fs.writeFileSync(mdFile,markdown.join('\n\n')+'\n');
  fs.writeFileSync(file,$.html());
}
fs.writeFileSync('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page=>`  <url><loc>${esc(absolute(page.route))}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync('public/robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`);
fs.writeFileSync('public/llms.txt',`# Metall Rack\n\n> Catálogo de racks, gabinetes, acessórios e fibra para TI, telecomunicações e energia. Atendimento em Sorocaba, SP, e entregas em território brasileiro.\n\n${config.legalName}, CNPJ ${config.taxID}. Contato comercial: ${config.phone}; ${config.email}. As configurações, os preços e os prazos são consultados no atendimento. Não há pagamento online no site.\n\n## Páginas principais\n${mainPages.map(page=>`- [${page.title}](${absolute(page.route+'index.md')}): ${page.description}`).join('\n')}\n\n## Produtos\n${pages.filter(page=>page.product).map(page=>`- [${page.product.title} — ${categoryNames[page.product.category]}](${absolute(page.route+'index.md')})`).join('\n')}\n`);
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/seo-keywords.json',JSON.stringify(pages.map(({route,title,description,keywords})=>({url:absolute(route),title,description,keywords})),null,2)+'\n');
console.log(`SEO generated for ${pages.length} pages. Domain: ${origin}${config.domainConfirmed?'':' (pending owner confirmation)'}.`);
