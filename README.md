# Metall Rack — frontend local

Site estático Metall Rack com 36 páginas. Referências de organização: Rack Solutions (https://racksolutions.com.br/), D2W (https://d2w.ind.br/) e RackFort (https://www.rackfort.com.br/). HTML, imagens, fontes e estilos locais; não precisa de WordPress.

## Executar

```sh
npm install
npm run dev
```

## Produção

Site: https://metallrack.com.br/ (VPS 89.116.74.235).

Pushes to main trigger validation and deployment over SSH. Pull requests only validate. Secrets: VPS_SSH_KEY and VPS_KNOWN_HOSTS. The dedicated SSH key only permits /opt/metallrack/deploy.sh.

Docker builds and tests the 36 pages. The metallrack_web service uses traefik_public and the existing le certificate resolver. DNS A stays at 89.116.74.235. Source: /opt/metallrack/repo. Images are tagged by commit. Rollback: docker service rollback metallrack_web.

The root-owned entry point /opt/metallrack/deploy.sh must be updated explicitly when changing deploy/deploy.sh. Private keys must never be committed.

```sh
npm run build
npm run preview
```

O diretório `dist/` pode ser servido por qualquer hospedagem estática.

## Estrutura

- `produtos/<slug>/index.html`: página individual de cada item do catálogo, com imagem, descrição, produtos relacionados e orçamento por WhatsApp.
- `scripts/generate-site.mjs`: gera Início, Nossas linhas, Produtos, A empresa, Ajuda para escolher e as 31 páginas de produto. Executado antes de `npm run dev` e `npm run build`. Edite os layouts e textos neste gerador, pois os HTMLs são regenerados.
- `scripts/generate-product-pages.mjs`: template base das páginas individuais; chamado pelo gerador do site.
- `src/site-pages.css`: estilos das páginas institucionais, catálogo, guia e melhorias das páginas de produto.
- `scripts/landing-content.mjs` e `src/landing-refresh.css`: abertura da página inicial com vitrine selecionável e refinamentos visuais.
- `src/landing-motion.js`: vitrine com troca automática a cada 6,5 segundos, pausa manual, pausa por foco/hover/visibilidade, seleção por teclado e gestos de toque. Respeita movimento reduzido.
- `src/responsive-motion.css`: ajustes finais para celular, tablet e desktop, menu recolhível abaixo de 1200 px, cartões em uma coluna abaixo de 380 px e animações opcionais.
- `public/assets/metal-rack-signature.svg` e `metal-rack-signature-light.svg`: logo vetorial em contornos, sem dependência de fontes instaladas.
- `src/product-page.css`: layout responsivo das páginas de produto.
- `vite.config.js`: inclui a página inicial e todas as páginas de produto na compilação estática.
- `node scripts/check-product-pages.mjs`: após compilar e com o servidor local ativo na porta 5174, verifica as 36 rotas, imagens, conteúdo, navegação e links internos.

- `index.html`: página inicial; também fornece o cabeçalho e o rodapé compartilhados para a geração.
- `src/main.js`: busca com sugestões, filtros do catálogo, menu mobile, guia de escolha e ampliação de imagens.
- `src/local.css`: ajustes locais de interação e acessibilidade.
- `public/assets/`: imagens, fontes, estilos e biblioteca Swiper locais.
- `asset-manifest.json`: origem de cada arquivo copiado.
- `original.html`: HTML de referência obtido do site público.
- `scripts/copy-site.mjs`: importação dos recursos da referência. Reexecutar substitui `index.html`.

## SEO e performance

- `src/site-config.json`: domínio canônico (ainda a confirmar), dados comerciais e token opcional do Search Console. Também aceita as variáveis `SITE_URL` e `GOOGLE_SITE_VERIFICATION` durante a geração.
- `scripts/generate-seo.mjs`: metadados, JSON-LD, sitemap.xml, robots.txt, llms.txt, versões Markdown e imagem social. Executado na geração do site.
- `scripts/optimize-images.mjs`: cria WebP responsivo, catálogo otimizado para o navegador e folha de fontes Latin. `src/products.json` conserva as imagens originais.
- `npm run check:seo`: valida os metadados e arquivos da produção após compilar.
- `npm run audit:performance`: audita o tamanho dos arquivos de produção; resultados em `reports/performance.md`. Não substitui Lighthouse ou Web Vitals.
- `reports/google-activation.md`: preparação e pendências para verificar o Search Console e publicar o Perfil da Empresa no Google. Nenhuma conta externa foi criada ou verificada nesta sessão.

## Atendimento e interações

Os cartões e as sugestões da busca levam às páginas individuais dos produtos. Os botões de orçamento abrem o WhatsApp comercial com o nome e a linha do item, sem enviar a mensagem automaticamente. A busca retorna ao catálogo com o termo aplicado. O catálogo aceita `?linha=energia` e `?busca=rack`, incluindo combinações, e oferece limpeza da busca. O guia indica uma linha para explorar; configuração, disponibilidade e compatibilidade são consultadas no atendimento.

A compilação e a integridade dos arquivos locais foram verificadas. A comparação visual em navegador não foi realizada porque não havia navegador conectado disponível.
