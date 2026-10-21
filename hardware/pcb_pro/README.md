# SlimBadge-C6 Pro 旗舰顶配版

## 1. 版本定位
- **定位**：全功能顶配旗舰版，追求极致元器件品质与精度，适合极客样机、开发调试与高规格小批量。
- **BOM 元件总成本**：约 **¥126.74**（当前立创商城报价）。

## 2. 硬件特性全览
- **主控模块**：ESP32-C6-MINI-1-N4 (RISC-V 160MHz, WiFi 6 2.4GHz, Bluetooth 5 (LE), Zigbee 3.0, Thread 1.3, 内置 4MB Flash)
- **电源管理系统**：Silergy SY6970QCC (15W NVDC 同步降压充电管理，集成硬件高精度 I2C 电量计、动态路径管理、系统过压/过流/过温保护)
- **快充诱骗接口**：WCH CH224K (ESSOP-10，支持 USB PD 3.0 / QC 3.0 诱骗)
- **外部海量扩展**：
  - 128Mbit (16MB) 高速 SPI NOR Flash：Winbond W25Q128JVSIQ
  - 沉板自弹 MicroSD 卡座：Hirose (广濑) DM3D-SF
- **工业级传感矩阵**：
  - 6 轴 IMU 陀螺仪与加速度计：QST QMI8658A (LGA-14)
  - 瑞士进口高精度温湿度传感器：Sensirion SHT40-AD1B (DFN-4, ±1.8%RH, ±0.2°C)
  - 人眼感度匹配环境光传感器：TI OPT3001DNPR (USON-6)
- **近场与时钟通信**：
  - 双界面 NFC / RFID 标签芯片：STMicroelectronics ST25DV04K-IER6C3 (UFDFN-8) + 4P 0.5mm 卧贴天线 FPC 接口
  - 独立掉电走时硬件 RTC：NXP PCF8563TS/5 (TSSOP-8) + 精密 32.768kHz SMD 晶体
- **优质机电元件**：
  - 工业级手感贴片滑动开关：C&K PCM12SMTBR
  - 沉板 Type-C 16Pin 连接器：首韩 TYPE-C 16PIN 2MD(073)

## 3. 生产与配单文件
- 原理图：[`epd_c6_slimbadge.kicad_sch`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_pro/epd_c6_slimbadge.kicad_sch)
- PCB 工程：[`epd_c6_slimbadge.kicad_pcb`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_pro/epd_c6_slimbadge.kicad_pcb)
- 立创商城 BOM：[`BOM_SZLCSC_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_pro/BOM_SZLCSC_SlimBadge_C6.csv)
- 嘉立创 SMT 贴片 BOM：[`BOM_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_pro/BOM_JLCSMT_SlimBadge_C6.csv)
- 嘉立创坐标文件：[`CPL_JLCSMT_SlimBadge_C6.csv`](file:///c:/Users/ZGQ/Documents/antigravity/epd/hardware/pcb_pro/CPL_JLCSMT_SlimBadge_C6.csv)
