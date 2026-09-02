/* ==========================================================================
   DSE 中文科範文自學平台 — 首頁邏輯 (main.js)

   這個檔案做兩件事：
   1. 手機版導航選單的開關（純 UI 互動，不涉及資料）
   2. 讀取 data/articles.json 與 data/themes.json，
      動態產生「熱門範文」卡片
   ========================================================================== */

/* -------------------------------------------------------------------------
   1. 手機版導航選單開關
   ------------------------------------------------------------------------- */

// 抓取按鈕本身，以及要被開關的選單容器
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    // aria-expanded 目前是不是 "true"，用字串比較（因為 HTML attribute 都是字串）
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';

    // 切換開關狀態：true 變 false，false 變 true
    navToggle.setAttribute('aria-expanded', String(!isOpen));

    // 用 class 控制選單的顯示／隱藏（實際樣式寫在 style.css 的 .main-nav.is-open）
    mainNav.classList.toggle('is-open', !isOpen);
  });
}


/* -------------------------------------------------------------------------
   2. 「熱門範文」卡片：讀取 JSON 資料並動態產生 HTML
   ------------------------------------------------------------------------- */

// 首頁最多顯示幾張範文卡片
const FEATURED_ARTICLE_COUNT = 6;

// 文體代碼（articles.json 裡的 genre 值）對應的中文顯示名稱
// 之後如果 genre 分類有變動，只需要改這裡一個地方
const GENRE_LABELS = {
  narrative: '記敘抒情文',
  argumentative: '論說文',
  descriptive: '描寫文',
  topic: '話題式/開放式'
};

// 抓取要放卡片的容器，以及一開始顯示「載入中」的提示文字
const articleGrid = document.getElementById('articleGrid');
const articleStatus = document.getElementById('articleStatus');

// 進入頁面就開始載入資料
loadFeaturedArticles();

/**
 * 讀取 articles.json 與 themes.json，並把結果交給 renderArticleCards() 畫出來。
 * 用 async function 是因為要用 await 等 fetch() 的結果，寫法比 .then() 鏈式呼叫更好讀。
 */
async function loadFeaturedArticles() {
  try {
    // Promise.all 讓三個 fetch 同時發出，不用一個等完才等下一個，速度較快。
    // 注意：articles.json 本身不存「題目全文」，題目全文是存在 questions.json 裡，
    // 兩者要用「年份 + 題號」互相對應，所以這裡也要一併讀取 questions.json。
    const [articlesRes, themesRes, questionsRes] = await Promise.all([
      fetch('data/articles.json'),
      fetch('data/themes.json'),
      fetch('data/questions.json')
    ]);

    // fetch() 只有在網路真的斷線時才會 reject，
    // 如果是 404 之類的錯誤，要自己檢查 response.ok 再丟出錯誤
    if (!articlesRes.ok || !themesRes.ok || !questionsRes.ok) {
      throw new Error('資料檔案讀取失敗，請確認 data 資料夾內的 JSON 檔案是否存在。');
    }

    const articles = await articlesRes.json();
    const themes = await themesRes.json();
    const questions = await questionsRes.json();

    // 把 themes.json 的陣列轉成「id -> 名稱」的對照表，方便之後用 id 快速查名稱
    // 例如 { "th01": "個人成長", "th02": "處世之道", ... }
    const themeNameById = {};
    themes.forEach(theme => {
      themeNameById[theme.id] = theme.name;
    });

    // 把 questions.json 轉成「年份_題號 -> 題目全文」的對照表，
    // 例如 { "2015_Q1": "試以「未曾說出口的……」為題……", "2013_Q3": "……" }
    // 之後用 article.relatedQuestions 裡的 year + questionNumber 組成同樣的 key 去查
    const questionFullByKey = {};
    questions.forEach(question => {
      const key = `${question.year}_${question.questionNumber}`;
      questionFullByKey[key] = question.questionFull;
    });

    renderArticleCards(articles, themeNameById, questionFullByKey);

  } catch (error) {
    // 常見原因：直接用瀏覽器打開 index.html（file:// 協定）時，
    // 部分瀏覽器會擋掉本地 JSON 的 fetch 請求（CORS 限制）。
    // 這種情況需要透過本地伺服器開啟頁面，例如 VS Code 的 Live Server 擴充功能。
    console.error('讀取範文資料時發生錯誤：', error);
    articleStatus.textContent = '範文資料載入失敗，請確認網站是透過伺服器（而非直接開啟檔案）瀏覽。';
  }
}

/**
 * 把範文資料陣列轉成卡片 HTML，插入 #articleGrid。
 * @param {Array} articles - articles.json 讀出來的整份陣列
 * @param {Object} themeNameById - 立意向度 id 對照名稱的物件
 * @param {Object} questionFullByKey - 「年份_題號 -> 題目全文」對照表
 */
function renderArticleCards(articles, themeNameById, questionFullByKey) {
  // 只取前 FEATURED_ARTICLE_COUNT 篇作為「熱門範文」展示
  // （未來若要改成真的依熱門程度排序，只要在這裡換成排序過的陣列即可）
  const featuredArticles = articles.slice(0, FEATURED_ARTICLE_COUNT);

  if (featuredArticles.length === 0) {
    articleStatus.textContent = '目前尚未有範文資料。';
    return;
  }

  // 把「載入中」的提示文字移除，準備放入真正的卡片
  articleStatus.remove();

  // 用 map() 把每篇範文轉成一段 HTML 字串，再用 join('') 全部接起來
  const cardsHtml = featuredArticles
    .map(article => buildArticleCardHtml(article, themeNameById, questionFullByKey))
    .join('');

  articleGrid.innerHTML = cardsHtml;
}

/**
 * 產生單一篇範文卡片的 HTML 字串。
 */
function buildArticleCardHtml(article, themeNameById, questionFullByKey) {
  const genreLabel = GENRE_LABELS[article.genre] || article.genre;
  const yearQuestionText = formatRelatedQuestions(article.relatedQuestions);
  const questionText = getQuestionFullText(article.relatedQuestions, questionFullByKey);
  const themeTagsHtml = buildThemeTagsHtml(article.themeConceptIds, themeNameById);

  // 篇章編號補成兩位數，例如 5 -> "05"，畫面上比較整齊
  const paddedId = String(article.id).padStart(2, '0');

  return `
    <a class="article-card" href="article.html?id=${article.id}">
      <div class="article-card-head">
        <span class="article-id">篇章 ${paddedId}</span>
        <span class="article-genre-tag">${genreLabel}</span>
      </div>
      <p class="article-meta">${yearQuestionText}</p>
      <h3 class="article-question" title="${escapeHtml(questionText)}">
        ${escapeHtml(questionText)}
      </h3>
      <div class="article-tags">
        ${themeTagsHtml}
      </div>
    </a>
  `;
}

/**
 * 依 relatedQuestions 的第一筆「年份 + 題號」，去 questionFullByKey 對照表查出題目全文。
 * 若一篇範文對應多個年份題目（見 SCHEMA.md 的一對多情況），卡片版面有限，
 * 這裡先只顯示第一筆題目的全文，其餘年份題號仍會顯示在上方的 yearQuestionText 那一行。
 */
function getQuestionFullText(relatedQuestions, questionFullByKey) {
  if (!relatedQuestions || relatedQuestions.length === 0) {
    return '（題目待補）';
  }

  const firstQuestion = relatedQuestions[0];
  const key = `${firstQuestion.year}_${firstQuestion.questionNumber}`;
  return questionFullByKey[key] || '（題目待補）';
}

/**
 * 把 relatedQuestions 陣列格式化成畫面上顯示的年份題號字串。
 * 一篇範文可能對應多年題目（見 SCHEMA.md），所以要處理多筆的情況。
 * 例如：[{year:"2013",questionNumber:"Q3"},{year:"2019",questionNumber:"Q4"}]
 *   -> "2013年 Q3・2019年 Q4"
 */
function formatRelatedQuestions(relatedQuestions) {
  if (!relatedQuestions || relatedQuestions.length === 0) {
    return '年份／題號待補';
  }

  return relatedQuestions
    .map(q => `${q.year}年 ${q.questionNumber}`)
    .join('・');
}

/**
 * 把 themeConceptIds（一堆 id）轉成一串 <span class="tag"> 標籤的 HTML。
 */
function buildThemeTagsHtml(themeConceptIds, themeNameById) {
  if (!themeConceptIds || themeConceptIds.length === 0) {
    return '';
  }

  return themeConceptIds
    .map(id => {
      const name = themeNameById[id] || id; // 萬一 id 對不到名稱，先顯示原始 id 方便除錯
      return `<span class="tag">${escapeHtml(name)}</span>`;
    })
    .join('');
}

/**
 * 簡單的 HTML 逸出函式，避免資料裡若含有 < > & 等符號時破壞版面或造成 XSS。
 * 因為目前資料是我們自己維護的 JSON，風險很低，但養成習慣比較安全。
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
