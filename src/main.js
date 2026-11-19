import Lenis from 'lenis';
import { PRODUCTS } from './products.js';
import { hasWebGL, prefersReducedMotion, CM_PER_UNIT, TINTS } from './glass.js';
import { createCart, money } from './cart.js';

const $ = (s) => document.querySelector(s);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!prefersReducedMotion()) {
  lenis = new Lenis({ lerp: 0.1 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: a.getAttribute('href') === '#top' ? 0 : -72 });
    });
  });
}

/* ---------- nav colour over hero ---------- */
const nav = $('#nav');
const hero = document.querySelector('.hero');
new IntersectionObserver(([e]) => nav.classList.toggle('nav-solid', !e.isIntersecting), {
  rootMargin: '-64px 0px 0px 0px',
}).observe(hero);

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- cart ---------- */
const cart = createCart({
  count: $('#cartCount'),
  list: $('#cartList'),
  empty: $('#cartEmpty'),
  footer: $('#cartFoot'),
  subtotal: $('#subtotal'),
  shipBar: $('#shipBar'),
  shipText: $('#shipText'),
});

const drawer = $('#cart');
const scrim = $('#scrim');
let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  drawer.removeAttribute('inert');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('open');
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('show'));
  lenis?.stop();
  document.body.style.overflow = 'hidden';
  $('#cartClose').focus();
}
function closeCart() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.setAttribute('inert', '');
  scrim.classList.remove('show');
  setTimeout(() => { scrim.hidden = true; }, 300);
  lenis?.start();
  document.body.style.overflow = '';
  lastFocus?.focus();
}
$('#cartOpen').onclick = openCart;
$('#cartClose').onclick = closeCart;
scrim.onclick = closeCart;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });
$('#checkout').onclick = () => {
  $('#checkoutNote').textContent = 'Checkout is switched off: this is a portfolio concept and no orders are placed.';
};

function bumpCart() {
  const b = $('#cartOpen');
  b.classList.remove('bump');
  void b.offsetWidth;
  b.classList.add('bump');
}

/* ---------- product grid ---------- */
const images = {};
const grid = $('#grid');
for (const p of PRODUCTS) {
  const li = document.createElement('li');
  li.className = `card card-${p.span}`;
  li.style.setProperty('--bg', p.bg);
  const low = p.stock <= 3;
  li.innerHTML = `
    <div class="card-media">
      <img alt="${p.name}, hand-blown ${TINTS[p.tint].name.toLowerCase()} glass" data-id="${p.id}" width="720" height="900" decoding="async">
      ${low ? `<span class="stock">Only ${p.stock} left</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-title">
        <h3>${p.name}</h3>
        <p class="price">${money(p.price)}</p>
      </div>
      <p class="card-note">${p.note}</p>
      <p class="card-meta">${p.size}. ${p.maker}.</p>
      <button type="button" class="btn btn-ink" data-add="${p.id}">Add to cart</button>
    </div>`;
  grid.appendChild(li);
}
grid.addEventListener('click', (e) => {
  const id = e.target.closest('[data-add]')?.dataset.add;
  if (!id) return;
  const p = PRODUCTS.find((x) => x.id === id);
  cart.add({ id: p.id, name: p.name, price: p.price, meta: `${TINTS[p.tint].name}, ${p.size.split(',')[0]}`, img: images[p.id], bg: p.bg });
  bumpCart();
  toast(`Added ${p.name} to your cart`);
});

/* ---------- newsletter ---------- */
$('#newsletter').addEventListener('submit', (e) => {
  e.preventDefault();
  $('#newsletterNote').textContent = 'Thanks. This is a demo, so no email was saved.';
  e.target.reset();
});

/* ---------- WebGL parts ---------- */
if (!hasWebGL()) {
  document.documentElement.classList.add('no-webgl');
  $('#make').hidden = true;
} else {
  const { initHero } = await import('./hero.js');
  const heroApi = initHero($('#heroCanvas'));
  heroApi.onShapeChange((p) => { $('#heroPiece').textContent = p.name; });

  // product renders: after the hero has drawn its first frames
  const { renderThumbs, renderSingle } = await import('./thumbs.js');
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  idle(async () => {
    await document.fonts?.ready;
    const urls = await renderThumbs(PRODUCTS);
    Object.assign(images, urls);
    cart.fillImages(urls);
    document.querySelectorAll('.card-media img').forEach((img) => {
      img.src = urls[img.dataset.id];
      img.addEventListener('load', () => img.classList.add('in'), { once: true });
    });
  });

  // configurator
  const { initConfigurator } = await import('./configurator.js');
  let latest = null;
  const fmt = {
    h: (v) => `${Math.round(v * CM_PER_UNIT)} cm`,
    belly: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    neck: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    lip: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    bellyPos: (v) => (v < 0.3 ? 'Low' : v < 0.46 ? 'Middle' : 'High'),
  };
  let makeReady = false;
  const cfg = initConfigurator($('#makeCanvas'), {
    onChange(s) {
      latest = s;
      if (!makeReady) return;
      $('#specH').textContent = `${Math.round(s.heightCm)} cm`;
      $('#specMl').textContent = s.ml >= 1000 ? `${(s.ml / 1000).toFixed(1)} L` : `${Math.round(s.ml / 10) * 10} ml`;
      $('#specPrice').textContent = money(s.price);
    },
  });
  makeReady = true;
  const form = $('#makeForm');
  form.querySelectorAll('input[type=range]').forEach((input) => {
    const out = $(`#o-${input.name}`);
    const sync = () => {
      cfg.set(input.name, parseFloat(input.value));
      out.textContent = fmt[input.name](parseFloat(input.value));
    };
    input.addEventListener('input', sync);
    sync();
  });

  const sw = $('#swatches');
  for (const [key, t] of Object.entries(TINTS)) {
    const id = `tint-${key}`;
    sw.insertAdjacentHTML('beforeend', `
      <input type="radio" name="tint" id="${id}" value="${key}" ${key === 'seafoam' ? 'checked' : ''}>
      <label for="${id}" style="--c:${t.attenuation}"><span class="dot"></span>${t.name}</label>`);
  }
  sw.addEventListener('change', (e) => cfg.setTint(e.target.value));

  $('#makeAdd').onclick = async () => {
    const s = latest;
    const key = Object.values(s.shape).map((v) => v.toFixed(2)).join('-') + s.tint;
    const name = `Your ${TINTS[s.tint].name.toLowerCase()} vessel`;
    const product = { id: `custom-${key}`, shape: s.shape, tint: s.tint, bg: '#e3e8ec', name };
    const img = await renderSingle(product);
    cart.add({
      id: product.id, name, price: s.price, img, bg: '#e3e8ec',
      meta: `Made to order, ${Math.round(s.heightCm)} cm tall`,
    });
    bumpCart();
    toast(`Added ${name} to your cart. We'll blow it within three weeks.`);
  };
}
