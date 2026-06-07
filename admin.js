/**
 * Warpigs Admin Dashboard Scripts
 * Manages the schedule editor rows, reordering list states,
 * and exporting configuration back to schedule.js.
 */
document.addEventListener('DOMContentLoaded', () => {
  let scheduleData = [];

  // Load schedule from JS / localstorage
  function loadData() {
    scheduleData = getWarpigsSchedule();
    renderRows();
    updateCodePreview();
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
          <input type="text" class="form-control" value="${escapeHtml(event.venue)}" placeholder="e.g. Lagunitas Tap Room" data-index="${index}" data-field="venue">
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" class="form-control" value="${escapeHtml(event.city)}" placeholder="e.g. Petaluma" data-index="${index}" data-field="city">
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
        scheduleData[idx][field] = e.target.value;
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

  // Generate schedule.js text
  function generateScheduleFileContent() {
    const dataString = JSON.stringify(scheduleData, null, 2);
    return `/**
 * Warpigs Schedule Data
 * Stored as a global configuration script to allow simple file:// protocol usage without CORS issues.
 */
const DEFAULT_WARPIGS_SCHEDULE = ${dataString};

function getWarpigsSchedule() {
  const local = localStorage.getItem('warpigs_schedule');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing local storage schedule:', e);
    }
  }
  return DEFAULT_WARPIGS_SCHEDULE;
}
`;
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
      const blob = new Blob([generateScheduleFileContent()], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schedule.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('schedule.js download started.');
    });
  }

  // File System Access API Save
  const saveFileBtn = document.getElementById('saveFileBtn');
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', async () => {
      try {
        const options = {
          suggestedName: 'schedule.js',
          types: [{
            description: 'JavaScript Config File',
            accept: { 'text/javascript': ['.js'] }
          }]
        };
        // Check if supported
        if (!window.showSaveFilePicker) {
          throw new Error('Your browser does not support the File System Access API. Please use "Download schedule.js" instead.');
        }
        
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(generateScheduleFileContent());
        await writable.close();
        
        // Also save to local storage as fallback preview
        localStorage.setItem('warpigs_schedule', JSON.stringify(scheduleData));
        showToast('File schedule.js saved successfully!');
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

  // Load initial data
  loadData();
});
