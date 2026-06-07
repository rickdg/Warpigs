/**
 * Warpigs Admin Dashboard Scripts
 * Manages the schedule editor rows, reordering list states,
 * and exporting configuration back to schedule.js.
 */
document.addEventListener('DOMContentLoaded', () => {
  let scheduleData = [];

  // Load schedule from JSON / localstorage
  async function loadData() {
    await loadCities(); // Load autocomplete cities first
    await loadVenues(); // Load autocomplete venues
    scheduleData = await loadSchedule();
    renderRows();
    updateCodePreview();
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

  // Render event rows
  function renderRows() {
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

    // Attach event listeners for inputs
    list.querySelectorAll('.form-control').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        let val = e.target.value;
        if (field === 'date') {
          val = formatDateInput(val);
          e.target.value = val; // Update UI immediately
        } else if (field === 'time') {
          val = formatTimeInput(val);
          e.target.value = val; // Update UI immediately
        }
        scheduleData[idx][field] = val;
        updateCodePreview();
      });
    });

    // Attach event listeners for buttons
    list.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        moveEvent(idx, -1);
      });
    });

    list.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        moveEvent(idx, 1);
      });
    });

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        deleteEvent(idx);
      });
    });
  }

  function deleteEvent(index) {
    scheduleData.splice(index, 1);
    renderRows();
    updateCodePreview();
  }

  function moveEvent(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < scheduleData.length) {
      const temp = scheduleData[index];
      scheduleData[index] = scheduleData[targetIndex];
      scheduleData[targetIndex] = temp;
      renderRows();
      updateCodePreview();
    }
  }

  // Add new event
  const addEventBtn = document.getElementById('addEventBtn');
  if (addEventBtn) {
    addEventBtn.addEventListener('click', () => {
      scheduleData.push({ date: 'FRI · JUN 5', venue: 'New Brewery Co.', city: 'Cotati', time: '4–8pm' });
      renderRows();
      updateCodePreview();
      
      // Auto-scroll to the new item
      setTimeout(() => {
        const rows = document.querySelectorAll('.event-row');
        if (rows.length > 0) {
          rows[rows.length - 1].scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    });
  }

  // Generate schedule.json text
  function generateScheduleFileContent() {
    return JSON.stringify(scheduleData, null, 2);
  }

  function updateCodePreview() {
    const codePreview = document.getElementById('codePreview');
    if (codePreview) {
      codePreview.textContent = generateScheduleFileContent();
    }
  }

  // Save Local
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  if (saveLocalBtn) {
    saveLocalBtn.addEventListener('click', () => {
      localStorage.setItem('warpigs_schedule', JSON.stringify(scheduleData));
      showToast('Saved to local browser! Refresh the Home page to preview.');
    });
  }

  // Reset Defaults
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Discard changes and restore factory schedule defaults?')) {
        localStorage.removeItem('warpigs_schedule');
        loadData();
        showToast('Restored default schedule configuration.');
      }
    });
  }

  // Copy Code
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateScheduleFileContent()).then(() => {
        showToast('Code copied to clipboard!');
      }).catch(err => {
        showToast('Failed to copy: ' + err, 'error');
      });
    });
  }

  // Download File
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([generateScheduleFileContent()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schedule.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('schedule.json download started.');
    });
  }

  // File System Access API Save
  const saveFileBtn = document.getElementById('saveFileBtn');
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', async () => {
      try {
        const options = {
          suggestedName: 'schedule.json',
          types: [{
            description: 'JSON Data File',
            accept: { 'application/json': ['.json'] }
          }]
        };
        // Check if supported
        if (!window.showSaveFilePicker) {
          throw new Error('Your browser does not support the File System Access API. Please use "Download schedule.json" instead.');
        }
        
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(generateScheduleFileContent());
        await writable.close();
        
        // Also save to local storage as fallback preview
        localStorage.setItem('warpigs_schedule', JSON.stringify(scheduleData));
        showToast('File schedule.json saved successfully!');
      } catch (err) {
        console.error(err);
        if (err.name !== 'AbortError') {
          showToast(err.message, 'error');
        }
      }
    });
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

  // Helper to parse user date input and convert to "SAT · JUN 6" format
  function formatDateInput(val) {
    const clean = val.trim().toUpperCase();
    
    // If it's already in the correct format "SAT · JUN 6", return it.
    const targetPattern = /^[A-Z]{3}\s*·\s*[A-Z]{3}\s*\d{1,2}$/;
    if (targetPattern.test(clean)) {
      return clean.replace(/\s+/g, ' '); // normalize spaces
    }

    // Try parsing custom formats first, e.g. "6/6/2026" or "6/6"
    const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10);
      const day = parseInt(slashMatch[2], 10);
      let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : new Date().getFullYear();
      if (year < 100) {
        year += 2000; // handle "26" as "2026"
      }
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day);
        return formatFromDate(d);
      }
    }

    // Try natural text formats: "June 6", "June 6, 2026", "Jun 6", etc.
    const monthsList = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthsFull = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const textMatch = clean.match(/^([A-Z]+)\s+(\d{1,2})(?:\s*,?\s*(\d{2,4}))?$/);
    if (textMatch) {
      const mStr = textMatch[1];
      const day = parseInt(textMatch[2], 10);
      let year = textMatch[3] ? parseInt(textMatch[3], 10) : new Date().getFullYear();
      if (year < 100) {
        year += 2000;
      }
      
      let monthIdx = monthsList.indexOf(mStr.substring(0, 3));
      if (monthIdx === -1) {
        monthIdx = monthsFull.indexOf(mStr);
      }
      
      if (monthIdx !== -1 && day >= 1 && day <= 31) {
        const d = new Date(year, monthIdx, day);
        return formatFromDate(d);
      }
    }

    // Fallback to JS standard parser
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

    return val; // If we can't parse it, return raw value
  }

  function formatFromDate(d) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
  }

  // Load cities list for autocomplete
  async function loadCities() {
    try {
      const response = await fetch('cities.json');
      if (!response.ok) throw new Error('Could not load cities.json');
      const cities = await response.json();
      populateCitiesDatalist(cities);
    } catch (err) {
      console.warn('Could not load cities.json. Falling back to default list.', err);
      // Hardcode fallback just in case fetch fails locally
      const defaultCities = [
        "Cloverdale", "Cotati", "Healdsburg", "Petaluma", 
        "Rohnert Park", "Santa Rosa", "Sebastopol", "Sonoma", "Windsor"
      ];
      populateCitiesDatalist(defaultCities);
    }
  }

  function populateCitiesDatalist(cities) {
    const datalist = document.getElementById('citiesDatalist');
    if (!datalist) return;
    datalist.innerHTML = cities
      .map(city => `<option value="${escapeHtml(city)}">`)
      .join('');
  }

  // Load venues list for autocomplete
  async function loadVenues() {
    try {
      const response = await fetch('venues.json');
      if (!response.ok) throw new Error('Could not load venues.json');
      const venues = await response.json();
      populateVenuesDatalist(venues);
    } catch (err) {
      console.warn('Could not load venues.json. Falling back to default list.', err);
      // Hardcode fallback just in case fetch fails locally
      const defaultVenues = [
        "Chateau Diana", "Cotati Brewing Co.", "HenHouse Brewing", 
        "Lagunitas Tap Room", "Mercy Lounge", "Parliament Brewery", 
        "Private Catering", "RV Taproom", "Shady Oak", "Windsor Town Green"
      ];
      populateVenuesDatalist(defaultVenues);
    }
  }

  function populateVenuesDatalist(venues) {
    const datalist = document.getElementById('venuesDatalist');
    if (!datalist) return;
    datalist.innerHTML = venues
      .map(venue => `<option value="${escapeHtml(venue)}">`)
      .join('');
  }

  // Helper to format time input to "4:00 to 10:00"
  function formatTimeInput(val) {
    const clean = val.trim();
    
    // Check if it looks like a range
    const rangeDelimiters = /[-–—]|\s+to\s+/i;
    if (!rangeDelimiters.test(clean)) {
      return clean; // If no range, return as is (e.g. "Booked", "TBA")
    }

    const parts = clean.split(rangeDelimiters);
    if (parts.length === 2) {
      const startStr = parts[0].trim();
      const endStr = parts[1].trim();
      
      const startFormatted = formatSingleTime(startStr);
      const endFormatted = formatSingleTime(endStr);
      
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
    
    const hour = match[1];
    const min = match[2] || '00';
    const ampm = match[3] || '';
    
    return `${hour}:${min}${ampm}`;
  }

  // Load initial data
  loadData();
});
