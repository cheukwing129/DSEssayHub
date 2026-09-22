import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const articleDir = path.join(dataDir, 'articles');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const errors = [];
const warnings = [];
const fail = message => errors.push(message);
const warn = message => warnings.push(message);

const articles = readJson('data/articles.json');
const questions = readJson('data/questions.json');
const themes = readJson('data/themes.json');
const techniques = readJson('data/techniques.json');
const searchIndex = readJson('data/search-index.json');

for (const [name, value] of Object.entries({ articles, questions, themes, techniques, searchIndex })) {
  if (!Array.isArray(value)) fail(`${name} 必須是陣列。`);
}

const uniqueIds = (items, label, makeId = item => item.id) => {
  const seen = new Set();
  for (const item of items) {
    const id = makeId(item);
    if (!id) fail(`${label} 有缺少 ID 的項目。`);
    else if (seen.has(id)) fail(`${label} 出現重複 ID：${id}`);
    seen.add(id);
  }
  return seen;
};

const articleIds = uniqueIds(articles, '文章');
const themeIds = uniqueIds(themes, '立意向度');
const techniqueIds = uniqueIds(techniques, '寫作手法');
const questionKeys = uniqueIds(questions, '試題', q => `${q.year}_${q.questionNumber}`);
const searchIndexIds = uniqueIds(searchIndex, '搜尋索引');
const allowedGenres = new Set(['narrative', 'argumentative', 'descriptive', 'topic']);
const allowedAnalysisTypes = new Set(['keyword', 'image', 'imagery', 'quote', 'continuation', 'argumentative', 'open']);
const derivedLinks = new Map(questions.map(q => [`${q.year}_${q.questionNumber}`, []]));
let paragraphCount = 0;
let commentCount = 0;
let taggedCount = 0;

for (const article of articles) {
  if (!Number.isInteger(article.id) || article.id < 1) fail(`文章 ID 無效：${article.id}`);
  if (!allowedGenres.has(article.genre)) fail(`篇章 ${article.id} 的文體無效：${article.genre}`);
  if (!article.file || !fs.existsSync(path.join(root, article.file))) {
    fail(`篇章 ${article.id} 的內容檔不存在：${article.file}`);
    continue;
  }
  for (const themeId of article.themeConceptIds || []) {
    if (!themeIds.has(themeId)) fail(`篇章 ${article.id} 參照不存在的立意向度：${themeId}`);
  }
  for (const ref of article.relatedQuestions || []) {
    const key = `${ref.year}_${ref.questionNumber}`;
    if (!questionKeys.has(key)) fail(`篇章 ${article.id} 參照不存在的試題：${key}`);
    else derivedLinks.get(key).push(article.id);
  }

  const detail = readJson(article.file);
  if (detail.reviewStatus !== undefined && !['pending-human-review', 'reviewed'].includes(detail.reviewStatus)) {
    fail(`篇章 ${article.id} 的 reviewStatus 無效：${detail.reviewStatus}`);
  }
  if (detail.reviewStatus === 'reviewed') {
    if (!String(detail.reviewedBy || '').trim()) fail(`篇章 ${article.id} 已標記 reviewed，但缺少 reviewedBy。`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(detail.reviewedAt || ''))) fail(`篇章 ${article.id} 已標記 reviewed，但 reviewedAt 必須是 YYYY-MM-DD。`);
  }
  for (const field of ['id', 'genre', 'wordCount', 'summary']) {
    if (detail[field] !== undefined && JSON.stringify(detail[field]) !== JSON.stringify(article[field])) {
      fail(`篇章 ${article.id} 的 ${field} 在索引與內容檔不一致。`);
    }
  }
  for (const field of ['relatedQuestions', 'themeConceptIds']) {
    if (detail[field] !== undefined && JSON.stringify(detail[field]) !== JSON.stringify(article[field])) {
      fail(`篇章 ${article.id} 的 ${field} 在索引與內容檔不一致。`);
    }
  }
  if (!Array.isArray(detail.paragraphs) || detail.paragraphs.length === 0) {
    fail(`篇章 ${article.id} 沒有有效段落。`);
  } else {
    detail.paragraphs.forEach((paragraph, index) => {
      paragraphCount += 1;
      const paragraphText = String(paragraph.text || '').trim();
      if (!paragraphText) fail(`篇章 ${article.id} 第 ${index + 1} 段缺少正文。`);
      if (String(paragraph.comment || '').trim()) commentCount += 1;
      if ((paragraph.techniqueTagIds || []).length) taggedCount += 1;
      for (const tagId of paragraph.techniqueTagIds || []) {
        if (/^t\d{2}$/.test(tagId)) {
          fail(`篇章 ${article.id} 第 ${index + 1} 段仍使用舊版手法代號：${tagId}`);
        } else if (!techniqueIds.has(tagId)) {
          fail(`篇章 ${article.id} 第 ${index + 1} 段參照不存在的手法：${tagId}`);
        }
      }
    });
  }
  const analysis = detail.topicAnalysis;
  if (!analysis || typeof analysis !== 'object') fail(`篇章 ${article.id} 缺少 topicAnalysis。`);
  else {
    if (!allowedAnalysisTypes.has(analysis.analysisType)) fail(`篇章 ${article.id} 的 analysisType 無效：${analysis.analysisType}`);
    if (!String(analysis.directionSuggestion || '').trim()) fail(`篇章 ${article.id} 缺少取材方向。`);
  }
}

for (const question of questions) {
  const key = `${question.year}_${question.questionNumber}`;
  const expected = [...new Set(derivedLinks.get(key))];
  const actual = question.relatedArticleIds || [];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`試題 ${key} 的 relatedArticleIds 未與 articles.json 同步。`);
  }
  for (const articleId of actual) {
    if (!articleIds.has(articleId)) fail(`試題 ${key} 參照不存在的篇章：${articleId}`);
  }
}

const indexedFiles = new Set(articles.map(article => path.basename(article.file)));
for (const file of fs.readdirSync(articleDir).filter(file => file.endsWith('.json'))) {
  if (!indexedFiles.has(file)) fail(`發現未列入索引的文章檔：data/articles/${file}`);
}

if (searchIndexIds.size !== articleIds.size || [...articleIds].some(id => !searchIndexIds.has(id))) {
  fail('搜尋索引未完整涵蓋 articles.json 的所有篇章。');
}

const commentCoverage = paragraphCount ? (commentCount / paragraphCount * 100).toFixed(1) : '0.0';
const tagCoverage = paragraphCount ? (taggedCount / paragraphCount * 100).toFixed(1) : '0.0';
if (commentCount < paragraphCount) warn(`段旨點評覆蓋率 ${commentCoverage}%（${commentCount}/${paragraphCount}）。`);
if (taggedCount < paragraphCount) warn(`手法標籤覆蓋率 ${tagCoverage}%（${taggedCount}/${paragraphCount}）。`);

for (const message of warnings) console.warn(`警告：${message}`);
if (errors.length) {
  for (const message of errors) console.error(`錯誤：${message}`);
  console.error(`\n驗證失敗：共 ${errors.length} 項錯誤。`);
  process.exit(1);
}

console.log(`驗證通過：${articles.length} 篇文章、${paragraphCount} 個段落、${questions.length} 道試題、${techniques.length} 種手法、${themes.length} 個立意向度。`);
