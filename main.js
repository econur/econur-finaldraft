/* ==========================================
   Preloader
========================================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('hidden');
  }, 1900);
});

/* ==========================================
   Sticky Nav
   (single rAF-throttled scroll listener)
========================================== */
const nav = document.getElementById('mainNav');

let navTicking = false;
window.addEventListener('scroll', () => {
  if (!navTicking) {
    requestAnimationFrame(() => {
      nav.classList.toggle('scrolled', window.scrollY > 10);
      navTicking = false;
    });
    navTicking = true;
  }
});
/*================================
   Smooth Scroll for nav links
========================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 80,
      behavior: 'smooth'
    });
    // Close mobile menu if open
    const collapseEl = document.getElementById('navMenu');
    const bsCollapse = bootstrap.Collapse.getInstance(collapseEl);
    if (bsCollapse) bsCollapse.hide();
  });
});

/* PRODUCTS is defined in products-data.js — loaded before this file in index.html */

/* ==========================================
   SHOWCASE STATE
========================================== */
let currentIndex = 0;
let currentProduct = PRODUCTS[0];
let cart = [];
let autoTimer = null;
let progressTimer = null;
let isHovering = false;
let deliveryFee = 60;
const AUTO_INTERVAL = 5000;

/* ==========================================
   DOMContentLoaded — boot everything
========================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Showcase carousel
  buildThumbs();
  buildFullGrid();
  buildMarquee();
  setFeatured(0, false);
  startAuto();
  setupHoverPause();
  setupFilterBtns();

  // Trigger fade-in on product grid cards via IntersectionObserver
  // (they are always visible in the DOM now, below the showcase)
  setTimeout(() => {
    document.querySelectorAll('#productsGrid .fade-up').forEach(el => {
      fadeObserver.observe(el);
    });
  }, 100);

  // Order form — live validation listeners
  document.getElementById('fieldName').addEventListener('input', () => clearError('fieldName', 'errName'));
  document.getElementById('fieldPhone').addEventListener('input', () => clearError('fieldPhone', 'errPhone'));
  document.getElementById('fieldAddress').addEventListener('input', () => clearError('fieldAddress', 'errAddress'));

  // Order modal — close on backdrop click
  document.getElementById('orderModalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeOrderModal();
  });
});

/* ==========================================
   SCROLL FADE-IN (Intersection Observer)
========================================== */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

/* ==========================================
   THUMBNAIL STRIP
========================================== */
function buildThumbs() {
  const container = document.getElementById('showcaseThumbs');
  container.innerHTML = PRODUCTS.map((p, i) => `
    <div class="thumb-card ${i === 0 ? 'active' : ''}" data-idx="${i}" onclick="onThumbClick(${i})" tabindex="0" role="button" aria-label="View ${p.name}">
      <div class="thumb-card-img">
          <img src="${p.img}" alt="${p.name}" loading="lazy"/>
      </div>
      <div class="thumb-card-info">
        <div class="thumb-card-name">${p.name}</div>
        <div class="thumb-card-tag">${p.tag.replace('&amp;', '&')}</div>
      </div>
      <div class="thumb-active-dot"></div>
    </div>
  `).join('');
}

function onThumbClick(idx) {
  if (idx === currentIndex) return;
  stopAuto();
  setFeatured(idx, true);
  startAuto();
}

function setFeatured(idx, animate) {
  currentIndex = idx;
  currentProduct = PRODUCTS[idx];

  // Update thumb active states and scroll the active one into view
  document.querySelectorAll('.thumb-card').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
  const activeThumb = document.querySelector('.thumb-card.active');
  if (activeThumb) {
    const strip = document.getElementById('showcaseThumbs');
    if (strip) {
      // Desktop: vertical strip — scroll top
      // Mobile: horizontal strip — scroll left
      const isHorizontal = strip.scrollWidth > strip.clientWidth;
      if (isHorizontal) {
        strip.scrollTo({ left: activeThumb.offsetLeft - strip.clientWidth / 2 + activeThumb.offsetWidth / 2, behavior: 'smooth' });
      } else {
        strip.scrollTo({ top: activeThumb.offsetTop - strip.clientHeight / 2 + activeThumb.offsetHeight / 2, behavior: 'smooth' });
      }
    }
  }

  // Trigger transition
  const card = document.getElementById('featuredCard');
  const overlay = document.getElementById('featuredOverlay');

  if (animate) {
    overlay.classList.add('flash');
    setTimeout(() => overlay.classList.remove('flash'), 80);

    card.classList.add('transitioning');
    setTimeout(() => card.classList.remove('transitioning'), 600);
  }

  const p = currentProduct;

  // Swap image
  const img = document.getElementById('featuredImg');
  img.src = p.img;
  img.alt = p.imgAlt;

  const link = document.getElementById('featuredLink');
  link.href = p.pageUrl


  // Swap text
  document.getElementById('featuredTag').innerHTML = p.tag;

  const badge = document.getElementById('featuredBadge');
  badge.textContent = p.badge;
  badge.style.display = p.badge ? '' : 'none';

  document.getElementById('featuredName').textContent = p.name;
  document.getElementById('featuredDesc').innerHTML = p.desc;

  const ingWrap = document.getElementById('featuredIngredients');
  ingWrap.innerHTML = p.ingredients.map(ing => `<span class="ingredient-chip">${ing}</span>`).join('');

  document.getElementById('featuredPrice').textContent = '৳' + p.price;
}

/* ==========================================
   AUTO-ADVANCE + PROGRESS BAR
========================================== */
function startAuto() {
  stopAuto();
  resetProgress();
  startProgress();
  autoTimer = setTimeout(() => {
    if (!isHovering) {
      const next = (currentIndex + 1) % PRODUCTS.length;
      setFeatured(next, true);
    }
    startAuto();
  }, AUTO_INTERVAL);
}

function stopAuto() {
  clearTimeout(autoTimer);
  clearTimeout(progressTimer);
  autoTimer = null;
}

function resetProgress() {
  const bar = document.getElementById('progressBar');
  bar.classList.remove('animating');
  bar.style.width = '0%';
  bar.style.transition = 'none';
}

function startProgress() {
  const bar = document.getElementById('progressBar');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.classList.add('animating');
    });
  });
}

function setupHoverPause() {
  const card = document.getElementById('featuredCard');
  card.addEventListener('mouseenter', () => {
    isHovering = true;
    stopAuto();
    document.getElementById('progressBar').style.transition = 'none';
  });
  card.addEventListener('mouseleave', () => {
    isHovering = false;
    startAuto();
  });
}

/* ==========================================
   FULL PRODUCT GRID (browse mode)
========================================== */
function buildFullGrid() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = PRODUCTS.map((p, i) => `
    <div class="product-card-wrap fade-up delay-${(i % 4) + 1}" data-category="${p.category}">
      <div class="glass-card product-card">
        <div class="product-card-img">
          <a href="${p.pageUrl}">
            <img src="${p.img}" alt="${p.imgAlt}" loading="lazy"/>
          </a>
          <span class="product-tag">${p.tag}</span>
          ${p.badge ? `<span class="product-badge-bestseller">${p.badge}</span>` : ''}
        </div>
        <div class="product-card-body">
          <h4>${p.name}</h4>
          <p>${p.desc}</p>
          <div class="product-ingredients">
            ${p.ingredients.map(ing => `<span class="ingredient-chip">${ing}</span>`).join('')}
          </div>
          <div class="product-pricing-row">
            <div>
              <div style="font-size:0.78rem;color:var(--text-mid);margin-bottom:2px;">50gm</div>
              <div style="font-size:1rem;font-weight:700;color:var(--emerald-dark);">৳${p.price}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
              <button class="btn-add-cart btn-card-order" style="font-size:0.78rem;padding:8px 14px;" onclick="addToCart(PRODUCTS[${i}])">🛒 Cart</button>
              <button class="btn-order-now btn-card-order" style="font-size:0.78rem;padding:8px 14px;" onclick="orderNow(PRODUCTS[${i}])">Order →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================
   CATEGORY FILTER BUTTONS
========================================== */
function setupFilterBtns() {
  document.querySelectorAll('.filter-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#productsGrid .product-card-wrap').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}

/* ==========================================
   BROWSE MODE — removed; products section is
   now a standalone section below showcase.
========================================== */

/* ==========================================
   MARQUEE
========================================== */
function buildMarquee() {
  const items = [
    'BCSIR Certified',
    'BUET Certified',
    'Chemical-Free Formula',
    'Zero-Plastic Packaging',
    'Nationwide Delivery',
    'Cold-Processed',
    '100% Natural Ingredients',
    'Handcrafted in Bangladesh',
    'Skin-Safe for All Ages',
  ];
  // Duplicate for seamless infinite loop
  const all = [...items, ...items];
  const track = document.getElementById('marqueeTrack');
  track.innerHTML = all.map(text => `
    <span class="trust-marquee-item">
      <i class="fa fa-check"></i>
      ${text}
      <span class="trust-dot"></span>
    </span>
  `).join('');
}

/* ==========================================
   CART
========================================== */
function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();

  // Bounce the FAB
  const fab = document.getElementById('cartFab');
  fab.style.transform = 'scale(1.25)';
  setTimeout(() => fab.style.transform = '', 250);

  triggerCartShake();
  showCartCTA();
}

function orderNow(product) {
  // Single-product express order — clear cart, add product, go straight to order modal
  cart = [{ ...product, qty: 1 }];
  updateCartUI();
  closeCart();
  openOrderModal();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCartUI();
}

function clearCart() {
  cart = [];
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  // FAB badge
  const badge = document.getElementById('cartFabBadge');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);

  // Footer totals
  document.getElementById('cartTotalDisplay').textContent = '৳' + total;
  document.getElementById('proceedOrderBtn').disabled = count === 0;

  // Rebuild item list
  const list = document.getElementById('cartItemsList');
  const emptyMsg = document.getElementById('cartEmptyMsg');

  list.querySelectorAll('.cart-item').forEach(el => el.remove());

  if (cart.length === 0) {
    emptyMsg.style.display = '';
  } else {
    emptyMsg.style.display = 'none';
    cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-img"><img src="${item.img}" alt="${item.name}" loading="lazy"/></div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-size">50gm</div>
          <div class="cart-item-price">৳${item.price * item.qty}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" aria-label="Remove">✕</button>
      `;
      list.appendChild(el);
    });
  }
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');

  // Lock body scroll – preserve scroll position
  const scrollY = window.scrollY;
  document.body.classList.add('no-scroll');
  document.body.style.top = `-${scrollY}px`;
  document.body.dataset.scrollY = scrollY;
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');

  // Restore body scroll
  document.body.classList.remove('no-scroll');
  const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
}
function triggerCartShake() {
  const fab = document.getElementById('cartFab');
  fab.classList.remove('cart-shake');
  void fab.offsetWidth; // reflow to restart animation
  fab.classList.add('cart-shake');
}

function showCartCTA() {
  let cta = document.getElementById('cartCTA');
  if (!cta) {
    cta = document.createElement('div');
    cta.id = 'cartCTA';
    cta.innerHTML = 'Checkout →';
    cta.onclick = openCart;
    document.body.appendChild(cta);
  }
  cta.classList.remove('cart-cta-hide');
  cta.classList.add('cart-cta-show');
  clearTimeout(cta._hideTimer);
  cta._hideTimer = setTimeout(() => {
    cta.classList.replace('cart-cta-show', 'cart-cta-hide');
  }, 4000);
}
/* ==========================================
   ORDER MODAL
========================================== */
function openOrderModal() {
  // Populate order summary
  const preview = document.getElementById('orderItemsPreview');
  preview.innerHTML = cart.map(item => `
    <div class="order-item-row">
      <div class="order-item-img"><img src="${item.img}" alt="${item.name}"/></div>
      <div class="order-item-detail">
        <div class="order-item-detail-name">${item.name}</div>
        <div class="order-item-detail-meta">50gm × ${item.qty}</div>
      </div>
      <div class="order-item-detail-price">৳${item.price * item.qty}</div>
    </div>
  `).join('');

  const subtotal = getCartTotal();
  document.getElementById('orderTotalVal').textContent = '৳' + subtotal;

  // Reset delivery zone to Inside Dhaka
  deliveryFee = 60;
  const insideLabel = document.getElementById('deliveryChoiceInside');
  const outsideLabel = document.getElementById('deliveryChoiceOutside');
  const insideRadio = document.getElementById('zoneInside');
  const outsideRadio = document.getElementById('zoneOutside');
  if (insideLabel && outsideLabel) {
    insideRadio.checked = true;
    outsideRadio.checked = false;
    insideLabel.classList.add('active');
    outsideLabel.classList.remove('active');
  }
  const deliveryEl = document.getElementById('orderDeliveryVal');
  const grandEl = document.getElementById('orderGrandVal');
  if (deliveryEl) deliveryEl.textContent = '৳60';
  if (grandEl) grandEl.textContent = '৳' + (subtotal + 60);

  // Reset form state
  document.getElementById('orderFormWrap').style.display = '';
  document.getElementById('orderSuccess').classList.remove('visible');

  ['fieldName', 'fieldPhone', 'fieldAddress'].forEach(id => {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('error');
  });
  ['errName', 'errPhone', 'errAddress'].forEach(id => {
    document.getElementById(id).classList.remove('visible');
  });

  document.getElementById('orderModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  closeCart();
}

function closeOrderModal() {
  document.getElementById('orderModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ==========================================
   DELIVERY ZONE PICKER
========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const insideLabel = document.getElementById('deliveryChoiceInside');
  const outsideLabel = document.getElementById('deliveryChoiceOutside');
  const insideRadio = document.getElementById('zoneInside');
  const outsideRadio = document.getElementById('zoneOutside');

  function updateDeliveryFee(fee) {
    deliveryFee = fee;
    const subtotal = getCartTotal();
    const deliveryEl = document.getElementById('orderDeliveryVal');
    const grandEl = document.getElementById('orderGrandVal');
    if (deliveryEl) deliveryEl.textContent = '৳' + fee;
    if (grandEl) grandEl.textContent = '৳' + (subtotal + fee);
  }

  if (insideLabel && outsideLabel) {
    insideLabel.addEventListener('click', () => {
      insideRadio.checked = true;
      outsideRadio.checked = false;
      insideLabel.classList.add('active');
      outsideLabel.classList.remove('active');
      updateDeliveryFee(60);
    });

    outsideLabel.addEventListener('click', () => {
      outsideRadio.checked = true;
      insideRadio.checked = false;
      outsideLabel.classList.add('active');
      insideLabel.classList.remove('active');
      updateDeliveryFee(120);
    });
  }
});

/* ==========================================
   FORM VALIDATION + SUBMIT
========================================== */
function isValidBDPhone(phone) {
  // Bangladesh mobile: 01[3-9]XXXXXXXX — exactly 11 digits
  return /^01[3-9]\d{8}$/.test(phone.replace(/[\s\-()]/g, ''));
}

function showError(fieldId, errId) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errId).classList.add('visible');
}

function clearError(fieldId, errId) {
  document.getElementById(fieldId).classList.remove('error');
  document.getElementById(errId).classList.remove('visible');
}

async function submitOrder() {
  const name = document.getElementById('fieldName').value.trim();
  const phone = document.getElementById('fieldPhone').value.trim();
  const address = document.getElementById('fieldAddress').value.trim();

  let valid = true;

  if (!name) { showError('fieldName', 'errName'); valid = false; }
  else clearError('fieldName', 'errName');

  if (!isValidBDPhone(phone)) { showError('fieldPhone', 'errPhone'); valid = false; }
  else clearError('fieldPhone', 'errPhone');

  if (!address || address.length < 10) { showError('fieldAddress', 'errAddress'); valid = false; }
  else clearError('fieldAddress', 'errAddress');

  if (!valid) return;

  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const deliveryZone = deliveryFee === 60 ? 'Inside Dhaka' : 'Outside Dhaka';
  const grandTotal = getCartTotal() + deliveryFee;

  // For console reference if webhook not yet wired
  const orderData = {
    customer: { name, phone, address },
    items: cart.map(i => ({ name: i.name, size: '50gm', qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
    subtotal: getCartTotal(),
    delivery: { zone: deliveryZone, fee: deliveryFee },
    total: grandTotal,
    payment: 'Cash on Delivery',
    timestamp: new Date().toISOString()
  };

  // Discord webhook payload
  const discordPayload = {
    embeds: [{
      title: '🛒 New Econur Order!',
      color: 0x10B981,
      fields: [
        { name: '👤 Customer', value: name, inline: true },
        { name: '📞 Phone', value: phone, inline: true },
        { name: '📍 Address', value: address, inline: false },
        {
          name: '📦 Items',
          value: cart.map(i => `• ${i.name} (50gm) × ${i.qty} = ৳${i.price * i.qty}`).join('\n'),
          inline: false
        },
        { name: '🚚 Delivery', value: `${deliveryZone} (৳${deliveryFee})`, inline: true },
        { name: '💰 Grand Total', value: `৳${grandTotal}`, inline: true },
        { name: '💳 Payment', value: 'Cash on Delivery', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Econur Orders' }
    }]
  };

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Backend order error [${res.status} ${res.statusText}]:`, errBody || '(empty body)');
    }
  } catch (err) {
    console.error('Order request error:', err);
    // Don't block the user — order shows success regardless
  }

  // Show screen
  document.getElementById('orderFormWrap').style.display = 'none';
  document.getElementById('orderSuccess').classList.add('visible');
  btn.disabled = false;
  btn.innerHTML = 'Place My Order 🌿';
}