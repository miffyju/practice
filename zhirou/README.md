# 芷媃的五年級練習站

給芷媃（新北文德國小五年級，115 學年度上學期）用的離線練習網站，架構與功能同妹妹紫嫈的三年級練習站。題目已加深（多步驟應用、推理、陷阱、比較判斷、長篇閱讀），目標私中與資優班程度。

題數：「📝 期中考衝刺」5 組基本題 84 題（國語 第1~3課 15、國語 第4~6課 15、數學 第一~五單元 18、自然 第1~2單元 16、社會 第一~二單元 20，含大肚王國 5 題）＋ 5 組「⭐ 挑戰題」33 題（國語 5+5、數學 7、自然 6、社會 10，含大肚王國 4 題），共 117 題。另有「🔤 英文」科目（康軒 Wonder World 5 Unit 1 The Best Drink、Unit 2 Let’s Make Fruit Salad 單字）：基本 18 題、⭐ 挑戰 9 題，有「🔊 唸給我聽」；全站共 144 題。英文顏色 #b48ee0 同紫嫈網站。首頁另有國語/數學/自然/社會按鈕，裡面是同一批題目。科目顏色同紫嫈網站（國語 #7ec8a9、數學 #ff9f68、自然 #6cc070、社會 #f2b84b），單元按鈕、題目頁標籤與題目卡左邊框都依科目上色（data.js 單元的 color 欄位）。長篇閱讀用題目的 passage 欄位。題目依五上考卷題型與考點改寫，非出版社原題。部署位置：repo miffyju/practice 的 zhirou/（https://miffyju.github.io/practice/zhirou/），資源皆為相對路徑；localStorage 鍵名為 p5zr_*，不會和妹妹的紀錄混在一起。
純 HTML/CSS/JavaScript，不需要建置、不連外部資源，可直接放上 GitHub Pages。

- `index.html`、`style.css`、`app.js`：網站本體
- `data.js`：題庫（新增題目照現有格式即可）
- `validate.js`：題庫檢查（`node validate.js`）：每題都有答案/提示/解說、選擇題答案在選項中、數字題用 `check` 算式重算答案、英語 `say` 欄位須為英文

本機測試：`python3 -m http.server 8000` 後開 http://localhost:8000/

作答紀錄與錯題本只存在該裝置瀏覽器的 localStorage。
