# 微調小型語言模型（SLM）製作輔導諮商語音聊天機器人

孫逸平｜2024-09-18

---

## 簡介

隨著人工智慧技術的發展，加上 Apple 對開源社群的投資，想要在自己的 Mac 電腦上運行語言模型已不再是什麼困難的事情。

於是我就開始思考，語言模型除了製作類似 ChatGPT 的聊天機器人，是否還能運用在其他領域。眾所周知，心理諮商的成本相當之高，一小時的諮商可能就要花掉上千元，然而在諮商時，往往需要耗費大把的時間在搜集病人的基本資訊及背景，若能透過語言模型製作輔導諮商的聊天機器人將可降低大量時間與金錢成本。

心理諮商師的語氣和說話模式是諮商時的關鍵重點之一，而模型微調即是相當適合改變語言模型說話模式的途徑。

因此我想使用心理諮商的對話紀錄資料集微調小型語言模型並進行語音的訓練，製作輔導諮商語音聊天機器人，以協助心理諮商領域降低諮商成本。

然而本次製作僅為測試階段及示範，並無實際拿相關資料進行訓練。

## 製作規劃與架構

1. **建置環境**：建立 conda 環境並使用 GitHub 上的 [linyiLYi/bilibot](https://github.com/linyiLYi/bilibot) 專案。
2. **下載模型**：下載本次使用的 [Qwen/Qwen1.5-4B-Chat](https://huggingface.co/Qwen/Qwen1.5-4B-Chat) 模型。本次運行的環境如下：
    - CPU：Apple M1 Pro
    - RAM：16 GB
3. **進行微調**：借助 [mlx-lm](https://github.com/ml-explore/mlx-examples/blob/main/llms/mlx_lm/LORA.md) 進行微調。
4. **語音生成**：透過 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 將語言模型的問答進行生成語音。

---

## Step 1：環境建置

> 1. 克隆 [linyiLYi/bilibot](https://github.com/linyiLYi/bilibot) 的專案：
    
```bash
git clone https://github.com/linyiLYi/bilibot.git
```
    
> 2. 執行以下指令確認 Anaconda 是否安裝，若沒有成功顯示版本號，請至[官網](https://www.anaconda.com/download/success)下載並安裝 Anaconda。

```bash
    conda --version
```

> 3. 建立環境並啟動：
    
```bash
conda create -n bilibot python=3.10
conda activate bilibot
```
    
> 4. 進入 bilibot 資料夾中並安裝套件：
    
```bash
cd bilibot
pip install -r requirements.txt
```

## Step 2: 下載模型

> 1. 透過 brew 安裝 git-lfs，或在[官網](https://git-lfs.com/)查看其他安裝方式：
        
```bash
git lfs install
```
        
> 2. 在 `bilibot/` 中建立資料夾 `models`：
    
```bash
mkdir models
```
    
> 3. 進入 `models` 資料夾並下載模型，本次使用 Qwen1.5-4B-Chat 作為範例：
    
```bash
cd models
git clone https://huggingface.co/Qwen/Qwen1.5-4B-Chat
```
    

## Step 3：進行微調

> 1. 回到 `bilibot/` 資料夾

> 2. 輸入以下指令進行微調，當中的 `-batcb-size` 若電腦能夠負荷，可改為 `16`：
    
```bash
python -m mlx_lm.lora --model models/Qwen1.5-4B-Chat --data data/ --train --iters 1000 --batch-size 4 --lora-layers 12
```
    
> 3. 將微調後的 adapters 文件與原模型合併：
    
```bash
python -m mlx_lm.fuse --model models/Qwen1.5-4B-Chat --save-path models/Qwen1.5-4B-Chat-FT --adapter-path adapters/
```
    
> 4. 對壓縮後的模型進行加速，執行以下指令前，需對 tools/copress_model.py 檔的內容將模型路徑及檔名進行修改：
    
```bash
python tools/compress_model.py
```
    
> 5. 對話測試，執行以下指令前，需對 main/chat.py 檔的內容將模型路徑及檔名進行修改：
    
```bash
python chat.py
```
    
> 6. 現在你可以和一個經過微調，讓說話模式變得很像酸民的聊天機器人。
    
![Screenshot 2024-07-23 at 00.15.18.png](posts/2024-SLM-tunning/image.png)
    

## Step 4: 語音生成

透過 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 生成語音，Mac 使用者可透過官方的[教學指南](https://www.yuque.com/baicaigongchang1145haoyuangong/ib3g1e/znoph9dtetg437xb)操作，指南當中也有教學的[影片](https://b23.tv/wJWCNWc)。

本次以 Apple Silicon 的電腦作為範例，操作步驟如下：

> 1. 下載並解壓縮資料：https://www.icloud.com/iclouddrive/0c4q1AeMClzGC2l-srUdlJE8Q#GPT-SoVITS
> 2. 進入資料夾後，在終端機輸入：
    
```bash
bash install\ for\ mac.sh
```
    
> 3. 執行 webUI：
    
```bash
./go-webui.command
```
    
> 4. 依照 Web 中的 UI 進行語音訓練。

---

## 總結

透過這次的實作經驗讓我對於人工智慧有更多的認識，也相當期待未來人工智慧的發展及應用會如何幫助社會更加進步與方便。

這次的實作我認為最可惜的地方是，沒有完整做出輔導諮商語音聊天機器人，不過後續若有時間，還是可以將這個聊天機器人完整的做出來，並且去更深入的調查、了解諮商領域。