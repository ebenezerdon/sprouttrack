(function($){
  'use strict';
  window.App = window.App || {};

  // Internal state defaults
  const defaultState = () => ({
    version: 1,
    units: 'metric', // metric | imperial (display only)
    children: [],
    selectedChildId: null
  });

  // Seed demo data on first load
  function seedDemo(){
    const id = window.App.Helpers.uid('child');
    const today = new Date();
    const d = (offsetDays) => { const t = new Date(today); t.setDate(t.getDate() - offsetDays); return t.toISOString().slice(0,10); };
    const child = {
      id,
      name: 'Avery',
      birthdate: new Date(new Date().setFullYear(today.getFullYear()-1)).toISOString().slice(0,10),
      sex: 'unspecified',
      color: '#fb923c',
      measurements: [
        { id: window.App.Helpers.uid('m'), date: d(300), weightKg: 6.2, heightCm: 60.0, headCm: 40.0, notes: 'First visit' },
        { id: window.App.Helpers.uid('m'), date: d(220), weightKg: 7.4, heightCm: 66.2, headCm: 42.0, notes: '' },
        { id: window.App.Helpers.uid('m'), date: d(150), weightKg: 8.3, heightCm: 70.1, headCm: 43.2, notes: 'Sleeping better' },
        { id: window.App.Helpers.uid('m'), date: d(90),  weightKg: 9.1, heightCm: 73.3, headCm: 44.3, notes: '' },
        { id: window.App.Helpers.uid('m'), date: d(30),  weightKg: 9.8, heightCm: 76.8, headCm: 45.0, notes: 'Lots of crawling' }
      ]
    };
    return { ...defaultState(), children: [child], selectedChildId: id };
  }

  // State on App
  window.App.state = defaultState();

  // Helpers for state access
  function getSelectedChild(){
    const s = window.App.state;
    if (!s.selectedChildId) return null;
    return s.children.find(c => c.id === s.selectedChildId) || null;
  }

  function saveState(){ window.App.Storage.save(window.App.state); }

  // Rendering functions
  function renderSidebar(){
    const s = window.App.state;
    const $list = $('#childrenList').empty();
    if (!s.children.length){
      $list.append($(`<li class="text-sm text-slate-600">No children yet. Click "Add child" to begin.</li>`));
      return;
    }
    s.children.forEach(child => {
      const isActive = s.selectedChildId === child.id;
      const $item = $(`
        <li>
          <button class="w-full flex items-center gap-3 p-2 rounded-xl ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-slate-200" data-id="${child.id}">
            <div class="h-9 w-9 rounded-lg shrink-0 grid place-content-center text-white font-extrabold shadow" style="background:${child.color}">${(child.name||'?').slice(0,1).toUpperCase()}</div>
            <div class="flex-1 text-left">
              <p class="text-sm font-semibold">${child.name}</p>
              <p class="text-xs ${isActive ? 'text-white/80':'text-slate-500'}">${window.App.Helpers.formatDate(child.birthdate)}</p>
            </div>
          </button>
        </li>
      `);
      $item.on('click','button', function(){ window.App.state.selectedChildId = child.id; saveState(); window.App.render(); });
      $list.append($item);
    });
  }

  function renderHeader(){
    const child = getSelectedChild();
    const $name = $('#childName');
    const $meta = $('#childMeta');
    const $avatar = $('#childAvatar');
    if (!child){
      $name.text('No child selected');
      $meta.text('Add a child to get started.');
      $avatar.text('?').css('background', '#94a3b8');
      return;
    }
    $name.text(child.name);
    $meta.text('Born ' + window.App.Helpers.formatDate(child.birthdate));
    $avatar.text((child.name||'?').slice(0,1).toUpperCase()).css('background', child.color || '#fb923c');
  }

  function enrichMeasurements(child){
    const sorted = window.App.Helpers.sortByDateAsc(child.measurements || []);
    return sorted.map(m => ({
      ...m,
      age: window.App.Helpers.ageBetween(child.birthdate, m.date),
      bmi: window.App.Helpers.bmi(m.weightKg, m.heightCm)
    }));
  }

  function unitLabels(){
    const u = window.App.state.units;
    return {
      weight: u === 'metric' ? 'kg' : 'lb',
      length: u === 'metric' ? 'cm' : 'in'
    };
  }

  function displayValue(type, value){
    if (value === null || value === undefined || value === '') return '';
    const u = window.App.state.units;
    if (type === 'weight') return (u === 'metric' ? value : window.App.Helpers.kgToLb(value)).toFixed(2);
    if (type === 'length') return (u === 'metric' ? value : window.App.Helpers.cmToIn(value)).toFixed(2);
    return value;
  }

  function renderSparklines(child){
    const ms = enrichMeasurements(child);
    const wVals = ms.filter(m=>m.weightKg!=null).map(m=>m.weightKg);
    const hVals = ms.filter(m=>m.heightCm!=null).map(m=>m.heightCm);
    const headVals = ms.filter(m=>m.headCm!=null).map(m=>m.headCm);

    const renderSpark = (selector, values, stroke) => {
      const $wrap = $(selector).empty();
      const w = $wrap.width() || 300; const h = $wrap.height() || 100;
      if (!values.length){ $wrap.append($('<div class="text-xs text-slate-500">No data</div>')); return; }
      const pts = window.App.Helpers.mapToSparkline(values, w, h);
      const d = window.App.Helpers.buildSvgPath(pts);
      const $svg = $(`<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" stroke="${stroke}" stroke-width="2.5" fill="none"/></svg>`);
      $wrap.append($svg);
    };

    renderSpark('#sparkWeight', wVals, '#fb923c');
    renderSpark('#sparkHeight', hVals, '#60a5fa');
    renderSpark('#sparkHead', headVals, '#f59e0b');
  }

  function renderTable(child){
    const $tbody = $('#measurementsTbody').empty();
    if (!child || !child.measurements || !child.measurements.length){
      $tbody.append($('<tr><td class="py-3 text-slate-600" colspan="8">No measurements yet.</td></tr>'));
      return;
    }
    const ms = enrichMeasurements(child);
    ms.forEach(m => {
      const $tr = $(`
        <tr class="align-top">
          <td class="py-3 pr-4 whitespace-nowrap">${window.App.Helpers.formatDate(m.date)}</td>
          <td class="py-3 pr-4">${m.age}</td>
          <td class="py-3 pr-4">${displayValue('weight', m.weightKg)} ${unitLabels().weight}</td>
          <td class="py-3 pr-4">${displayValue('length', m.heightCm)} ${unitLabels().length}</td>
          <td class="py-3 pr-4">${displayValue('length', m.headCm)} ${unitLabels().length}</td>
          <td class="py-3 pr-4">${m.bmi || ''}</td>
          <td class="py-3 pr-4 max-w-[280px]">${(m.notes||'')}</td>
          <td class="py-3 pr-4 whitespace-nowrap">
            <button class="btn-ghost text-xs" data-action="edit" data-id="${m.id}">Edit</button>
            <button class="btn-ghost text-xs" data-action="delete" data-id="${m.id}">Delete</button>
          </td>
        </tr>
      `);
      $tbody.append($tr);
    });
  }

  function updateUnitLabels(){
    const labels = unitLabels();
    $('.weightUnitLabel').text(labels.weight);
    $('.heightUnitLabel').text(labels.length);
    $('.headUnitLabel').text(labels.length);
    $('#unitLabel').text(window.App.state.units === 'metric' ? 'Metric' : 'Imperial');
  }

  function openChildModal(mode, child){
    $('#childModalTitle').text(mode === 'edit' ? 'Edit child' : 'Add child');
    if (mode === 'edit' && child){
      $('#childId').val(child.id);
      $('#childNameInput').val(child.name || '');
      $('#childBirthInput').val(child.birthdate || '');
      $('#childSexInput').val(child.sex || 'unspecified');
      $('#childColorInput').val(child.color || '#fb923c');
    } else {
      $('#childId').val('');
      $('#childNameInput').val('');
      $('#childBirthInput').val('');
      $('#childSexInput').val('unspecified');
      $('#childColorInput').val('#fb923c');
    }
    $('#childModal').removeClass('hidden').addClass('flex');
    $('#childNameInput').trigger('focus');
  }

  function closeChildModal(){ $('#childModal').removeClass('flex').addClass('hidden'); }

  function bindEvents(){
    // Sidebar toggle on small screens
    $('#toggleSidebar').on('click', function(){
      const $sb = $('#sidebar');
      if ($sb.hasClass('hidden')) { $sb.removeClass('hidden').addClass('block'); $(this).attr('aria-expanded','true'); }
      else { $sb.addClass('hidden').removeClass('block'); $(this).attr('aria-expanded','false'); }
    });

    // Child modal open/close
    $('#addChildBtn').on('click', function(){ openChildModal('add'); });
    $('#editChildBtn').on('click', function(){ const c = getSelectedChild(); if (c) openChildModal('edit', c); });
    $('#closeChildModal, #cancelChildBtn').on('click', function(){ closeChildModal(); });

    // Close on backdrop click
    $('#childModal').on('click', function(e){ if (e.target === this) { closeChildModal(); } });
    // Close on ESC key
    $(document).on('keydown', function(e){ if (e.key === 'Escape') { closeChildModal(); } });

    // Child form submit
    $('#childForm').on('submit', function(e){
      e.preventDefault();
      const id = $('#childId').val();
      const payload = {
        id: id || window.App.Helpers.uid('child'),
        name: String($('#childNameInput').val() || '').trim().slice(0,40) || 'Unnamed',
        birthdate: window.App.Helpers.toISO($('#childBirthInput').val()),
        sex: $('#childSexInput').val() || 'unspecified',
        color: $('#childColorInput').val() || '#fb923c',
      };
      if (!payload.birthdate){ alert('Please choose a valid birthdate.'); return; }
      const s = window.App.state;
      const existingIdx = s.children.findIndex(c => c.id === payload.id);
      if (existingIdx >= 0){
        // preserve measurements
        payload.measurements = s.children[existingIdx].measurements || [];
        s.children.splice(existingIdx, 1, payload);
      } else {
        payload.measurements = [];
        s.children.push(payload);
        s.selectedChildId = payload.id;
      }
      saveState();
      closeChildModal();
      window.App.render();
    });

    // Delete child
    $('#deleteChildBtn').on('click', function(){
      const c = getSelectedChild();
      if (!c) return;
      const ok = confirm('Delete ' + c.name + ' and all measurements? This cannot be undone.');
      if (!ok) return;
      const s = window.App.state;
      s.children = s.children.filter(x => x.id !== c.id);
      s.selectedChildId = s.children[0] ? s.children[0].id : null;
      saveState();
      window.App.render();
    });

    // Measurement form
    $('#measurementForm').on('submit', function(e){
      e.preventDefault();
      const c = getSelectedChild(); if (!c){ alert('Please add a child first.'); return; }
      const date = window.App.Helpers.toISO($('#mDate').val());
      const weightInput = window.App.Helpers.sanitizeNumber($('#mWeight').val());
      const heightInput = window.App.Helpers.sanitizeNumber($('#mHeight').val());
      const headInput = window.App.Helpers.sanitizeNumber($('#mHead').val());
      const notes = String($('#mNotes').val() || '').trim().slice(0,120);

      if (!date){ alert('Please enter a valid date.'); return; }
      if (weightInput==null && heightInput==null && headInput==null){ alert('Enter at least one measurement value.'); return; }

      // Convert display units to metric for storage
      let weightKg = weightInput;
      let heightCm = heightInput;
      let headCm = headInput;
      if (window.App.state.units === 'imperial'){
        if (weightKg!=null) weightKg = window.App.Helpers.lbToKg(weightKg);
        if (heightCm!=null) heightCm = window.App.Helpers.inToCm(heightCm);
        if (headCm!=null) headCm = window.App.Helpers.inToCm(headCm);
      }

      // Upsert measurement if same date exists
      const existing = (c.measurements||[]).find(m => m.date === date);
      if (existing){
        existing.weightKg = weightKg!=null ? weightKg : existing.weightKg;
        existing.heightCm = heightCm!=null ? heightCm : existing.heightCm;
        existing.headCm = headCm!=null ? headCm : existing.headCm;
        existing.notes = notes || existing.notes;
      } else {
        c.measurements.push({ id: window.App.Helpers.uid('m'), date, weightKg, heightCm, headCm, notes });
      }

      // Clear inputs but keep date
      $('#mWeight').val(''); $('#mHeight').val(''); $('#mHead').val(''); $('#mNotes').val('');

      saveState();
      window.App.render();
    });

    // Measurement row actions
    $('#measurementsTbody').on('click', 'button', function(){
      const id = $(this).data('id');
      const action = $(this).data('action');
      const c = getSelectedChild(); if (!c) return;
      const idx = c.measurements.findIndex(m => m.id === id);
      if (idx < 0) return;
      if (action === 'delete'){
        if (!confirm('Delete this entry?')) return;
        c.measurements.splice(idx,1);
        saveState();
        window.App.render();
      }
      if (action === 'edit'){
        const m = c.measurements[idx];
        // Preload form for quick edit
        $('#mDate').val(m.date);
        const u = window.App.state.units;
        $('#mWeight').val(u==='metric' ? (m.weightKg ?? '') : (m.weightKg!=null? window.App.Helpers.kgToLb(m.weightKg).toFixed(2):''));
        $('#mHeight').val(u==='metric' ? (m.heightCm ?? '') : (m.heightCm!=null? window.App.Helpers.cmToIn(m.heightCm).toFixed(2):''));
        $('#mHead').val(u==='metric' ? (m.headCm ?? '') : (m.headCm!=null? window.App.Helpers.cmToIn(m.headCm).toFixed(2):''));
        $('#mNotes').val(m.notes || '');
        $('html, body').animate({ scrollTop: $('#measurementForm').offset().top - 80 }, 300);
      }
    });

    // Range filter (simple client filter on table)
    $('#rangeFilter').on('change', function(){ window.App.render(); });

    // Unit toggle
    $('#unitToggle').on('click', function(){
      window.App.state.units = window.App.state.units === 'metric' ? 'imperial' : 'metric';
      saveState();
      updateUnitLabels();
      window.App.render();
    });

    // Clear all measurements
    $('#clearAllBtn').on('click', function(){
      const c = getSelectedChild(); if (!c) return;
      if (!confirm('Remove all measurements for ' + c.name + '?')) return;
      c.measurements = [];
      saveState();
      window.App.render();
    });

    // Export
    $('#exportBtn').on('click', function(){
      try {
        const data = JSON.stringify(window.App.state, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sprouttrack-backup.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch(e){ alert('Export failed.'); console.error(e); }
    });

    // Import
    $('#importInput').on('change', function(e){
      const file = e.target.files && e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(){
        try {
          const json = JSON.parse(String(reader.result));
          // Simple shape check
          if (!json || !json.children || !Array.isArray(json.children)) throw new Error('Invalid file');
          window.App.state = {
            version: 1,
            units: json.units === 'imperial' ? 'imperial' : 'metric',
            children: json.children.map(c => ({
              id: c.id || window.App.Helpers.uid('child'),
              name: String(c.name || 'Child'),
              birthdate: window.App.Helpers.toISO(c.birthdate || new Date()),
              sex: c.sex || 'unspecified',
              color: c.color || '#fb923c',
              measurements: Array.isArray(c.measurements) ? c.measurements.map(m => ({
                id: m.id || window.App.Helpers.uid('m'),
                date: window.App.Helpers.toISO(m.date),
                weightKg: m.weightKg!=null ? Number(m.weightKg) : null,
                heightCm: m.heightCm!=null ? Number(m.heightCm) : null,
                headCm: m.headCm!=null ? Number(m.headCm) : null,
                notes: String(m.notes || '')
              })) : []
            })),
            selectedChildId: json.selectedChildId || (json.children[0] && json.children[0].id) || null
          };
          saveState();
          updateUnitLabels();
          window.App.render();
          $('#importInput').val('');
          alert('Import successful.');
        } catch(err){ console.error(err); alert('Could not import this file.'); }
      };
      reader.readAsText(file);
    });
  }

  function applyRangeFilter(ms){
    const val = $('#rangeFilter').val();
    if (val === 'all') return ms;
    const months = val === '6m' ? 6 : 12;
    const end = new Date();
    const start = new Date(); start.setMonth(start.getMonth() - months);
    return ms.filter(m => {
      const d = new Date(m.date);
      return d >= start && d <= end;
    });
  }

  // Public API
  window.App.init = function(){
    const loaded = window.App.Storage.load();
    if (loaded && loaded.children && Array.isArray(loaded.children)){
      window.App.state = loaded;
    } else {
      window.App.state = seedDemo();
      saveState();
    }
    updateUnitLabels();
    bindEvents();
  };

  window.App.render = function(){
    renderSidebar();

    const child = getSelectedChild();
    renderHeader();

    if (child){
      const filtered = applyRangeFilter(enrichMeasurements(child));
      // draw sparklines based on filtered list
      const c2 = { ...child, measurements: filtered };
      renderSparklines(c2);
      renderTable(c2);
    } else {
      $('#sparkWeight, #sparkHeight, #sparkHead').empty().append('<div class="text-xs text-slate-500">Add a child to see charts.</div>');
      $('#measurementsTbody').empty().append('<tr><td class="py-3 text-slate-600" colspan="8">No data.</td></tr>');
    }
  };

})(jQuery);
