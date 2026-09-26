# DSE 中文科範文自學網站 — 架構與資料說明

本文件說明目前網站的實際檔案結構、資料格式，以及各頁面之間如何串接。

**這份文件在階段一寫過一次，但後來架構有幾次演進（尤其是範文內容從單檔改成分檔、筆記系統從一個 LocalStorage 物件拆成三把 key），舊版文件已經跟實際程式碼對不上，這次是照目前的實際狀態整份重寫。**

---

## 總覽：三層資料

```
靜態內容資料（/data，開發者維護，唯讀）
  ├─ articles.json ─────────┐
  ├─ articles/article_NN.json  （每篇範文的完整內容，分檔存放）
  ├─ questions.json
  ├─ themes.json
  ├─ techniques.json
  └─ search-index.json          （由腳本產生的全文搜尋索引）

使用者資料（LocalStorage，瀏覽器本地，讀寫）
  ├─ dse_notes        （高亮＋段落註解）
  ├─ materialBank     （素材庫收藏）
  └─ articleProgress  （結構分析／個人反思／審題訓練）

網站頁面（純靜態 HTML，各自獨立的 <script>，不共用框架）
  index.html／genre-list.html／genre.html／questions.html／
  techniques.html／article.html／notes.html／search.html
```

---

## 一、靜態內容資料

### 1.1 `articles.json` — 範文索引（不是完整內容）

放在 `/data/articles.json`，是一個陣列，**每篇範文只有列表頁需要的欄位**，不含段落全文：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 篇章編號，1–86，全站唯一 |
| `genre` | string | `"narrative"` / `"argumentative"` / `"descriptive"` / `"topic"` 之一 |
| `relatedQuestions` | array of object | `{ year, questionNumber }`，一篇可能對應多年題目 |
| `wordCount` | number | 全文字數 |
| `themeConceptIds` | array of string | 參照 `themes.json` 的 `id` |
| `summary` | string | 一兩句話的內容簡介，首頁／文體列表／搜尋結果／範文詳情頁都會用到 |

**為什麼拆成索引 + 分檔**：86 篇全文全部塞進一個檔案，光是列表頁（只需要題目跟摘要）也要整份下載，太浪費。拆開之後，列表類頁面只讀輕量索引，點進單篇才抓完整內容。

### 1.2 `articles/article_NN.json` — 單篇範文完整內容

`NN` 是篇章編號補零到兩位數（例如篇章 5 對應 `article_05.json`）。每個檔案是一個物件。現有資料亦保留 `id`、`genre`、`relatedQuestions`、`wordCount`、`themeConceptIds` 和 `summary` 等索引欄位；這些欄位必須與 `articles.json` 一致，驗證腳本會自動檢查：

```json
{
  "paragraphs": [ ... ],
  "topicAnalysis": { ... }
}
```

**`paragraphs[]`**，每個元素：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `text` | string | 段落原文；不得為空字串。如匯入後出現空白段，應先核對是否只是切段／格式錯誤 |
| `comment` | string | 段旨點評，可為空字串 |
| `techniqueTagIds` | array of string | 參照 `techniques.json` 的語意化 `id`（`tag_xxx`）；驗證腳本會拒絕舊版 `tNN` 代號 |

文章層級可另設 `reviewStatus`：`pending-human-review` 表示點評／標籤已整理但尚待人工覆核；只有完成人工覆核後才可改為 `reviewed`，而且必須同時填寫 `reviewedBy` 與 `reviewedAt`（`YYYY-MM-DD`）。這個欄位用來區分「內容已補齊」與「已由人手確認」兩件事，避免把自動整理誤當人工審核。

**`topicAnalysis`**：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `analysisType` | string | `"keyword"` / `"image"` / `"quote"` / `"continuation"` / `"argumentative"` / `"open"`；舊資料亦兼容 `"imagery"` |
| `keywordExplanation` | string | 題目字詞、引文、續寫要求或議題解說 |
| `imageryDescription` | string | 圖畫／寓意及核心意象描述；`image`／`imagery` 類型會優先顯示此欄 |
| `directionSuggestion` | string | 取材方向與立意建議，各類型都會使用 |
| `referenceAnswerPoints` | array of string | 參考立意要點，審題訓練模式「查看參考答案」後第一層顯示的內容 |
| `openEndedAngles` | array of string | 開放式取材角度，只有話題式文體（`genre: "topic"`）會用到，其他文體是空陣列 |

**新增一篇範文的流程**：用 `/tools/paste-to-json-tool.html` 把 Word 原文貼上切段，複製產生的 `paragraphs` 陣列，貼進新的 `article_NN.json`，手動補上 `comment`／`techniqueTagIds`／`topicAnalysis`；同時記得在 `articles.json` 加一筆對應的索引項目。若匯入後出現空白段，應先核對原稿與切段結果；不要把純格式空行當成正文段落，也不要以推測文字補寫原稿。

### 1.3 `questions.json` — 歷屆試題

陣列，每個元素：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `year` | string | 年份，pilot paper 用 `"2012pp"` 這種格式 |
| `questionNumber` | string | 題號，如 `"Q1"` |
| `questionFull` | string | 題目完整文字 |
| `questionType` | string（舊資料） | 2012–2021 等較早資料主要使用的題型標籤，現有值包括「記敘」「議論」「人物描寫」「景物描寫」「開放式」「圖畫題」「談論類」等；暫未強制正規化 |
| `relatedArticleIds` | array of number | 對應 `articles.json` 的 `id`；由同步腳本產生，不應手動修改 |
| `hasImage` | boolean（可選） | 原題是否包含必須配合閱讀的圖片 |
| `imagePath` | string（可選） | 已收錄原題圖片時的站內相對路徑，例如 `assets/question-images/2022_Q2.png` |
| `imageAlt` | string（可選） | 原題圖片的無障礙替代文字；有 `imagePath` 時應一併提供 |
| `imageNote` | string（可選） | 圖片來源／性質的簡短說明；目前使用「原題附圖」 |

2022–2026 等較新的試題資料主要以 `genre`（`narrative` / `argumentative` / `descriptive` / `topic`）表示文體分類，並可包含 `subject`、`title`、`hasImage`、`imagePath`、`imageAlt`、`imageNote` 等欄位；舊題則主要使用 `questionType`。每道題至少應有 `questionType` 或合法 `genre` 其中一種分類。現階段不應僅為格式一致而批量補寫另一套 metadata，待完成全庫題型語義審核後再決定是否統一 schema。

`articles.json.relatedQuestions` 是關聯的唯一人工維護來源。執行 `npm run sync:data` 會重建 `questions.json.relatedArticleIds`，`npm run check` 會阻止未同步資料進入主分支。

### 1.4 `themes.json` — 立意向度主檔

| 欄位 | 型別 |
|---|---|
| `id` | string，如 `"th01"` |
| `name` | string，如「個人成長」 |
| `description` | string |

### 1.5 `techniques.json` — 寫作手法主檔

| 欄位 | 型別 |
|---|---|
| `id` | string |
| `name` | string，如「倒敘法」 |
| `category` | string，`"敘事技巧"` / `"描寫手法"` / `"抒情手法"` / `"修辭手法"` / `"論說手法"` / `"結構手法"` 之一 |
| `description` | string |

所有文章現已統一使用 `tag_xxx` 語意化 ID；新增或修改文章時亦必須直接使用這些 ID。

### 1.6 `search-index.json` — 自動產生的全文搜尋索引

搜尋索引由 `npm run build:search` 讀取 86 個文章分檔後產生，包含正文、段旨點評、題目分析及文章實際使用的寫作手法名稱。`search.html` 只需額外讀取這一個檔案，不會在每次搜尋時逐篇請求 86 個 JSON。

這個檔案不可手動修改。新增或修改文章後應執行 `npm run sync`；`npm run check` 會檢查索引內容是否為最新版本及是否完整涵蓋全部篇章。

---

## 二、使用者資料（LocalStorage）

以下三把 key 都是「執行期由瀏覽器產生」，不是檔案，也**不會同步到雲端**——這是目前最大的限制，見第五章。三把 key 各自獨立，不要互相混用。

### 2.1 `dse_notes` — 高亮與段落註解

陣列，每筆：

```json
{
  "articleId": "5",
  "paragraphIndex": 0,
  "type": "highlight",
  "color": "yellow",
  "text": "段落原文（存起來方便之後不用重新抓範文內容就能顯示）",
  "noteContent": "",
  "timestamp": 1788644411178
}
```

- `type` 是 `"highlight"` 或 `"comment"` 兩種之一。**同一段可以同時有一筆 highlight 跟一筆 comment**，是兩筆獨立資料，不是同一筆的兩個欄位。
- `color` 只有 `type: "highlight"` 才有意義，值是 `"yellow"`（好詞好句）／`"pink"`（修辭手法）／`"blue"`（立意轉折），對應 `type: "comment"` 時固定是空字串。
- `noteContent` 反過來，只有 `type: "comment"` 才有內容。
- `articleId` 存成字串（即使 `articles.json` 裡的 `id` 是數字），比對時全部用 `String()` 轉型後再比較，避免型別不一致漏比對。

### 2.2 `materialBank` — 素材庫收藏

陣列，每筆：

```json
{
  "articleId": "5",
  "paragraphIndex": 1,
  "type": "material",
  "text": "段落原文",
  "timestamp": 1788644411577
}
```

刻意跟 `dse_notes` 分開存放：概念上素材庫是「收藏的好句子清單」，跟針對單一段落的個人筆記用途不同，之後如果只想匯出/清空素材庫、不動筆記，分開存會比較方便。

### 2.3 `articleProgress` — 結構分析／個人反思／審題訓練

**格式跟前兩個不一樣：是物件，不是陣列**，key 是 `articleId`：

```json
{
  "5": {
    "structureNote": "起：藤椅蒲扇的日常\n承：……",
    "reflectionNote": "我想到自己也有類似的經驗……",
    "trainingModeAnswer": "我認為這道題目的關鍵詞是……",
    "trainingModeRevealed": true,
    "updatedAt": 1788644412694
  }
}
```

| 欄位 | 說明 |
|---|---|
| `structureNote` | 筆記面板「結構分析」分頁的內容 |
| `reflectionNote` | 筆記面板「個人反思」分頁的內容 |
| `trainingModeAnswer` | 審題訓練模式裡，學生自己寫的審題分析 |
| `trainingModeRevealed` | 布林值，是否已經按過「查看參考答案」——記住這個狀態，下次回來這篇文章不用重新點開 |
| `updatedAt` | 最後修改時間，合併備份資料時用來判斷「哪一份比較新」 |

這三個欄位存在同一個物件底下，是因為它們有一個共同特徵：**每篇文章只有一份**（不像高亮/註解/素材是「每段可以有好幾筆」），用 articleId 直接當 key 存取最直覺。

### 2.4 備份檔案格式（匯出／匯入）

`notes.html` 的「匯出備份」會產生這個結構的 JSON 檔案：

```json
{
  "exportedAt": "2026-09-05T09:33:00.000Z",
  "version": 1,
  "dse_notes": [ ... ],
  "materialBank": [ ... ],
  "articleProgress": { ... }
}
```

`version` 欄位是為了將來資料格式如果改變，可以判斷舊備份檔案還相不相容，目前固定是 `1`。匯入時採**合併**邏輯：陣列類資料用 `articleId + paragraphIndex + type` 判斷是不是同一筆，物件類資料用 `articleId`，遇到重複的都比較 `timestamp`／`updatedAt`，留下比較新的一份，不會用舊資料覆蓋新資料。

---

## 三、網站頁面地圖

全部都是獨立的靜態 HTML，各自在檔案內寫自己的 `<style>` 跟 `<script>`（除了 `index.html` 額外拉了共用的 `style.css`／`main.js`），沒有共用的前端框架或建置流程。

| 頁面 | 用途 | 主要讀取的資料 |
|---|---|---|
| `index.html` | 首頁，寫作地圖＋熱門範文 | `articles.json`、`themes.json`、`questions.json` |
| `genre-list.html` | 四大文體總覽，含即時收錄篇數統計 | `articles.json` |
| `genre.html?type=xxx` | 單一文體的範文列表，可依立意向度篩選 | `articles.json`、`themes.json`、`questions.json` |
| `questions.html` | 歷屆試題列表，可依年份／題型篩選 | `questions.json`、`articles.json` |
| `techniques.html` | 寫作手法字典，可依分類篩選；支援 `?highlight=<id>` 深層連結（從搜尋結果點進來時捲動＋脈動提示） | `techniques.json` |
| `article.html?id=xxx` | 範文詳情頁，全站最複雜的頁面（見下方獨立說明） | `articles.json`、`articles/article_NN.json`、`themes.json`、`techniques.json`、`questions.json` |
| `notes.html` | 我的筆記，跨文章彙整所有高亮／註解／素材／匯出入備份 | `articles.json`、`questions.json`＋三把 LocalStorage key |
| `search.html` | 全站搜尋，同時搜範文全文／段旨／分析／試題／寫作手法，並按相關度排列範文 | `articles.json`、`search-index.json`、`questions.json`、`themes.json`、`techniques.json` |

### `article.html` 內部功能一覽

這個頁面疊了好幾層功能，容易搞混，列一下目前有哪些：

1. **審題訓練**：先隱藏 `referenceAnswerPoints`／`openEndedAngles`／完整解說，學生寫下自己的審題分析（存到 `articleProgress[id].trainingModeAnswer`）後按「查看參考答案」才展開，狀態記在 `trainingModeRevealed`。
2. **逐段點評**：每段的 `comment` 預設收合，點「顯示段旨點評」才展開（原生 `<details>`）。
3. **段落高亮**：段落右上角的標記筆圖示，選色寫入 `dse_notes`（`type: "highlight"`）。
4. **段落註解**：高亮選單裡的「加註解」，彈出對話框寫入 `dse_notes`（`type: "comment"`）。
5. **素材庫收藏**：高亮選單裡的「加入素材庫」，寫入 `materialBank`。
6. **筆記面板**：右下角固定按鈕開關的側欄（桌面）／底部抽屜（手機），三個分頁對應「結構分析」「佳句與手法（即時彙整當前文章的高亮＋素材）」「個人反思」。

第 3–6 項互相獨立，同一段可以同時有高亮＋註解＋素材庫收藏，三者互不影響。

---

## 四、審題訓練模式的前端邏輯

（這段是階段一就寫好的原始設計，目前 `article.html` 已經照這個邏輯實作出來了）

1. 頁面載入時只顯示題目跟一個空白輸入框，`topicAnalysis` 的所有欄位都藏起來。
2. 學生寫下審題分析，自動存到 `articleProgress[articleId].trainingModeAnswer`（debounce 600ms 後存檔）。
3. 按「查看參考答案」，才依序顯示：先是 `referenceAnswerPoints`（精簡條列，快速對答案用）跟 `openEndedAngles`（如果是話題式文體），再往下一層才是「展開完整解說」（`keywordExplanation`／`imageryDescription` ＋ `directionSuggestion`，屬於更詳細的補充材料，刻意用巢狀的 `<details>` 藏得更深一層）。
4. 揭曉狀態存在 `trainingModeRevealed`，下次回來這篇文章會記得，不用重新點一次；也可以點「隱藏參考答案，重新練習」收回去，但學生寫的分析不會被清空。

---

## 五、已知技術債／待辦事項

### 5.1 尚未接 Firebase，資料只存在單一瀏覽器

`dse_notes`／`materialBank`／`articleProgress` 都只存在瀏覽器的 LocalStorage，換裝置或清除瀏覽器資料就會遺失。目前用「匯出／匯入備份」（見 2.4）作為暫時的解法，長期還是要接雲端同步。三把 key 的資料形狀已經比較穩定，之後要接 Firestore 的話：

- `dse_notes` → 可以直接對應 `users/{uid}/notes/{noteId}` 這種子集合
- `materialBank` → `users/{uid}/materials/{materialId}`
- `articleProgress` → `users/{uid}/articleProgress/{articleId}`（這個本來就是用 articleId 當 key，剛好對應 Firestore 文件 ID）
