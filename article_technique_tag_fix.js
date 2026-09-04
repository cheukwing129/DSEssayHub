/*
  將本檔案內容完整複製到「文章詳情頁」原本顯示段落、段旨及寫作手法的 JavaScript 檔案。

  如果你的專案已有 article.js、article-detail.js 或 detail.js，請以本檔案覆蓋該檔案；
  並確認對應的 HTML 使用 <script src="article_technique_tag_fix.js"></script> 載入本檔案。
*/

const TECHNIQUE_ID_ALIASES = {
  t01: 'tag_flashback',
  t02: 'tag_sequence',
  t03: 'tag_flashback',
  t04: 'tag_echo',
  t05: 'tag_scene',
  t06: 'tag_character',
  t07: 'tag_scene',
  t08: 'tag_event_emotion',
  t09: 'tag_direct_emotion',
  t10: 'tag_dialogue',
  t11: 'tag_psychological',
  t12: 'tag_contrast',
  t13: 'tag_scene_emotion',
  t14: 'tag_symbolism',
  t15: 'tag_question',
  t16: 'tag_rhetorical_question',
  t17: 'tag_parallel',
  t18: 'tag_progression',
  t19: 'tag_metaphor',
  t20: 'tag_personification',
  t21: 'tag_counterargument',
  t22: 'tag_example',
  t23: 'tag_quote',
  t24: 'tag_balanced_argument',
  t25: 'tag_analogy',
  t26: 'tag_thesis',
  t27: 'tag_foreshadowing',
  t28: 'tag_suspense',
  t29: 'tag_transition',
  t30: 'tag_side_description',
  t31: 'tag_dynamic_static',
  t32: 'tag_sensory',
  t33: 'tag_detail',
  t34: 'tag_small_big',
  t35: 'tag_question'
};

const FALLBACK_TECHNIQUE_NAMES = {
  tag_background: '背景交代',
  tag_thesis: '提出主旨／點題',
  tag_definition: '下定義',
  tag_dialogue: '對話描寫',
  tag_flashback: '回憶／倒敘',
  tag_sequence: '順敘',
  tag_scene: '場景描寫',
  tag_character: '人物描寫',
  tag_detail: '細節描寫',
  tag_psychological: '心理描寫',
  tag_side_description: '側寫',
  tag_dynamic_static: '動靜結合',
  tag_sensory: '感官描寫',
  tag_event_emotion: '借事抒情',
  tag_direct_emotion: '直接抒情',
  tag_contrast: '對比襯托',
  tag_scene_emotion: '以景寓情',
  tag_symbolism: '象徵手法',
  tag_question: '設問／自問自答',
  tag_rhetorical_question: '反問',
  tag_parallel: '排比',
  tag_progression: '層遞',
  tag_metaphor: '比喻',
  tag_personification: '擬人',
  tag_repetition: '反覆',
  tag_counterargument: '反駁論點／駁論法',
  tag_example: '舉例／舉例論證',
  tag_quote: '引用／引用論證',
  tag_balanced_argument: '正反論證',
  tag_analogy: '類比論證',
  tag_small_big: '以小見大',
  tag_concession: '讓步論證',
  tag_cause_effect: '因果關係',
  tag_echo: '首尾呼應',
  tag_foreshadowing: '伏筆',
  tag_suspense: '懸念',
  tag_transition: '轉折',
  tag_ending: '反問結尾',
  tag_conclusion: '總結／結尾',
  tag_ending_open: '開放式結尾',
  tag_climax: '高潮'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeTechniqueId(id) {
  return TECHNIQUE_ID_ALIASES[id] || id;
}

function createTechniqueNameMap(techniques) {
  const names = { ...FALLBACK_TECHNIQUE_NAMES };
  (Array.isArray(techniques) ? techniques : []).forEach(technique => {
    if (technique && technique.id && technique.name) {
      names[technique.id] = technique.name;
    }
  });
  return names;
}

function getTechniqueDisplayName(id, techniqueNameById) {
  const normalizedId = normalizeTechniqueId(id);
  return techniqueNameById[normalizedId] || techniqueNameById[id] || FALLBACK_TECHNIQUE_NAMES[normalizedId] || id;
}

function buildTechniqueTagsHtml(techniqueTagIds, techniqueNameById) {
  if (!Array.isArray(techniqueTagIds) || techniqueTagIds.length === 0) {
    return '';
  }

  const seen = new Set();
  return techniqueTagIds
    .map(id => normalizeTechniqueId(id))
    .filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map(id => `<span class="technique-tag">${escapeHtml(getTechniqueDisplayName(id, techniqueNameById))}</span>`)
    .join('');
}

async function loadArticlePage() {
  const status = document.getElementById('articleStatus');
  const articleContent = document.getElementById('articleContent');

  try {
    const articleId = new URLSearchParams(window.location.search).get('id');
    if (!articleId) {
      throw new Error('找不到篇章編號。');
    }

    const [articlesResponse, techniquesResponse] = await Promise.all([
      fetch('data/articles.json'),
      fetch('data/techniques.json')
    ]);

    if (!articlesResponse.ok || !techniquesResponse.ok) {
      throw new Error('無法讀取範文或寫作手法資料。');
    }

    const articles = await articlesResponse.json();
    const techniques = await techniquesResponse.json();
    const article = articles.find(item => String(item.id) === String(articleId));

    if (!article) {
      throw new Error('找不到指定篇章。');
    }

    const articleResponse = await fetch(article.file);
    if (!articleResponse.ok) {
      throw new Error('無法讀取文章內容。');
    }

    const articleDetail = await articleResponse.json();
    const techniqueNameById = createTechniqueNameMap(techniques);
    const paragraphs = Array.isArray(articleDetail.paragraphs) ? articleDetail.paragraphs : [];

    articleContent.innerHTML = `
      <header class="article-header">
        <p class="article-kicker">篇章 ${String(article.id).padStart(2, '0')} ・ ${escapeHtml(article.genre || '')}</p>
        <h1>${escapeHtml(articleDetail.title || article.title || '範文')}</h1>
        <p>${escapeHtml(articleDetail.summary || article.summary || '')}</p>
      </header>
      <section class="paragraph-list">
        ${paragraphs.map((paragraph, index) => `
          <article class="paragraph-card">
            <div class="technique-tags">${buildTechniqueTagsHtml(paragraph.techniqueTagIds, techniqueNameById)}</div>
            <p class="paragraph-text"><strong>${index + 1}.</strong> ${escapeHtml(paragraph.text)}</p>
            ${paragraph.comment ? `<details class="paragraph-comment"><summary>顯示段旨點評</summary><p>${escapeHtml(paragraph.comment)}</p></details>` : ''}
          </article>
        `).join('')}
      </section>
    `;

    if (status) status.remove();
  } catch (error) {
    if (status) status.textContent = `文章載入失敗：${error.message}`;
  }
}

document.addEventListener('DOMContentLoaded', loadArticlePage);