# 2025-scratch-1-hour-course

---


- 這是給有 Scratch 基礎的人的一小時課程，目標是:
(1) 先做出遊戲基本設定
(2) 學生自行創造地圖
(3) 加上其他遊戲元素


## 1 創建角色

(1) 首先創建一個角色，把角色底部換成另一種顏色，以便偵測是否觸碰地板
![image](https://hackmd.io/_uploads/B1MizxqOR.png)

(2) 創建角色 地圖  做成角色可以在上面移動的地版，選一種顏色當成可以踩的，另一種顏色當成不能踩的，造型名稱設 1，當第一關的地板
 ![螢幕擷取畫面 2024-07-22 143751](https://hackmd.io/_uploads/ByJdCOsd0.png)
 我選藍色當可以踩的，紅色當不能踩的



## 玩家角色移動程式

(1) 第一塊積木就是當綠旗被點擊，後面接綠旗被點擊後要執行的事
(2) 先把角色拉到畫面最左邊，站在藍色地圖上後，再拉取此積木，以此座標當起始點

![image](https://hackmd.io/_uploads/Hk3zcUj_C.png)

(3) 讓角色只能向左或向右轉，不旋轉
![螢幕擷取畫面 2024-07-22 115330](https://hackmd.io/_uploads/r1qZOLodA.png)



這樣就完成基本定位了!


- 如果要按下 A 向左移動 :
(1) 當 (a) 鍵被按下
(2) 重複直到 (a) 鍵被按下不成立
(3) 面朝 -90 度
(4) X軸改變 -10，角色像畫面左方移動
![螢幕擷取畫面 2024-07-22 122145](https://hackmd.io/_uploads/By95AIi_C.png)

- 如果要按下 D 向右移動 :
(1) 當 (d) 鍵被按下
(2) 重複直到 (d) 鍵被按下不成立
(3) 面朝 90 度
(4) X軸改變 10，角色像畫面右方移動
![螢幕擷取畫面 2024-07-22 122658](https://hackmd.io/_uploads/ByM01wj_R.png)


這樣就能左右移動了!

- 如果按下空白鍵要跳 :
先建立一個變數 [jump]
![螢幕擷取畫面 2024-07-22 154523](https://hackmd.io/_uploads/HyuN0YsOR.png)![image](https://hackmd.io/_uploads/HyyN0FjdC.png)

(1) 當空白鍵被按下
(2) 變數 jump 設為 15，這會影響跳的高度
(3) 重複直到 四捨五入 (jump) 等於零
(4) y 改變 (jump)，(jump) 會隨著迴圈重複變小，向上跳的速度也會變慢
(5) (jump) 乘 0.9，讓 (jump) 越來越小
(6) 等待直到 顏色(一開始畫角色底部顏色)碰到 顏色(可以踩的地板)。讓角色的腳碰到可以踩的地面前都在等待。使用滴管工具選取顏色
![螢幕擷取畫面 2024-07-22 122821](https://hackmd.io/_uploads/SyfMxvju0.png)![螢幕擷取畫面 2024-07-22 123804](https://hackmd.io/_uploads/r1Owfvsu0.png)


這樣就能按下空白鍵跳躍!


## 重力

- 角色跳起之後落下直到碰到地板 :
(1) 把積木接到之前定位的程式後，用於重複無限次
(2) 重複直到 顏色(角色底部的顏色) 碰到 顏色(可以踩的地板)，使用滴管選取該色
(3) 下降 4。如果下降太多會卡在地板，太少下降太慢
(4) 如果碰到顏色(不能踩的地板)
(5) 定位到關卡起始點

![螢幕擷取畫面 2024-07-22 124950](https://hackmd.io/_uploads/ry4QrDj_A.png)
這樣就能站在藍色上，踩到紅色傳送就到起始點


## 目的地

如果要做很多關，就要使用一個變數紀錄關卡 :
建立變數 (level)，把變數設定放到綠旗積木底下，把關卡設為 1 ![螢幕擷取畫面 2024-07-22 125800](https://hackmd.io/_uploads/SkpmvPouR.png)

當角色碰到右邊邊緣進到下一關 : 
程式接在當 d 被按下後
(1) 如果 x 座標大於 220 且碰到邊緣
(2) 變數 (level) 改變 1，進到下一關
(3) 定位回起始點
![螢幕擷取畫面 2024-07-22 142720](https://hackmd.io/_uploads/r1RPhus_R.png)
到這裡就做好一關了

## 關卡
- 如果要做很多關，角色 地圖就需要換造型 : 
切換到角色 地圖的程式區
(1) 當綠旗被點擊
(2) 顯示
(3) 關卡地板一到最下層才不會擋住玩家角色
(4) 定位到正中央
(5) 重複無限次 (不小心多拉一塊，一個就夠了)
(6) 造型換成現在關卡的數字。所以地圖的造型會換成level 變數的數字，也就是造型名稱數字即是該 level 的地板
![螢幕擷取畫面 2024-07-22 145519](https://hackmd.io/_uploads/HyLFGtj_0.png)
這樣就是遊戲的基本設定了


## 其他元素

### 其他關卡
- 如果要新增其他關卡:
- 到角色 地圖的造型，選繪畫![image](https://hackmd.io/_uploads/r1jeLto_0.png)

把造型名稱你想要的關卡數(造型名稱數字即是該 level 的地板)
畫之前先去前面的關卡選取顏色 
![image](https://hackmd.io/_uploads/HkIBPto_R.png)
只能使用特定顏色，因為偵測是判斷顏色

### 敵人
- 如果要增加一個敵人，會朝向玩家角色移動，玩家角色碰到敵人就定位回傳送點
敵人程式:
(1) 朝向玩家
(2) 移動9直到碰到邊緣
(3) 碰到邊緣反彈後移動 10 以免卡再牆裡
(4) 等待一秒後重複上述
![螢幕擷取畫面 2024-07-22 152227](https://hackmd.io/_uploads/S1L1YtouR.png)
玩家角色程式:
(1) 再玩家角色偵測地板處多加偵測敵人
![螢幕擷取畫面 2024-07-22 153155](https://hackmd.io/_uploads/Hy0WitsuA.png)


玩家角色碰到衝過來的敵人就會被傳送回起始點
 - 還有很多不同的元素可以增加，像觸碰特殊顏色地圖有不同作用，增加計時等等。
![image](https://hackmd.io/_uploads/ryv23FsdR.png)


## 完整程式
玩家角色:![image](https://hackmd.io/_uploads/r1NETtodR.png)
地圖:![image](https://hackmd.io/_uploads/SkzHTKo_0.png)


