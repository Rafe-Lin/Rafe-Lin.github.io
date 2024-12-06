# 我用 2007 年的迷你電腦安裝 Kali Linux

孫逸平｜2024-09-14

---

自從 Apple 推出 Arm 規格的 M1 晶片後，許多 CTF 中的 Reverse 和 PWN 題目都無法執行，直到我在家中找到了一台 ASUS 於 2007 年推出的 Eee PC 8G，它使用 8 GB 的 SSD 及 1 GB 記憶體，查了一下發現符合 Kali 的最低硬體要求，於是就心血來潮決定安裝起來！

![](articles/2024-EeePC-Kali/01.webp)

## Step 1：下載映像檔

前往 [Kali 官網下載](https://www.kali.org/get-kali/#kali-installer-images) iso 映像檔，注意：Eee PC 8G 的 CPU 為 32-bit，因此在下載時需應選擇 32-bit 的版本。

![](articles/2024-EeePC-Kali/02.webp)

## Step 2：製作安裝碟

準備一隻隨身碟作為安裝碟，並下載製作工具，Windows 使用者請安裝 [Rufes](https://rufus.ie/)，MacOS 使用者則是安裝 [Etcher](https://www.balena.io/etcher/)。接著匯入下載好的映像檔並選擇隨身碟作為安裝碟即可開始製作安裝碟。

![](articles/2024-EeePC-Kali/03.webp)

## Step 3：開始安裝 Kali

將製作好的開機碟插入 Eee PC 8G 並重新開機後點擊 F2 進入 BIOS，將隨身碟設定為開機順位一的裝置，接著就可以開始設定 Kali 了，安裝完成！

---

## 後紀

原本嘗試將系統安裝在電腦內置的 8G SSD 硬碟上，但一直無法成功，因此最後改為安裝在外接的 USB 隨身碟上，才順利完成安裝。另外，安裝完成後突然想到 CTF 的題目大多都是 x86 的題目，32-bit 的電腦還是不能使用，但可以隨身攜帶一台小電腦還是蠻好玩的。