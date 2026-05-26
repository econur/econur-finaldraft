/* =============================================
   EID ER SHUNDOR KAJ — Main Script
   ============================================= */

// ─── Language Toggle ───────────────────────────────────────────
let currentLang = 'bn';

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.querySelectorAll('.bn-text').forEach(el => {
    el.classList.toggle('hidden', lang !== 'bn');
  });
  document.querySelectorAll('.en-text').forEach(el => {
    el.classList.toggle('hidden', lang !== 'en');
  });

  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  updateDotLabels();
}

// ─── Lazy Image Loading ─────────────────────────────────────────
function initLazyImages() {
  const images = document.querySelectorAll('img.lazy');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    images.forEach(img => imageObserver.observe(img));
  } else {
    images.forEach(loadImage);
  }
}

function loadImage(img) {
  const src = img.dataset.src;
  if (!src) return;
  const tempImg = new Image();
  tempImg.onload = () => {
    img.src = src;
    img.classList.add('loaded');
    const placeholder = img.nextElementSibling;
    if (placeholder && placeholder.classList.contains('card-img-placeholder')) {
      placeholder.style.display = 'none';
    }
  };
  tempImg.onerror = () => {
    // Fallback: show placeholder with gradient
    const placeholder = img.nextElementSibling;
    if (placeholder) {
      placeholder.style.animation = 'none';
      placeholder.style.opacity = '0.5';
    }
  };
  tempImg.src = src;
}

// ─── Cinematic Carousel ─────────────────────────────────────────
let currentIndex = 0;
let isAnimating = false;
let autoPlayTimer = null;
let isDragging = false;
let startX = 0;
let startScrollLeft = 0;
const AUTOPLAY_INTERVAL = 4500;
const EASE_DURATION = 700; // ms for cinematic ease

const track = document.getElementById('carouselTrack');
const cards = document.querySelectorAll('.deed-card');
const totalCards = cards.length;

function getVisibleCount() {
  const width = window.innerWidth;
  if (width <= 480) return 1;
  if (width <= 768) return 1.5;
  if (width <= 1024) return 2.5;
  return 3;
}

function getCardWidth() {
  const card = cards[0];
  if (!card) return 340;
  const style = getComputedStyle(track);
  const gap = parseFloat(style.gap) || 28;
  return card.offsetWidth + gap;
}

function goToSlide(index, instant = false) {
  if (isAnimating && !instant) return;
  currentIndex = Math.max(0, Math.min(index, totalCards - 1));
  isAnimating = true;

  const cardWidth = getCardWidth();
  const trackPadding = parseFloat(getComputedStyle(track).paddingLeft) || 48;
  const viewportWidth = track.parentElement.offsetWidth;
  const centeredOffset = (viewportWidth - cards[0].offsetWidth) / 2;
  const targetX = currentIndex * cardWidth - centeredOffset + trackPadding;

  cinematicScroll(track, targetX, instant ? 0 : EASE_DURATION, () => {
    isAnimating = false;
  });

  updateActiveCard();
  updateDots();
}

function cinematicScroll(element, targetScrollLeft, duration, callback) {
  if (duration === 0) {
    element.scrollLeft = targetScrollLeft;
    if (callback) callback();
    return;
  }

  const startScroll = element.scrollLeft;
  const distance = targetScrollLeft - startScroll;
  const startTime = performance.now();

  // Cinematic cubic-bezier easing (like a film cut with momentum)
  function easeInOutExpo(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    element.scrollLeft = startScroll + distance * easeInOutExpo(progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (callback) callback();
    }
  }

  requestAnimationFrame(step);
}

function updateActiveCard() {
  cards.forEach((card, i) => {
    card.classList.toggle('active', i === currentIndex);
  });
}

function updateDots() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function updateDotLabels() {
  // Dots are just visual, no labels needed
}

function carouselNext() {
  const next = currentIndex < totalCards - 1 ? currentIndex + 1 : 0;
  goToSlide(next);
  resetAutoPlay();
}

function carouselPrev() {
  const prev = currentIndex > 0 ? currentIndex - 1 : totalCards - 1;
  goToSlide(prev);
  resetAutoPlay();
}

function buildDots() {
  const dotsContainer = document.getElementById('carouselDots');
  if (!dotsContainer) return;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalCards; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => {
      goToSlide(i);
      resetAutoPlay();
    });
    dotsContainer.appendChild(dot);
  }
}

// Drag/swipe support
function initDragScroll() {
  if (!track) return;

  track.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.pageX;
    startScrollLeft = track.scrollLeft;
    track.classList.add('grabbing');
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    const delta = startX - e.pageX;
    track.scrollLeft = startScrollLeft + delta;
  });

  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('grabbing');
    snapToNearest();
  });

  // Touch
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].pageX;
    startScrollLeft = track.scrollLeft;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const delta = startX - e.changedTouches[0].pageX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? carouselNext() : carouselPrev();
    } else {
      snapToNearest();
    }
  }, { passive: true });
}

function snapToNearest() {
  const cardWidth = getCardWidth();
  const scrollLeft = track.scrollLeft;
  const trackPadding = parseFloat(getComputedStyle(track).paddingLeft) || 48;
  const viewportWidth = track.parentElement.offsetWidth;
  const centeredOffset = (viewportWidth - cards[0].offsetWidth) / 2;
  const adjustedScroll = scrollLeft + centeredOffset - trackPadding;
  const nearest = Math.round(adjustedScroll / cardWidth);
  goToSlide(Math.max(0, Math.min(nearest, totalCards - 1)));
}

function startAutoPlay() {
  stopAutoPlay();
  autoPlayTimer = setInterval(() => {
    const next = currentIndex < totalCards - 1 ? currentIndex + 1 : 0;
    goToSlide(next);
  }, AUTOPLAY_INTERVAL);
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function resetAutoPlay() {
  stopAutoPlay();
  startAutoPlay();
}

// Pause autoplay on hover
function initAutoPlayHover() {
  const outer = document.querySelector('.carousel-track-outer');
  if (!outer) return;
  outer.addEventListener('mouseenter', stopAutoPlay);
  outer.addEventListener('mouseleave', startAutoPlay);
}

// ─── Scroll Reveal ──────────────────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.section-header, .prize-tier, .amb-prize-pool, .submission-box, .amb-card, .amb-tiers, .final-cta .cta-content, .amb-tier'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Step items with delays
  const stepItems = document.querySelectorAll('.step-item');
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        stepObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  stepItems.forEach(el => stepObserver.observe(el));
}

// ─── Crescent Particle FX (subtle hero atmosphere) ──────────────
function initHeroParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0.4;';
  hero.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create subtle floating dust particles
  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.3 - 0.1,
      alpha: Math.random() * 0.5 + 0.2,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      alphaSpeed: Math.random() * 0.003 + 0.001,
    });
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.alphaDir * p.alphaSpeed;
      if (p.alpha <= 0.1 || p.alpha >= 0.65) p.alphaDir *= -1;
      if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
      if (p.x < -5) p.x = canvas.width + 5;
      if (p.x > canvas.width + 5) p.x = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,222,179,${p.alpha})`;
      ctx.fill();
    });
    raf = requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // Pause when not visible
  const heroObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!raf) animateParticles();
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });
  heroObs.observe(hero);
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Language: default Bengali
  setLang('bn');

  // Carousel
  buildDots();
  updateActiveCard();
  initDragScroll();
  initAutoPlayHover();

  // Initial position
  setTimeout(() => {
    goToSlide(0, true);
    startAutoPlay();
  }, 100);

  // Lazy images
  initLazyImages();

  // Scroll reveal
  initScrollReveal();

  // Hero particles
  initHeroParticles();

  // Keyboard navigation for carousel
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') carouselNext();
    if (e.key === 'ArrowLeft') carouselPrev();
  });

  // Resize handler
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      goToSlide(currentIndex, true);
    }, 150);
  });
});

// Expose for inline onclick handlers
window.setLang = setLang;
window.carouselNext = carouselNext;
window.carouselPrev = carouselPrev;
