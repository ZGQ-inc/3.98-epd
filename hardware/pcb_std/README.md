# SlimBadge-C6 Standard 标准版 (全功能平衡)

## 1. 版本定位与成本
- **定位**：全功能平衡版，支持 NFC 交互、RTC 极低功耗待机、IMU 计步/姿态唤醒、MicroSD/TF 卡扩展与电量精确监控。
- **BOM 器件数**：40 项 (主板) + 1 项 (FPC NFC 天线)。
- **单套预估成本**：约 ¥84.19。

## 2. 关键硬件变更说明
1. **移除 CH224K PD 诱骗芯片**：
   - 采用标准 5.1k CC 下拉，直接从 USB Type-C 端口安全取电 5V，彻底消除 9V 降压带来的发热与电容耐压隐患。
2. **新增侧按微动轻触按键 (SW2)**：
   - 采用标准超薄侧按轻触开关 `SW_SPST_B3U-3000P`（LCSC: C135850），放置于板边顶部 ($X=13.5, Y=1.7$)。
   - 按键轴心沿 PCB 水平外沿突出 0.25mm，适配外壳侧壁开孔，实现真正的**侧边按压（侧按）**。
   - 信号直连 `GPIO9`，支持一键刷机下载与用户自定义功能（切页/休眠/背光）。
3. **新增 6 位镀金调试测试焊盘矩阵 (TP1 ~ TP6)**：
   - 利用原 CH224K 区域布局 6 个 1.2mm 镀金测试点：`VBUS`、`3V3`、`BAT`、`BOOT` 及双 `GND`，外围标注清晰丝印，便于出厂测试与探针测试。
4. **板载 SPI Flash (U12) 3D 模型修复**：
   - 绑定物理 SOIC-8 3D 模型，3D 视图与渲染图均完整呈现元器件实体。

## 3. 生产文件
- PCB: `epd_c6_slimbadge.kicad_pcb`
- SCH: `epd_c6_slimbadge.kicad_sch`
- SMT BOM: `BOM_JLCSMT_SlimBadge_C6.csv`
- CPL: `CPL_JLCSMT_SlimBadge_C6.csv`
