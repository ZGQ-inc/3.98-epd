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
├── tools/                  # 开放式 HTTP 2bpp 推送工具箱与 Python 示例
│   ├── README.md           # 详细 REST API 接口规范与第三方生态接入指引
│   └── epd_push.py         # 任意图片转 2bpp / 自动立绘旋转 / HTTP 推送 CLI & SDK
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

### 6. 连电脑用命令恢复出厂设置与防死锁救砖 (Factory Reset & Unbricking)

系统在 PWA / 本地 Web 控制台 / 蓝牙 BLE 发起「恢复出厂设置」时，**会同时彻底清空 NVS 参数配置分区与 Storage 效果库预设分区**（恢复至裸机出厂态，并重启进入 AP 配网热点与 BLE 广播）。

若在操作射频模式时不慎将 Wi-Fi 与蓝牙设置为死锁/失联状态，可通过 Type-C 数据线将 ESP32-C3 连接至电脑，使用以下命令免拆机 1 秒恢复出厂设置：

#### 方案一：彻底恢复出厂设置（同时擦除 NVS 参数配置与 Storage 效果库）
```bash
# 擦除 0x9000 (NVS 24KB) 与 0x268000 (Storage 1632KB)
python -m esptool --chip esp32c3 -p <PORT> erase_region 0x9000 0x6000
python -m esptool --chip esp32c3 -p <PORT> erase_region 0x268000 0x198000
```

#### 方案二：仅清除配置参数（保留已保存的效果库预设文件）
只需擦除 `0x9000` 处的 NVS 分区（大小 24 KB），设备即可在**不损坏主固件、字库与已保存预设**的前提下重置 Wi-Fi/模式参数：
```bash
# 推荐方式 A：使用本工程内置的 espflash 工具：
espflash erase-parts --port COM17 --partition-table partitions.csv nvs

# 方式 B：使用 Python esptool 工具：
python -m esptool --chip esp32c3 -p COM17 erase_region 0x9000 0x6000
```
执行完毕后，重新插拔 USB 或按一下板载 Reset 键，设备即以出厂默认状态启动。

#### 方案三：全片擦除并重新刷机（终极救砖）
```bash
# 1. 彻底擦除 4MB Flash
python -m esptool --chip esp32c3 -p <PORT> erase_flash

# 2. 重新刷入最新编译的二进制固件
python -m esptool --chip esp32c3 -p <PORT> write_flash 0x20000 firmware/epd-firmware.bin
```

---

### 7. 屏幕硬件规格版本切换 (A0 / A1 扫描走线)

华为手机保护壳拆机的 3.98 英寸 BWRY 四色电子墨水屏通常存在两款不同的物理硬件批次：`SE0398NZ07-FNG-A0` 与 `A1`。
两者的差异在于内部 Gate 扫描引脚在玻璃基板上的交错走线映射方式不同。如果驱动版本选错，屏幕画面会出现**隔行交错条纹、半屏错位或上下撕裂**。

本项目已实现 **NVS 动态配置与免编译一键切换**：

1. **PWA 随身工坊（支持蓝牙 BLE 直连 / 局域网 Wi-Fi）**：
   - 打开 PWA 页面，进入 **「⚙️ 硬件诊断」** 选项卡；
   - 顶部提供 **「🖥️ 墨水屏硬件规格版本 (A0 / A1 扫描走线)」** 开关卡片；
   - 点击 **`A0 走线 (默认)`** 或 **`A1 走线`**，配置将即时写入单片机 NVS，并自动触发墨水屏物理重绘全刷。
2. **设备内置 Web 控制台**：
   - 浏览器直接访问设备 IP（如 `http://192.168.4.1` 或局域网分配 IP）；
   - 在控制台系统诊断区域直接点击 **A0 / A1** 单选按钮即可立即生效。
3. **固件默认值修改（可选编译配置）**：
   - 固件源码中默认采用 `A0` 规格；若希望编译一份开机即默认以 `A1` 运行的固件，可直接修改 `src/config/mod.rs` 中的 `default_panel_version()` 返回值为 `"A1"`。

---

## 🌐 开放式 HTTP 2bpp 点阵推送 API (Open REST API)

为方便任意外部系统（**Home Assistant 智能家居、Android Automate/Tasker、Python 脚本、树莓派、我的台式机、我的 GPD 掌机、cURL、服务器监控**）向工牌推送显示内容，固件原生提供免绑定的 **RESTful HTTP 原始位图裸推接口**：

* **API 端点**: `POST http://<设备IP或域名>/api/push/raw` *(支持 mDNS: `http://epd-display.local/api/push/raw`)*
* **请求头**: `Content-Type: application/octet-stream`
* **数据规格**: 严格 **105,984 字节** 的 2bpp 二进制流（768×552 BWRY 4色点阵，每字节打包 4 像素）
* **参数选项**: `?refresh=false` 或 `X-Refresh: false`（仅写入显存，暂不触发 16 秒硬件波形刷新）

### ⚡ 3 种极简调用示例

#### 1. cURL 单行命令直接推送现有点阵文件
```bash
curl -X POST --data-binary @image.2bpp http://epd-display.local/api/push/raw
```

#### 2. Python 转换任意图片并推送 (推荐使用内置工具)
本项目在 `tools/` 目录提供了全功能的图片转 2bpp 及网络推送工具：
```bash
# 安装依赖
pip install pillow requests

# 一键推送任意图片至工牌
python tools/epd_push.py photo.png --host epd-display.local

# 兽聚痛卡 / 二次元竖屏立绘自适应旋转模式 (-p)
python tools/epd_push.py character.png -p --host epd-display.local

# 仅导出 .2bpp 二进制文件与四色预览图 (不发送请求)
python tools/epd_push.py input.jpg -o output.2bpp --preview preview.png --dry-run
```

#### 3. Python SDK 代码集成
```python
from tools.epd_push import image_to_2bpp, push_to_epd

# 转换图片为 105KB 2bpp 点阵
raw_bytes = image_to_2bpp("avatar.png", portrait=True, dither="floyd")

# 推送至局域网工牌
res = push_to_epd(raw_bytes, host="epd-display.local")
print(res)  # {'success': True, 'status': 'ok', 'message': '...'}
```

👉 **更详细的接口规范、2bpp 像素位编码格式与 Home Assistant 自动化配置，请参阅：[开放式 HTTP 推送 API 与工具箱文档 (tools/README.md)](tools/README.md)**

---

## 🛡️ 蓝牙双向设备管理、动态 PIN 码配对与 NFC 碰一碰秒绑 (Two-Way Device Management & Security)

为了让墨水屏能够安全、可靠地佩戴于漫展、聚会与公共场合，固件与前端 PWA 提供了完整的**双向设备管理与硬件级防骚扰安全认证体系**：

### 1. 为什么必须具备硬件级会话认证与防骚扰？
- **保护双稳态屏幕寿命与电量**：四色电子墨水屏物理刷新一次需 16 秒并消耗毫安级电量。若蓝牙广播处于完全开放裸奔状态，任何经过的陌生人均可在手机浏览器通过 WebBLE 下发指令频繁刷屏骚扰或篡改显示画面。
- **连接不扰动原则**：蓝牙物理连接建立时，**墨水屏物理屏幕绝不意外闪烁或刷新**！屏幕保持原展示画面不变。

### 2. 双向设备管理架构 (Two-Way Architecture)
- **控制端 (浏览器 / PWA 侧)**：
  - 用户可在「我的墨水屏徽章库」中同时管理与记忆多台墨水屏（如：`3.98吋工牌-兽聚痛卡挂件`、`我的桌面副屏时钟`、`冰箱贴留言板`）；
  - 支持分别设置自定义徽章别名，点击即可一键秒速重连。
- **墨水屏硬件端 (ESP32 NVS 永久白名单)**：
  - 硬件 NVS 独立维护 `trusted_devices` 控制端白名单列表（如：`主力机三星 Fold7`、`我的台式机`、`备用机红米`、`我的 GPD 掌机`、`朋友的手机`）；
  - 只有处于白名单中且持有随机分配 `token` 的控制端才能向墨水屏下发推送点阵、切换模式或刷新指令；
  - 主人可在 PWA 控制台中对白名单中的控制端进行**重命名**或**解除授权/删除**；一旦从白名单中删除，该设备即刻失去控制权。

### 3. 开箱首次配对与动态 PIN 码流程 (OOB PIN Pairing)
1. **未配对接入确认**：全新浏览器连接时，PWA 会弹出确认弹窗。若用户选择「取消断开」，蓝牙立即断开且墨水屏**不刷新**；
2. **6 位动态 PIN 码卡片**：用户点击「开始 PIN 配对」后，墨水屏屏幕刷新显示大字版 6 位动态 PIN 码（120 秒防暴力破解倒计时）；
3. **安全注册写入 NVS**：用户在 PWA 弹窗中输入屏幕上的 6 位 PIN 码并为控制端命名（支持智能预填：如检测到 Android 手机自动预填 `主力机三星 Fold7` 或 `备用机红米`，检测到 Windows PC 自动预填 `我的台式机` 或 `我的 GPD 掌机`），验证通过后在硬件 NVS 写入唯一设备 ID 与令牌，墨水屏自动切至【配对成功与 NFC 钥匙指引】界面。

### 4. NFC 物理电子钥匙一碰秒绑 (Zero-PIN NFC Claim)
- **硬件随机主密钥**：单片机在每次开机时若检测到未生成过密钥，将调用 ESP32 硬件真随机数发生器 (`esp_random()`) 自动生成唯一 16 字节 Master Key 永久存入 NVS（出厂恢复或老固件 OTA 均能自愈）；
- **写入贴纸标签**：在 PWA 设备管理中点击「碰一碰将钥匙写入 NFC 标签」，通过 Web NFC（或复制链接用 NFC Tools）将 `https://398epd.zgqinc.gq/#key=<32位密钥>` 写入贴在墨水屏背面或挂绳上的 NTAG 标签；
- **新设备一碰秒绑**：外出时新设备（或朋友手机）只需碰一下墨水屏背面的 NFC 标签，浏览器打开 PWA 后通过 URL Hash（仅保存在浏览器客户端，零网络泄露）自动读取钥匙并一键秒速完成白名单绑定，完全免去开机看屏输 PIN 码！

### 5. 漫展防骚扰开关 (Anti-DoS PIN Disable)
- 主人完成设备初次配对后，可在 PWA 设备管理中一键关闭「屏幕 PIN 码配对」；
- 关闭后，陌生人在公共场合无法触发屏幕 PIN 码配对，彻底杜绝恶意蹭连与耗电刷屏骚扰；只有碰一碰物理 NFC 钥匙或已有白名单设备方可操控。

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
