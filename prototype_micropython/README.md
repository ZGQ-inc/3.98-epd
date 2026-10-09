# 3.98" BWRY 墨水屏 MicroPython 原型验证 Demo (Prototype)

本目录包含了项目初期用于验证 3.98 英寸四色墨水屏（SSD1683 控制器，768×552 分辨率）硬件管脚、SPI 通信、微粒抖动算法与刷新波形的核心 MicroPython 驱动与测试例程。

---

## 📁 文件清单

- **`epd3in98.py`**:
  - 3.98 英寸 4 色电子墨水屏 (BWRY) 的 MicroPython 底层驱动库。
  - 封装了 SSD1683 的 SPI 初始化序列、寄存器控制、2bpp (2-bit per pixel) 显存管理、全刷/局刷控制及低功耗休眠指令。
- **`demo.py`**:
  - 基础硬件与图像测试脚本。
  - 演示了四色基础几何图形绘制、文字排版题字以及将 RAW 二进制图像推送至墨水屏物理刷新的完整流程。
- **`convert_image.py`**:
  - PC 端图片格式转换与 4 色 Floyd-Steinberg 误差扩散抖动算法脚本。
  - 可将任意格式的 JPG/PNG 图片缩放为 768×552 并转换为黑/白/红/黄 4 色 2bpp 原始显存二进制文件（`.raw`）。
- **`avatar.raw`**:
  - 预生成的 768×552 4 色测试图片二进制数据样本（可直接由 `demo.py` 读取刷屏）。
- **`SE0398NZ07_MicroPython.zip`**:
  - 原始完整备份压缩包（含厂家技术参考、引脚对照图与初期测试工程）。

---

## 🚀 快速测试方法 (MicroPython)

1. 在开发板（如 ESP32-C3）上刷入标准 MicroPython 固件；
2. 使用 Thonny IDE 或 `mpremote` / `ampy` 将 `epd3in98.py`、`demo.py` 和 `avatar.raw` 上传到开发板根目录；
3. 根据硬件接线修改 `demo.py` 中的 GPIO 引脚分配（SCK, MOSI, CS, DC, RST, BUSY）；
4. 运行 `demo.py`，墨水屏即可完成物理颗粒沉淀全彩刷新。
