const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

(async () => {
  for (const [page, functionName, limit] of [['repartidores.html', 'optimizeImage', 5], ['registro.html', 'prepareDocument', 6]]) {
    const elements = new Map();
    let draws = 0;
    let failDecode = false;
    const context = {
      Set, Map, File, Blob, Error, console, window: { addEventListener() {} },
      URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
      Image: class {
        naturalWidth = 1200; naturalHeight = 1600;
        set src(value) { queueMicrotask(() => failDecode ? this.onerror() : this.onload()); }
      },
      document: {
        getElementById(id) { if (!elements.has(id)) elements.set(id, { addEventListener() {} }); return elements.get(id); },
        querySelectorAll: () => [],
        createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() { draws++; } }), toBlob: cb => cb(new Blob(['normalized JPEG'], { type: 'image/jpeg' })) }),
      },
      fetch: async () => ({ ok: true, json: async () => ({}) }),
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(page, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1], context);
    // Small mobile files must be decoded and re-encoded, not passed through with their original bytes.
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/pjpeg', '', 'application/octet-stream']) {
      context.input = new File(['original mobile bytes'], 'document.jpg', { type });
      assert.equal(vm.runInContext('isSupportedImage(input)', context), true);
      const result = await vm.runInContext(`${functionName}(input)`, context);
      assert.notEqual(result, context.input);
      assert.equal(result.type, 'image/jpeg');
      assert.equal(result.name, 'document.jpg');
      assert.equal(await result.text(), 'normalized JPEG');
      assert.ok(result.size < limit * 1024 * 1024);
    }
    assert.equal(draws, 7);
    context.input = new File(['not an image'], 'document.jpg', { type: 'image/jpeg' });
    failDecode = true;
    await assert.rejects(vm.runInContext(`${functionName}(input)`, context), /leer/);
    failDecode = false;
    context.input = new File(['x'], 'document.svg', { type: 'image/svg+xml' });
    assert.equal(vm.runInContext('isSupportedImage(input)', context), false);
    if (page === 'registro.html') {
      context.input = new File(['%PDF-1.7'], 'document.pdf', { type: 'application/pdf' });
      assert.equal(await vm.runInContext('prepareDocument(input)', context), context.input);
      context.input = new File([new Uint8Array(6 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
      await assert.rejects(vm.runInContext('prepareDocument(input)', context), /supera/);
    }
    console.log(`${page}: mobile photos normalized; unreadable files rejected; document limits preserved.`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
