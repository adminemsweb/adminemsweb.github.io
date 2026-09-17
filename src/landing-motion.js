export function initLandingMotion(products, productPath, categoryNames, reducedMotion) {
  const stage = document.querySelector('.studio-stage');
  if (!stage) return;
  const hero = document.querySelector('.studio-hero');
  const buttons = [...stage.querySelectorAll('[data-stage-product]')];
  const image = stage.querySelector('.stage-product-image');
  const progress = stage.querySelector('.stage-progress span');
  const pause = stage.querySelector('.stage-pause');
  pause.hidden = false;
  const caption = stage.querySelector('.stage-caption');
  let current = 0;
  let timer;
  let progressAnimation;
  let userPaused = false;
  let hovered = false;
  let visible = !('IntersectionObserver' in window);
  let pointerStart;
  let suppressClickUntil = 0;
  const duration = 6500;

  function schedule() {
    clearTimeout(timer);
    progressAnimation?.cancel();
    const stopped = userPaused || reducedMotion.matches || hovered || !visible || document.hidden || stage.contains(document.activeElement);
    hero.classList.toggle('motion-paused', Boolean(stopped));
    pause.disabled = reducedMotion.matches;
    pause.textContent = reducedMotion.matches ? 'Movimento reduzido' : userPaused ? '▶ Reproduzir' : 'Ⅱ Pausar';
    pause.setAttribute('aria-label', userPaused ? 'Reproduzir animações da vitrine' : 'Pausar animações da vitrine');
    pause.setAttribute('aria-pressed', String(userPaused));
    if (stopped) return;
    progressAnimation = progress.animate([{transform:'scaleX(0)'}, {transform:'scaleX(1)'}], {duration, fill:'forwards'});
    timer = setTimeout(() => show(current + 1), duration);
  }
  function show(index) {
    current = (index + buttons.length) % buttons.length;
    const product = products[Number(buttons[current].dataset.stageProduct)];
    image.src = product.image;
    image.srcset = product.imageSrcset;
    image.sizes = '(max-width: 700px) 85vw, (max-width: 900px) 600px, 500px';
    image.alt = product.title;
    stage.querySelector('.stage-product-title').textContent = product.title;
    stage.querySelector('.stage-category').textContent = categoryNames[product.category].toUpperCase();
    stage.querySelector('.stage-count').textContent = `${String(current + 1).padStart(2,'0')} / ${String(buttons.length).padStart(2,'0')}`;
    stage.querySelectorAll('.stage-product-link, .stage-details').forEach(link => {
      link.href = productPath(product, products);
      link.setAttribute('aria-label', `Conhecer ${product.title}`);
    });
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === current)));
    if (!reducedMotion.matches) {
      image.getAnimations().forEach(animation => animation.cancel());
      caption.getAnimations().forEach(animation => animation.cancel());
      image.animate([{opacity:0, transform:'translateY(16px) scale(.96)'}, {opacity:1, transform:'translateY(0) scale(1)'}], {duration:550, easing:'cubic-bezier(.22,1,.36,1)'});
      caption.animate([{opacity:.3, transform:'translateY(7px)'}, {opacity:1, transform:'translateY(0)'}], {duration:400, easing:'ease-out'});
    }
    schedule();
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
  stage.querySelector('.stage-selector').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1);
    show(next);
    buttons[current].focus();
  });
  pause.addEventListener('click', () => { userPaused = !userPaused; schedule(); });
  stage.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  stage.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  stage.addEventListener('focusin', schedule);
  stage.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  window.addEventListener('pagehide', () => { clearTimeout(timer); progressAnimation?.cancel(); });
  window.addEventListener('pageshow', schedule);
  const surface = stage.querySelector('.stage-surface');
  surface.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') pointerStart = {x:event.clientX, y:event.clientY}; });
  surface.addEventListener('pointercancel', () => { pointerStart = undefined; });
  surface.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = undefined;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    suppressClickUntil = Date.now() + 500;
    userPaused = true;
    show(current + (dx < 0 ? 1 : -1));
  });
  surface.addEventListener('click', event => { if (Date.now() < suppressClickUntil) { event.preventDefault(); suppressClickUntil = 0; } }, true);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, {threshold:.25});
    observer.observe(stage);
  }
  schedule();
}
