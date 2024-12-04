# 2024 CGGC 心得及 Writeup

孫逸平｜2024-11-10

---

這次是我第一次和其他人組隊打 CTF，也是第一次那麼認真的打 CTF，先來講一下人事時地物等等的背景資訊好了。

這次我和朋友一共四個人組隊參加比賽，為了增加打題目的效率和互動討論，我們的指導老師陳晉老師將復興高中的圖書館開放給我們以及他的其他學生打題目，並透過安排了兩天一夜的時間讓我們專注比賽（雖然我中途跑去比學科能力競賽所以沒有住宿啦）。

這次的陣容有一些新手，經過競賽後發現每個人都各有所長、各司其職，以下以 A、B、C、D 代稱四位組員，A 和 B 因為有較多的經驗，所以負責專注的打比賽；而 C 相對缺乏經驗，因此 D 在旁邊拉著他，避免拖到團隊後腿（誤）；同時 C 也被賦予了一個相當重要的角色 — — 負責大家的伙食，一到飯點就會聽到 C 開始揪大家叫外送、飲料、豆花。就在我們四位組員巧妙的完美配合下，最終打穿 3 題以 200 分的成績，拿到 27/122 的名次（雖然沒有到很好啦哈哈）。

![計分板截圖](articles/2024-CGGC-writeup/01.webp)

---

## Writeup

### Web: previewsite

網頁是一個提供註冊和登入的頁面，登入後可透過線上工具發送請求到使用者輸入的網址，並顯示回應內容。
題目敘述說明 Flag 位於檔案路徑 `/flag` 中，但在 source code 中請求的網址有進行阻擋，請求的開頭必須為字串 `http://previewsite/` 。

![](articles/2024-CGGC-writeup/02.webp)

經過觀察發現第 14 行的 `urlopen`，不僅可以對網址發送請求，還可以開啟檔案。同時為了繞過請求網址開頭的限制，最後透過參數 `?next` 獲取開啟檔案。最後使用 Payload：`http://previewsite/logout?next=file:///flag` 順利獲得 Flag。

### Web: proxy

題目開啟後顯示原始碼：

```
<?php

function proxy($service) {
    // $service = "switchrange";
    // $service = "previewsite";
    // $service = "越獄";
    $requestUri = $_SERVER['REQUEST_URI'];
    $parsedUrl = parse_url($requestUri);

    $port = 80;
    if (isset($_GET['port'])) {
        $port = (int)$_GET['port'];
    } else if ($_COOKIE["port"]) {
        $port = (int)$_COOKIE['port'];
    }
    setcookie("service", $service);
    setcookie("port", $port);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $filter = '!$%^&*()=+[]{}|;\'",<>?_-/#:.\\@';
    $fixeddomain = trim(trim($service, $filter).".cggc.chummy.tw:".$port, $filter);
    $fixeddomain = idn_to_ascii($fixeddomain);
    $fixeddomain = preg_replace('/[^0-9a-zA-Z-.:_]/', '', $fixeddomain);
    curl_setopt($ch, CURLOPT_URL, 'http://'.$fixeddomain.$parsedUrl['path'].'?'.$_SERVER['QUERY_STRING']);
    curl_exec($ch);
    curl_close($ch);
}

if (!isset($_GET['service']) && !isset($_COOKIE["service"])) {
    highlight_file(__FILE__);
} else if (isset($_GET['service'])) {
    proxy($_GET['service']);
} else {
    proxy($_COOKIE["service"]);
}
```

題目要求要請求到一個網址，但我忘記是哪裡了，總之就是一個網址，但此題程式碼強制其鎖定在 `.cggc.chummy.tw` 內，因此要想辦法繞過。一開始還想在後面加上一些東西繞過去請求，參考這篇，後來發現一直不可行，最後發現可以從 `idn_to_ascii` 下手。只要輸入很長的字串，`idn_to_ascii` 就無法解析，然後就會回傳 `null`，所以最後將 `service` 設為一個很長的字串就成功繞過了，比賽結束後老師說輸入一個 Unicode 也能使其無法解析。

### Misc: Day31- 水落石出！真相大白的十一月預告信？

這題給了一個鐵人賽文章連結：[https://ithelp.ithome.com.tw/users/20168875/ironman/7849](https://ithelp.ithome.com.tw/users/20168875/ironman/7849)，使用 Ticket 詢問此題的小小提示得到是 Information Leak 但我翻遍了 30 天的文章都沒找到 Flag，最後發現在第 19 天的地方 Token 洩漏，使用：`curl -s -X POST <https://api.telegram.org/bot><YOUR_BOT_TOKEN>/getUpdates` 就找到 Flag 了。