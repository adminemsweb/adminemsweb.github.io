import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import * as cheerio from 'cheerio';

const label = process.argv[2] || 'after';
const routes = ['/', '/produtos/', '/empresa/', '/produtos/mini-rack/'];
const report = {measuredAt:new Date().toISOString(), scope:'Static production asset audit. Image totals include all referenced images, including lazy images; not a browser transfer trace or a Lighthouse score.', pages:[]};
for (const route of routes) {
  const html = fs.readFileSync(path.join('dist', route, 'index.html'));
  const $ = cheerio.load(html.toString());
  const resources = [...new Set($('script[src], link[rel="stylesheet"], img[src]').map((_,node)=>$(node).attr('src') || $(node).attr('href')).get())].filter(url=>url.startsWith('/'));
  const assets = resources.map(url=>{const bytes=fs.readFileSync(path.join('dist',url.split('?')[0]));return {url,bytes:bytes.length,gzipBytes:/\.(css|js)$/.test(url)?gzipSync(bytes).length:null};});
  report.pages.push({route,htmlBytes:html.length,htmlGzipBytes:gzipSync(html).length,referencedImageBytes:assets.filter(a=>/\.(png|jpe?g|webp|svg)$/.test(a.url)).reduce((sum,a)=>sum+a.bytes,0),javascriptBytes:assets.filter(a=>a.url.endsWith('.js')).reduce((sum,a)=>sum+a.bytes,0),cssBytes:assets.filter(a=>a.url.endsWith('.css')).reduce((sum,a)=>sum+a.bytes,0),assets});
}
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync(`reports/performance-${label}.json`,JSON.stringify(report,null,2)+'\n');
if(label==='after' && fs.existsSync('reports/performance-before.json')) {
  const before=JSON.parse(fs.readFileSync('reports/performance-before.json','utf8'));
  const rows=report.pages.map(page=>{const previous=before.pages.find(item=>item.route===page.route);return `| ${page.route} | ${(previous.referencedImageBytes/1000).toFixed(1)} KB | ${(page.referencedImageBytes/1000).toFixed(1)} KB | ${(100-page.referencedImageBytes/previous.referencedImageBytes*100).toFixed(1)}% |`;});
  fs.writeFileSync('reports/performance.md',`# Performance — Metall Rack\n\nMedição: ${report.measuredAt}\n\nAuditoria local dos arquivos da compilação de produção, antes e depois da otimização. Os valores abaixo somam os arquivos de imagem únicos referenciados por src no HTML, incluindo imagens lazy. Não representam o download inicial medido em navegador; srcset pode escolher versões ainda menores. KB decimal = 1.000 bytes.\n\n| Página | Imagens antes | Imagens depois | Redução |\n| --- | ---: | ---: | ---: |\n${rows.join('\n')}\n\n## Implementado\n\n- 31 imagens convertidas para WebP e variantes responsivas até 960 px, sem ampliar os arquivos originais.\n- srcset e sizes para o navegador escolher a resolução apropriada.\n- Prioridade alta e preload da imagem principal; carregamento lazy mantido nos cartões fora da abertura.\n- A vitrine e as sugestões dinâmicas também usam as imagens otimizadas.\n- Folha de fontes limitada às variantes normais Latin e Latin Extended utilizadas pelo conteúdo em português.\n- JavaScript e CSS minificados pelo Vite. O JavaScript ganhou metadados de imagens responsivas; os JSONs registram os tamanhos completos, inclusive esse aumento.\n\n## Limites do teste\n\nLighthouse, LCP, CLS, INP, TBT, velocidade em rede móvel e configuração real de CDN/cache não foram medidos. Não há navegador de auditoria conectado nem domínio publicado confirmado nesta sessão. Não foi atribuída uma pontuação fictícia.\n\nDepois de publicar, executar https://pagespeed.web.dev/ em modo móvel e desktop na home, catálogo e Mini Rack. Verificar também compressão Brotli/gzip, cabeçalhos de cache, HTTPS, redirecionamentos de domínio e resposta 404 para páginas inexistentes.\n\nReproduzir esta auditoria de arquivos: npm run build e npm run audit:performance.\n`);
}
console.log(JSON.stringify(report.pages.map(({assets,...summary})=>summary),null,2));
