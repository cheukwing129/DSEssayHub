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

const listeners = new Map();
const attributes = new Map([['aria-expanded', 'false']]);
const openClasses = new Set();
let menuButtonFocused = false;
const navToggle = {
  addEventListener(type, listener) { listeners.set(`button:${type}`, listener); },
  contains(target) { return target?.insideToggle === true; },
  focus() { menuButtonFocused = true; },
  getAttribute(name) { return attributes.get(name) ?? null; },
  setAttribute(name, value) { attributes.set(name, value); }
};
const mainNav = {
  classList: {
    add(value) { openClasses.add(value); },
    remove(value) { openClasses.delete(value); }
  },
  contains(target) { return target?.insideMenu === true; },
  querySelectorAll() { return []; }
};
globalThis.location = { pathname: '/index.html', href: 'https://example.test/index.html' };
globalThis.document = {
  addEventListener(type, listener) { listeners.set(`document:${type}`, listener); },
  getElementById(id) { return id === 'navToggle' ? navToggle : id === 'mainNav' ? mainNav : null; }
};
await import('../site.js?nav-interaction-test');

listeners.get('button:click')();
assert.equal(attributes.get('aria-expanded'), 'true');
assert.equal(openClasses.has('is-open'), true);
listeners.get('document:click')({ target: { insideMenu: true } });
assert.equal(attributes.get('aria-expanded'), 'true', 'clicks inside the menu should keep it open');
listeners.get('document:click')({ target: {} });
assert.equal(attributes.get('aria-expanded'), 'false', 'clicks outside the menu should close it');
assert.equal(openClasses.has('is-open'), false);

listeners.get('button:click')();
menuButtonFocused = false;
listeners.get('document:keydown')({ key: 'Escape' });
assert.equal(attributes.get('aria-expanded'), 'false');
assert.equal(menuButtonFocused, true, 'Escape should restore focus to the menu button');

console.log('site utils tests passed');
