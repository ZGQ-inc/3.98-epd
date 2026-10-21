# SlimBadge-C6 Standard 普通版 (全功能国产平替版)

## 1. 版本定位与成本优势
- **定位**：**100% 保留全部硬件功能与外设接口**（包含 6 轴陀螺仪、温湿度、光照、NFC、TF 卡槽、独立 RTC、外置 Flash）。
- **优化思路**：将原先导致整单成本飙升的高溢价进口物料（如 C&K 进口拨动开关、Winbond 华邦 Flash、Hirose 广濑卡座、NXP 时钟芯片、Sensirion 进口温湿度）全量替换为 **成熟稳定、库存充足的高性价比国产一级品牌元器件**。
- **BOM 元件总成本**：约 **¥85.40**（较 Pro 版立省 ¥41.34）。

## 2. 关键国产化平替清单

| 位号 | 原始进口型号 (Pro 版) | 换型国产平替型号 (Standard 版) | 品牌 / 封装 | 立创商城编号 | 价格变化 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SW1** | C&K PCM12SMTBR (¥11.28) | **MSK-12C02** | SHOU HAN (首韩) / 微型贴片 1P2T | [`C431540`](https://item.szlcsc.com/431540.html) | ¥11.28 ➔ **¥0.33** (省 ¥10.95) |
| **U12** | Winbond W25Q128JVSIQ (¥16.91) | **XT25F128 / P25Q128** | XTX (芯天下) / SOP-8 128Mbit SPI | [`C42162960`](https://item.szlcsc.com/42162960.html) | ¥16.91 ➔ **¥2.50** (省 ¥14.41) |
| **J_TF** | Hirose DM3D-SF 沉板 (¥7.12) | **SIM-004X / JBL** | SOFNG (硕方) / 贴片自弹 TF 卡座 | [`C183629`](https://item.szlcsc.com/183629.html) | ¥7.12 ➔ **¥0.85** (省 ¥6.27) |
| **U9** | NXP PCF8563TS/5 (¥3.81) | **PCF8563DTR** | XBLW (芯伯乐) / SOP-8 低功耗 RTC | [`C18723596`](https://item.szlcsc.com/18723596.html) | ¥3.81 ➔ **¥0.93** (省 ¥2.88) |
| **U7** | Sensirion SHT40-AD1B (¥11.71) | **AHT20** | Aosong (广州奥松) / DFN-4 温湿度 | [`C2757850`](https://item.szlcsc.com/2757850.html) | ¥11.71 ➔ **¥4.88** (省 ¥6.83) |
| **C20,21**| Samsung CL21A 22uF (¥1.17/颗) | **CL21A226MAQNNNE** | Samsung / 风华高科 22uF 0805 | [`C45783`](https://item.szlcsc.com/45783.html) | ¥2.33 ➔ **¥0.60** (省 ¥1.73) |

## 3. 功能保留矩阵
- [x] 主控核心：ESP32-C6-MINI-1-N4 (WiFi 6 + BLE 5.0)
- [x] 完整智能快充管理：SY6970QCC (I2C 电量计 + NVDC 充放电)
- [x] Type-C PD 诱骗快充：CH224K
- [x] 墨水屏专用升压电路：68uH 电感 + MOS + 肖特基
- [x] 6 轴运动加速度/陀螺仪传感：QMI8658A
- [x] 数字温湿度环境感知：广州奥松 AHT20
- [x] 人眼匹配高精度环境光感知：OPT3001DNPR
- [x] 硬件双界面 NFC/RFID 标签：ST25DV04K + FPC 天线
- [x] 大容量离线图库扩展：MicroSD (TF) 贴片自弹卡座
- [x] 外部高速数据存储：128Mbit (16MB) SPI NOR Flash
- [x] 掉电保持硬件时钟：PCF8563 + 32.768kHz 晶振

## 4. 嘉立创 SMT 与生产文件
- 原理图：[`epd_c6_slimbadge.kicad_sch`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_std/epd_c6_slimbadge.kicad_sch)
- 立创商城 BOM：[`BOM_SZLCSC_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_std/BOM_SZLCSC_SlimBadge_C6.csv)
- 嘉立创 SMT 贴片 BOM：[`BOM_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_std/BOM_JLCSMT_SlimBadge_C6.csv)
- 嘉立创坐标文件：[`CPL_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_std/CPL_JLCSMT_SlimBadge_C6.csv)
