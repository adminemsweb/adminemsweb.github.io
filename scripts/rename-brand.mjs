import fs from 'node:fs';
const files = ['index.html', 'README.md', 'package.json', ...fs.readdirSync('scripts').filter(f => f.endsWith('.mjs') && f !== 'rename-brand.mjs').map(f => `scripts/${f}`)];
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replaceAll('Rack Metal Life', 'Metall Rack')
    .replaceAll('RACK METAL LIFE', 'METALL RACK')
    .replaceAll('RACK<small>METAL LIFE</small>', 'METAL<small>RACK</small>')
    .replaceAll('/assets/rack-metal-life-navy.png', '/assets/metal-rack-logo.png')
    .replaceAll('RML', 'MR');
  fs.writeFileSync(file, text);
}
