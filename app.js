(function () {
  'use strict';
  const C = window.ImageChecker;
  const $ = id => document.getElementById(id);
  const presets = C.PRESETS.map(p => ({ ...p, formats: [...p.formats] }));
  const MAX_FILES = 200;
  const MAX_DECODE_BYTES = 50000000;
  let currentId = 'social', customCount = 0, nextId = 0, filter = 'all';
  let entries = [], queue = [], workers = 0, sampleLoading = false;
  let parsed = C.parseSpec(presets[0]);
  const controls = { name: $('spec-name'), rule: $('rule'), width: $('width'), height: $('height'), maxMB: $('max-size') };
  const formatInputs = [...document.querySelectorAll('input[name="format"]')];
  const announce = text => { $('announcement').textContent = text; };
  function notice(text) { $('notice').textContent = text; $('notice').hidden = !text; }
  function current() { return presets.find(p => p.id === currentId); }
  function syncOptions() {
    $('preset').replaceChildren(...presets.map(p => {
      const option = document.createElement('option'); option.value = p.id; option.textContent = p.name.trim() || 'Unnamed specification'; return option;
    }));
    $('preset').value = currentId;
  }
  function loadSpec() {
    for (const [name, control] of Object.entries(controls)) control.value = current()[name];
    formatInputs.forEach(input => { input.checked = current().formats.includes(input.value); });
    $('reset').hidden = !C.PRESETS.some(p => p.id === currentId);
    validateSpec();
  }
  function validateSpec() {
    parsed = C.parseSpec(current());
    for (const [name, control] of Object.entries(controls)) control.setAttribute('aria-invalid', String(Boolean(parsed.errors[name])));
    document.querySelector('.formats').setAttribute('aria-invalid', String(Boolean(parsed.errors.formats)));
    $('spec-error').textContent = Object.values(parsed.errors).join(' ');
    $('spec-error').hidden = parsed.valid;
    render();
  }
  $('spec-form').addEventListener('submit', e => e.preventDefault());
  $('spec-form').addEventListener('input', () => {
    for (const [name, control] of Object.entries(controls)) current()[name] = control.value;
    current().formats = formatInputs.filter(input => input.checked).map(input => input.value);
    syncOptions(); validateSpec();
  });
  $('preset').addEventListener('change', () => { currentId = $('preset').value; loadSpec(); announce(`Checking against ${current().name}.`); });
  $('new-spec').addEventListener('click', () => {
    customCount++;
    const base = parsed.valid ? current() : C.PRESETS[0];
    const copy = { ...base, id: `custom-${customCount}`, name: `Custom specification${customCount > 1 ? ' ' + customCount : ''}`, formats: [...base.formats] };
    presets.push(copy); currentId = copy.id; syncOptions(); loadSpec(); controls.name.focus(); controls.name.select();
    announce('New specification created from the current requirements. Edit its name and requirements.');
  });
  $('reset').addEventListener('click', () => {
    const original = C.PRESETS.find(p => p.id === currentId);
    if (!original) return;
    Object.assign(current(), original, { formats: [...original.formats] }); syncOptions(); loadSpec(); announce('Restored this example specification.');
  });
  function element(tag, className, text) {
    const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function resultFor(entry) {
    if (entry.pending) return { kind: 'waiting', text: 'Checking…', reasons: [] };
    if (!parsed.valid) return { kind: 'waiting', text: 'Check paused', reasons: ['Enter a valid specification to see results.'] };
    const result = C.checkImage(entry, parsed.spec);
    return { kind: result.passed ? 'passed' : 'failed', text: result.passed ? 'Passed' : 'Needs attention', reasons: result.reasons };
  }
  function makeRow(entry, result) {
    const row = element('tr'); row.dataset.id = entry.id;
    const imageCell = element('td', 'image-td');
    const wrap = element('div', 'image-cell');
    if (entry.thumbnail) { const img = element('img', 'thumbnail'); img.src = entry.thumbnail; img.alt = ''; img.width = 48; img.height = 48; wrap.append(img); }
    else wrap.append(element('span','thumbnail file-placeholder',entry.pending ? '…' : '×'));
    wrap.append(element('span','file-name',entry.name)); imageCell.append(wrap);
    const dimensions = element('td','metadata dimensions-td',entry.width ? `${entry.width} × ${entry.height} px` : '—');
    const format = element('td','metadata format-td',entry.format ? C.label(entry.format) : 'Unknown');
    const size = element('span','size',C.formatSize(entry.size)); size.title = `${entry.size.toLocaleString('en-US')} bytes`; format.append(size);
    const status = element('td','result-td');
    const badge = element('span',`status ${result.kind}`);
    const symbol = element('span','',result.kind === 'passed' ? '✓' : result.kind === 'failed' ? '×' : '·'); symbol.setAttribute('aria-hidden','true');
    badge.append(symbol,document.createTextNode(result.text)); status.append(badge);
    result.reasons.forEach(reason => status.append(element('p',`reason${result.kind === 'waiting' ? ' neutral' : ''}`,reason)));
    const removeCell = element('td','remove-td');
    const remove = element('button','remove','×'); remove.type = 'button'; remove.dataset.remove = entry.id; remove.setAttribute('aria-label',`Remove ${entry.name}`); removeCell.append(remove);
    row.append(imageCell,dimensions,format,status,removeCell); return row;
  }
  function render() {
    let passed = 0, failed = 0, pending = 0;
    const rows = [];
    entries.forEach(entry => {
      const result = resultFor(entry);
      if (result.kind === 'passed') passed++;
      else if (result.kind === 'failed') failed++;
      else pending++;
      if (filter === 'all' || result.kind === filter) rows.push(makeRow(entry,result));
    });
    $('results').replaceChildren(...rows);
    $('total').textContent = `${entries.length} ${entries.length === 1 ? 'image' : 'images'}`;
    $('passed').textContent = `${passed} passed`;
    $('failed').textContent = `${failed} need attention`;
    $('pending').textContent = `${pending} ${parsed.valid ? 'checking' : 'awaiting valid specification'}`;
    $('pending').hidden = !pending;
    $('count-all').textContent = entries.length; $('count-passed').textContent = passed; $('count-failed').textContent = failed;
    $('empty').hidden = Boolean(entries.length); $('results-table').hidden = !rows.length; $('no-matches').hidden = !entries.length || Boolean(rows.length);
    $('export').disabled = !entries.length || !parsed.valid || entries.some(e => e.pending) || sampleLoading;
    $('clear').disabled = !entries.length;
  }
  function setFilter(value) {
    filter = value;
    document.querySelectorAll('[data-filter]').forEach(button => { const active = button.dataset.filter === filter; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
    render();
  }
  document.querySelector('.filters').addEventListener('click', e => { const button = e.target.closest('[data-filter]'); if (button) setFilter(button.dataset.filter); });
  function release(entry) { entry.cancelled = true; if (entry.thumbnail) URL.revokeObjectURL(entry.thumbnail); entry.file = null; }
  $('results').addEventListener('click', e => {
    const button = e.target.closest('[data-remove]'); if (!button) return;
    const index = entries.findIndex(entry => entry.id === Number(button.dataset.remove)); if (index < 0) return;
    const name = entries[index].name; release(entries[index]); entries.splice(index,1); render();
    const next = $('results').querySelectorAll('[data-remove]'); (next[Math.min(index,next.length - 1)] || $('browse')).focus(); announce(`Removed ${name}. Original file unchanged.`);
  });
  $('clear').addEventListener('click', () => { entries.forEach(release); entries = []; queue = []; notice(''); setFilter('all'); $('browse').focus(); announce('All results cleared. Original files unchanged.'); });
  function addFiles(files, isSample = false) {
    const input = Array.from(files); if (!input.length) return;
    const accepted = input.slice(0, Math.max(0,MAX_FILES - entries.length));
    let message = accepted.length < input.length ? `Added ${accepted.length} of ${input.length} files. This workspace holds up to ${MAX_FILES} files; clear some results to add more.` : '';
    if (isSample) announce('Six real sample images added. The original Square social post example gives 2 passes and 4 files needing attention.');
    notice(message);
    accepted.forEach(file => { const entry = { id: ++nextId, name: file.name, size: file.size, file, pending: true, cancelled: false, thumbnail: null, format: null, width: null, height: null, error: null }; entries.push(entry); queue.push(entry); });
    setFilter('all'); pump();
  }
  async function decode(entry) {
    const file = entry.file;
    if (!file.size) { entry.error = 'Empty file: this file contains no image data.'; return; }
    const header = new Uint8Array(await file.slice(0,16).arrayBuffer());
    entry.format = C.detectFormat(header);
    if (!C.FORMATS.includes(entry.format)) { entry.error = entry.format ? `Unsupported format: ${C.label(entry.format)}. This tool reads JPG, PNG and WebP.` : 'Unrecognized image data. The file may be invalid, damaged, or an unsupported format.'; return; }
    if (file.size > MAX_DECODE_BYTES) { entry.error = 'Not decoded: this file exceeds the 50 MB per-file processing limit.'; return; }
    const mime = { JPEG:'image/jpeg', PNG:'image/png', WEBP:'image/webp' }[entry.format];
    const url = URL.createObjectURL(file.slice(0,file.size,mime));
    const img = new Image();
    let timer;
    try {
      await new Promise((resolve,reject) => {
        timer = setTimeout(() => reject(new Error('timeout')),15000);
        img.onload = resolve; img.onerror = () => reject(new Error('decode')); img.src = url;
      });
      if (entry.cancelled) return;
      if (!img.naturalWidth || !img.naturalHeight) throw new Error('decode');
      entry.width = img.naturalWidth; entry.height = img.naturalHeight;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1,144 / Math.max(entry.width,entry.height));
      canvas.width = Math.max(1,Math.round(entry.width * scale)); canvas.height = Math.max(1,Math.round(entry.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const preview = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
      if (preview && !entry.cancelled) entry.thumbnail = URL.createObjectURL(preview);
    } catch (error) {
      entry.width = null; entry.height = null;
      entry.error = error.message === 'timeout' ? 'Could not decode this image within 15 seconds. Try a smaller file.' : 'Invalid or damaged image: the browser could not decode this file.';
    } finally {
      clearTimeout(timer); img.onload = null; img.onerror = null; img.removeAttribute('src'); URL.revokeObjectURL(url);
    }
  }
  function pump() {
    while (workers < 2 && queue.length) {
      const entry = queue.shift(); if (entry.cancelled) continue;
      workers++;
      decode(entry).catch(() => { entry.error = 'Could not read this file. Try selecting it again.'; }).finally(() => {
        entry.pending = false; entry.file = null; workers--; if (!entry.cancelled) render(); pump();
      });
    }
  }
  $('browse').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', () => { addFiles($('file-input').files); $('file-input').value = ''; });
  let dragDepth = 0;
  // Prevent a dropped file from navigating away from the local app, even outside the zone.
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => { e.preventDefault(); dragDepth = 0; $('dropzone').classList.remove('dragging'); if (!$('dropzone').contains(e.target)) notice('Drop files inside the dashed area to add them.'); });
  $('dropzone').addEventListener('dragenter', e => { e.preventDefault(); dragDepth++; $('dropzone').classList.add('dragging'); });
  $('dropzone').addEventListener('dragleave', () => { dragDepth = Math.max(0,dragDepth - 1); if (!dragDepth) $('dropzone').classList.remove('dragging'); });
  $('dropzone').addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
  $('dropzone').addEventListener('drop', e => { e.preventDefault(); addFiles(e.dataTransfer.files); });
  let samplePromise;
  function loadSamples() {
    if (window.IMAGE_CHECKER_SAMPLES) return Promise.resolve(window.IMAGE_CHECKER_SAMPLES);
    if (samplePromise) return samplePromise;
    samplePromise = new Promise((resolve,reject) => {
      const script = document.createElement('script'); script.src = 'samples/sample-data.js';
      script.onload = () => window.IMAGE_CHECKER_SAMPLES ? resolve(window.IMAGE_CHECKER_SAMPLES) : reject(new Error('missing'));
      script.onerror = () => { script.remove(); samplePromise = null; reject(new Error('load')); };
      document.head.append(script);
    });
    return samplePromise;
  }
  $('samples').addEventListener('click', async () => {
    sampleLoading = true; $('samples').disabled = true; $('samples').textContent = 'Loading samples…'; render();
    try {
      const samples = await loadSamples();
      const files = samples.map(sample => { const binary = atob(sample.base64); const bytes = Uint8Array.from(binary,char => char.charCodeAt(0)); return new File([bytes],sample.name,{type:sample.type}); });
      addFiles(files,true);
    } catch { notice('Could not load samples. Keep the samples folder beside index.html, or add the sample image files using Browse files.'); }
    finally { sampleLoading = false; $('samples').disabled = false; $('samples').textContent = 'Try sample images'; render(); }
  });
  $('export').addEventListener('click', () => {
    if ($('export').disabled) return;
    const csv = C.makeCSV(entries,parsed.spec);
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = 'image-delivery-report.csv'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url),30000);
    announce(`CSV report downloaded with all ${entries.length} files.`);
  });
  loadSpec();
})();
