import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const products = JSON.parse(fs.readFileSync('src/products.json','utf8'));
const mapping = {};
fs.mkdirSync('public/assets/optimized',{recursive:true});
for (const source of new Set(products.map(product=>product.image))) {
  const input=fs.readFileSync(path.join('public',source));
  const info=await sharp(input).metadata();
  const hash=createHash('sha256').update(input).update('webp-quality-82-v1').digest('hex').slice(0,12);
  const widths=[...new Set([320,640,960].map(width=>Math.min(width,info.width)))];
  const variants=[];
  for (const width of widths) {
    const url=`/assets/optimized/${hash}-${width}.webp`;
    const file=path.join('public',url);
    if (!fs.existsSync(file)) await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(file);
    const metadata=await sharp(file).metadata();
    variants.push({url,width:metadata.width,height:metadata.height,bytes:fs.statSync(file).size});
  }
  const main=variants.at(-1);
  mapping[source]={src:main.url,width:main.width,height:main.height,srcset:variants.map(item=>`${item.url} ${item.width}w`).join(', '),originalBytes:input.length,bytes:main.bytes};
}
fs.writeFileSync('src/optimized-images.json',JSON.stringify(mapping,null,2)+'\n');
fs.writeFileSync('src/catalog.generated.json',JSON.stringify(products.map(({image,...product})=>({...product,image:mapping[image].src,imageSrcset:mapping[image].srcset})),null,2)+'\n');
const oldCSS=fs.readFileSync('public/assets/rubik-0a82a7167b.css','utf8');
const blocks=[...oldCSS.matchAll(/\/\* (latin(?:-ext)?) \*\/\s*(@font-face\s*\{[^}]+\})/g)].filter(match=>match[2].includes('font-style: normal'));
if (!blocks.length) throw new Error('Portuguese font subsets not found');
fs.writeFileSync('public/assets/fonts-pt.css',blocks.map(match=>`/* ${match[1]} */\n${match[2]}`).join('\n'));
console.log(`Optimized ${Object.keys(mapping).length} product images and retained Latin font subsets.`);
