import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { productPath } from './src/product-links.js';
const products = JSON.parse(fs.readFileSync(new URL('./src/products.json', import.meta.url), 'utf8'));
export default defineConfig({
  build: {
    rollupOptions: {
      input: [path.resolve('index.html'), ...['produtos', 'linhas', 'empresa', 'ajuda'].map(route => path.resolve(route, 'index.html')), ...products.map(product => path.join(process.cwd(), productPath(product, products), 'index.html'))],
    },
  },
});
