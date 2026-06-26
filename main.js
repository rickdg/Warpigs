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
      if (navbar) navbar.classList.toggle('menu-open', navLinks.classList.contains('open'));
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('[data-nav-link]').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        if (navbar) navbar.classList.remove('menu-open');
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
  let venuesInfo = {};

  async function loadVenuesInfo() {
    try {
      const response = await fetch('venues_info.json');
      if (response.ok) {
        venuesInfo = await response.json();
      } else {
        throw new Error('Not ok');
      }
    } catch (e) {
      console.warn('Could not load venues_info.json, falling back to local defaults.', e);
      venuesInfo = {
        "Chateau Diana": {
          "address": "6125 Dry Creek Rd, Healdsburg, CA 95448",
          "website": "https://chateaudiana.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Chateau+Diana+Healdsburg"
        },
        "Cotati Brewing Co.": {
          "address": "8225 Old Redwood Hwy, Cotati, CA 94931",
          "website": "http://www.cotatibrewing.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Cotati+Brewing+Co.+Cotati"
        },
        "HenHouse Brewing": {
          "address": "322 Bellevue Ave, Santa Rosa, CA 95407",
          "website": "https://henhousebrewing.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=HenHouse+Brewing+Company+Santa+Rosa"
        },
        "Lagunitas Tap Room": {
          "address": "1280 N McDowell Blvd, Petaluma, CA 94954",
          "website": "https://lagunitas.com/taproom/petaluma",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Lagunitas+Brewing+Company+Petaluma"
        },
        "Mercy Lounge": {
          "address": "7950 Redwood Dr #16, Cotati, CA 94931",
          "website": "https://mercywellness.com/the-lounge/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=The+Lounge+at+Mercy+Wellness+Cotati"
        },
        "Parliament Brewery": {
          "address": "5865 Labath Ave, Rohnert Park, CA 94928",
          "website": "https://www.parliamentbrewing.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Parliament+Brewing+Company+Rohnert+Park"
        },
        "Private Catering": {
          "address": "Private Location — Contact Larry to book your catering event!",
          "website": "https://www.instagram.com/warpigs_craft_kitchen/",
          "maps": ""
        },
        "RV Taproom": {
          "address": "4927 Sonoma Hwy, Santa Rosa, CA 95409",
          "website": "https://www.rvtaproom.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Rincon+Valley+Taproom+Santa+Rosa"
        },
        "Shady Oak": {
          "address": "420 1st St, Santa Rosa, CA 95401",
          "website": "https://shadyoakbarrelhouse.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Shady+Oak+Barrel+House+Santa+Rosa"
        },
        "Windsor Town Green": {
          "address": "701 McClelland Dr, Windsor, CA 95492",
          "website": "https://www.townofwindsor.com/",
          "maps": "https://www.google.com/maps/dir/?api=1&destination=Windsor+Town+Green+Windsor"
        }
      };
    }
  }

  if (scheduleGrid) {
    Promise.all([loadSchedule(), loadVenuesInfo()]).then(([scheduleData]) => {
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
    
    scheduleGrid.innerHTML = data.map((event, idx) => `
      <div class="schedule__row" data-index="${idx}">
        <div class="schedule__date">${escapeHtml(event.date)}</div>
        <div class="schedule__venue">${escapeHtml(event.venue)}</div>
        <div class="schedule__city">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHtml(event.city)}
        </div>
        <div class="schedule__time">${escapeHtml(event.time)}</div>
      </div>
    `).join('');

    // Attach click listeners to rows
    scheduleGrid.querySelectorAll('.schedule__row').forEach(row => {
      row.addEventListener('click', () => {
        const index = parseInt(row.dataset.index, 10);
        if (!isNaN(index) && data[index]) {
          showVenueDetails(data[index]);
        }
      });
    });
  }

  function showVenueDetails(event) {
    const venueName = event.venue;
    const city = event.city;
    
    // Find matching venue info
    let info = venuesInfo[venueName];
    
    // If not found, try a case-insensitive search or substring match
    if (!info) {
      const normalizedName = venueName.toLowerCase().trim();
      const matchKey = Object.keys(venuesInfo).find(key => 
        key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())
      );
      if (matchKey) {
        info = venuesInfo[matchKey];
      }
    }
    
    // Set fallback details if still not found
    const address = info ? info.address : `${city || 'Sonoma County'}, CA`;
    const websiteUrl = info ? info.website : 'https://www.instagram.com/warpigs_craft_kitchen/';
    const mapsUrl = (info && info.maps) ? info.maps : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName + ' ' + (city || 'Sonoma County'))}`;
    
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'venue-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = `
      <div class="venue-modal__backdrop"></div>
      <div class="venue-modal__wrapper">
        <div class="venue-modal__content">
          <button class="venue-modal__close" aria-label="Close modal">✕</button>
          <div class="venue-modal__header">
            <div class="section-label">Venue Details</div>
            <h3 class="venue-modal__title">${escapeHtml(venueName)}</h3>
            <p class="venue-modal__meta">${escapeHtml(event.date)} &nbsp;·&nbsp; ${escapeHtml(event.time)}</p>
          </div>
          <div class="venue-modal__body">
            <div class="venue-modal__info-item">
              <svg class="venue-modal__icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <div class="venue-modal__info-text">
                <span class="venue-modal__label">Address</span>
                <span class="venue-modal__value">${escapeHtml(address)}</span>
              </div>
            </div>
          </div>
          <div class="venue-modal__actions">
            ${mapsUrl ? `
              <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn-primary venue-modal__btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                Directions
              </a>
            ` : ''}
            ${websiteUrl ? `
              <a href="${websiteUrl}" target="_blank" rel="noopener" class="btn-outline venue-modal__btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Lock scroll
    
    // Animate show
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Close functions
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = ''; // Restore scroll
      }, 300);
    };
    
    modal.querySelector('.venue-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.venue-modal__backdrop').addEventListener('click', closeModal);
    
    // Support Escape key to close
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
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

  // ——— Load and Render Story from JSON ———
  const storyBody = document.querySelector('.story__body');
  const storySectionLabel = document.querySelector('#story .section-label');
  const storySectionTitle = document.querySelector('#story .section-title');
  const storyStatsContainer = document.querySelector('.story__stats');

  if (storyBody) {
    loadStoryContent().then(data => {
      if (!data) return;

      // Update section label
      if (storySectionLabel && data.sectionLabel) {
        storySectionLabel.textContent = data.sectionLabel;
      }

      // Update title
      if (storySectionTitle && data.title) {
        storySectionTitle.innerHTML = `${escapeHtml(data.title)}<br><span class="ember">${escapeHtml(data.titleAccent || '')}</span>`;
      }

      // Update paragraphs
      if (data.paragraphs && data.paragraphs.length > 0) {
        storyBody.innerHTML = data.paragraphs.map(p => {
          if (p.includes('THANK YOU')) {
            return `<p>${escapeHtml(p).replace('THANK YOU', '<strong>THANK YOU</strong>')}</p>`;
          }
          return `<p>${escapeHtml(p)}</p>`;
        }).join('');

        // Add signoff
        if (data.signoff) {
          storyBody.innerHTML += `
            <p style="margin-top: 2rem;">
              <span style="color: var(--ember); font-family: var(--font-heading); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85rem;">${escapeHtml(data.signoff)}</span>
            </p>
          `;
        }
      }

      // Update stats
      if (storyStatsContainer && data.stats && data.stats.length > 0) {
        storyStatsContainer.innerHTML = data.stats.map(stat => `
          <div class="stat">
            <div class="stat__number" data-count="${parseInt(stat.number)}">0</div>
            <div class="stat__label">${escapeHtml(stat.label)}</div>
          </div>
        `).join('');

        // Re-observe the new counter elements
        storyStatsContainer.querySelectorAll('[data-count]').forEach(el => {
          const cObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const target = parseInt(el.dataset.count);
                const suffix = target > 10 ? '+' : '';
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
                }, 2000 / steps);
                cObserver.unobserve(el);
              }
            });
          }, { threshold: 0.5 });
          cObserver.observe(el);
        });
      }
    });
  }

  async function loadStoryContent() {
    try {
      const response = await fetch('story.json');
      if (!response.ok) throw new Error('Not ok');
      return await response.json();
    } catch (err) {
      console.warn('Could not fetch story.json, using localStorage/defaults.', err);
      const local = localStorage.getItem('warpigs_story');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
      return null;
    }
  }

  // ——— Load and Render Contact from JSON ———
  const contactSection = document.getElementById('contact');

  if (contactSection) {
    loadContactContent().then(data => {
      if (!data) return;

      const cLabel = contactSection.querySelector('.section-label');
      const cTitle = contactSection.querySelector('.section-title');
      const cDesc = contactSection.querySelector('.contact__desc');
      const cCard = contactSection.querySelector('.contact__card');

      if (cLabel && data.sectionLabel) cLabel.textContent = data.sectionLabel;

      if (cTitle && data.title) {
        cTitle.innerHTML = data.title.split('\n').map(line => escapeHtml(line)).join('<br>');
      }

      if (cDesc && data.description) cDesc.textContent = data.description;

      if (cCard) {
        let html = '';

        if (data.address) {
          html += `
            <div class="contact__item">
              <div class="contact__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div class="contact__label">${escapeHtml(data.address.label || 'Kitchen')}</div>
                <div class="contact__value">${escapeHtml(data.address.line1 || '')}<br>${escapeHtml(data.address.line2 || '')}</div>
              </div>
            </div>
          `;
        }

        if (data.phone) {
          const phoneHref = data.phone.href || ('tel:+1' + (data.phone.number || '').replace(/\D/g, ''));
          html += `
            <div class="contact__item">
              <div class="contact__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <div class="contact__label">${escapeHtml(data.phone.label || 'Phone')}</div>
                <div class="contact__value"><a href="${phoneHref}">${escapeHtml(data.phone.number || '')}</a></div>
              </div>
            </div>
          `;
        }

        if (data.email) {
          html += `
            <div class="contact__item">
              <div class="contact__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <div class="contact__label">${escapeHtml(data.email.label || 'Email')}</div>
                <div class="contact__value"><a href="mailto:${escapeHtml(data.email.address || '')}">${escapeHtml(data.email.address || '')}</a></div>
              </div>
            </div>
          `;
        }

        if (data.socials) {
          html += `<div class="contact__socials">`;
          if (data.socials.instagram) {
            html += `
              <a href="${data.socials.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="social-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            `;
          }
          if (data.socials.facebook) {
            html += `
              <a href="${data.socials.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="social-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            `;
          }
          html += `</div>`;
        }

        cCard.innerHTML = html;
      }
    });
  }

  async function loadContactContent() {
    try {
      const response = await fetch('contact.json');
      if (!response.ok) throw new Error('Not ok');
      return await response.json();
    } catch (err) {
      console.warn('Could not fetch contact.json, using localStorage/defaults.', err);
      const local = localStorage.getItem('warpigs_contact');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
      return null;
    }
  }

  // ——— Order Online Notice Modal ———
  function showOrderNoticeModal() {
    const modal = document.createElement('div');
    modal.className = 'venue-modal order-notice-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = `
      <div class="venue-modal__backdrop"></div>
      <div class="venue-modal__wrapper">
        <div class="venue-modal__content" style="max-width: 450px; text-align: center;">
          <button class="venue-modal__close" aria-label="Close modal">✕</button>
          <div class="venue-modal__header" style="text-align: center;">
            <div class="section-label" style="margin-bottom: 1rem;">Online Ordering</div>
            <h3 class="venue-modal__title" style="font-size: 2.2rem; margin-bottom: 1rem; letter-spacing: 0.05em;">Not Taking Orders</h3>
          </div>
          <div class="venue-modal__body" style="text-align: center; font-size: 1.1rem; line-height: 1.6; margin-top: 1rem;">
            <p>Not taking orders at this time however we are working on it and it won't be long. Check back soon</p>
          </div>
          <div class="venue-modal__actions" style="justify-content: center; margin-top: 2rem;">
            <button class="btn-notice-close venue-modal__close-btn">Okay</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Lock scroll
    
    // Animate show
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Close functions
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = ''; // Restore scroll
      }, 300);
    };
    
    modal.querySelector('.venue-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.venue-modal__backdrop').addEventListener('click', closeModal);
    modal.querySelector('.venue-modal__close-btn').addEventListener('click', closeModal);
    
    // Support Escape key to close
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  // Map click handlers for order notice links
  document.querySelectorAll('[data-order-notice]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showOrderNoticeModal();
    });
  });

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
