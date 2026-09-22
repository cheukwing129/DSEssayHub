import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteScript = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .find(source => source.includes('renderResults'));

if (!script) throw new Error('找不到 search.html 的搜尋程式。');

const dataByUrl = Object.fromEntries([
  'articles.json', 'questions.json', 'themes.json', 'techniques.json', 'search-index.json'
].map(file => [`data/${file}`, JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'))]));

async function search(query) {
  const elements = Object.fromEntries(['searchHeading', 'searchSummary', 'searchResults', 'errorBox']
    .map(id => [id, { textContent: '', innerHTML: '' }]));
  const input = { value: '' };
  const document = {
    getElementById: id => elements[id] || null,
    querySelector: selector => selector === '.nav-search input[name="q"]' ? input : null
  };
  const fetch = async url => ({
    ok: Boolean(dataByUrl[url]),
    status: dataByUrl[url] ? 200 : 404,
    json: async () => dataByUrl[url]
  });
  const context = vm.createContext({
    console, document, fetch, URLSearchParams, encodeURIComponent,
    location: { search: `?q=${encodeURIComponent(query)}` }
  });
  new vm.Script(siteScript, { filename: 'site.js' }).runInContext(context);
  new vm.Script(script, { filename: 'search-inline.js' }).runInContext(context);
  await new Promise(resolve => setTimeout(resolve, 0));
  if (elements.errorBox.innerHTML) throw new Error(elements.errorBox.innerHTML);
  return elements.searchResults.innerHTML;
}

const cases = [
  ['自相殘殺', 'article.html?id=41', '正文命中'],
  ['身心平衡', 'article.html?id=41', '段旨點評'],
  ['中庸自持', 'article.html?id=41', '題目分析'],
  ['2014 Q2', 'article.html?id=41', '基本資料'],
  ['舉例論證', 'article.html?id=', '寫作手法']
];

for (const [query, expectedLink, expectedLabel] of cases) {
  const result = await search(query);
  const highlighted = query.split(/\s+/).every(term =>
    result.toLowerCase().includes(`<mark>${term.toLowerCase()}</mark>`)
  );
  if (!result.includes(expectedLink) || !result.includes(expectedLabel) || !highlighted) {
    throw new Error(`搜尋「${query}」未產生預期結果。`);
  }
}

console.log(`搜尋測試通過：${cases.length} 個正文／段旨／分析／資料／手法案例。`);
