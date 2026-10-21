# SlimBadge C6 & NFC FPC PCB Engineering & Production Files

本目录包含 ESP32-C6 3.98寸水墨屏胸牌 (SlimBadge C6) 主板与定制超薄 NFC 天线 FPC 的全套工程、原理图、BOM 及生产文件。无需解压 zip，所有文件已就绪。

---

## 目录结构

```
pcb/
├── slimbadge/                          # ESP32-C6 主控板 4 层沉金板工程
│   ├── epd_c6_slimbadge.kicad_pro      # KiCad 9 工程文件
│   ├── epd_c6_slimbadge.kicad_sch      # 完整原理图 (含 U12 Flash, 5 大传感器, SY6970 充放电管理)
│   ├── epd_c6_slimbadge.kicad_pcb      # 4层 PCB (0短路、0开路、0交叉、过孔完全收拢)
│   ├── epd_c6_slimbadge.kicad_prl      # KiCad 项目设置
│   ├── BOM_JLCSMT_SlimBadge_C6.csv     # 嘉立创 SMT 物料清单 (92 项物料, 100% 匹配 LCSC 编号)
│   ├── CPL_JLCSMT_SlimBadge_C6.csv     # 嘉立创 SMT 坐标清单 (88 个贴片元件)
│   └── gerber/                         # 光绘与钻孔文件目录 (21 项 Gerber + Drill)
│
└── nfc_fpc/                            # 超薄贴纸式 NFC 天线 FPC 2 层柔性板工程
    ├── nfc_antenna_fpc.kicad_pro       # KiCad 9 FPC 工程文件
    ├── nfc_antenna_fpc.kicad_pcb       # 2 层 FPC 天线线圈 Layout
    ├── nfc_antenna_fpc.kicad_prl       # KiCad 项目设置
    ├── BOM_JLCSMT_NFC_FPC.csv          # NFC FPC 物料清单 (NTAG216 DFN-2)
    ├── CPL_JLCSMT_NFC_FPC.csv          # NFC FPC SMT 坐标清单
    └── gerber/                         # FPC 光绘与钻孔文件目录 (18 项 Gerber + Drill)
```

---

## 核心硬件特性

### 1. SlimBadge C6 主控板
- **板厚与层叠**: 1.0mm 4层板 (JLC04101H-7628 / JLC04101H-2313 标准层叠)，工艺推荐沉金 (ENIG)。
- **存储方案**: 
  - 支持 **MicroSD 卡槽 (DM3D-SF)** 扩展。
  - 支持 **U12 双封装 (SOIC-8 / WSON-8 8x6mm) SPI NOR Flash**，兼容 4MB / 8MB / 16MB / 32MB / 64MB / 128MB (如 W25Q128JVSIQ)。
  - 两者共享高集成 SPI 总线，分别具备独立片选 (`SD_CS` -> IO12, `FLASH_CS` -> IO18)。
- **电源管理**:
  - SY6970 15W 高效 NVDC 同步降压充电 + OTG 升压电路。
  - 具备全套硬件过压、欠压、过流保护与电池 ADC/I2C 深度监测。
- **传感器网络**:
  - SHT40 (高精度温湿度传感器)
  - OPT3001 (环境光强传感器)
  - QMI8658C (6轴惯性传感器 / IMU)
  - PCF8563 (超低功耗 RTC 实时时钟)
  - ST25DV04K (双界面 RFID/NFC 动态标签)

### 2. NFC Antenna FPC 柔性板
- **板厚与材质**: 0.12mm 单面/双面柔性聚酰亚胺 (PI) FPC。
- **天线设计**: 5 匝 Concentric 对称多边形天线线圈，中心谐振频率 13.56 MHz。
- **连接方式**: 2-Pin 0.5mm 间距沉板插座通过超柔排线无缝跨接至主板 `J_NFC`。
