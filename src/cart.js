const KEY = 'gather-cart-v1';
export const FREE_SHIPPING = 200;

const money = (n) => `$${n.toLocaleString('en-US')}`;
export { money };

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
}

export function createCart(els) {
  let items = load();
  const listeners = new Set();

  const subtotal = () => items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = () => items.reduce((s, i) => s + i.qty, 0);

  function emit() {
    save(items);
    render();
    listeners.forEach((fn) => fn());
  }

  function add(item) {
    const found = items.find((i) => i.id === item.id);
    if (found) found.qty += 1;
    else items.push({ ...item, qty: 1 });
    emit();
  }
  function setQty(id, qty) {
    items = items.map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    emit();
  }

  function render() {
    els.count.textContent = count();
    els.count.hidden = count() === 0;
    els.list.innerHTML = '';
    els.empty.hidden = items.length > 0;
    els.footer.hidden = items.length === 0;

    for (const i of items) {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        ${i.img
          ? `<img src="${i.img}" alt="" width="72" height="90" style="background:${i.bg || '#e3e8ec'}">`
          : `<span class="cart-ph" style="background:${i.bg || '#e3e8ec'}"></span>`}
        <div class="cart-item-body">
          <p class="cart-item-name">${i.name}</p>
          <p class="cart-item-meta">${i.meta}</p>
          <div class="qty" role="group" aria-label="Quantity for ${i.name}">
            <button type="button" data-act="dec" aria-label="Remove one">−</button>
            <span aria-live="polite">${i.qty}</span>
            <button type="button" data-act="inc" aria-label="Add one">+</button>
          </div>
        </div>
        <p class="cart-item-price">${money(i.price * i.qty)}</p>`;
      li.querySelector('[data-act="dec"]').onclick = () => setQty(i.id, i.qty - 1);
      li.querySelector('[data-act="inc"]').onclick = () => setQty(i.id, i.qty + 1);
      els.list.appendChild(li);
    }

    const sub = subtotal();
    els.subtotal.textContent = money(sub);
    const left = FREE_SHIPPING - sub;
    els.shipBar.style.setProperty('--p', Math.min(sub / FREE_SHIPPING, 1));
    els.shipText.textContent = left > 0
      ? `Add ${money(left)} more for free insured shipping.`
      : 'Your order ships free, packed in wool and insured.';
  }

  render();
  function fillImages(map) {
    let changed = false;
    for (const i of items) if (!i.img && map[i.id]) { i.img = map[i.id]; changed = true; }
    if (changed) emit();
  }

  return { add, setQty, fillImages, onChange: (fn) => listeners.add(fn), get count() { return count(); } };
}
