# 小學三年級練習站

給國小三年級（三上）用的離線練習網站：數學（康軒三上 1–5 單元）、國語、閱讀理解。
純 HTML/CSS/JavaScript，不需要建置、不連外部資源，可直接放上 GitHub Pages。

- `index.html`、`style.css`、`app.js`：網站本體
- `data.js`：題庫（新增題目照現有格式即可）
- `validate.js`：題庫檢查（`node validate.js`）：每題都有答案/提示/解說、選擇題答案在選項中、數字題用 `check` 算式重算答案

本機測試：`python3 -m http.server 8000` 後開 http://localhost:8000/

作答紀錄與錯題本只存在該裝置瀏覽器的 localStorage。
