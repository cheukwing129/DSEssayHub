import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import '../site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function assertInlineScriptsParse(relative) {
  const html = read(relative);
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...withoutComments.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]))
    .map(match => match[2]);
  assert.ok(scripts.length > 0, relative + ' 應至少有一段 inline script');
  scripts.forEach((script, index) => {
    try {
      new Function(script);
    } catch (error) {
      throw new Error(relative + ' inline script #' + (index + 1) + ' 語法錯誤：' + error.message);
    }
  });
  return html;
}

const questionsHtml = assertInlineScriptsParse('questions.html');
const articleHtml = assertInlineScriptsParse('article.html');
const genreHtml = assertInlineScriptsParse('genre.html');
const searchHtml = read('search.html');
const notesHtml = read('notes.html');
const globalCss = read('style.css');
const techniquesHtml = assertInlineScriptsParse('techniques.html');
const siteJs = read('site.js');
const questions = JSON.parse(read('data/questions.json'));

// Render the real article template with two different essays of the same question.
// Their training reference must come from the question, while essay analysis remains separate.
const articleRenderSource = articleHtml.slice(articleHtml.indexOf('function render(index,'), articleHtml.indexOf('\n(async()=>'));
const articles = JSON.parse(read('data/articles.json'));
const question = questions.find(item => item.year === '文學2025' && item.questionNumber === 'Q1');
function renderTraining(articleId) {
  const index = articles.find(item => item.id === articleId);
  const content = { innerHTML: '' };
  const context = {
    document: {}, content, back: {}, labels: {}, DSEHub: globalThis.DSEHub,
    esc: globalThis.DSEHub.escapeHtml,
    getSafeReturnTarget: () => null,
    withRestoreFlag: value => value,
    articleUrl: id => `article.html?id=${id}`,
    buildParagraphNavigation: () => '',
    applyEditorialLayout: () => {},
    index, body: JSON.parse(read(index.file)), questions, articles,
    encodeURIComponent
  };
  vm.runInNewContext(`${articleRenderSource}\nrender(index,body,{}, {},questions,articles);`, context);
  const reference = content.innerHTML.match(/id="trainingReference" hidden>([\s\S]*?)<\/div><\/div><\/details>/)?.[1];
  assert.ok(reference, '文章須提供審題參考');
  assert.ok(content.innerHTML.includes('這篇範文的寫法分析'));
  assert.ok(reference.includes(question.writingGuidance.planning[0]));
  assert.ok(!reference.includes(context.body.topicAnalysis.referenceAnswerPoints[0]), '範文情節分析不可當作審題參考');
  const ideas = content.innerHTML.match(/<details class="writing-ideas">[\s\S]*?<\/details>/)?.[0];
  assert.equal(ideas, globalThis.DSEHub.renderWritingIdeas(question.writingIdeas), '構思舉隅須預設收合並使用試題層級資料');
  assert.ok(!reference.includes(question.writingIdeas.directions[0].detail), '構思舉隅與審題參考須分開展開');
  return { reference, ideas };
}
assert.deepEqual(renderTraining(106), renderTraining(107), '同題範文必須共用試題層級的審題參考及構思舉隅');

// Questions without any essays still expose the same topic guidance through the question bank.
const cardSource = questionsHtml.slice(questionsHtml.indexOf('function buildCard(q)'), questionsHtml.indexOf('function populateQuickYears()'));
const noEssayQuestion = questions.find(item => item.year === '2026' && item.questionNumber === 'Q3');
const cardContext = {
  q: noEssayQuestion, DSEHub: globalThis.DSEHub, labels: {},
  esc: globalThis.DSEHub.escapeHtml,
  relatedArticleIds: () => [], articleHref: id => `article.html?id=${id}`
};
const questionCard = vm.runInNewContext(`${cardSource}\nbuildCard(q);`, cardContext);
assert.ok(questionCard.includes(noEssayQuestion.writingGuidance.requirements[0]));
assert.ok(questionCard.includes('暫未有對應範文'));
assert.ok(questionCard.includes(globalThis.DSEHub.renderWritingIdeas(noEssayQuestion.writingIdeas)), '未有範文的題目亦須提供預設收合的構思舉隅');

const openQuestion = questions.find(item => item.year === '2021' && item.questionNumber === 'Q2');
const openIdeas = globalThis.DSEHub.renderWritingIdeas(openQuestion.writingIdeas);
for (const heading of ['立意舉隅', '取材舉隅', '論點舉隅']) {
  assert.ok(openIdeas.includes(`<h3>${heading}</h3>`), '開放題可同時提供取材與論點');
}

for (const item of questions.filter(item => item.subject === '文學')) {
  assert.ok(item.writingGuidance.requirements.join('').includes(item.questionFull), `${item.year} ${item.questionNumber} 的審題內容必須對應題名`);
}
for (const question of questions.filter(item => item.hasImage)) {
  assert.ok(question.imagePath, `${question.year} ${question.questionNumber} 應提供 imagePath`);
  assert.ok(question.imageAlt, `${question.year} ${question.questionNumber} 應提供 imageAlt`);
  assert.ok(fs.existsSync(path.join(root, question.imagePath)), `${question.year} ${question.questionNumber} 圖片檔案不存在：${question.imagePath}`);
}

assert.ok(questionsHtml.includes('formatQuestionSourceYear(q.year)'));
assert.ok(questionsHtml.includes('question-image-note'));
assert.ok(questionsHtml.includes('question-image-wrap'));
assert.ok(questionsHtml.includes('q.imagePath'));
assert.ok(questionsHtml.includes('2012 練習卷'));
assert.ok(questionsHtml.includes('questions.html?subject=literature'));
assert.ok(questionsHtml.includes("if(value==='2012pp')return '練習卷';"));
assert.ok(questionsHtml.includes('coverageFilter'));
assert.ok(questionsHtml.includes('有範文'));
assert.ok(questionsHtml.includes('未有範文'));
assert.match(questionsHtml, /\.question-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(158px,\s*190px\)/s);
assert.match(questionsHtml, /\.question-card-head\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1;/s);
assert.match(questionsHtml, /\.question-card-main\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*2;/s);
assert.match(questionsHtml, /\.question-links-panel\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1\s*\/\s*span\s*2;/s);
assert.match(questionsHtml, /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.question-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
assert.match(globalCss, /\.nav-toggle\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
assert.match(globalCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?scroll-behavior:\s*auto\s*!important;[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/);
assert.ok(techniquesHtml.includes("const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;"));
assert.ok(techniquesHtml.includes("behavior: reducedMotion ? 'auto' : 'smooth'"));
assert.ok(techniquesHtml.includes('id="countNote" aria-live="polite" aria-atomic="true"'));
assert.ok(techniquesHtml.includes("${currentCategory ? `「${currentCategory}」類別：` : '全部類別：'}共 ${filtered.length} 個寫作手法`"));
assert.match(techniquesHtml, /\.category-btn\s*\{[^}]*min-height:\s*44px;/);
assert.match(questionsHtml, /\.q-filter select\s*\{[^}]*min-height:\s*44px;/);
assert.match(questionsHtml, /\.q-filter-reset\s*\{[^}]*min-height:\s*44px;/);
assert.match(questionsHtml, /\.question-links a\s*\{[^}]*min-height:\s*44px;/);
assert.match(genreHtml, /\.genre-filter select\s*\{[^}]*min-height:\s*44px;/);
assert.match(searchHtml, /\.search-jump-link\s*\{[^}]*min-height:\s*44px;/);
assert.match(notesHtml, /\.btn-notes-action\s*\{[^}]*min-height:\s*44px;/);
assert.match(notesHtml, /\.notes-type-filter\s*\{[^}]*min-height:\s*44px;/);
assert.match(articleHtml, /\.paragraph-actions\s*\{[^}]*min-height:\s*44px;/s);
assert.match(articleHtml, /\.highlight-option\s*\{[^}]*min-height:\s*44px;/s);
assert.match(questionsHtml, /id="countNote" aria-live="polite" aria-atomic="true"/);
assert.ok(questionsHtml.includes('目前條件：${activeFilters.join'));
assert.ok(questionsHtml.includes('來源／年份：${yearFilterEl.selectedOptions'));
assert.ok(questionsHtml.includes('題型：${typeFilterEl.selectedOptions'));
assert.ok(questionsHtml.includes('範文：${coverageFilterEl.selectedOptions'));
assert.ok(articleHtml.includes('question?.hasImage'));
assert.ok(articleHtml.includes('article-question-image-wrap'));
assert.ok(articleHtml.includes('question?.imagePath'));
assert.ok(articleHtml.includes('formatQuestionSourceYear(first.year)'));
assert.ok(articleHtml.includes('article-sequence-nav'));
assert.ok(articleHtml.includes('同文體上一篇及下一篇'));
assert.ok(articleHtml.includes('paragraph-actions'));
assert.ok(articleHtml.includes('aria-label="標記或記錄這一段"'));
assert.ok(articleHtml.includes('id="trainingCard"'));
assert.ok(articleHtml.includes('trainingCard.open = Boolean'));
assert.ok(articleHtml.includes('id="notebookBackdrop"'));
assert.ok(articleHtml.includes("document.body.classList.add('notebook-open')"));
assert.ok(articleHtml.includes("backdrop.addEventListener('click'"));
assert.ok(articleHtml.includes('.paragraph-actions .highlight-btn'));
assert.ok(articleHtml.includes('width:40px'));
assert.ok(articleHtml.includes('height:min(68dvh,620px)'));
assert.ok(articleHtml.includes('getSafeReturnTarget'));
assert.ok(articleHtml.includes("['genre.html','questions.html','notes.html']"));
assert.ok(articleHtml.includes('scrollToRequestedParagraph'));
assert.ok(articleHtml.includes('id="paragraph-${i}"'));
assert.ok(articleHtml.includes("returningToNotes?'← 返回我的筆記'"));
assert.ok(articleHtml.includes("params.set('returnTo',returnTarget)"));
assert.ok(genreHtml.includes('resultCount'));
assert.ok(genreHtml.includes('resetFilter'));
assert.ok(genreHtml.includes("pageParams.get('theme')"));
assert.ok(genreHtml.includes('sessionStorage.setItem(scrollStateKey()'));
assert.ok(genreHtml.includes('returnTo='));
assert.ok(questionsHtml.includes("pageParams.get('year')"));
assert.ok(questionsHtml.includes("pageParams.get('qtype')"));
assert.ok(questionsHtml.includes("pageParams.get('coverage')"));
assert.ok(questionsHtml.includes('sessionStorage.setItem(scrollStateKey()'));
assert.ok(questionsHtml.includes('returnTo='));
assert.ok(siteJs.includes("event.key === 'Escape'"));
assert.ok(siteJs.includes("link.setAttribute('aria-current', 'page')"));

console.log('question and study-flow UI tests passed');
