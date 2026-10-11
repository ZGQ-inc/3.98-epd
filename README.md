# 3.98" BWRY 墨水屏随身伴侣 · Open E-Badge & Ita-Bag

<p align="center">
  <img src="hardware/enclosure_vector_mockup.svg" width="380" alt="3.98英寸 4色墨水屏外壳与随身工牌矢量图">
</p>

<p align="center">
  <b>无需局域网 Wi-Fi · 手机 Chrome 蓝牙直连 · 100% 离线 PWA · Cloudflare Pages 免费一键托管</b><br>
  专为 3.98 英寸四色电子墨水屏打造的随身工牌、电子名片、兽聚痛卡与智能留言板开源软硬件全栈解决方案。
</p>

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/ZGQ-inc/3.98-epd"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Pages"></a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps"><img src="https://img.shields.io/badge/PWA-100%25_Offline-005ac1.svg" alt="PWA Ready"></a>
  <a href="https://developer.chrome.com/articles/bluetooth/"><img src="https://img.shields.io/badge/WebBLE-Bluetooth_5.0-success.svg" alt="Web Bluetooth"></a>
  <a href="#-硬件物料清单-bom"><img src="https://img.shields.io/badge/E--Ink-3.98%22_768%C3%97552_BWRY-d32f2f.svg" alt="Screen"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
</p>

---

## 🌟 项目亮点 (Highlights)

1. **彻底告别 Wi-Fi 局域网依赖 (Zero Wi-Fi Needed)**:
   - 随身携带在展会、地铁、办公室或户外时，无需路由器局域网。
   - 打开手机或电脑 Chrome / Edge 浏览器访问部署好的 PWA 网页，点击“连接蓝牙”即可通过 Web Bluetooth API 直接与 3.98" 墨水屏握手直推。
2. **免费静态托管于 Cloudflare Pages**:
   - 纯前端无服务器架构（HTML5 + Canvas + Pure JS + Service Worker）。
   - 零成本全球 CDN 极速分发与自动权威 HTTPS（满足 Chromium WebBLE API 强制安全上下文要求）。
3. **100% 离线 PWA 支持 (Offline PWA)**:
   - 首次访问后，Service Worker 会将点阵字库生成器、二维码引擎和 4色微粒抖动算法缓存在本地。
   - 即使断网、飞行模式或深处地下场馆，依然能秒速打开并向墨水屏推送。
4. **四大随身定制工坊 (4 Built-in Studios)**:
   - 📇 **智能工牌 / 电子名片 (Smart E-Badge)**: 极客黑客、商务简约、同人展会等高对比度大字模板，内置零依赖纯离线二维码生成器。
   - 🎒 **兽聚痛卡 / 角色挂件 (Anime Ita-Bag Charm)**: 配合外壳双挂绳孔，相册选图、自由缩放/旋转、4色微粒抖动还原，个性台词题字。
   - 📝 **随身便签 / 留言板 (Memo & Checklist)**: 超大字号待办清单，方框复选框，磁吸/挂绳一目了然。
   - 🎨 **4色像素手绘画板 (BWRY Paint Canvas)**: 黑/白/红/黄 4色调色盘，画笔、矩形、圆形、题字、橡皮与撤销功能。
5. **极客级 3D 打印三明治外壳设计 (Optimized Enclosure)**:
   - **三明治三层坚固架构**: 前盖 + 中框 + 后盖独立分层，8 颗 M2 热熔铜螺母高强度锁合（前盖 4 颗 + 中框 4 颗）。
   - **防脱落滑动按键推钮**: 外露手按长度 1.5mm，加厚 7.0mm，四边 45° 倒角，内部防脱咬合卡块卡死后盖限位槽，杜绝脱落丢失。
   - **双挂绳孔**: 屏幕 FPC 一侧居中打 2 个穿绳孔（孔径 1.5mm，孔距 6mm），并带内部穿绳导引沉槽。
   - **前后双 NFC 贴片槽**: 中框正中心 + 后盖屏幕排线侧半边居中，适配 **NTAG216** (25mm 直径) 888 字节大容量贴片。
   - **4 颗强力吸附磁铁**: 后盖内壁预留 4 个 N52 钕铁硼磁铁沉孔（直径 6.0mm），可直接吸附在金属痛包或冰箱表面。

---

## 🗂️ 规范项目目录结构 (Repository Layout)

```text
.
├── README.md               # 项目主说明文档 (功能概览 / 快速编译与刷机指引)
├── BOM.md                  # 详尽硬件物料选型、采购单价与硬核避坑总结 (单一事实来源)
├── LICENSE                 # MIT 开源授权协议
├── .gitignore              # Git 忽略规则 (过滤 target/、编译缓存及临时文件)
│
├── hardware/               # 硬件与 3D 打印外壳工程
│   ├── README.md           # 3D 打印参数推荐与三明治全套组装指导
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
│   └── fpc_adapter/        # 24-Pin 0.8mm 转 0.5mm 45° 转接板历史归档工程
│
├── cf_pages/               # 部署至 Cloudflare Pages 的 100% 离线独立 PWA 控制端
│   ├── README.md           # Cloudflare Pages 部署说明
│   ├── index.html          # 单页应用 (包含工牌、痛卡、便签、手绘 4 大工坊与 WebBLE 驱动)
│   ├── manifest.json       # PWA 应用配置清单
│   ├── sw.js               # Service Worker 离线缓存引擎 (v2.9)
│   ├── icon-192.svg        # 192x192 矢量图标
│   └── icon-512.svg        # 512x512 高清矢量图标
│
├── firmware/               # 预编译纯净固件与刷机指南
│   ├── README.md           # 详细环境配置与烧录步骤
│   └── epd-firmware.bin    # 预编译好的 1.76MB 裸机启动镜像 (即刷即用)
│
├── src/                    # Rust ESP-IDF 嵌入式主固件源码
│   ├── main.rs             # 系统启动入口、低功耗管理、任务并发调度
│   ├── ble/                # BLE 5.0 GATT 服务定义、流式点阵直推与无刷新预设协议
│   ├── display/            # 2bpp 硬件显存、无闪烁局刷与汉字字库渲染引擎
│   ├── storage/            # 1.5MB SPIFFS 效果库存储管理与物理配额统计
│   ├── modes/              # 工牌、痛卡、时钟、天气与便签模式逻辑
│   ├── power/              # 电源管理、电池电压 ADC 采样与休眠控制
│   ├── web/                # 内嵌轻量级 HTTP Web 服务器与 REST API
│   └── wifi/               # Wi-Fi 局域网通信与 AP 自动配网
│
├── web_assets/             # 编译期内嵌至固件的本地 Web 控制台静态资源
│   ├── index.html          # 局域网控制台 (已支持一键自定义配置您的专属 PWA 网址)
│   ├── index.html.gz       # 极速传输的 Gzip 压缩包
│   └── pwa.html            # 设备内置备用 PWA 页面
│
├── Cargo.toml              # Rust 项目依赖声明 (已配置 strip 自动剥离符号)
├── partitions.csv          # ESP32-C3 4MB Flash 分区表 (2MB App + 1.5MB SPIFFS 效果库)
└── sdkconfig.defaults      # ESP-IDF 系统底层配置 (启用蓝牙射频共存与蓝牙 5.0)
```

---

## 📋 硬件物料清单 (BOM)

关于器件的具体选型背景（**20~25 元华为生态四色墨水屏手机壳尾货捡漏实录**、高压驱动电压避坑、**663032 750mAh 锂电池**选型、**三明治 8 颗 M2 铜螺母锁固**及 NTAG216 智能名片细节），请直接参阅独立的硬件物料清单文档：

👉 **[硬件物料选型与采购清单 (BOM.md)](BOM.md)**

---

## 💻 固件编译与刷机指引 (Compilation & Flashing)

本项目主固件基于 **Rust ESP-IDF** 体系打造，针对 **ESP32-C3 (RISC-V 32位架构)** 进行了极致汇编与内存优化。

### 1. 为什么未剥离的 ELF 文件会有 20MB+？
在 `target/.../release/` 下生成的 `epd-firmware` 文件是标准的 RISC-V ELF 格式，包含了大量的 **DWARF 调试符号表**（`.debug_info`、`.debug_line`、函数符号与源码行号映射等，用于 GDB/LLDB 断点调试）。  
我们已在 `Cargo.toml` 中配置了 `debug = 0` 与 `strip = true`：
```toml
[profile.release]
opt-level = "z"
lto = "fat"
panic = "abort"
debug = 0
strip = true
```
真正烧录进单片机 Flash 的纯二进制镜像（.bin 文件）仅为 **1,764,592 字节（约 1.68 MB）**，完全适配 ESP32-C3 4MB Flash 的 **2MB 固件分区**（占用率 84.14%）。

---

### 2. 编译环境准备 (Prerequisites)

1. **安装 Rust 工具链**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **安装 ESP32-C3 RISC-V 交叉编译器与烧录工具**:
   ```bash
   cargo install espup
   espup install
   cargo install espflash
   ```
3. **加载 ESP 编译环境变量**:
   - **Windows PowerShell**:
     ```powershell
     . $HOME/export-esp.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source ~/export-esp.sh
     ```

---

### 3. 一键编译与固件导出

在项目根目录下执行：
```bash
# 1. 编译 release 生产模式固件
cargo +esp build --release

# 2. 将 ELF 可执行文件剥离并保存为单片机纯二进制镜像 (.bin)
espflash save-image --chip esp32c3 target/riscv32imc-esp-espidf/release/epd-firmware firmware/epd-firmware.bin
```

---

### 4. 烧录到设备 (Flash to ESP32-C3)

将 ESP32-C3 SuperMini 通过 Type-C 数据线连接至电脑：

#### 方式一：使用 `espflash` 自动烧录（最推荐）
```bash
# 自动探测串口并烧录
espflash flash --release

# 或指定具体串口号（例如 Windows 上的 COM17，Linux 上的 /dev/ttyUSB0）
espflash flash --port COM17 --release
```

#### 方式二：免编译直接烧录预编译镜像 (.bin)
仓库已在 `firmware/epd-firmware.bin` 预先提供了最新编译好的裸机固件。您可以使用 Python 的 `esptool.py` 直接刷入：
```bash
esptool.py --chip esp32c3 -p <PORT> -b 460800 write_flash 0x20000 firmware/epd-firmware.bin
```

---

### 5. Flash 分区表规划 (Partitions Layout)

4MB Flash 布局严格按照 `partitions.csv` 划分：

| 分区名 | 类型 | 子类型 | 偏移地址 | 大小 | 作用说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nvs` | data | nvs | `0x9000` | 24 KB | 存储 Wi-Fi 凭据、蓝牙名称与模式持久配置 |
| `phy_init` | data | phy | `0x11000` | 4 KB | 射频初始化与天线校准数据 |
| `factory` | app | factory | `0x20000` | 2048 KB (2.0 MB) | Rust ESP-IDF 主固件代码段 (当前占用约 84%) |
| `font` | data | 0x01 | `0x220000` | 288 KB | Flash MMU 零内存占用标准点阵中文字库 |
| `storage` | data | spiffs | `0x268000` | 1632 KB (~1.6 MB) | 单片机内置 SPIFFS 效果库 (真实物理存储) |

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

---

## 📄 开源许可证 (License)

本项目采用 [MIT 许可证](LICENSE) 开源，欢迎自由构建、修改、二次开发与商业/非商业分享！

> 💡 **关于版权与署名说明**：  
> 版权声明中的 `ZGQ Inc.` 仅为作者个人昵称（Author Handle）。本项目全栈源代码、固件、前端 PWA 及相关硬件工程文件均遵循宽松的 **MIT 许可证** 开放授权，任何人均可在遵守并保留 MIT 许可证声明的前提下自由使用、修改与衍生开发。
