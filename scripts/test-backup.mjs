import assert from 'node:assert/strict';
import '../site.js';
import '../backup.js';

const { sanitizeBackup } = globalThis.DSEHub.backup;

const valid = sanitizeBackup({
  version: 1,
  dse_notes: [
    { articleId: 1, paragraphIndex: 0, type: 'highlight', color: 'yellow', text: '甲', timestamp: 10 },
    { articleId: '2', paragraphIndex: 3, type: 'comment', noteContent: '想法', text: '乙', timestamp: 20 }
  ],
  materialBank: [
    { articleId: '3', paragraphIndex: 1, type: 'material', text: '佳句', timestamp: 30 }
  ],
  articleProgress: {
    '4': {
      structureNote: '結構',
      reflectionNote: '反思',
      trainingModeAnswer: '審題',
      trainingModeRevealed: true,
      updatedAt: 40
    }
  }
});

assert.equal(valid.ok, true);
assert.equal(valid.invalidCount, 0);
assert.deepEqual(valid.data.dse_notes[0], {
  articleId: '1',
  paragraphIndex: 0,
  type: 'highlight',
  color: 'yellow',
  text: '甲',
  noteContent: '',
  timestamp: 10
});
assert.equal(valid.data.dse_notes[1].articleId, '2');
assert.equal(valid.data.materialBank[0].articleId, '3');
assert.equal(valid.data.articleProgress['4'].trainingModeRevealed, true);

const legacy = sanitizeBackup({
  dse_notes: [
    { articleId: '01', paragraphIndex: 2, type: 'highlight', color: 'blue' }
  ]
});
assert.equal(legacy.ok, true);
assert.equal(legacy.data.dse_notes[0].articleId, '1');
assert.equal(legacy.data.dse_notes[0].timestamp, 0);

const mixed = sanitizeBackup(JSON.parse(`{
  "version": 1,
  "dse_notes": [
    { "articleId": "1", "paragraphIndex": 0, "type": "highlight", "color": "pink" },
    { "articleId": "__proto__", "paragraphIndex": 0, "type": "comment", "noteContent": "壞資料" },
    { "articleId": "2", "paragraphIndex": -1, "type": "highlight", "color": "yellow" },
    { "articleId": "2", "paragraphIndex": 1, "type": "highlight", "color": "purple" }
  ],
  "materialBank": [
    { "articleId": "2", "paragraphIndex": 1, "text": "有效素材" },
    { "articleId": "2", "paragraphIndex": 2, "text": "" }
  ],
  "articleProgress": {
    "3": { "structureNote": "有效", "updatedAt": 5 },
    "__proto__": { "structureNote": "無效" },
    "4": { "structureNote": 123 }
  }
}`));
assert.equal(mixed.ok, true);
assert.equal(mixed.invalidCount, 6);
assert.equal(mixed.data.dse_notes.length, 1);
assert.equal(mixed.data.materialBank.length, 1);
assert.deepEqual(Object.keys(mixed.data.articleProgress), ['3']);

assert.deepEqual(sanitizeBackup(null), {
  ok: false,
  error: '備份檔案格式不正確。'
});
assert.deepEqual(sanitizeBackup({ version: 2 }), {
  ok: false,
  error: '不支援的備份版本：2。'
});

console.log('backup validation tests passed');
