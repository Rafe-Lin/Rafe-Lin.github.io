# 🚀 終極終端機美化指南：Zsh + Powerlevel10k + Windows Terminal

帶你把原本單調的終端機，打造成具備豐富圖示、極速提示符（Prompt），以及帶有透明背景與專屬底圖的超炫工作環境。

---

## 🛠️ 第一階段：安裝與啟用 Powerlevel10k 主題

在開始之前，請確保你已經安裝了 **Zsh**、**Oh My Zsh**，並且已經在終端機字型設定中選用了 **MesloLGS NF**（Nerd Font），這是確保後續圖示能正常顯示的關鍵。

### 1. 下載 Powerlevel10k
打開終端機，輸入以下指令將主題 Clone 到 Oh My Zsh 的 custom 目錄下：
```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
```

### 2. 解決 `zsh: command not found: p10k` 錯誤
如果你下載後直接執行 `p10k configure`，系統會報錯找不到指令。這是因為我們還沒告訴 Zsh 要啟用這個主題。

請編輯 Zsh 設定檔：
```bash
nano ~/.zshrc
```
找到 `ZSH_THEME` 這一行，將其修改為：
```bash
ZSH_THEME="powerlevel10k/powerlevel10k"
```
*(提示：若原本是 `ZSH_THEME="robbyrussell"`，直接替換掉即可。)*

儲存並離開（在 nano 中按 `Ctrl + O` -> `Enter` -> `Ctrl + X`），接著重新載入設定讓其生效：
```bash
source ~/.zshrc
```

---

## 🧙‍♂️ 第二階段：Powerlevel10k 設定精靈 (p10k configure)

執行 `source ~/.zshrc` 後，設定精靈通常會自動啟動。若沒有，請手動輸入 `p10k configure`。

### 1. 字型與圖示確認
精靈會連續問你幾個圖示問題（例如：是否看起來像菱形 `diamond`、鎖頭 `lock`、Python Logo 等）。
* **動作：** 只要圖示顯示正常（不是亂碼或方塊），請一路按 **`y` (Yes)**。

### 2. 關鍵風格設定
* **Character Set (字元集)：** 請務必選 **`1` (Unicode)**。這樣才能發揮 MesloLGS NF 字型的實力，顯示漂亮的資料夾、Git 分支圖示與流線轉角。
* **Prompt Style (風格) & Colors (顏色)：** 依照個人喜好選擇（如 Lean 極簡、Classic 經典、Rainbow 虹彩等）。

### 3. 進階功能設定
* **Enable Transient Prompt? (瞬時提示符)：**
    * 選 **`y` (Yes)**：執行指令後，舊的長提示符會縮水成一個小圖示，讓畫面保持極度清爽（推薦！）。
    * 選 **`n` (No)**：保留每一行完整的路徑與狀態紀錄。
* **Instant Prompt Mode (極速啟動模式)：**
    * 推薦選 **`1` (Verbose)**。這會讓終端機在開啟的瞬間「秒出」輸入框，大幅減少等待外掛加載的延遲感。
* **Apply changes to ~/.zshrc? (套用設定)：**
    * 請按 **`y`**，將剛剛的所有設定寫入設定檔。

---

## 🎨 第三階段：Windows Terminal 背景與透明度設定

最後，我們要在 Windows Terminal 中加入透明度光線效果與客製化背景圖。

### 1. 修改 Terminal 設定檔
1. 在 Windows Terminal 上方的下拉選單（`v`）中點擊 **「設定」**（或按 `Ctrl + ,`）。
2. 在設定視窗的左下方，點擊 **「開啟 JSON 檔」**。
3. 將你準備好的 `profiles.json`（內含透明度與光線效果設定）的內容，複製並替換/合併到開啟的設定檔中，然後存檔。這樣你的終端機就會具備基礎的光線與透明度效果。

### 2. 放置背景圖片
1. 準備好你的背景圖片，例如 `au-os-L.png` 或 `au-os-M.png`。
2. 打開檔案總管，前往以下隱藏路徑（請將 `<YourUsername>` 換成你自己的 Windows 使用者名稱，例如 `USER`）：
   ```text
   C:\Users\<YourUsername>\AppData\Local\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState
   ```
3. 將圖片放入該資料夾，並確保檔名與你 JSON 設定檔中呼叫的名稱一致（例如將其重新命名為 **`au-os-L.png`**）。

🎉 **大功告成！** 現在重新打開 Windows Terminal，你就會看到帶有超帥背景圖、半透明效果，以及專業 p10k 提示符的完美開發環境了！

![](postsBeautify your Terminal - WSL2/resu;t.png)
