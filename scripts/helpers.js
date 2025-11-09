(function(){
  'use strict';
  window.App = window.App || {};
  // Storage wrapper that namespaced under App to avoid global collisions
  const STORAGE_KEY = 'sprouttrack_state_v1';

  const AppStorage = {
    load() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load state', e);
        return null;
      }
    },
    save(state) {
      try {
        const payload = JSON.stringify(state);
        window.localStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        console.error('Failed to save state', e);
      }
    },
    clear() {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch(e) { console.error(e); }
    }
  };

  // Utilities
  const Utils = {
    uid(prefix='id'){ return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    toISO(d){ try { return new Date(d).toISOString().slice(0,10);} catch(e){ return ''; } },
    formatDate(d){ try { const dt = new Date(d); return dt.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); } catch(e){ return d; } },
    ageBetween(birthISO, atISO){
      try {
        const b = new Date(birthISO), a = new Date(atISO);
        const diffMs = a - b; if (isNaN(diffMs)) return '';
        const diffDays = Math.floor(diffMs / (1000*60*60*24));
        const years = Math.floor(diffDays / 365.25);
        const months = Math.floor((diffDays % 365.25) / 30.4375);
        if (years <= 0 && months <= 0) return diffDays + 'd';
        if (years <= 0) return months + 'm';
        return years + 'y ' + months + 'm';
      } catch(e){ return ''; }
    },
    // Unit conversions (store metrics internally)
    kgToLb(kg){ return kg * 2.2046226218; },
    lbToKg(lb){ return lb / 2.2046226218; },
    cmToIn(cm){ return cm / 2.54; },
    inToCm(inches){ return inches * 2.54; },
    bmi(weightKg, heightCm){
      const h = Number(heightCm);
      const w = Number(weightKg);
      if (!h || !w) return '';
      const m = h / 100;
      if (m <= 0) return '';
      return (w / (m*m)).toFixed(1);
    },
    sanitizeNumber(v){ if (v === '' || v === null || v === undefined) return null; const n = Number(v); return isFinite(n) ? n : null; },
    sortByDateAsc(arr){ return arr.slice().sort((a,b)=> new Date(a.date) - new Date(b.date)); },
    debounce(fn, wait){ let t; return function(){ const ctx=this, args=arguments; clearTimeout(t); t=setTimeout(()=>fn.apply(ctx,args), wait); }; },
    // Create an SVG sparkline path string given normalized points array [{x,y}]
    buildSvgPath(points){
      if (!points || !points.length) return '';
      let d = 'M' + points[0].x + ',' + points[0].y;
      for (let i=1;i<points.length;i++) d += ' L' + points[i].x + ',' + points[i].y;
      return d;
    },
    mapToSparkline(values, width, height){
      if (!values || values.length === 0) return [];
      const min = Math.min.apply(null, values);
      const max = Math.max.apply(null, values);
      const span = max - min || 1;
      const stepX = values.length > 1 ? width / (values.length - 1) : 0;
      return values.map((v, i)=>{
        const x = Math.round(i * stepX);
        // invert y so larger values go up less: y = height - normalized
        const y = Math.round(height - ((v - min) / span) * height);
        return { x, y };
      });
    }
  };

  window.App.Helpers = Utils;
  window.App.Storage = AppStorage;
})();
