# 固件烧录与编译指南 (Firmware Compilation & Flashing Guide)

本固件基于 **Rust ESP-IDF** 体系打造，专为 **ESP32-C3** (RISC-V 32位架构) 设计，实现了 4色墨水屏硬件显存管理、Web Bluetooth (WebBLE) 蓝牙直推、Wi-Fi 局域网控制台与低功耗多模式共存。

---

## 🛠️ 编译环境配置 (Prerequisites)

1. **安装 Rust 工具链**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **安装 ESP32-C3 RISC-V 交叉编译器与 espflash 工具**:
   ```bash
   cargo install espup
   espup install
   cargo install espflash
   ```
3. **加载 ESP 环境变量**:
   - **Linux / macOS**: `source ~/export-esp.sh`
   - **Windows PowerShell**: `. $HOME/export-esp.ps1`

---

## 📦 固件编译 (Build)

在项目根目录运行：
```bash
cargo +esp build --release
```
编译产物位于 `target/riscv32imc-esp-espidf/release/epd-firmware`（注意：`target/` 目录已被 `.gitignore` 忽略以保持代码仓库整洁）。

---

## ⚡ 一键烧录到设备 (Flash)

### 方式一：使用 `espflash` 自动烧录 (推荐)
将 ESP32-C3 SuperMini 通过 Type-C 数据线连接至电脑（设备管理器中查看端口号，例如 Windows 上的 `COMx` 或 Linux 上的 `/dev/ttyUSB0`）：
```bash
# 自动检测串口并烧录
espflash flash --release

# 或指定具体串口与监控日志（请将 <PORT> 替换为你的实际串口号，如 COM17 或 /dev/ttyUSB0）
espflash flash --port <PORT> --release --monitor
```

### 方式二：使用 `esptool.py` 烧录
如果您拥有编译打包后的二进制分卷：
```bash
esptool.py --chip esp32c3 -p <PORT> -b 460800 --before default_reset --after hard_reset write_flash \
  0x0      bootloader.bin \
  0x8000   partitions.bin \
  0x20000  epd-firmware.bin
```

---

## 🧭 Flash 分区表规划 (Partitions Table)

| 分区名 (Name) | 类型 (Type) | 子类型 (SubType) | 偏移地址 (Offset) | 分区大小 (Size) | 作用说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nvs` | data | nvs | `0x9000` | 24 KB (`0x6000`) | 存储 Wi-Fi 凭据、蓝牙设备名与模式配置 |
| `phy_init` | data | phy | `0x11000` | 4 KB (`0x1000`) | 射频初始化校准数据 |
| `factory` | app | factory | `0x20000` | 3072 KB (`0x300000`) | Rust ESP-IDF 完整主固件镜像 |
| `storage` | data | spiffs | `0x320000` | 896 KB (`0xE0000`) | 备用离线资源与字库文件存储 |
