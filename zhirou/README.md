# 芷媃的五年級練習站

給芷媃（新北文德國小五年級，115 學年度上學期）用的離線練習網站，架構與功能同妹妹紫嫈的三年級練習站。目前題庫為「📝 期中考衝刺」。

題數：「📝 期中考衝刺」5 組 80 題——國語 第1~3課 15、國語 第4~6課 15、數學 第一~五單元 20（康軒）、自然 第1~2單元 16（南一）、社會 第一~二單元 14（翰林）。英語尚未加入。題目依五上考卷題型與考點改寫，非出版社原題。部署位置：repo miffyju/practice 的 zhirou/ 子資料夾（https://miffyju.github.io/practice/zhirou/），資源皆為相對路徑；localStorage 鍵名為 p5zr_*，不會和妹妹的紀錄混在一起。
純 HTML/CSS/JavaScript，不需要建置、不連外部資源，可直接放上 GitHub Pages。

- `index.html`、`style.css`、`app.js`：網站本體
- `data.js`：題庫（新增題目照現有格式即可）
- `validate.js`：題庫檢查（`node validate.js`）：每題都有答案/提示/解說、選擇題答案在選項中、數字題用 `check` 算式重算答案、英語 `say` 欄位須為英文

本機測試：`python3 -m http.server 8000` 後開 http://localhost:8000/

作答紀錄與錯題本只存在該裝置瀏覽器的 localStorage。
