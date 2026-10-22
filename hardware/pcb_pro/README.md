# SlimBadge-C6 Pro 旗舰版 (极致性能与工业级选料)

## 1. 版本定位与成本
- **定位**：旗舰版，采用工业级低温漂器件、顶级传感器配置、高耐久开关与高容量 SPI Flash。
- **BOM 器件数**：40 项 (主板) + 1 项 (FPC NFC 天线)。
- **单套预估成本**：约 ¥125.53。

## 2. 关键硬件变更说明
1. **移除 CH224K PD 诱骗芯片**：
   - 全系统一取消诱骗升压，USB Type-C 标准 5V 输入直供系统，同步降压充电机效率提升至 94%+，发热降低 60% 以上。
2. **新增侧按微动轻触按键 (SW2)**：
   - 采用标准超薄侧按轻触开关 `SW_SPST_B3U-3000P`（LCSC: C135850），放置于板边顶部 ($X=13.5, Y=1.7$)。
   - 按键轴心向外侧水平延伸 0.25mm，实现真正的**侧边按压（侧按）**，适配外壳侧键装配。
   - 信号连通 `GPIO9`，支持 Bootloader 恢复与功能交互。
3. **新增 6 位镀金调试测试焊盘矩阵 (TP1 ~ TP6)**：
   - 布局 6 个 1.2mm 镀金测试点：`VBUS`、`3V3`、`BAT`、`BOOT` 及双 `GND`。
4. **板载 SPI Flash (U12) 3D 模型渲染**：
   - 绑定物理 SOIC-8 3D 模型，元器件实体在全角度 3D 图中均完整渲染。

## 3. 生产文件
- PCB: `epd_c6_slimbadge.kicad_pcb`
- SCH: `epd_c6_slimbadge.kicad_sch`
- SMT BOM: `BOM_JLCSMT_SlimBadge_C6.csv`
- CPL: `CPL_JLCSMT_SlimBadge_C6.csv`
