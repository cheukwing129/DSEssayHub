import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
for (const question of questions.filter(item => item.hasImage)) {
  assert.ok(question.imagePath, `${question.year} ${question.questionNumber} 應提供 imagePath`);
  assert.ok(question.imageAlt, `${question.year} ${question.questionNumber} 應提供 imageAlt`);
  assert.ok(fs.existsSync(path.join(root, question.imagePath)), `${question.year} ${question.questionNumber} 圖片檔案不存在：${question.imagePath}`);
}

assert.ok(questionsHtml.includes('formatQuestionSourceYear(q.year)'));
assert.ok(questionsHtml.includes('question-image-note'));
assert.ok(questionsHtml.includes('question-image-wrap'));
assert.ok(questionsHtml.includes('q.imagePath'));
assert.ok(questionsHtml.includes('2012 Pilot Paper 及文學題'));
assert.ok(questionsHtml.includes('coverageFilter'));
assert.ok(questionsHtml.includes('有範文'));
assert.ok(questionsHtml.includes('未有範文'));
assert.match(globalCss, /\.nav-toggle\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
assert.match(globalCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?scroll-behavior:\s*auto\s*!important;[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/);
assert.ok(techniquesHtml.includes("const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;"));
assert.ok(techniquesHtml.includes("behavior: reducedMotion ? 'auto' : 'smooth'"));
assert.ok(techniquesHtml.includes('id="countNote" aria-live="polite" aria-atomic="true"'));
assert.ok(techniquesHtml.includes("${currentCategory ? `「${currentCategory}」類別：` : '全部類別：'}共 ${filtered.length} 個寫作手法`"));
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
