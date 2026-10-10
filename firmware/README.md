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
   - **Windows PowerShell**:
     ```powershell
     . $HOME/export-esp.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source ~/export-esp.sh
     ```

---

## 📦 固件编译与剥离 (Build & Strip)

项目 `Cargo.toml` 已经内置了符号剥离配置（`debug = 0`, `strip = true`, `lto = "fat"`）：

```bash
# 1. 在项目根目录执行 release 编译
cargo +esp build --release

# 2. 将 ELF 可执行文件提取为纯净裸机固件镜像 (.bin)
espflash save-image --chip esp32c3 target/riscv32imc-esp-espidf/release/epd-firmware firmware/epd-firmware.bin
```

> **💡 ELF 与 BIN 的体积说明**:
> - `target/.../release/epd-firmware` 是未提取的 ELF 格式，早期包含 DWARF 调试符号时可达 20MB+（现经 `strip = true` 优化后约 3MB）；
> - 真正通过 `espflash save-image` 或 `espflash flash` 烧录进 ESP32-C3 Flash 的裸机二进制固件（`.bin`）仅为 **1,764,592 字节（约 1.68 MB）**，完全适配 2MB 固件分区。

---

## ⚡ 一键烧录到设备 (Flash)

### 方式一：使用 `espflash` 自动烧录 (最推荐)
将 ESP32-C3 SuperMini 通过 Type-C 数据线连接至电脑（设备管理器中查看端口号，例如 Windows 上的 `COMx` 或 Linux 上的 `/dev/ttyUSB0`）：
```bash
# 自动检测串口并烧录
espflash flash --release

# 或指定具体串口（请将 COM17 替换为你的实际串口号）
espflash flash --port COM17 --release
```

### 方式二：免编译直接使用 `esptool.py` 刷入预打包固件
本目录已预先提供构建好的 `epd-firmware.bin` (1.76MB)：
```bash
esptool.py --chip esp32c3 -p <PORT> -b 460800 write_flash 0x20000 firmware/epd-firmware.bin
```

---

## 🧭 Flash 分区表规划 (Partitions Table)

4MB Flash 布局严格遵循项目根目录下的 `partitions.csv`：

| 分区名 (Name) | 类型 (Type) | 子类型 (SubType) | 偏移地址 (Offset) | 分区大小 (Size) | 作用说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nvs` | data | nvs | `0x9000` | 24 KB (`0x6000`) | 存储 Wi-Fi 凭据、蓝牙设备名与模式配置 |
| `phy_init` | data | phy | `0x11000` | 4 KB (`0x1000`) | 射频初始化校准数据 |
| `factory` | app | factory | `0x20000` | 2048 KB (`0x200000`, 2.0MB) | Rust ESP-IDF 完整主固件镜像 (当前约占 84%) |
| `font` | data | 0x01 | `0x220000` | 288 KB (`0x48000`) | Flash MMU 零内存占用标准点阵中文字库 |
| `storage` | data | spiffs | `0x268000` | 1632 KB (`0x198000`, ~1.6MB)| 单片机内置 SPIFFS 效果库 (真实物理存储) |
