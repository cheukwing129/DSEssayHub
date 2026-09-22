import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const articles = readJson('data/articles.json');
const techniques = readJson('data/techniques.json');
const outputPath = path.join(root, 'data/search-index.json');
const checkOnly = process.argv.includes('--check');

const aliases = {
  t01:'tag_flashback', t02:'tag_sequence', t03:'tag_flashback', t04:'tag_echo',
  t05:'tag_scene', t06:'tag_character', t07:'tag_scene', t08:'tag_event_emotion',
  t09:'tag_direct_emotion', t10:'tag_dialogue', t11:'tag_psychological', t12:'tag_contrast',
  t13:'tag_scene_emotion', t14:'tag_symbolism', t15:'tag_question', t16:'tag_rhetorical_question',
  t17:'tag_parallel', t18:'tag_progression', t19:'tag_metaphor', t20:'tag_personification',
  t21:'tag_counterargument', t22:'tag_example', t23:'tag_quote', t24:'tag_balanced_argument',
  t25:'tag_analogy', t26:'tag_thesis', t27:'tag_foreshadowing', t28:'tag_suspense',
  t29:'tag_transition', t30:'tag_side_description', t31:'tag_dynamic_static', t32:'tag_sensory',
  t33:'tag_detail', t34:'tag_small_big', t35:'tag_question'
};

const techniqueNameById = Object.fromEntries(techniques.map(item => [item.id, item.name]));
const flatten = value => Array.isArray(value) ? value.flatMap(flatten) : [String(value ?? '').trim()];

const index = articles.map(article => {
  const detail = readJson(article.file);
  const paragraphs = Array.isArray(detail.paragraphs) ? detail.paragraphs : [];
  const techniqueNames = [...new Set(paragraphs.flatMap(paragraph =>
    (paragraph.techniqueTagIds || [])
      .map(id => techniqueNameById[aliases[id] || id])
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
