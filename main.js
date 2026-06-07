/**
 * Warpigs Shared UI Scripts
 * Handles mobile menus, scroll interactions, parallax effects,
 * scroll-reveal animations, and floating ember particles.
 */
document.addEventListener('DOMContentLoaded', () => {
  // ——— Footer year ———
  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = `© ${new Date().getFullYear()} War Pigs BBQ. All rights reserved.`;
  }

  // ——— Navbar scroll shrink ———
  const navbar = document.getElementById('navbar');
  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 80);
      lastScroll = window.scrollY;
    }, { passive: true });
  }

  // ——— Mobile nav toggle ———
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('[data-nav-link]').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ——— Scroll-triggered animations ———
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .slide-left, .slide-right, .scale-in').forEach(el => {
    observer.observe(el);
  });

  // ——— Parallax hero background (Home-page only) ———
  const heroBg = document.getElementById('heroBg');
  if (heroBg) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${window.scrollY * 0.3}px) scale(1.05)`;
      }
    }, { passive: true });
  }

  // ——— Animated counters (Home-page only) ———
  const counterElements = document.querySelectorAll('[data-count]');
  if (counterElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count);
          const suffix = target > 10 ? '+' : '';
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = Math.floor(current) + suffix;
          }, duration / steps);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  // ——— Load and Render Schedule ———
  const scheduleGrid = document.getElementById('scheduleGrid');
  if (scheduleGrid) {
    loadSchedule().then(scheduleData => {
      renderScheduleGrid(scheduleData);
    });
  }

  async function loadSchedule() {
    try {
      const response = await fetch('schedule.json');
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      console.warn('Could not fetch schedule.json. Falling back to localStorage/defaults.', err);
      const local = localStorage.getItem('warpigs_schedule');
      if (local) {
        try {
          return JSON.parse(local);
        } catch (e) {}
      }
      return [
        { date: "FRI · MAY 1", venue: "Lagunitas Tap Room", city: "Petaluma", time: "4–8pm" },
        { date: "SAT · MAY 9", venue: "Windsor Town Green", city: "Windsor", time: "12–7pm" },
        { date: "THU · MAY 14", venue: "Cotati Brewing Co.", city: "Cotati", time: "5–9pm" },
        { date: "SAT · MAY 23", venue: "Private Catering", city: "Sonoma", time: "Booked" },
        { date: "FRI · MAY 29", venue: "HenHouse Brewing", city: "Santa Rosa", time: "4–8pm" }
      ];
    }
  }

  function renderScheduleGrid(data) {
    if (!scheduleGrid) return;
    if (!data || data.length === 0) {
      scheduleGrid.innerHTML = `
        <div style="padding: 3rem 1rem; text-align: center; color: var(--cream-30); font-family: var(--font-heading); width: 100%;">
          No upcoming pop-ups scheduled. Check back soon!
        </div>
      `;
      return;
    }
    
    scheduleGrid.innerHTML = data.map(event => `
      <div class="schedule__row">
        <div class="schedule__date">${escapeHtml(event.date)}</div>
        <div class="schedule__venue">${escapeHtml(event.venue)}</div>
        <div class="schedule__city">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHtml(event.city)}
        </div>
        <div class="schedule__time">${escapeHtml(event.time)}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ——— Inject Particles into all sections ———
  document.querySelectorAll('section, footer').forEach(section => {
    const particles = document.createElement('div');
    particles.className = 'particles';
    particles.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      particles.appendChild(p);
    }
    section.insertBefore(particles, section.firstChild);
  });
});
