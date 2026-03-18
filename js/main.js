/* ============================================
   EMERIE CREDIT UNION - Shared Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initStickyHeader();
  initScrollAnimations();
  initStatCounters();
  initAccordions();
});

/* --- Mobile Navigation --- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-overlay');
  const mobile = document.querySelector('.nav-mobile');
  const close = document.querySelector('.nav-mobile__close');

  if (!toggle || !mobile) return;

  function openNav() {
    overlay.classList.add('open');
    mobile.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    overlay.classList.remove('open');
    mobile.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openNav);
  if (close) close.addEventListener('click', closeNav);
  if (overlay) overlay.addEventListener('click', closeNav);

  mobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });
}

/* --- Sticky Header Shadow --- */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const sentinel = document.querySelector('.hero, .page-header');
  if (!sentinel) {
    header.classList.add('scrolled');
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { rootMargin: '-108px 0px 0px 0px' }
  );
  observer.observe(sentinel);
}

/* --- Scroll Animations --- */
function initScrollAnimations() {
  const items = document.querySelectorAll('.animate-in');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(item => observer.observe(item));
}

/* --- Stat Counter Animation --- */
function initStatCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const start = performance.now();
  const isDecimal = target % 1 !== 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = target * eased;

    if (isDecimal) {
      el.textContent = prefix + current.toFixed(1) + suffix;
    } else {
      el.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
    }
  }

  requestAnimationFrame(update);
}

/* --- Accordions --- */
function initAccordions() {
  const triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close siblings if needed
      const parent = item.parentElement;
      if (parent) {
        parent.querySelectorAll('.accordion-item.open').forEach(openItem => {
          openItem.classList.remove('open');
        });
      }

      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}
