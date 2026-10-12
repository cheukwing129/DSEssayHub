import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(path.join(root,name),'utf8');
const pages=[
  'index.html','article.html','questions.html','notes.html','search.html',
  'genre.html','genre-list.html','techniques.html','writing-guides.html',
  'writing-guide-narrative.html','writing-guide-descriptive.html',
  'writing-guide-topic.html','brand-preview.html'
];

for(const name of pages){
  const page=read(name);
  assert.ok(page.includes('ui-refresh.css?v=20261012'), name+' should use the refreshed design system');
  assert.ok(page.includes('href="writing-guides.html"'), name+' should expose writing guides in the navigation');
  assert.ok(page.includes('essayhub-logo.png?v=20261012-original'), name+' should keep the approved logo');
  assert.ok(page.includes('favicon.png?v=20261012-original'), name+' should keep the approved favicon');
}

const css=read('ui-refresh.css');
assert.match(css, /@media \(max-width: 1080px\)[\s\S]*?\.nav-toggle\s*\{\s*display:\s*flex/);
assert.match(css, /@media \(max-width: 960px\)[\s\S]*?grid-template-areas:\s*"header"\s*"main"\s*"sidebar"/);
assert.ok(css.includes('.year-quick-nav[hidden] { display: none; }'));
assert.ok(css.includes('prefers-reduced-motion'));

const article=read('article.html');
assert.ok(article.includes('layout.append(header,mainColumn,sidebar)'), 'article DOM should place reading before supplementary tools');

const questions=read('questions.html');
for(const token of ['id="yearQuickNav"','populateQuickYears()', 'syncQuickYears()', "button.setAttribute('aria-pressed'", "yearQuickNavEl.addEventListener('click'"]) {
  assert.ok(questions.includes(token),'quick-year navigation missing '+token);
}
assert.ok(questions.includes('pageParams.get(\'year\')'), 'deep-linked year selection must remain supported');
assert.ok(questions.includes('sessionStorage.setItem(scrollStateKey()'), 'question scroll restoration must stay intact');

const home=read('index.html');
assert.ok(home.includes('讀懂範文，<br>寫出好文章。'));
assert.ok(home.includes('按年份找題目') && home.includes('按文體讀範文'));
assert.ok(read('site.js').includes("currentPage.startsWith('writing-guide-')"), 'active navigation should include guide subpages');
console.log('EssayHub responsive design regression checks passed');
