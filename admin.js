/**
 * Warpigs Admin Dashboard Scripts
 * Manages the schedule editor, story editor, contact editor,
 * tab navigation, and exporting configuration to JSON files.
 */
document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════
  //  SHARED UTILITIES
  // ═══════════════════════════════════════════

  // HTML escape helper
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toast system
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    
    if (type === 'error') {
      toast.classList.add('toast--error');
    } else {
      toast.classList.remove('toast--error');
    }
    
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // Fallback save using browser picker or download
  async function fallbackSave(filename, content) {
    if (window.showSaveFilePicker) {
      try {
        const options = {
          suggestedName: filename,
          types: [{
            description: 'JSON Data File',
            accept: { 'application/json': ['.json'] }
          }]
        };
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        showToast(`${filename} saved successfully!`);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.warn('File picker failed, falling back to download', err);
      }
    }
    downloadFile(filename, content);
  }

  // Generic save via PUT to local dev server (with automatic browser fallback)
  async function saveToFile(filename, content) {
    try {
      const response = await fetch(filename, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: content
      });
      if (response.ok) {
        showToast(`${filename} saved automatically to disk!`);
      } else {
        console.warn(`Server PUT returned status ${response.status}. Falling back to browser save.`);
        await fallbackSave(filename, content);
      }
    } catch (err) {
      console.warn('Server PUT connection failed. Falling back to browser save.', err);
      await fallbackSave(filename, content);
    }
  }

  // Generic download helper
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${filename} download started.`);
  }

  // ═══════════════════════════════════════════
  //  TAB NAVIGATION
  // ═══════════════════════════════════════════

  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      // Activate clicked
      tab.classList.add('active');
      const panel = document.querySelector(`[data-panel="${targetTab}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  // ═══════════════════════════════════════════
  //  SCHEDULE EDITOR
  // ═══════════════════════════════════════════

  let scheduleData = [];

  async function loadScheduleData() {
    await loadCities();
    await loadVenues();
    scheduleData = await loadSchedule();
    renderScheduleRows();
    updateScheduleCodePreview();
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
        try { return JSON.parse(local); } catch (e) {}
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

  function renderScheduleRows() {
    const list = document.getElementById('eventList');
    if (!list) return;
    list.innerHTML = '';
    
    if (scheduleData.length === 0) {
      list.innerHTML = `
        <div style="padding: 3rem 1rem; text-align: center; color: var(--cream-30); font-family: var(--font-heading); border: 1.5px dashed var(--cream-10); border-radius: 0.75rem;">
          No events scheduled. Click "Add New Event" to create one.
        </div>
      `;
      return;
    }

    scheduleData.forEach((event, index) => {
      const row = document.createElement('div');
      row.className = 'event-row';
      row.innerHTML = `
        <div class="form-group">
          <label>Date</label>
          <input type="text" class="form-control" value="${escapeHtml(event.date)}" placeholder="e.g. FRI · MAY 1" data-index="${index}" data-field="date">
        </div>
        <div class="form-group">
          <label>Venue</label>
          <input type="text" class="form-control" list="venuesDatalist" value="${escapeHtml(event.venue)}" placeholder="e.g. Lagunitas Tap Room" data-index="${index}" data-field="venue">
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" class="form-control" list="citiesDatalist" value="${escapeHtml(event.city)}" placeholder="e.g. Petaluma" data-index="${index}" data-field="city">
        </div>
        <div class="form-group">
          <label>Time</label>
          <input type="text" class="form-control" value="${escapeHtml(event.time)}" placeholder="e.g. 4–8pm" data-index="${index}" data-field="time">
        </div>
        <div class="row-actions">
          <button class="icon-btn move-up-btn" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>
            ↑
          </button>
          <button class="icon-btn move-down-btn" data-index="${index}" title="Move Down" ${index === scheduleData.length - 1 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>
            ↓
          </button>
          <button class="icon-btn icon-btn--delete delete-btn" data-index="${index}" title="Delete Event">
            ✕
          </button>
        </div>
      `;
      list.appendChild(row);
    });

    // Input listeners
    list.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        let val = e.target.value;
        if (field === 'date') {
          val = formatDateInput(val);
          e.target.value = val;
        } else if (field === 'time') {
          val = formatTimeInput(val);
          e.target.value = val;
        }
        scheduleData[idx][field] = val;
        updateScheduleCodePreview();
      });
    });

    // Button listeners
    list.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        moveScheduleEvent(parseInt(e.target.dataset.index), -1);
      });
    });
    list.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        moveScheduleEvent(parseInt(e.target.dataset.index), 1);
      });
    });
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        scheduleData.splice(parseInt(e.target.dataset.index), 1);
        renderScheduleRows();
        updateScheduleCodePreview();
      });
    });
  }

  function moveScheduleEvent(index, direction) {
    const target = index + direction;
    if (target >= 0 && target < scheduleData.length) {
      const temp = scheduleData[index];
      scheduleData[index] = scheduleData[target];
      scheduleData[target] = temp;
      renderScheduleRows();
      updateScheduleCodePreview();
    }
  }

  function generateScheduleJSON() {
    return JSON.stringify(scheduleData, null, 2);
  }

  function updateScheduleCodePreview() {
    const el = document.getElementById('codePreview');
    if (el) el.textContent = generateScheduleJSON();
  }

  // Schedule buttons
  const addEventBtn = document.getElementById('addEventBtn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      scheduleData.push({ date: 'FRI · JUN 5', venue: 'New Brewery Co.', city: 'Cotati', time: '4–8pm' });
      renderScheduleRows();
      updateScheduleCodePreview();
      setTimeout(() => {
        const rows = document.querySelectorAll('.event-row');
        if (rows.length > 0) rows[rows.length - 1].scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });
  }

  const saveLocalBtn = document.getElementById('saveLocalBtn');
  if (saveLocalBtn) {
    saveLocalBtn.addEventListener('click', () => {
      localStorage.setItem('warpigs_schedule', JSON.stringify(scheduleData));
      showToast('Schedule saved to browser! Refresh the Home page to preview.');
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Discard changes and restore factory schedule defaults?')) {
        localStorage.removeItem('warpigs_schedule');
        loadScheduleData();
        showToast('Restored default schedule configuration.');
      }
    });
  }

  const copyCodeBtn = document.getElementById('copyCodeBtn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateScheduleJSON()).then(() => {
        showToast('Schedule code copied to clipboard!');
      }).catch(err => showToast('Failed to copy: ' + err, 'error'));
    });
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => downloadFile('schedule.json', generateScheduleJSON()));
  }

  const saveFileBtn = document.getElementById('saveFileBtn');
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', async () => {
      await saveToFile('schedule.json', generateScheduleJSON());
      localStorage.setItem('warpigs_schedule', JSON.stringify(scheduleData));
    });
  }

  // ═══════════════════════════════════════════
  //  STORY EDITOR
  // ═══════════════════════════════════════════

  let storyData = {};

  const defaultStory = {
    sectionLabel: "The Story",
    title: "A WARPIGS",
    titleAccent: "History.",
    paragraphs: [
      "I started BBQ'ing in my backyard as a hobby with my then-roommate Bryan Lakey about 9 years ago. Soon after, I entered a couple of competitions and had some immediate success. I thought I was gonna win the Grand Royal right away! I then decided to stalk out my mentor, Gary Park of G's Slow Smoked BBQ.",
      "After about a month of harassment, Gary agreed to let me shadow him. He showed me his day-to-day operation and how to be a #bbqhustler. During the Sonoma County fires of 2018, I stalked my next mentor, Oscar Camacho of @camachossouthernstylebbq. I asked Camacho if he was going to help feed first responders and if I could help. He graciously accepted my help even though he knew nothing about me. Since then, Camacho has welcomed me in and been open with all his information.",
      "When I decided to take the next step in my evolution, @Juncture_taproom and @Remys_lounge were there to invite me in and help me with the next steps of growth. Now you can find my meats at pop-up BBQ beer pairings, private parties, and catering gigs. I am forever thankful to everyone in this journey.",
      "To my family, friends, and customers: THANK YOU."
    ],
    signoff: "— Larry H, Owner & Pitmaster",
    stats: [
      { number: 14, label: "Years Smoking" },
      { number: 500, label: "Events Catered" },
      { number: 1, label: "Pit Master" }
    ]
  };

  async function loadStoryData() {
    try {
      const response = await fetch('story.json');
      if (!response.ok) throw new Error('Network response was not ok');
      storyData = await response.json();
    } catch (err) {
      console.warn('Could not fetch story.json. Falling back to localStorage/defaults.', err);
      const local = localStorage.getItem('warpigs_story');
      if (local) {
        try { storyData = JSON.parse(local); return; } catch (e) {}
      }
      storyData = JSON.parse(JSON.stringify(defaultStory));
    }
    populateStoryForm();
  }

  function populateStoryForm() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('storySectionLabel', storyData.sectionLabel);
    setVal('storyTitle', storyData.title);
    setVal('storyTitleAccent', storyData.titleAccent);
    setVal('storySignoff', storyData.signoff);
    renderStoryParagraphs();
    renderStoryStats();
    updateStoryCodePreview();
  }

  function renderStoryParagraphs() {
    const container = document.getElementById('storyParagraphs');
    if (!container) return;
    container.innerHTML = '';

    if (!storyData.paragraphs || storyData.paragraphs.length === 0) {
      storyData.paragraphs = [''];
    }

    storyData.paragraphs.forEach((text, idx) => {
      const row = document.createElement('div');
      row.className = 'paragraph-row';
      row.innerHTML = `
        <div class="paragraph-number">${idx + 1}</div>
        <textarea data-index="${idx}" placeholder="Write paragraph content...">${escapeHtml(text)}</textarea>
        <div class="paragraph-actions">
          <button class="icon-btn icon-btn--delete para-delete-btn" data-index="${idx}" title="Remove Paragraph">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    // Input listeners
    container.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', (e) => {
        storyData.paragraphs[parseInt(e.target.dataset.index)] = e.target.value;
        updateStoryCodePreview();
      });
    });

    // Delete listeners
    container.querySelectorAll('.para-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        storyData.paragraphs.splice(parseInt(e.target.dataset.index), 1);
        renderStoryParagraphs();
        updateStoryCodePreview();
      });
    });
  }

  function renderStoryStats() {
    const container = document.getElementById('storyStats');
    if (!container) return;
    container.innerHTML = '';

    if (!storyData.stats) storyData.stats = [];

    storyData.stats.forEach((stat, idx) => {
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = `
        <div class="form-group">
          <label>Number</label>
          <input type="number" class="form-control stat-number" data-index="${idx}" value="${stat.number || 0}">
        </div>
        <div class="form-group">
          <label>Label</label>
          <input type="text" class="form-control stat-label" data-index="${idx}" value="${escapeHtml(stat.label || '')}">
        </div>
        <div class="row-actions">
          <button class="icon-btn icon-btn--delete stat-delete-btn" data-index="${idx}" title="Remove Stat">✕</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.stat-number').forEach(input => {
      input.addEventListener('change', (e) => {
        storyData.stats[parseInt(e.target.dataset.index)].number = parseInt(e.target.value) || 0;
        updateStoryCodePreview();
      });
    });

    container.querySelectorAll('.stat-label').forEach(input => {
      input.addEventListener('change', (e) => {
        storyData.stats[parseInt(e.target.dataset.index)].label = e.target.value;
        updateStoryCodePreview();
      });
    });

    container.querySelectorAll('.stat-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        storyData.stats.splice(parseInt(e.target.dataset.index), 1);
        renderStoryStats();
        updateStoryCodePreview();
      });
    });
  }

  // Gather story form data
  function gatherStoryData() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    storyData.sectionLabel = getVal('storySectionLabel');
    storyData.title = getVal('storyTitle');
    storyData.titleAccent = getVal('storyTitleAccent');
    storyData.signoff = getVal('storySignoff');
    // paragraphs and stats are already updated in real-time
    return storyData;
  }

  function generateStoryJSON() {
    gatherStoryData();
    return JSON.stringify(storyData, null, 2);
  }

  function updateStoryCodePreview() {
    const el = document.getElementById('storyCodePreview');
    if (el) el.textContent = generateStoryJSON();
  }

  // Listen for heading field changes to update preview
  ['storySectionLabel', 'storyTitle', 'storyTitleAccent', 'storySignoff'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => updateStoryCodePreview());
    }
  });

  // Add paragraph
  const addParagraphBtn = document.getElementById('addParagraphBtn');
  if (addParagraphBtn) {
    addParagraphBtn.addEventListener('click', () => {
      if (!storyData.paragraphs) storyData.paragraphs = [];
      storyData.paragraphs.push('');
      renderStoryParagraphs();
      updateStoryCodePreview();
    });
  }

  // Story save buttons
  const saveStoryLocalBtn = document.getElementById('saveStoryLocalBtn');
  if (saveStoryLocalBtn) {
    saveStoryLocalBtn.addEventListener('click', () => {
      localStorage.setItem('warpigs_story', generateStoryJSON());
      showToast('Story saved to browser! Refresh the Home page to preview.');
    });
  }

  const saveStoryFileBtn = document.getElementById('saveStoryFileBtn');
  if (saveStoryFileBtn) {
    saveStoryFileBtn.addEventListener('click', async () => {
      const content = generateStoryJSON();
      await saveToFile('story.json', content);
      localStorage.setItem('warpigs_story', content);
    });
  }

  const downloadStoryBtn = document.getElementById('downloadStoryBtn');
  if (downloadStoryBtn) {
    downloadStoryBtn.addEventListener('click', () => downloadFile('story.json', generateStoryJSON()));
  }

  const resetStoryBtn = document.getElementById('resetStoryBtn');
  if (resetStoryBtn) {
    resetStoryBtn.addEventListener('click', () => {
      if (confirm('Discard changes and restore the default story?')) {
        localStorage.removeItem('warpigs_story');
        storyData = JSON.parse(JSON.stringify(defaultStory));
        populateStoryForm();
        showToast('Restored default story.');
      }
    });
  }

  const copyStoryCodeBtn = document.getElementById('copyStoryCodeBtn');
  if (copyStoryCodeBtn) {
    copyStoryCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateStoryJSON()).then(() => {
        showToast('Story code copied to clipboard!');
      }).catch(err => showToast('Failed to copy: ' + err, 'error'));
    });
  }

  // ═══════════════════════════════════════════
  //  CONTACT EDITOR
  // ═══════════════════════════════════════════

  let contactData = {};

  const defaultContact = {
    sectionLabel: "Get in Touch",
    title: "Let's\nFeed Your\nPeople.",
    description: "Tell us about your event and we'll send a quote within 24 hours. Most weekends book 4–6 weeks ahead.",
    address: {
      label: "Kitchen",
      line1: "8492 So. Gravenstein Hwy",
      line2: "Cotati, CA 94931"
    },
    phone: {
      label: "Call the Pit",
      number: "(707) 508-5551",
      href: "tel:+17075085551"
    },
    email: {
      label: "Email",
      address: "larry@warpigsbarbeque.com"
    },
    socials: {
      instagram: "https://www.instagram.com/warpigs_craft_kitchen/",
      facebook: "https://www.facebook.com/WarPigsBBQinCali"
    }
  };

  async function loadContactData() {
    try {
      const response = await fetch('contact.json');
      if (!response.ok) throw new Error('Network response was not ok');
      contactData = await response.json();
    } catch (err) {
      console.warn('Could not fetch contact.json. Falling back to localStorage/defaults.', err);
      const local = localStorage.getItem('warpigs_contact');
      if (local) {
        try { contactData = JSON.parse(local); return; } catch (e) {}
      }
      contactData = JSON.parse(JSON.stringify(defaultContact));
    }
    populateContactForm();
  }

  function populateContactForm() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('contactSectionLabel', contactData.sectionLabel);
    setVal('contactTitle', contactData.title);
    setVal('contactDescription', contactData.description);
    setVal('contactAddressLabel', contactData.address?.label);
    setVal('contactAddressLine1', contactData.address?.line1);
    setVal('contactAddressLine2', contactData.address?.line2);
    setVal('contactPhoneLabel', contactData.phone?.label);
    setVal('contactPhoneNumber', contactData.phone?.number);
    setVal('contactEmailLabel', contactData.email?.label);
    setVal('contactEmailAddress', contactData.email?.address);
    setVal('contactInstagram', contactData.socials?.instagram);
    setVal('contactFacebook', contactData.socials?.facebook);
    updateContactCodePreview();
  }

  function gatherContactData() {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };

    contactData.sectionLabel = getVal('contactSectionLabel');
    contactData.title = getVal('contactTitle');
    contactData.description = getVal('contactDescription');
    
    if (!contactData.address) contactData.address = {};
    contactData.address.label = getVal('contactAddressLabel');
    contactData.address.line1 = getVal('contactAddressLine1');
    contactData.address.line2 = getVal('contactAddressLine2');

    if (!contactData.phone) contactData.phone = {};
    contactData.phone.label = getVal('contactPhoneLabel');
    contactData.phone.number = getVal('contactPhoneNumber');
    // Auto-generate the href from the phone number
    contactData.phone.href = 'tel:+1' + getVal('contactPhoneNumber').replace(/\D/g, '');

    if (!contactData.email) contactData.email = {};
    contactData.email.label = getVal('contactEmailLabel');
    contactData.email.address = getVal('contactEmailAddress');

    if (!contactData.socials) contactData.socials = {};
    contactData.socials.instagram = getVal('contactInstagram');
    contactData.socials.facebook = getVal('contactFacebook');

    return contactData;
  }

  function generateContactJSON() {
    gatherContactData();
    return JSON.stringify(contactData, null, 2);
  }

  function updateContactCodePreview() {
    const el = document.getElementById('contactCodePreview');
    if (el) el.textContent = generateContactJSON();
  }

  // Listen for all contact form changes
  const contactFields = [
    'contactSectionLabel', 'contactTitle', 'contactDescription',
    'contactAddressLabel', 'contactAddressLine1', 'contactAddressLine2',
    'contactPhoneLabel', 'contactPhoneNumber',
    'contactEmailLabel', 'contactEmailAddress',
    'contactInstagram', 'contactFacebook'
  ];
  contactFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => updateContactCodePreview());
    }
  });

  // Contact save buttons
  const saveContactLocalBtn = document.getElementById('saveContactLocalBtn');
  if (saveContactLocalBtn) {
    saveContactLocalBtn.addEventListener('click', () => {
      localStorage.setItem('warpigs_contact', generateContactJSON());
      showToast('Contact info saved to browser! Refresh the Home page to preview.');
    });
  }

  const saveContactFileBtn = document.getElementById('saveContactFileBtn');
  if (saveContactFileBtn) {
    saveContactFileBtn.addEventListener('click', async () => {
      const content = generateContactJSON();
      await saveToFile('contact.json', content);
      localStorage.setItem('warpigs_contact', content);
    });
  }

  const downloadContactBtn = document.getElementById('downloadContactBtn');
  if (downloadContactBtn) {
    downloadContactBtn.addEventListener('click', () => downloadFile('contact.json', generateContactJSON()));
  }

  const resetContactBtn = document.getElementById('resetContactBtn');
  if (resetContactBtn) {
    resetContactBtn.addEventListener('click', () => {
      if (confirm('Discard changes and restore the default contact info?')) {
        localStorage.removeItem('warpigs_contact');
        contactData = JSON.parse(JSON.stringify(defaultContact));
        populateContactForm();
        showToast('Restored default contact info.');
      }
    });
  }

  const copyContactCodeBtn = document.getElementById('copyContactCodeBtn');
  if (copyContactCodeBtn) {
    copyContactCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateContactJSON()).then(() => {
        showToast('Contact code copied to clipboard!');
      }).catch(err => showToast('Failed to copy: ' + err, 'error'));
    });
  }

  // ═══════════════════════════════════════════
  //  DATE & TIME FORMATTERS (Schedule)
  // ═══════════════════════════════════════════

  function formatDateInput(val) {
    const clean = val.trim().toUpperCase();
    
    const targetPattern = /^[A-Z]{3}\s*·\s*[A-Z]{3}\s*\d{1,2}$/;
    if (targetPattern.test(clean)) {
      return clean.replace(/\s+/g, ' ');
    }

    const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10);
      const day = parseInt(slashMatch[2], 10);
      let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day);
        return formatFromDate(d);
      }
    }

    const monthsList = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthsFull = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const textMatch = clean.match(/^([A-Z]+)\s+(\d{1,2})(?:\s*,?\s*(\d{2,4}))?$/);
    if (textMatch) {
      const mStr = textMatch[1];
      const day = parseInt(textMatch[2], 10);
      let year = textMatch[3] ? parseInt(textMatch[3], 10) : new Date().getFullYear();
      if (year < 100) year += 2000;
      
      let monthIdx = monthsList.indexOf(mStr.substring(0, 3));
      if (monthIdx === -1) monthIdx = monthsFull.indexOf(mStr);
      
      if (monthIdx !== -1 && day >= 1 && day <= 31) {
        const d = new Date(year, monthIdx, day);
        return formatFromDate(d);
      }
    }

    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
      const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      if (isoMatch) {
        const d = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
        return formatFromDate(d);
      }
      const d = new Date(parsed);
      return formatFromDate(d);
    }

    return val;
  }

  function formatFromDate(d) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
  }

  function formatTimeInput(val) {
    const clean = val.trim();
    const rangeDelimiters = /[-–—]|\s+to\s+/i;
    if (!rangeDelimiters.test(clean)) return clean;

    const parts = clean.split(rangeDelimiters);
    if (parts.length === 2) {
      const startFormatted = formatSingleTime(parts[0].trim());
      const endFormatted = formatSingleTime(parts[1].trim());
      if (startFormatted && endFormatted) {
        return `${startFormatted} to ${endFormatted}`;
      }
    }
    return val;
  }

  function formatSingleTime(timeStr) {
    const clean = timeStr.toLowerCase().replace(/\s+/g, '');
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
    if (!match) return null;
    return `${match[1]}:${match[2] || '00'}${match[3] || ''}`;
  }

  // ═══════════════════════════════════════════
  //  CITY & VENUE AUTOCOMPLETE
  // ═══════════════════════════════════════════

  async function loadCities() {
    try {
      const response = await fetch('cities.json');
      if (!response.ok) throw new Error('Could not load cities.json');
      const cities = await response.json();
      populateCitiesDatalist(cities);
    } catch (err) {
      console.warn('Could not load cities.json. Falling back to default list.', err);
      populateCitiesDatalist([
        "Cloverdale", "Cotati", "Healdsburg", "Petaluma", 
        "Rohnert Park", "Santa Rosa", "Sebastopol", "Sonoma", "Windsor"
      ]);
    }
  }

  function populateCitiesDatalist(cities) {
    const datalist = document.getElementById('citiesDatalist');
    if (!datalist) return;
    datalist.innerHTML = cities.map(city => `<option value="${escapeHtml(city)}">`).join('');
  }

  async function loadVenues() {
    try {
      const response = await fetch('venues.json');
      if (!response.ok) throw new Error('Could not load venues.json');
      const venues = await response.json();
      populateVenuesDatalist(venues);
    } catch (err) {
      console.warn('Could not load venues.json. Falling back to default list.', err);
      populateVenuesDatalist([
        "Chateau Diana", "Cotati Brewing Co.", "HenHouse Brewing", 
        "Lagunitas Tap Room", "Mercy Lounge", "Parliament Brewery", 
        "Private Catering", "RV Taproom", "Shady Oak", "Windsor Town Green"
      ]);
    }
  }

  function populateVenuesDatalist(venues) {
    const datalist = document.getElementById('venuesDatalist');
    if (!datalist) return;
    datalist.innerHTML = venues.map(venue => `<option value="${escapeHtml(venue)}">`).join('');
  }

  // ═══════════════════════════════════════════
  //  INIT — Load all data
  // ═══════════════════════════════════════════

  loadScheduleData();
  loadStoryData();
  loadContactData();
});
