const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../core.js');
const spec = C.parseSpec(C.PRESETS[0]).spec;
const good = { name: 'image.jpg', width: 1080, height: 1080, format: 'JPEG', size: 2000000 };

test('all example specifications are valid and independent', () => {
  assert.ok(C.PRESETS.every(p => C.parseSpec(p).valid));
  assert.equal(C.parseSpec(C.PRESETS[1]).spec.rule, 'minimum');
  assert.equal(C.parseSpec(C.PRESETS[2]).spec.width, 1920);
});
test('exact dimension rule includes a one-pixel failure', () => {
  assert.equal(C.checkImage(good,spec).passed,true);
  assert.match(C.checkImage({...good,width:1079},spec).reasons.join(),/Expected exactly/);
  assert.equal(C.checkImage({...good,height:1081},spec).passed,false);
});
test('minimum dimensions compare both axes independently', () => {
  const min = C.parseSpec(C.PRESETS[1]).spec;
  assert.equal(C.checkImage({...good,width:1700,height:1600},min).passed,true);
  assert.equal(C.checkImage({...good,width:1600,height:1599},min).passed,false);
});
test('byte limit is inclusive and one byte over fails', () => {
  assert.equal(C.checkImage(good,spec).passed,true);
  assert.match(C.checkImage({...good,size:2000001},spec).reasons.join(),/File too large/);
});
test('decimal MB becomes exact integer bytes', () => {
  assert.equal(C.parseSpec({...C.PRESETS[0],maxMB:'0.035793'}).spec.maxBytes,35793);
  assert.equal(C.parseSpec({...C.PRESETS[0],maxMB:'0.000001'}).spec.maxBytes,1);
});
test('a disallowed supported format is explained', () => {
  assert.match(C.checkImage({...good,format:'WEBP'},spec).reasons.join(),/WebP is not allowed/);
});
test('dimension, format and size failures are all retained', () => {
  assert.equal(C.checkImage({...good,width:1,format:'WEBP',size:2000001},spec).reasons.length,3);
});
test('decode errors always fail, including small files', () => {
  assert.equal(C.checkImage({...good,error:'Invalid or damaged image'},spec).passed,false);
});
test('real sample signatures and documented outcomes match', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,'../samples/manifest.json'),'utf8'));
  const outcomes = manifest.map(m => {
    const bytes = fs.readFileSync(path.join(__dirname,'../samples',m.name));
    assert.equal(bytes.length,m.bytes);
    assert.equal(C.detectFormat(bytes.subarray(0,16)),m.format);
    return C.checkImage({...m,size:m.bytes},spec).passed;
  });
  assert.deepEqual(outcomes,[true,true,false,false,false,false]);
});
test('unrecognized data and empty data cannot masquerade as JPG', () => {
  assert.equal(C.detectFormat(Buffer.from('not an image')),null);
  assert.equal(C.detectFormat(new Uint8Array()),null);
  assert.equal(C.detectFormat(Buffer.from('GIF89a')), 'GIF');
});
test('invalid dimensions are rejected', () => {
  for (const width of ['','0','-1','1.5','1e3','Infinity','100001','abc']) assert.equal(C.parseSpec({...C.PRESETS[0],width}).valid,false,width);
});
test('invalid file limits, names and no allowed formats are rejected', () => {
  for (const maxMB of ['','0','-1','1e2','Infinity','0.0000001','50.000001']) assert.equal(C.parseSpec({...C.PRESETS[0],maxMB}).valid,false,maxMB);
  assert.equal(C.parseSpec({...C.PRESETS[0],formats:[]}).valid,false);
  assert.equal(C.parseSpec({...C.PRESETS[0],name:'  '}).valid,false);
});
test('CSV escapes commas, double quotes and embedded newlines', () => {
  assert.equal(C.csvCell('a,"b"\nc'),'"a,""b""\nc"');
});
test('CSV neutralizes formula-like and control-prefixed values', () => {
  for (const s of ['=1+1','+SUM(A1)','-1','@test','  =HYPERLINK("x")','\t=1','\rtest']) assert.ok(C.csvCell(s).startsWith('"\''));
});
test('CSV contains all requirements, raw bytes, UTC time and Unicode', () => {
  const csv = C.makeCSV([{...good,name:'照片.jpg'},{...good,name:'bad.webp',format:'WEBP'}],spec,'2026-11-06T12:00:00.000Z');
  assert.ok(csv.startsWith('\uFEFF'));
  for (const value of ['照片.jpg','"PASS"','"FAIL"','2000000','Square social post','2026-11-06T12:00:00.000Z','Allowed formats']) assert.ok(csv.includes(value));
  assert.equal(csv.split('\r\n').length,4);
});
test('embedded sample bytes equal the downloadable sample files', () => {
  const vm = require('node:vm'); const sandbox = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../samples/sample-data.js'),'utf8'),sandbox);
  for (const sample of sandbox.window.IMAGE_CHECKER_SAMPLES) assert.ok(Buffer.from(sample.base64,'base64').equals(fs.readFileSync(path.join(__dirname,'../samples',sample.name))));
});
