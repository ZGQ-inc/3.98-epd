# 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag (开源墨水屏随身伴侣)

> **Zero Wi-Fi Required** · **100% Client-Side Offline PWA** · **Web Bluetooth (WebBLE) Direct Drive** · **One-Click Deploy to Cloudflare Pages**

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZGQ-inc/3.98-epd)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25_Offline-005ac1.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Web Bluetooth](https://img.shields.io/badge/WebBLE-Bluetooth_5.0-success.svg)](https://developer.chrome.com/articles/bluetooth/)
[![Screen](https://img.shields.io/badge/E--Ink-3.98%22_768%C3%97552_BWRY-red.svg)](#hardware-specs)

---

## 🌟 项目亮点 (Highlights)

1. **彻底告别 Wi-Fi 依赖 (No Wi-Fi Needed)**:
   - 随身携带在兽聚、地铁、办公室或野外时，无需路由器局域网。
   - 打开手机或电脑 Chrome / Edge 浏览器访问本 PWA 网页，点击“连接蓝牙”即可通过 Web Bluetooth API 直接与 3.98" 墨水屏握手通信。
2. **免费静态托管于 Cloudflare Pages**:
   - 纯前端静态架构（HTML5 + Canvas + Pure JS + Service Worker）。
   - 无需任何后端服务器、Docker 或数据库，零成本全球 CDN 极速分发与自动 HTTPS（WebBLE API 强制要求 HTTPS）。
3. **100% 离线 PWA 支持 (Offline PWA)**:
   - 首次访问后，Service Worker 会将所有点阵字库生成器、RFC-Compliant 二维码引擎和 4色抖动算法缓存在本地。
   - 即使断网、飞行模式或深处兽聚地下场馆，依然能秒速打开并向墨水屏推送。
4. **四大随身定制工坊 (4 Built-in Studios)**:
   - 📇 **智能工牌 / 电子名片定制 (Smart E-Badge)**: 极客黑客、商务简约、兽聚同人、展会工作证 4 套高对比度大字模板，内置零依赖纯离线二维码生成器。
   - 🎒 **兽聚痛卡 / 角色挂件 (Anime Ita-Bag Charm)**: 配合 3D 打印外壳的双挂绳孔设计，相册选图、自由缩放/旋转、4色微粒抖动还原，个性台词题字。
   - 📝 **随身便签 / 冰箱贴 (Memo & Checklist)**: 32px 超大字号待办清单，方框复选框，磁吸/挂绳一目了然。
   - 🎨 **4色像素手绘画板 (BWRY Paint Canvas)**: 黑/白/红/黄 4色调色盘，画笔、矩形、圆形、题字、橡皮与撤销功能。
5. **多设备记忆与切换 (Multi-Device Support)**:
   - 自动记忆多个已配对的墨水屏胸牌与痛包挂饰，支持自定义备注别名（例如“工作胸牌”、“痛包立绘挂饰”、“厨房留言板”），一键重连。
6. **蓝牙隔空配网 (BLE Air Provisioning)**:
   - 如果用户后续需要连接 Wi-Fi（例如用于 Home Assistant 联动、天气看板、NTP 时钟），无需连接难用的 AP 热点，直接在蓝牙控制台中输入 SSID 和密码一键隔空写入。

---

## 🚀 1分钟部署到 Cloudflare Pages (Deploy Guide)

### 方式一：一键自动部署 (Recommended)
1. 将本仓库 `cf_pages/` 目录推送到你自己的 GitHub 仓库。
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 选择你的仓库，配置如下：
   - **Framework preset**: `None`
   - **Build command**: *(留空)*
   - **Build output directory**: `.` (或填写 `cf_pages`)
4. 点击 **Save and Deploy**，30 秒内即可获得专属于你的全球 HTTPS 地址（如 `https://my-epd-badge.pages.dev`）！

### 方式二：Cloudflare Wrangler CLI 部署
```bash
npm install -g wrangler
cd cf_pages
wrangler pages deploy . --project-name=epd-badge
```

---

## 📱 手机与电脑蓝牙直连要求 (Browser Compatibility)

| 平台 / 操作系统 | 推荐浏览器 | Web Bluetooth 支持情况 |
| :--- | :--- | :--- |
| **Android** | Google Chrome / Edge / Opera | ✅ 开箱即用 (原生支持 WebBLE) |
| **Windows / macOS** | Google Chrome / Microsoft Edge | ✅ 开箱即用 (需系统支持蓝牙 4.0+) |
| **Linux** | Google Chrome / Chromium | ✅ 需开启 `chrome://flags/#enable-web-bluetooth` |

---

## 📐 硬件规格参数 (Hardware Specifications)

- **显示面板**: 3.98 英寸超高清 4 色电子墨水屏 (BWRY: 黑/白/红/黄)
- **分辨率**: 768 × 552 像素 (1:1 点对点 2bpp 硬件显存，整屏 105,984 字节)
- **主控芯片**: ESP32-C3 SuperMini (RISC-V 160MHz, BLE 5.0 + Wi-Fi 802.11b/g/n)
- **刷新速度**: ~16 秒物理全色阶颗粒沉淀刷新，断电永久保持画面不耗电
- **结构设计**:
  - 外壳左上方配备 **双挂绳孔** (间距 6.0mm，孔径 1.5mm)，便于穿过挂绳作为胸牌或钥匙扣。
  - 内置 **前后双 NFC 贴片凹槽** (中框正中心 + 屏幕排线侧背面中心，直径 25.5mm)，可贴手机触碰感应标签。
  - 防脱落拨动开关推扭设计 (防掉防脱手感优化)。

---

## 📡 蓝牙 GATT 协议接口规范 (BLE Specification)

- **Service UUID**: `000000ff-0000-1000-8000-00805f9b34fb`
- **RX Characteristic (Write Without Response)**: `0000ff01-0000-1000-8000-00805f9b34fb`
  - 用于流式接收 2bpp 105,984 字节点阵（单包建议 240 字节）或 JSON/文本控制指令。
- **TX Characteristic (Notify / Read)**: `0000ff02-0000-1000-8000-00805f9b34fb`
  - 用于向网页回报墨水屏当前电量、刷新进度、IP 地址与状态信息。

### 控制指令速查：
- `refresh` : 触发墨水屏 16s 物理全刷新
- `mode:<mode_name>` : 切换预设场景（如 `demo`, `memo`, `fridge_board`, `weather` 等）
- `wireless:<mode>` : 切换射频模式（`auto`, `ble_only`, `wifi_only`, `dual`）
- `{"cmd":"wifi_setup","ssid":"...","pass":"..."}` : 隔空配置 Wi-Fi 路由器信息

---

## 📄 开源许可证 (License)

MIT License © 2026 ZGQ Inc. & Open Contributors.
欢迎 Fork、提交 PR 或制作专属的个性外壳与主题模版！
