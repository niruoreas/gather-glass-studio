import Lenis from 'lenis';
import { PRODUCTS, PROCESS, TESTIMONIALS, unsplash, srcset } from './products.js';
import { hasWebGL, prefersReducedMotion, CM_PER_UNIT, TINTS } from './glass.js';
import { createCart, money } from './cart.js';

const $ = (s) => document.querySelector(s);
const reduce = prefersReducedMotion();
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce) {
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
new IntersectionObserver(([e]) => nav.classList.toggle('nav-solid', !e.isIntersecting), {
  rootMargin: '-64px 0px 0px 0px',
}).observe($('.hero'));

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
const grid = $('#grid');
for (const p of PRODUCTS) {
  const li = document.createElement('li');
  li.className = `card card-${p.span}`;
  const low = p.stock <= 3;
  li.innerHTML = `
    <div class="card-media">
      <img alt="${p.name}, hand-blown ${TINTS[p.tint].name.toLowerCase()} glass"
        src="${unsplash(p.photo, 900, 1125)}" srcset="${srcset(p.photo)}"
        sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 45vw"
        width="900" height="1125" loading="lazy" decoding="async">
      <div class="loupe" aria-hidden="true" style="background-image:url('${unsplash(p.photo, 1800, 2250)}')"></div>
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
  const img = li.querySelector('img');
  const show = () => img.classList.add('in');
  if (img.complete) show(); else img.addEventListener('load', show, { once: true });
  grid.appendChild(li);
}

// the loupe: a round lens that magnifies the photo under the cursor
if (finePointer && !reduce) {
  grid.querySelectorAll('.card-media').forEach((m) => {
    const lens = m.querySelector('.loupe');
    m.addEventListener('pointerenter', () => m.classList.add('looking'));
    m.addEventListener('pointerleave', () => m.classList.remove('looking'));
    m.addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      lens.style.transform = `translate(${x}px, ${y}px)`;
      lens.style.backgroundPosition = `${(x / r.width) * 100}% ${(y / r.height) * 100}%`;
    });
  });
}

grid.addEventListener('click', (e) => {
  const id = e.target.closest('[data-add]')?.dataset.add;
  if (!id) return;
  const p = PRODUCTS.find((x) => x.id === id);
  cart.add({
    id: p.id, name: p.name, price: p.price,
    meta: `${TINTS[p.tint].name}, ${p.size.split(',')[0]}`,
    img: unsplash(p.photo, 160, 200), bg: '#e3e8ec',
  });
  bumpCart();
  toast(`Added ${p.name} to your cart`);
});

/* ---------- furnace + studio photos ---------- */
const furnace = $('#furnaceImg');
furnace.src = unsplash('1625765361596-d425d3c3eb96', 2000, 1100);
furnace.srcset = [900, 1400, 2000].map((w) => `${unsplash('1625765361596-d425d3c3eb96', w, Math.round(w * 0.55))} ${w}w`).join(', ');
furnace.sizes = '100vw';
const studio = $('#studioImg');
studio.src = unsplash('1773125465958-4b83adc60498', 1100, 1375);

// heat haze: the turbulence drifts only while the furnace is on screen
if (!reduce) {
  const noise = $('#heatNoise');
  let on = false, t = 0;
  new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) loop(); }).observe($('.furnace'));
  function loop() {
    if (!on) return;
    t += 0.012;
    noise.setAttribute('baseFrequency', `${0.008 + Math.sin(t) * 0.002} ${0.03 + Math.cos(t * 0.7) * 0.008}`);
    noise.setAttribute('seed', String(Math.floor(t * 6) % 40));
    requestAnimationFrame(loop);
  }
}

/* ---------- process ---------- */
$('#steps').innerHTML = PROCESS.map((s, i) => `
  <li style="--heat:${i}">
    <figure><img src="${unsplash(s.photo, 600, 800)}" alt="${s.name}: ${s.text.split('.')[0].toLowerCase()}" loading="lazy" decoding="async" width="600" height="800"></figure>
    <span class="temp">${s.temp.replace(' °C', '&nbsp;°C')}</span>
    <h3>${s.name}</h3>
    <p>${s.text}</p>
  </li>`).join('');

/* ---------- testimonials ---------- */
const track = $('#lettersTrack');
track.innerHTML = TESTIMONIALS.map((t) => `
  <li class="letter">
    <figure><img src="${unsplash(t.photo, 700, 875)}" alt="${t.bought} in ${t.name.split(' ')[0]}'s home" loading="lazy" decoding="async" width="700" height="875"></figure>
    <blockquote><p>${t.quote}</p></blockquote>
    <p class="letter-who"><strong>${t.name}</strong>, ${t.place}</p>
    <p class="letter-bought">Owns the ${t.bought.replace(/^A /, '')}</p>
  </li>`).join('');
const step = () => track.querySelector('.letter').getBoundingClientRect().width + 24;
$('#lettersPrev').onclick = () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' });
$('#lettersNext').onclick = () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' });
// let the page's smooth scroll ignore horizontal wheel on the track
track.setAttribute('data-lenis-prevent-horizontal', '');

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

  const { renderSingle } = await import('./thumbs.js');
  const { initConfigurator } = await import('./configurator.js');
  let latest = null;
  const fmt = {
    h: (v) => `${Math.round(v * CM_PER_UNIT)} cm`,
    belly: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    neck: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    lip: (v) => `${Math.round(v * 2 * CM_PER_UNIT)} cm`,
    bellyPos: (v) => (v < 0.3 ? 'Low' : v < 0.46 ? 'Middle' : 'High'),
  };
  const cfg = initConfigurator($('#makeCanvas'), {
    onChange(s) {
      latest = s;
      const h = $('#specH');
      if (!h) return;
      h.textContent = `${Math.round(s.heightCm)} cm`;
      $('#specMl').textContent = s.ml >= 1000 ? `${(s.ml / 1000).toFixed(1)} L` : `${Math.round(s.ml / 10) * 10} ml`;
      $('#specPrice').textContent = money(s.price);
    },
  });
  $('#makeForm').querySelectorAll('input[type=range]').forEach((input) => {
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
