import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'notes.html'), 'utf8');

const required = [
  '清除全部學習紀錄',
  'saveAllArticleProgress({})',
  'const articleProgress = getAllArticleProgress();',
  'notes.length === 0 && materials.length === 0 && progressCount === 0',
  '文章學習紀錄',
  'id="notesSearch"',
  'id="notesTypeFilter"',
  'function notesListUrl',
  'function cloneGroupForFilter',
  'buildGroups(notes, materials, articleProgress)',
  '回到原段落',
  "params.set('paragraph', String(paragraphIndex))",
  "sessionStorage.setItem(scrollStateKey()"
];

for (const text of required) {
  if (!html.includes(text)) throw new Error(`notes.html 缺少筆記頁保護：${text}`);
}

if (html.includes('清除全部筆記與素材</button>')) {
  throw new Error('notes.html 仍使用舊的清除按鈕文案。');
}

const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
const scripts = [...withoutComments.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/\bsrc\s*=/.test(match[1]))
  .map(match => match[2]);

if (scripts.length === 0) throw new Error('notes.html 應至少有一段 inline script');
scripts.forEach((script, index) => {
  try {
    new Function(script);
  } catch (error) {
    throw new Error(`notes.html inline script #${index + 1} 語法錯誤：${error.message}`);
  }
});

console.log('notes UX tests passed');
