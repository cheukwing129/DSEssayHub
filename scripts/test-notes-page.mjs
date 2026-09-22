import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'notes.html'), 'utf8');

const required = [
  '清除全部學習紀錄',
  'saveAllArticleProgress({})',
  'const articleProgress = getAllArticleProgress();',
  'const progressCount = Object.keys(articleProgress).length;',
  'notes.length === 0 && materials.length === 0 && progressCount === 0',
  '文章學習紀錄 ${progressCount} 篇'
];

for (const text of required) {
  if (!html.includes(text)) throw new Error(`notes.html 缺少清除全部學習紀錄的保護：${text}`);
}

if (html.includes('清除全部筆記與素材</button>')) {
  throw new Error('notes.html 仍使用舊的清除按鈕文案。');
}

console.log('notes clear-all tests passed');
