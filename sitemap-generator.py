import json
import xml.etree.ElementTree as ET
from datetime import datetime

# 讀取 JSON 檔案
with open('posts.json', 'r', encoding='utf-8') as file:
    posts = json.load(file)

# 定義網站的根目錄
domain = "https://rafe-lin.github.io/" #https://1ping.org

# 定義本來就有的連結
existing_links = [
    {"link": "/", "lastmod": "2024-12-01", "changefreq": "daily", "priority": "1.0"},
    {"link": "/?page=posts", "lastmod": "2024-11-01", "changefreq": "monthly", "priority": "0.8"},
    {"link": "/?page=CV", "lastmod": "2024-10-01", "changefreq": "monthly", "priority": "0.8"}
]

# 建立 XML 標頭
urlset = ET.Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

# 生成本來就有的連結的 XML 節點
for link in existing_links:
    url = ET.SubElement(urlset, 'url')
    loc = ET.SubElement(url, 'loc')
    loc.text = f"{domain}{link['link']}"
    
    lastmod = ET.SubElement(url, 'lastmod')
    lastmod.text = link['lastmod']
    
    changefreq = ET.SubElement(url, 'changefreq')
    changefreq.text = link['changefreq']
    
    priority = ET.SubElement(url, 'priority')
    priority.text = link['priority']

# 生成每個文章的 XML 節點
for post in posts:
    url = ET.SubElement(urlset, 'url')
    loc = ET.SubElement(url, 'loc')
    loc.text = f"{domain}{post['link']}"
    
    lastmod = ET.SubElement(url, 'lastmod')
    lastmod.text = datetime.strptime(post['date'], '%Y-%m-%d').strftime('%Y-%m-%d')
    
    changefreq = ET.SubElement(url, 'changefreq')
    changefreq.text = 'monthly'
    
    priority = ET.SubElement(url, 'priority')
    priority.text = '0.8'

# 生成 XML 樹
tree = ET.ElementTree(urlset)

# 將 XML 樹寫入檔案
with open('sitemap.xml', 'wb') as file:
    tree.write(file, encoding='utf-8', xml_declaration=True)

print("sitemap.xml 生成完成")
