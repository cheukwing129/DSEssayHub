# DSEssayHub

DSE 中文科寫作範文自學平台。網站以原生 HTML、CSS 和 JavaScript 建成，提供文體分類、歷屆試題、寫作技巧、審題訓練、段落點評及本機筆記功能。

## 本機開啟

瀏覽器會限制 `file://` 頁面讀取 JSON，因此不要直接雙擊 `index.html`。在專案目錄啟動本機伺服器：

```bash
python3 -m http.server 8000
```

然後開啟 `http://localhost:8000/`。

## 資料維護

- `data/articles.json`：文章索引，也是文章與試題關聯的唯一人工維護來源。
- `data/articles/article_NN.json`：每篇文章的全文、段旨、手法標籤和審題分析。
- `data/questions.json`：歷屆試題；`relatedArticleIds` 由同步腳本產生，不應手動修改。
- `data/themes.json`：立意向度主檔。
- `data/techniques.json`：寫作手法主檔。

新增或修改內容後執行：

```bash
npm run sync:data
npm run validate
```

提交前可一次執行：

```bash
npm run check
```

GitHub Actions 會在每個 Pull Request 重複執行相同檢查，驗證 JSON、檔案存在、ID 唯一性、跨檔案關聯、手法標籤和索引資料一致性。

更完整的資料格式及筆記結構請參閱 [SCHEMA.md](SCHEMA.md)。

## 使用者資料

高亮、註解、素材庫及審題答案目前保存在瀏覽器 LocalStorage，不會自動同步至其他裝置。請使用「我的筆記」頁面的匯出功能定期備份。

## 內容狀態

部分早期文章仍在補充逐段點評及寫作手法標籤。驗證腳本會把覆蓋率列為警告，但不阻止其他正確內容提交。
