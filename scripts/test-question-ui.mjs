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
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
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

assert.ok(questionsHtml.includes('formatQuestionSourceYear(q.year)'));
assert.ok(questionsHtml.includes('question-image-note'));
assert.ok(questionsHtml.includes('2012 Pilot Paper 及文學題'));
assert.ok(articleHtml.includes('question?.hasImage'));
assert.ok(articleHtml.includes('formatQuestionSourceYear(first.year)'));

console.log('question UI tests passed');
