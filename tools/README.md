# 🌐 开放式 HTTP 2bpp 点阵推送 API & Python 工具库

本项目固件内置了极简、开放且零单片机负担的 **RESTful HTTP 原始位图裸推接口**。任何局域网客户端（**Python 脚本、Home Assistant 智能家居、iOS 快捷指令、cURL、Node-RED、树莓派、Linux 服务器**）均可直接向墨水屏推送 105KB 2bpp 高保真四色点阵。

---

## 📌 REST API 接口规范

### 1. 推送 2bpp 原始位图

* **请求端点**: `POST http://<设备IP或主机名>/api/push/raw`
  *(或兼容别名 `/api/display/raw`、`/api/push`)*
* **支持域名**: `http://epd-display.local/api/push/raw` (无需固定 IP，mDNS 自动寻址)
* **请求头 (Headers)**:
  - `Content-Type: application/octet-stream`
  - `X-Refresh: true` *(可选，默认 true；传 false 表示仅写入显存，不触发物理刷新)*
* **查询参数 (Query Params)**:
  - `?refresh=false` *(可选，与 Header 效果相同)*
* **请求体 (Body)**:
  - **严格 105,984 字节** 的二进制流 (768 × 552 BWRY 2bpp 点阵数据)

### 2. 响应格式 (JSON)

#### 成功响应 (HTTP 200)
```json
{
  "success": true,
  "status": "ok",
  "message": "1:1 高保真画板点阵已推送成功，正在执行16秒硬件波形刷新..."
}
```

#### 设备硬件刷新繁忙 (HTTP 200 / 硬件互斥保护)
```json
{
  "success": false,
  "status": "busy",
  "message": "墨水屏硬件驱动当前繁忙（正在物理刷新中），请稍候重试！"
}
```

#### 数据长度不匹配 (HTTP 400)
```json
{
  "success": false,
  "status": "error",
  "message": "数据长度不匹配：预期 105984 字节，实际接收 81920 字节"
}
```

---

## 🎨 2bpp 像素位编码格式规范

3.98 英寸四色墨水屏分辨率为 **768 × 552**，单像素采用 2 个 Bit 表示 4 种颜色：

### 1. BWRY 四色调色板定义
| 颜色名称 | 2-bit 原始值 | 二进制位 | 典型 RGB 色值 | 16进制色号 |
| :---: | :---: | :---: | :---: | :---: |
| **黑色 (Black)** | `0` | `0b00` | `rgb(0, 0, 0)` | `#000000` |
| **白色 (White)** | `1` | `0b01` | `rgb(255, 255, 255)` | `#FFFFFF` |
| **黄色 (Yellow)** | `2` | `0b10` | `rgb(244, 196, 48)` | `#F4C430` |
| **红色 (Red)** | `3` | `0b11` | `rgb(211, 47, 47)` | `#D32F2F` |

### 2. 字节打包结构 (4 像素 / 字节)
每 1 个字节存储同一扫描行中相邻的 4 个像素，自高位到低位依次排列：

```text
  Bit 7   Bit 6   Bit 5   Bit 4   Bit 3   Bit 2   Bit 1   Bit 0
┌───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┐
│     Pixel 0   │     Pixel 1   │     Pixel 2   │     Pixel 3   │
└───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┘
```
* **单行字节数**: $768 \div 4 = 192 \text{ 字节}$
* **全屏总字节数**: $192 \times 552 = 105,984 \text{ 字节}$

---

## 🛠️ Python 转换与推送工具 (`epd_push.py`)

本项目在 `tools/epd_push.py` 中提供了一站式 Python 命令行工具与可导入 SDK，支持任意图片格式一键缩放、四色 Floyd-Steinberg 误差扩散抖动、2bpp 打包与网络推送。

### 1. 安装依赖
```bash
pip install pillow requests
# 可选安装 numpy 获得极速向量化打包加速：
pip install numpy
```

### 2. 命令行使用示例

#### ① 一键推送图片至工牌 (默认通过 mDNS 局域网寻址)
```bash
python tools/epd_push.py my_photo.png
```

#### ② 指定工牌局域网 IP 推送
```bash
python tools/epd_push.py banner.jpg --host 192.168.1.100
```

#### ③ 二次元竖屏立绘 / 兽聚痛卡挂件模式 (`-p` / `--portrait`)
自动将图片等比缩放至 552×768 并旋转 270° 适配物理显存，戴在胸前或挂在包上视角完全正立：
```bash
python tools/epd_push.py anime_character.png -p --host epd-display.local
```

#### ④ 仅转换并导出 `.2bpp` 点阵文件与四色预览图 (不发送网络请求)
```bash
python tools/epd_push.py test.png -o test.2bpp --preview preview.png --dry-run
```

#### ⑤ 静默预载入显存 (不触发 16 秒硬件刷新)
```bash
python tools/epd_push.py background.png --no-refresh
```

### 3. CLI 参数列表
```text
positional arguments:
  image                 输入图像路径 (支持 PNG, JPG, WebP, BMP 等)

options:
  -h, --help            显示帮助信息
  --host HOST           墨水屏 IP 地址或 mDNS 域名 (默认: epd-display.local)
  -p, --portrait        启用竖屏立绘模式 (552×768 自动等比缩放并旋转贴合物理屏)
  --fit {contain,cover,stretch}
                        图像适配模式: contain (留白), cover (裁切填充), stretch (拉伸) [默认: contain]
  --dither {floyd,none} 抖动算法: floyd (Floyd-Steinberg 误差扩散), none (纯阈值) [默认: floyd]
  --rotate {0,90,180,270} 图像额外旋转角度
  --no-refresh          写入显存缓冲区但暂不触发 16 秒硬件波形物理刷新
  -o, --save-bin PATH   导出 105,984 字节原始 2bpp 点阵二进制文件路径
  --preview PATH        导出转换后的四色点阵预览图路径 (PNG 格式)
  --dry-run             仅执行转换处理，不向网络设备发送推送请求
```

---

## 🐍 Python SDK 代码集成示例

你可以将 `epd_push.py` 作为模块直接导入到自己的项目中：

```python
from tools.epd_push import image_to_2bpp, push_to_epd

# 1. 将任意 PIL 图像或文件转换为 105,984 字节二进制点阵
raw_bytes = image_to_2bpp(
    "avatar.png",
    fit="cover",
    portrait=True,      # 竖屏立绘自适应
    dither="floyd"      # 高保真四色误差扩散
)

# 2. 通过 HTTP 推送至设备
res = push_to_epd(raw_bytes, host="epd-display.local")
print("推送结果:", res)
```

---

## 🌐 其它客户端接入示例

### 1. cURL 单行命令
若已有现成的 `.2bpp` 点阵文件（或通过脚本生成的点阵）：
```bash
curl -X POST --data-binary @image.2bpp http://epd-display.local/api/push/raw
```

### 2. Node.js (Fetch)
```javascript
import fs from 'fs';

const rawData = fs.readFileSync('image.2bpp');
const res = await fetch('http://epd-display.local/api/push/raw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  body: rawData
});

const json = await res.json();
console.log(json);
```

### 3. Home Assistant (智能家居自动化)
在 `configuration.yaml` 中配置 `rest_command`：
```yaml
rest_command:
  push_epd_bitmap:
    url: "http://epd-display.local/api/push/raw"
    method: POST
    headers:
      Content-Type: "application/octet-stream"
    payload: "{{ bitmap_binary }}"
```
