const menu = document.querySelector('#navigation');
import products from './catalog-images.js';
import { productPath, categoryNames } from './product-links.js';
import { initLandingMotion } from './landing-motion.js';
const toggle = document.querySelector('.menu-toggle');
function closeMenu() { menu.classList.remove('open'); document.body.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); }
toggle.addEventListener('click', () => { const open = menu.classList.toggle('open'); document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); });
window.matchMedia('(min-width: 1200px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.addEventListener('pointerdown', event => { if (menu.classList.contains('open') && !menu.contains(event.target) && !toggle.contains(event.target)) closeMenu(); });
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); toggle.focus(); } });
const cards = [...document.querySelectorAll('.product')];
let searchTerm = '';
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let category = 'all';
function filterProducts() {
  let visible = 0;
  cards.forEach(card => { card.hidden = !(category === 'all' || card.dataset.category === category) || !normalize(card.dataset.search).includes(normalize(searchTerm.trim())); if (!card.hidden) visible++; });
  document.querySelector('.result-count').textContent = `${visible} ${visible === 1 ? 'produto' : 'produtos'}`;
  document.querySelector('.empty').hidden = visible !== 0;
  const summary = document.querySelector('.search-summary');
  if (summary) {
    summary.hidden = !searchTerm.trim();
    summary.querySelector('span').textContent = `Busca por “${searchTerm.trim()}”`;
  }
  const catalogHeading = document.querySelector('.catalog-top h2');
  if (catalogHeading) catalogHeading.textContent = categoryNames[category] || 'Todos os produtos';
  animateCards();
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  const query = new URLSearchParams(window.location.search);
  if (category === 'all') query.delete('linha'); else query.set('linha', category);
  if (searchTerm.trim()) query.set('busca', searchTerm.trim()); else query.delete('busca');
  history.replaceState(null, '', `${location.pathname}${query.size ? '?' + query.toString() : ''}`);
  document.querySelectorAll('[data-filter]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  filterProducts();
}));
const headerSearch = document.querySelector('#header-search');
const headerSearchForm = document.querySelector('.header-search');
const suggestions = document.createElement('div');
suggestions.className = 'search-suggestions';
suggestions.id = 'search-suggestions';
suggestions.hidden = true;
suggestions.setAttribute('role', 'region');
suggestions.setAttribute('aria-label', 'Sugestões de produtos');
headerSearchForm.append(suggestions);
headerSearch.setAttribute('autocomplete', 'off');
headerSearch.setAttribute('aria-controls', suggestions.id);
headerSearch.setAttribute('aria-expanded', 'false');
function hideSuggestions() {
  suggestions.hidden = true;
  headerSearch.setAttribute('aria-expanded', 'false');
}
function showSuggestions() {
  const term = normalize(headerSearch.value.trim());
  const defaults = ['Rack Standard', 'Rack Server', 'Mini Rack', 'Rack de Parede', 'Bandeja Fixa'];
  const matches = (term ? products.filter(product => normalize(product.title).includes(term)) : defaults.map(title => products.find(product => product.title === title)).filter(Boolean)).slice(0, 5);
  suggestions.replaceChildren();
  const heading = document.createElement('p');
  heading.className = 'suggestions-heading';
  heading.textContent = term ? 'Produtos encontrados' : 'Sugestões para você';
  suggestions.append(heading);
  matches.forEach(product => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-suggestion';
    const image = document.createElement('img');
    image.src = product.image;
    image.srcset = product.imageSrcset;
    image.sizes = '40px';
    image.alt = '';
    const title = document.createElement('span');
    title.textContent = product.title;
    button.append(image, title);
    button.addEventListener('click', () => {
      window.location.assign(productPath(product, products));
    });
    suggestions.append(button);
  });
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'suggestions-empty';
    empty.textContent = 'Nenhum produto encontrado. Tente “rack” ou “bandeja”.';
    suggestions.append(empty);
  }
  suggestions.hidden = false;
  headerSearch.setAttribute('aria-expanded', 'true');
}
headerSearch.addEventListener('focus', showSuggestions);
headerSearch.addEventListener('input', showSuggestions);
headerSearchForm.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !suggestions.hidden) {
    event.stopPropagation();
    headerSearch.focus();
    hideSuggestions();
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (suggestions.hidden) showSuggestions();
    const options = [...suggestions.querySelectorAll('button')];
    if (!options.length) return;
    event.preventDefault();
    const index = options.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? (index + 1) % options.length : (index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length);
    options[next].focus();
  }
});
headerSearchForm.addEventListener('focusout', event => {
  if (!headerSearchForm.contains(event.relatedTarget)) hideSuggestions();
});
document.addEventListener('pointerdown', event => {
  if (!headerSearchForm.contains(event.target)) hideSuggestions();
});
headerSearchForm.addEventListener('submit', event => {
  event.preventDefault();
  hideSuggestions();
  searchTerm = headerSearch.value;
  if (!document.querySelector('#produtos')) {
    window.location.assign('/produtos/?busca=' + encodeURIComponent(searchTerm) + '#produtos');
    return;
  }
  document.querySelector('[data-filter="all"]').click();
  closeMenu();
  document.querySelector('#produtos').scrollIntoView({ block: 'start' });
  const resultsHeading = document.querySelector('#produtos h2');
  resultsHeading.setAttribute('tabindex', '-1');
  resultsHeading.focus({ preventScroll: true });
});
document.querySelectorAll('[data-product]').forEach(link => link.addEventListener('click', () => { document.querySelector('#interest').value = link.dataset.product; }));
document.querySelector('.contact form')?.addEventListener('submit', event => { event.preventDefault(); const notice = document.querySelector('#form-notice'); notice.textContent = 'Dados revisados. Esta demonstração ainda não envia solicitações; nenhuma mensagem foi enviada.'; notice.hidden = false; });
document.querySelectorAll('[data-line]').forEach(link => link.addEventListener('click', () => {
  searchTerm = '';
  headerSearch.value = '';
  document.querySelector(`[data-filter="${link.dataset.line}"]`)?.click();
}));

const showcaseButtons = [...document.querySelectorAll('[data-showcase]')];
showcaseButtons.forEach((button, index) => button.addEventListener('click', () => {
  const product = products[Number(button.dataset.showcase)];
  document.querySelector('#showcase-image').src = product.image;
  document.querySelector('#showcase-image').alt = product.title;
  document.querySelector('#showcase-title').textContent = product.title;
  document.querySelector('.showcase-counter').textContent = `${String(index + 1).padStart(2, '0')} / 03`;
  const details = document.querySelector('.showcase-caption [data-details]');
  details.dataset.details = button.dataset.showcase;
  details.href = productPath(product, products);
  details.setAttribute('aria-label', `Ver detalhes de ${product.title}`);
  showcaseButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  if (!reducedMotion.matches) {
    const image = document.querySelector('#showcase-image');
    image.getAnimations().forEach(animation => animation.cancel());
    image.animate([
      { opacity: .3, transform: 'translateX(16px) scale(.96)' },
      { opacity: 1, transform: 'translateX(0) scale(1)' }
    ], { duration: 450, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
}));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
initLandingMotion(products, productPath, categoryNames, reducedMotion);
function animateCards() {
  if (reducedMotion.matches) return;
  cards.filter(card => !card.hidden).slice(0, 12).forEach((card, index) => {
    card.getAnimations().forEach(animation => animation.cancel());
    card.animate([
      { opacity: .4, transform: 'translateY(14px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 350, delay: index * 25, easing: 'ease-out' });
  });
}

// Reveal once; no hidden content if JavaScript is unavailable.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealObserver.unobserve(entry.target);
      if (reducedMotion.matches) return;
      entry.target.animate([
        { opacity: .2, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.7,.3,1)' });
    });
  }, { threshold: .12 });
  document.querySelectorAll('.editorial-heading, .range-card, .featured-grid .product, .company-teaser > div, .project-cta, .line-feature, .company-values article, .checklist-grid article').forEach(element => revealObserver.observe(element));
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) document.getAnimations().forEach(animation => animation.cancel());
});

if (document.querySelector('#produtos')) {
  const initialParams = new URLSearchParams(window.location.search);
  searchTerm = initialParams.get('busca') || '';
  headerSearch.value = searchTerm;
  const initialCategory = initialParams.get('linha');
  const categoryButton = [...document.querySelectorAll('[data-filter]')].find(button => button.dataset.filter === initialCategory);
  if (categoryButton) categoryButton.click(); else filterProducts();
  document.querySelector('#clear-search')?.addEventListener('click', () => {
    searchTerm = '';
    headerSearch.value = '';
    document.querySelector(`[data-filter="${category}"]`).click();
  });
}

const guideCopy = {
  rack: 'Veja estruturas para organizar equipamentos de TI e telecomunicações.',
  energia: 'Explore gabinetes e caixas para os equipamentos da sua instalação.',
  acessorios: 'Encontre componentes para organização, montagem e distribuição no rack.',
  fibra: 'Conheça os produtos para distribuição e organização da infraestrutura óptica.',
};
document.querySelectorAll('[data-guide]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-guide]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const result = document.querySelector('#guide-result');
  result.querySelector('h3').textContent = categoryNames[button.dataset.guide];
  result.querySelector('p:not(.eyebrow)').textContent = guideCopy[button.dataset.guide];
  result.querySelector('a').href = `/produtos/?linha=${button.dataset.guide}`;
}));
const imageDialog = document.querySelector('.image-dialog');
if (imageDialog) {
  document.querySelector('.product-zoom').addEventListener('click', () => imageDialog.showModal());
  document.querySelector('.image-dialog-close').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', event => {
    if (event.target !== imageDialog) return;
    const bounds = imageDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageDialog.close();
  });
}
