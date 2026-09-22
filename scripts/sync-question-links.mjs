import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articlesPath = path.join(root, 'data/articles.json');
const questionsPath = path.join(root, 'data/questions.json');
const checkOnly = process.argv.includes('--check');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const articles = readJson(articlesPath);
const questions = readJson(questionsPath);
const idsByQuestion = new Map(questions.map(q => [`${q.year}_${q.questionNumber}`, []]));

for (const article of articles) {
  for (const question of article.relatedQuestions || []) {
    const key = `${question.year}_${question.questionNumber}`;
    if (!idsByQuestion.has(key)) {
      throw new Error(`篇章 ${article.id} 參照不存在的試題 ${key}`);
    }
    idsByQuestion.get(key).push(article.id);
  }
}

const synced = questions.map(question => ({
  ...question,
  relatedArticleIds: [...new Set(idsByQuestion.get(`${question.year}_${question.questionNumber}`))]
}));
const next = `${JSON.stringify(synced, null, 2)}\n`;
const current = fs.readFileSync(questionsPath, 'utf8');

if (checkOnly) {
  if (current !== next) {
    console.error('data/questions.json 的 relatedArticleIds 尚未同步；請執行 npm run sync:data。');
    process.exit(1);
  }
  console.log('試題反向關聯已同步。');
} else {
  fs.writeFileSync(questionsPath, next);
  console.log(`已從 articles.json 同步 ${questions.length} 道試題的反向關聯。`);
}
