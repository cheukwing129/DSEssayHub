import assert from 'node:assert/strict';
import '../site.js';
import '../storage.js';

const { KEYS, readArray, readObject, writeJson } = globalThis.DSEHub.storage;

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
    dump: () => Object.fromEntries(data)
  };
}

assert.deepEqual(KEYS, {
  NOTES: 'dse_notes',
  MATERIALS: 'materialBank',
  ARTICLE_PROGRESS: 'articleProgress'
});

const store = createStorage({
  [KEYS.NOTES]: JSON.stringify([{ type: 'highlight' }]),
  [KEYS.ARTICLE_PROGRESS]: JSON.stringify({ '1': { structureNote: '甲' } })
});

assert.deepEqual(readArray(KEYS.NOTES, { storage: store }), [{ type: 'highlight' }]);
assert.deepEqual(readArray(KEYS.MATERIALS, { storage: store }), []);
assert.deepEqual(readObject(KEYS.ARTICLE_PROGRESS, { storage: store }), { '1': { structureNote: '甲' } });

const wrongShape = createStorage({
  [KEYS.NOTES]: JSON.stringify({ not: 'an array' }),
  [KEYS.ARTICLE_PROGRESS]: JSON.stringify([])
});
assert.deepEqual(readArray(KEYS.NOTES, { storage: wrongShape }), []);
assert.deepEqual(readObject(KEYS.ARTICLE_PROGRESS, { storage: wrongShape }), {});

assert.equal(writeJson(KEYS.MATERIALS, [{ text: '句子' }], { storage: store }), true);
assert.deepEqual(JSON.parse(store.dump()[KEYS.MATERIALS]), [{ text: '句子' }]);

const brokenStore = {
  getItem: () => { throw new Error('read failed'); },
  setItem: () => { throw new Error('write failed'); }
};
const originalError = console.error;
console.error = () => {};
assert.deepEqual(readArray(KEYS.NOTES, { storage: brokenStore }), []);
assert.deepEqual(readObject(KEYS.ARTICLE_PROGRESS, { storage: brokenStore }), {});
assert.equal(writeJson(KEYS.NOTES, [], { storage: brokenStore }), false);
console.error = originalError;

console.log('storage tests passed');
