/* ============================================================
   GLOW by Ro — Lógica del catálogo
   ============================================================ */

const CATS = {
  skincare:   'Skincare',
  maquillaje: 'Maquillaje',
  fragancia:  'Fragancias',
  cabello:    'Cabello'
};

const PRODUCTOS = [
  { id:1,  nombre:'Sérum Iluminador Vitamina C', cat:'skincare',   precio:34.90, badge:'Best seller', desc:'Concentrado que unifica el tono y aporta luminosidad inmediata.' },
  { id:2,  nombre:'Crema Hidratante Hialurónico', cat:'skincare',  precio:28.50, badge:'',            desc:'Hidratación profunda 24 h con textura ligera no comedogénica.' },
  { id:3,  nombre:'Aceite Facial Rosa Mosqueta',  cat:'skincare',  precio:31.00, badge:'Nuevo',       desc:'Regenera y nutre la piel durante la noche. 100% natural.' },
  { id:4,  nombre:'Limpiador Suave de Rosas',     cat:'skincare',  precio:19.90, badge:'',            desc:'Espuma delicada que limpia sin resecar ni alterar la barrera.' },
  { id:5,  nombre:'Labial Líquido Mate Velvet',   cat:'maquillaje',precio:16.90, badge:'Best seller', desc:'Color intenso de larga duración con acabado aterciopelado.' },
  { id:6,  nombre:'Base Luminosa Skin Glow',      cat:'maquillaje',precio:27.50, badge:'',            desc:'Cobertura media modulable con acabado natural y luminoso.' },
  { id:7,  nombre:'Paleta de Sombras Nude',       cat:'maquillaje',precio:32.00, badge:'',            desc:'12 tonos neutros mate y satinados, altamente pigmentados.' },
  { id:8,  nombre:'Máscara de Pestañas Volumen',  cat:'maquillaje',precio:14.90, badge:'',            desc:'Volumen extremo y curvatura duradera sin grumos.' },
  { id:9,  nombre:'Eau de Parfum Vainilla Ámbar', cat:'fragancia', precio:59.00, badge:'Exclusivo',   desc:'Notas cálidas de vainilla, ámbar y madera de sándalo.' },
  { id:10, nombre:'Bruma Corporal Flor de Azahar',cat:'fragancia', precio:24.00, badge:'',            desc:'Bruma ligera y refrescante para perfumar tu piel a diario.' },
  { id:11, nombre:'Shampoo Reparador Keratina',   cat:'cabello',   precio:21.50, badge:'',            desc:'Repara la fibra capilar dañada y sella las puntas abiertas.' },
  { id:12, nombre:'Mascarilla Capilar Nutritiva', cat:'cabello',   precio:23.00, badge:'Nuevo',       desc:'Tratamiento intensivo con manteca de karité y aguacate.' }
];

/* ---------- Estado ---------- */
const state = { filtro: 'todos', carrito: [] };
const STORAGE_KEY = 'glowbyro_cart_v1';

const $  = sel => document.querySelector(sel);
const grid      = $('#grid');
const filtersEl = $('#filters');
const cartPanel = $('#cartPanel');
const overlay   = $('#overlay');
const modal     = $('#modal');
const toastEl   = $('#toast');

const money = n => '$' + Number(n).toFixed(2);
const getProducto = id => PRODUCTOS.find(p => p.id === id);

/* ============================================================
   RENDER: FILTROS
   ============================================================ */
function renderFiltros(){
  const items = [{ k:'todos', n:'Todos' }, ...Object.entries(CATS).map(([k, n]) => ({ k, n }))];
  filtersEl.innerHTML = items.map(i =>
    `<button class="chip ${state.filtro === i.k ? 'active' : ''}" data-filter="${i.k}">${i.n}</button>`
  ).join('');
}

/* ============================================================
   RENDER: PRODUCTOS
   ============================================================ */
function renderProductos(){
  const lista = state.filtro === 'todos'
    ? PRODUCTOS
    : PRODUCTOS.filter(p => p.cat === state.filtro);

  grid.innerHTML = lista.map(p => `
    <article class="card reveal" data-id="${p.id}">
      <div class="p-visual" data-cat="${p.cat}">
        <span class="shape"></span>
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <button class="quick" data-quick="${p.id}">Vista rápida</button>
      </div>
      <div class="card-body">
        <span class="cat">${CATS[p.cat]}</span>
        <h3>${p.nombre}</h3>
        <p class="desc">${p.desc}</p>
        <div class="card-foot">
          <span class="price">${money(p.precio)}</span>
          <button class="btn-add" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `).join('');

  observeReveals();
}

/* ============================================================
   CARRITO
   ============================================================ */
function addToCart(id, qty = 1){
  const item = state.carrito.find(i => i.id === id);
  if (item) item.qty += qty;
  else state.carrito.push({ id, qty });

  renderCart();
  saveCart();
  toast('Producto añadido a tu bolsa');
  bumpCount();
}

function changeQty(id, delta){
  const item = state.carrito.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.carrito = state.carrito.filter(i => i.id !== id);
  renderCart();
  saveCart();
}

function removeFromCart(id){
  state.carrito = state.carrito.filter(i => i.id !== id);
  renderCart();
  saveCart();
}

function renderCart(){
  const count = state.carrito.reduce((a, i) => a + i.qty, 0);
  const total = state.carrito.reduce((a, i) => a + getProducto(i.id).precio * i.qty, 0);

  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = money(total);

  if (!state.carrito.length){
    $('#cartItems').innerHTML = `
      <div class="cart-empty">
        Tu bolsa está vacía.<br>
        Descubre nuestros favoritos y empieza tu ritual ✨
      </div>`;
    return;
  }

  $('#cartItems').innerHTML = state.carrito.map(i => {
    const p = getProducto(i.id);
    return `
      <div class="cart-item">
        <div class="p-visual ci-visual" data-cat="${p.cat}"><span class="shape"></span></div>
        <div class="ci-info">
          <h4>${p.nombre}</h4>
          <span class="ci-price">${money(p.precio)}</span>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="Quitar una unidad">−</button>
            <span>${i.qty}</span>
            <button data-inc="${p.id}" aria-label="Añadir una unidad">+</button>
          </div>
        </div>
        <button class="ci-remove" data-del="${p.id}" aria-label="Eliminar producto">✕</button>
      </div>`;
  }).join('');
}

function bumpCount(){
  const el = $('#cartCount');
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 260);
}

/* ---------- Persistencia ---------- */
function saveCart(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.carrito)); } catch(e){}
}
function loadCart(){
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(data)){
      state.carrito = data.filter(i => i && getProducto(i.id) && i.qty > 0);
    }
  } catch(e){ state.carrito = []; }
}

/* ============================================================
   UI: PANELES
   ============================================================ */
function openCart(){
  cartPanel.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeAll(){
  cartPanel.classList.remove('open');
  modal.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
  $('#navLinks').classList.remove('open');
}

/* ---------- Modal producto ---------- */
function openModal(id){
  const p = getProducto(id);
  if (!p) return;

  $('#modalBox').innerHTML = `
    <div class="p-visual m-visual" data-cat="${p.cat}"><span class="shape"></span></div>
    <div class="m-body">
      <span class="cat">${CATS[p.cat]}</span>
      <h3>${p.nombre}</h3>
      <p>${p.desc}</p>
      <ul class="m-list">
        <li>Fórmula vegana y cruelty free</li>
        <li>Apto para todo tipo de piel</li>
        <li>Envase reciclable · 50 ml</li>
        <li>Envío en 24–48 h</li>
      </ul>
      <div class="m-foot">
        <span class="price">${money(p.precio)}</span>
        <button class="btn btn-primary" data-add="${p.id}">Añadir a la bolsa</button>
      </div>
    </div>
  `;

  modal.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ============================================================
   EVENTOS GLOBALES (delegación)
   ============================================================ */
document.addEventListener('click', e => {

  /* Filtros */
  const chip = e.target.closest('[data-filter]');
  if (chip){
    state.filtro = chip.dataset.filter;
    renderFiltros();
    renderProductos();
    return;
  }

  /* Añadir al carrito */
  const add = e.target.closest('[data-add]');
  if (add){
    addToCart(Number(add.dataset.add));
    return;
  }

  /* Vista rápida */
  const quick = e.target.closest('[data-quick]');
  if (quick){
    openModal(Number(quick.dataset.quick));
    return;
  }

  /* Cantidades */
  const inc = e.target.closest('[data-inc]');
  if (inc){ changeQty(Number(inc.dataset.inc), 1); return; }

  const dec = e.target.closest('[data-dec]');
  if (dec){ changeQty(Number(dec.dataset.dec), -1); return; }

  const del = e.target.closest('[data-del]');
  if (del){ removeFromCart(Number(del.dataset.del)); return; }
});

/* Abrir carrito */
$('#cartBtn').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeAll);

/* Cerrar con overlay / Escape */
overlay.addEventListener('click', closeAll);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAll();
});

/* Cerrar modal al hacer clic fuera de la caja */
modal.addEventListener('click', e => {
  if (e.target === modal) closeAll();
});

/* Menú móvil */
$('#menuBtn').addEventListener('click', () => {
  $('#navLinks').classList.toggle('open');
});
$('#navLinks').addEventListener('click', e => {
  if (e.target.tagName === 'A') $('#navLinks').classList.remove('open');
});

/* Checkout (demo) */
$('#checkoutBtn').addEventListener('click', () => {
  if (!state.carrito.length){
    toast('Tu bolsa está vacía');
    return;
  }
  toast('¡Gracias! Redirigiendo al pago…');
});

/* Newsletter */
$('#newsForm').addEventListener('submit', e => {
  e.preventDefault();
  toast('¡Bienvenida al Club Glow! Revisa tu correo ✨');
  e.target.reset();
});

/* Header con sombra al hacer scroll */
const header = $('#header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 12);
}, { passive: true });

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
let observer;
function observeReveals(){
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  if (!observer){
    observer = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting){
          setTimeout(() => entry.target.classList.add('in'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  document.querySelectorAll('.reveal:not(.in)').forEach(el => observer.observe(el));
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
loadCart();
renderFiltros();
renderProductos();
renderCart();
observeReveals();