/* Pure validation and CSV helpers. No browser, network or storage access. */
(function (root) {
  'use strict';
  const FORMATS = ['JPEG', 'PNG', 'WEBP'];
  const PRESETS = [
    { id: 'social', name: 'Square social post', rule: 'exact', width: '1080', height: '1080', formats: ['JPEG', 'PNG'], maxMB: '2' },
    { id: 'product', name: 'Product image', rule: 'minimum', width: '1600', height: '1600', formats: ['JPEG', 'PNG', 'WEBP'], maxMB: '5' },
    { id: 'banner', name: 'Website banner', rule: 'exact', width: '1920', height: '640', formats: ['JPEG', 'PNG', 'WEBP'], maxMB: '2' }
  ];
  const label = format => ({ JPEG: 'JPG', PNG: 'PNG', WEBP: 'WebP', GIF: 'GIF', PDF: 'PDF', BMP: 'BMP' }[format] || 'Unknown');
  function detectFormat(bytes) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'JPEG';
    if ([137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)) return 'PNG';
    const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    if (text(0,4) === 'RIFF' && text(8,12) === 'WEBP') return 'WEBP';
    if (['GIF87a','GIF89a'].includes(text(0,6))) return 'GIF';
    if (text(0,5) === '%PDF-') return 'PDF';
    if (text(0,2) === 'BM') return 'BMP';
    return null;
  }
  function parseSpec(draft) {
    const errors = {};
    const name = String(draft.name || '').trim();
    if (!name || name.length > 80) errors.name = 'Enter a specification name (1–80 characters).';
    if (!['exact','minimum'].includes(draft.rule)) errors.rule = 'Choose a valid dimension rule.';
    for (const field of ['width','height']) {
      if (!/^\d+$/.test(String(draft[field])) || Number(draft[field]) < 1 || Number(draft[field]) > 100000) errors[field] = `Enter ${field} as a whole number from 1 to 100,000 px.`;
    }
    const formats = [...new Set((draft.formats || []).filter(f => FORMATS.includes(f)))];
    if (!formats.length) errors.formats = 'Select at least one allowed format.';
    const raw = String(draft.maxMB ?? '');
    if (!/^(?:\d+)(?:\.\d{1,6})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > 50) errors.maxMB = 'Enter a file limit above 0 and up to 50 MB, with at most 6 decimal places.';
    // Convert decimal MB to integer bytes without floating-point boundary errors.
    const [whole, fraction = ''] = raw.split('.');
    const maxBytes = Number(whole) * 1000000 + Number(fraction.padEnd(6, '0'));
    return { errors, valid: !Object.keys(errors).length, spec: { name, rule: draft.rule, width: Number(draft.width), height: Number(draft.height), formats, maxBytes, maxMB: Number(raw) } };
  }
  function checkImage(item, spec) {
    const reasons = [];
    if (item.error) reasons.push(item.error);
    if (item.format && FORMATS.includes(item.format) && !spec.formats.includes(item.format)) reasons.push(`${label(item.format)} is not allowed. Accepted: ${spec.formats.map(label).join(', ')}.`);
    if (item.width && item.height) {
      const wrong = spec.rule === 'exact' ? item.width !== spec.width || item.height !== spec.height : item.width < spec.width || item.height < spec.height;
      if (wrong) reasons.push(`${spec.rule === 'exact' ? 'Expected exactly' : 'Requires at least'} ${spec.width} × ${spec.height} px; found ${item.width} × ${item.height} px.`);
    }
    if (item.size > spec.maxBytes) reasons.push(`File too large: ${item.size.toLocaleString('en-US')} bytes exceeds ${spec.maxMB} MB (${spec.maxBytes.toLocaleString('en-US')} bytes).`);
    return { passed: reasons.length === 0, reasons };
  }
  function formatSize(bytes) {
    if (bytes < 1000) return `${bytes} B`;
    if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${(bytes / 1000000).toFixed(2)} MB`;
  }
  function csvCell(value) {
    let text = String(value ?? '');
    // Preserve Unicode/newlines/quotes while preventing spreadsheet formula execution.
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function makeCSV(items, spec, checkedAt = new Date().toISOString()) {
    const header = ['Filename','Width (px)','Height (px)','Detected format','File size (bytes)','File size (MB)','Status','Reasons','Specification','Dimension rule','Required width (px)','Required height (px)','Allowed formats','Maximum size (bytes)','Maximum size (MB)','Report time (UTC)'];
    const rows = items.map(item => {
      const result = checkImage(item, spec);
      return [item.name,item.width || '',item.height || '',label(item.format),item.size,(item.size / 1000000).toFixed(6),result.passed ? 'PASS' : 'FAIL',result.reasons.join(' | '),spec.name,spec.rule === 'exact' ? 'Exactly' : 'At least',spec.width,spec.height,spec.formats.map(label).join('; '),spec.maxBytes,spec.maxMB,checkedAt];
    });
    return '\uFEFF' + [header,...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  const api = { FORMATS, PRESETS, label, detectFormat, parseSpec, checkImage, formatSize, csvCell, makeCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ImageChecker = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
