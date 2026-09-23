import assert from 'node:assert/strict';
import '../site.js';

const { escapeHtml, nameById, questionTextByKey, itemById, formatQuestionSourceYear } = globalThis.DSEHub || {};

assert.equal(typeof escapeHtml, 'function');
assert.equal(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#039;');
assert.equal(escapeHtml(null), '');
assert.equal(escapeHtml(undefined), '');
assert.equal(escapeHtml('DSE 中文'), 'DSE 中文');

assert.deepEqual(nameById([{ id: 'th01', name: '個人成長' }, { id: 'th02', name: '處世之道' }]), {
  th01: '個人成長',
  th02: '處世之道'
});
assert.deepEqual(nameById(null), {});

assert.deepEqual(questionTextByKey([
  { year: '2015', questionNumber: 'Q1', questionFull: '題目一' },
  { year: '2013', questionNumber: 'Q3', questionFull: '題目二' }
]), {
  '2015_Q1': '題目一',
  '2013_Q3': '題目二'
});

assert.deepEqual(itemById([{ id: 1, value: '甲' }, { id: 2, value: '乙' }]), {
  1: { id: 1, value: '甲' },
  2: { id: 2, value: '乙' }
});

assert.equal(formatQuestionSourceYear('2026'), '2026年');
assert.equal(formatQuestionSourceYear('2012pp'), '2012 Pilot Paper');
assert.equal(formatQuestionSourceYear('文學2020'), '文學2020');

console.log('site utils tests passed');
