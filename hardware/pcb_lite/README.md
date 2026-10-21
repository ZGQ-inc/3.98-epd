# SlimBadge-C6 Lite 极致精简版 (极高性价比)

## 1. 版本定位与成本优势
- **定位**：面向大批量低成本、超长续航水墨屏智能胸牌 / 会议名牌 / 工牌。
- **BOM 元件总成本**：约 **¥40.60**（较 Pro 版立省 ¥86.14，降幅达 **68%**）。
- **整机总造价**（含 PCB 打样与嘉立创贴片）：约 **¥55 ~ ¥65**，完美控制在 ¥100 预算以内！

## 2. 架构裁剪与优化说明 (Why & How)
依据极简水墨屏胸牌需求，去除非必要外围芯片，核心功能与交互体验完全不缩水：
1. **砍掉外置 SPI Flash (`U12` + `C31`, 省 ¥16.91)**：
   - ESP32-C6-MINI-1 内部已集成 **4MB (32Mbit) SPI Flash**。
   - 4MB 容量不仅能存放完整 MicroPython / ESP-IDF 固件与 LVGL 引擎，还可容纳数十张 296x128 全屏图片和完整 GB2312 汉字字库，无需额外耗电与占地方的外置 Flash。
2. **砍掉 TF 卡槽 (`J_TF`, 省 ¥7.12)**：
   - 胸牌内容更新全面依托 ESP32-C6 的 **WiFi 6 (2.4GHz) / BLE 5.0** 进行无线远程下发，无需物理插拔卡，机身更轻薄一体。
3. **砍掉 6 轴陀螺仪 (`U6` + `C26`, 省 ¥12.13)**：
   - 胸牌主要处于静态佩戴或胸前晃动，无需高功耗、高成本的姿态传感。
4. **砍掉温湿度传感器 (`U7` + `C28`, 省 ¥11.71)**：
   - 联网型墨水屏直接通过 WiFi 获取所在城市的天气与温湿度 API，无需在胸前受体温干扰的板载温湿度计。
5. **砍掉环境光传感器 (`U8` + `C29`, 省 ¥13.26)**：
   - 电子墨水屏为环境光双稳态全反射显示，外部光线越强越清晰，无需像背光屏一样调节亮度。
6. **砍掉外部 NFC 芯片与天线座 (`U10` + `C30` + `J_NFC`, 省 ¥9.07)**：
   - 免碰配网与信息交换由 ESP32-C6 原生低功耗蓝牙 (BLE 5.0) 完美替代，兼容 iOS 与安卓设备。
7. **砍掉独立外部 RTC (`U9` + `Y1` + `C32`, 省 ¥4.85)**：
   - ESP32-C6 内部集成超低功耗 RTC 定时器，深睡眠待机功耗仅数微安，结合定期的网络 SNTP 自动校时，走时分毫不差。
8. **开关换型 (`SW1`, 省 ¥10.95)**：
   - 替换昂贵的进口 C&K 开关，选用成熟国产微型贴片拨动开关 **首韩 MSK-12C02 (`C431540`, ¥0.33)**。

## 3. 保留的核心电路与硬件保障
- **主控运算中心**：ESP32-C6-MINI-1-N4（RISC-V 160MHz、WiFi 6、BLE 5.0、Thread/Zigbee）
- **高端电源管理核心**：SY6970QCC NVDC 降压充电管理 + 硬件 I2C 电池电量计（电池电压、电流、实时充放状态精准感知，支持动态电源路径与边充边用）
- **快充握手**：CH224K Type-C PD 诱骗芯片
- **墨水屏完整驱动接口**：24P FPC 卧贴插座、68uH 升压电感、AO3400A 功率放电 MOS、MBR0540 肖特基二极管及电荷泵电容
- **电源与指示**：RT9193-33GB 3.3V 低噪声 LDO、USBLC6-2SC6 保护、Type-C 沉板口、1.0mm 2P 锂电池座、充电/充满/运行/RGB 状态灯

## 4. 嘉立创 SMT 与生产文件
- 原理图：[`epd_c6_slimbadge.kicad_sch`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_lite/epd_c6_slimbadge.kicad_sch)（裁剪元件已在属性中标记 `dnp yes`）
- 立创商城 BOM：[`BOM_SZLCSC_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_lite/BOM_SZLCSC_SlimBadge_C6.csv)（32 行核心物料，总价仅 ¥40.60）
- 嘉立创 SMT 贴片 BOM：[`BOM_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_lite/BOM_JLCSMT_SlimBadge_C6.csv)
- 嘉立创坐标文件：[`CPL_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_lite/CPL_JLCSMT_SlimBadge_C6.csv)（已剔除裁剪器件坐标）
