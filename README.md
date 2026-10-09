# 3.98" BWRY 墨水屏随身伴侣 · Open E-Badge & Ita-Bag

<p align="center">
  <img src="hardware/enclosure_vector_mockup.svg" width="380" alt="3.98英寸 4色墨水屏外壳与随身工牌矢量图">
</p>

<p align="center">
  <b>无需局域网 Wi-Fi · 手机 Chrome 蓝牙直连 · 100% 离线 PWA · Cloudflare Pages 免费一键托管</b><br>
  专为 3.98 英寸四色电子墨水屏打造的随身工牌、电子名片、漫展痛卡与冰箱留言板开源软硬件全栈解决方案。
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/epd-smart-badge"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Pages"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"><img src="https://img.shields.io/badge/PWA-100%25_Offline-005ac1.svg" alt="PWA Ready"></a>
  <a href="https://developer.chrome.com/articles/bluetooth/"><img src="https://img.shields.io/badge/WebBLE-Bluetooth_5.0-success.svg" alt="Web Bluetooth"></a>
  <a href="#-硬件规格参数-hardware-specifications"><img src="https://img.shields.io/badge/E--Ink-3.98%22_768%C3%97552_BWRY-d32f2f.svg" alt="Screen"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
</p>

---

## 🌟 项目亮点 (Highlights)

1. **彻底告别 Wi-Fi 局域网依赖 (Zero Wi-Fi Needed)**:
   - 随身携带在漫展、地铁、办公室或野外时，无需路由器局域网。
   - 打开手机或电脑 Chrome / Edge 浏览器访问部署好的 PWA 网页，点击“连接蓝牙”即可通过 Web Bluetooth API 直接与 3.98" 墨水屏握手通信。
2. **免费静态托管于 Cloudflare Pages**:
   - 纯前端无服务器架构（HTML5 + Canvas + Pure JS + Service Worker）。
   - 零成本全球 CDN 极速分发与自动权威 HTTPS（满足 Chromium WebBLE API 强制安全上下文要求）。
3. **100% 离线 PWA 支持 (Offline PWA)**:
   - 首次访问后，Service Worker 会将点阵字库生成器、二维码引擎和 4色微粒抖动算法缓存在本地。
   - 即使断网、飞行模式或深处漫展地下场馆，依然能秒速打开并向墨水屏推送。
4. **四大随身定制工坊 (4 Built-in Studios)**:
   - 📇 **智能工牌 / 电子名片 (Smart E-Badge)**: 极客黑客、商务简约、漫展同人、展会工作证 4 套高对比度大字模板，内置零依赖纯离线二维码生成器。
   - 🎒 **漫展痛卡 / 角色挂件 (Anime Ita-Bag Charm)**: 配合外壳双挂绳孔，相册选图、自由缩放/旋转、4色微粒抖动还原，个性台词题字。
   - 📝 **随身便签 / 留言板 (Memo & Checklist)**: 32px 超大字号待办清单，方框复选框，磁吸/挂绳一目了然。
   - 🎨 **4色像素手绘画板 (BWRY Paint Canvas)**: 黑/白/红/黄 4色调色盘，画笔、矩形、圆形、题字、橡皮与撤销功能。
5. **极客级 3D 打印外壳设计 (Optimized Enclosure)**:
   - **防脱落滑动按键推钮**: 外露手按长度 1.5mm，加厚 7.0mm，四边 45° 倒角，内部防脱咬合卡块卡死后盖限位槽，杜绝脱落丢失。
   - **双挂绳孔**: 屏幕 FPC 一侧居中打 2 个穿绳孔（孔径 1.5mm，孔距 6mm），并带内部穿绳导引沉槽。
   - **前后双 NFC 贴片槽**: 中框正中心 + 后盖屏幕排线侧半边居中，适配 **NTAG216** (25mm 直径) 大容量贴片。
   - **4 颗强力吸附磁铁**: 后盖内壁预留 4 个 N52 钕铁硼磁铁沉孔（直径 6.0mm），可直接吸附在金属痛包或冰箱表面。

---

## 🗂️ 规范项目目录结构 (Repository Layout)

```text
.
├── README.md               # 项目主说明文档 (中英双语 / 快速指引)
├── BOM.md                  # 详尽硬件物料选型与采购清单 (含 NFC 216 / 磁铁 / 开关规格)
├── LICENSE                 # MIT 开源授权协议
├── .gitignore              # Git 忽略规则 (过滤 target/、编译缓存及临时文件)
│
├── hardware/               # 硬件与 3D 打印外壳工程
│   ├── README.md           # 3D 打印参数推荐与全套组装指导
│   ├── enclosure_vector_mockup.svg # 外壳 1:1 矢量设计展示图
│   ├── 3d_models/          # 即用型 3D 打印 STL 模型与 OpenSCAD 源码
│   │   ├── case_front.stl  # 前框 (正面 6.9mm 窄边框，M2 铜螺母预埋孔)
│   │   ├── case_middle.stl # 中框 (双挂绳孔 1.5mm，正面 25mm NFC 槽，双 Type-C，'O'/`|` 开关标识)
│   │   ├── case_back.stl   # 标准后盖 (FPC 侧居中 25mm NFC 槽，4 个磁铁沉孔，电池防挤压圆角)
│   │   ├── case_back_logo.stl # 定制后盖 (带 "Made by ZGQ Inc." 凹刻文字)
│   │   ├── switch_cap.stl  # 防脱滑动推钮 (外露 1.5mm，卡紧后盖限位槽，4 道防滑齿)
│   │   ├── acrylic_template.stl # 91.0×64.0×1.5mm 亚克力视窗 1:1 划线切割模板
│   │   └── epd_case.scad   # 完整的 OpenSCAD 参数化建模源码
│   ├── scripts/
│   │   └── build_epd_case.py # Python 3D 网格生成脚本 (纯数学算法 + Delaunay 三角剖分)
│   └── fpc_adapter/        # 24-Pin 0.5mm 墨水屏 45° 转接板 KiCad 硬件工程
│
├── cf_pages/               # 部署至 Cloudflare Pages 的 100% 离线独立 PWA 控制端
│   ├── README.md           # Cloudflare Pages 部署说明
│   ├── index.html          # 单页应用 (包含工牌、痛卡、便签、手绘 4 大工坊与 WebBLE 驱动)
│   ├── manifest.json       # PWA 应用配置清单
│   ├── sw.js               # Service Worker 离线缓存引擎
│   ├── icon-192.svg        # 参考真实外壳重新设计的 192x192 矢量图标
│   └── icon-512.svg        # 512x512 高清矢量图标
│
├── prototype_micropython/  # 初期 MicroPython 原型验证 Demo
│   ├── README.md           # MicroPython 测试指南
│   ├── epd3in98.py         # 3.98" BWRY 底层驱动
│   ├── demo.py             # 硬件测试脚本
│   ├── convert_image.py    # 4色抖动算法与 RAW 图像转换脚本
│   └── avatar.raw          # 768×552 原始图像二进制样本
│
├── firmware/               # 固件编译、分区表与烧录指南
│   └── README.md           # espflash / esptool 烧录步骤
│
├── src/                    # Rust ESP-IDF 嵌入式主固件源码
│   ├── main.rs             # 系统启动入口、低功耗管理、任务并发调度
│   ├── ble/                # BLE 5.0 GATT 服务定义与分包传输协议 (MTU 512)
│   ├── display/            # 2bpp 硬件显存、无闪烁局刷与汉字字库渲染引擎
│   ├── modes/              # 工牌、痛卡、时钟、天气与便签模式逻辑
│   ├── power/              # 电源管理、电池电压 ADC 采样与休眠控制
│   ├── web/                # 内嵌轻量级 HTTP Web 服务器与 REST API
│   └── wifi/               # Wi-Fi 局域网通信与 AP 自动配网
│
├── web_assets/             # 编译期内嵌至固件的本地 Web 控制台静态资源
│   ├── index.html          # 局域网控制台 (已支持一键自定义配置您的专属 PWA 网址)
│   ├── index.html.gz       # 极速传输的 Gzip 压缩包
│   ├── pwa.html            # 设备内置备用 PWA 页面
│   ├── pwa.html.gz
│   ├── captive.html        # AP 配网热点门户页面
│   ├── manifest.json
│   └── sw.js
│
├── Cargo.toml              # Rust 项目依赖声明
├── partitions.csv          # ESP32-C3 4MB Flash 分区表
└── sdkconfig.defaults      # ESP-IDF 系统底层配置 (启用蓝牙射频共存与蓝牙 5.0)
```

---

## 📋 硬件物料采购清单 (BOM 概览)

| 器件名称 | 规格型号 | 数量 | 作用说明 |
| :--- | :--- | :---: | :--- |
| **四色墨水屏** | 3.98 英寸 BWRY (768×552, SSD1683) | 1 片 | 全彩粒子物理沉淀，断电永久保持画面 |
| **主控芯片** | ESP32-C3 SuperMini (4MB Flash) | 1 块 | RISC-V 160MHz，集成 BLE 5.0 与 Wi-Fi |
| **充电模块** | TP4056 Type-C 单节锂电充电板 | 1 块 | 带 DW01A + 8205A 电池过放保护 |
| **NFC 贴片** | **NTAG216** (直径 25mm, 888 字节容量) | 2 枚 | 正面中框中心 1 枚 + 背面排线侧半边居中 1 枚 |
| **强力磁铁** | N52 钕铁硼强磁 (直径 6.0mm × 厚 1.2mm) | 4 颗 | 后盖内壁 4 处沉孔，牢固吸附冰箱或痛包 |
| **电源开关** | 微型滑动开关 SS12D00 / SS12F15 (1P2T) | 1 个 | 3 Pin 侧拨，手柄插入 3D 打印防脱推钮 |
| **锂电池** | 3.7V 聚合物锂电 (402030 / 502030 等) | 1 块 | 容量 200~400mAh，厚度 ≤ 4.5mm |
| **视窗亚克力**| 高透 PMMA (91.0 × 64.0 × 1.5mm, R5) | 1 片 | 保护墨水屏玻璃，提供 1:1 切割治具模板 |
| **紧固件** | M2×8~10mm 沉头螺丝 + M2×3.5mm 铜螺母 | 各4个 | 前后框高强度锁合 |

> 完整参数、防坑细节与装配示意请参阅 [BOM.md](BOM.md)。

---

## 🚀 1 分钟一键部署至 Cloudflare Pages

1. Fork 本仓库到你自己的 GitHub 账号；
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，点击 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**；
3. 选择该仓库，配置构建参数：
   - **Framework preset**: `None`
   - **Build command**: *(留空)*
   - **Build output directory**: `cf_pages`
4. 点击 **Save and Deploy**，30 秒后即可获得免费的全球 CDN HTTPS 域名（例如: `https://my-epd-badge.pages.dev`）！
5. 在手机或电脑 Chrome / Edge 浏览器打开该网址，点击“连接蓝牙”即可开箱即用。

### 🌐 自定义设置本地控制台跳转地址
如果你同时在使用设备内置的局域网控制台（`http://<设备IP>` 或 `http://epd-display.local`）：
- 打开控制台的 **“网络与蓝牙”** 选项卡；
- 点击“📱 离线蓝牙 PWA 专页”旁边的 **“⚙️ 自定义地址”** 按钮；
- 填入你部署的 Cloudflare Pages 网址（如 `https://my-epd-badge.pages.dev`）；
- 设置后，控制台中的所有跳转链接都会直达你自己的专属域名，并保存在浏览器本地！

---

## 💻 固件编译与烧录

```bash
# 1. 编译 release 固件
cargo +esp build --release

# 2. 一键烧录到 ESP32-C3
espflash flash --release --monitor
```
详细环境搭建与命令行烧录说明请参阅 [firmware/README.md](firmware/README.md)。

---

## 📄 开源许可证 (License)

本项目采用 [MIT 许可证](LICENSE) 开源，欢迎自由构建、修改、二次开发与分享！
