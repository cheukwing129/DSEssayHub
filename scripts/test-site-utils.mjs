import assert from 'node:assert/strict';
import '../site.js';

const { escapeHtml } = globalThis.DSEHub || {};

assert.equal(typeof escapeHtml, 'function');
assert.equal(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#039;');
assert.equal(escapeHtml(null), '');
assert.equal(escapeHtml(undefined), '');
assert.equal(escapeHtml('DSE 中文'), 'DSE 中文');

console.log('site utils tests passed');
