import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const articles = readJson('data/articles.json');
const techniques = readJson('data/techniques.json');
const outputPath = path.join(root, 'data/search-index.json');
const checkOnly = process.argv.includes('--check');

const techniqueNameById = Object.fromEntries(techniques.map(item => [item.id, item.name]));
const flatten = value => Array.isArray(value) ? value.flatMap(flatten) : [String(value ?? '').trim()];

const index = articles.map(article => {
  const detail = readJson(article.file);
  const paragraphs = Array.isArray(detail.paragraphs) ? detail.paragraphs : [];
  const techniqueNames = [...new Set(paragraphs.flatMap(paragraph =>
    (paragraph.techniqueTagIds || [])
      .map(id => techniqueNameById[id])
      .filter(Boolean)
  ))];

  return {
    id: article.id,
    body: paragraphs.map(paragraph => String(paragraph.text || '').trim()).filter(Boolean).join('\n'),
    comments: paragraphs.map(paragraph => String(paragraph.comment || '').trim()).filter(Boolean).join('\n'),
    analysis: Object.values(detail.topicAnalysis || {}).flatMap(flatten).filter(Boolean).join('\n'),
    techniques: techniqueNames.join(' ')
  };
});

const serialized = `${JSON.stringify(index)}\n`;

if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== serialized) {
    console.error('錯誤：data/search-index.json 未更新，請執行 npm run build:search。');
    process.exit(1);
  }
  console.log(`搜尋索引已同步：${index.length} 篇文章。`);
} else {
  fs.writeFileSync(outputPath, serialized);
  console.log(`已建立搜尋索引：${index.length} 篇文章，${Buffer.byteLength(serialized)} bytes。`);
}
