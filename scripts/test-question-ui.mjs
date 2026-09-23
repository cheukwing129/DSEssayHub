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
