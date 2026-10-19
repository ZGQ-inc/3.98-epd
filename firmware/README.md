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

## 📦 预编译固件清单 (Pre-built Binaries)

本目录提供分别适配两种硬件版本的开箱即用二进制固件：

| 固件文件名 | 适配芯片 | 体积大小 | 适用硬件与说明 | 源码工程目录 |
| :--- | :--- | :--- | :--- | :--- |
| **`epd-firmware-c3.bin`** | ESP32-C3 | **1,764,592 字节 (~1.68 MB)** | **V1.0 原型机 (ESP32-C3 SuperMini)**<br>集成完整 Wi-Fi Web 控制台、Gzip PWA 前端、NTP 对时、HTTP 原始位图推图、Flash 中文字库与 SPIFFS 效果存储。 | 项目根目录 `src/` |
| **`epd-firmware-c6.bin`** | ESP32-C6 | **357,792 字节 (~349 KB)** | **V2.0 极限超薄工牌 (Project SlimBadge C6)**<br>基于 C6-MINI-1 架构，针对 5.4mm 极限超薄硬件优化，内置 SY6970 智能快充与库仑计遥测、低功耗 BLE 5.3 栈驱动。 | `src/c6/` |
| `epd-firmware.bin` | ESP32-C3 | 1,764,592 字节 | 兼容旧版构建路径（与 `epd-firmware-c3.bin` 相同）。 | 项目根目录 `src/` |

> **💡 固件体积差异说明**:
> - **C3 固件体积较大 (~1.7MB)**：是因为编译时嵌入了完整的 lwIP TCP/IP 协议栈、Wi-Fi 驱动、HTTP 嵌入式服务器、Gzip 压缩的本地控制台网页资源 (`web_assets/index.html.gz`) 以及 mDNS 服务等全功能网络应用。
> - **C6 固件体积小巧 (~350KB)**：聚焦于低功耗待机与传感器调度，去除了全栈大型 Web 服务，主要启用 NimBLE 5.3 蓝牙协议栈与 I2C SY6970 电源管理驱动。

---

## ⚡ 一键烧录到设备 (Flash)

### 1. ESP32-C3 (V1.0 原型机) 烧录

- **方式一：使用 `espflash` 自动烧录**:
  ```bash
  # 根目录执行
  espflash flash --release
  ```

- **方式二：直接使用 `esptool.py` 刷入预打包固件**:
  ```bash
  esptool.py --chip esp32c3 -p <PORT> -b 460800 write_flash 0x20000 firmware/epd-firmware-c3.bin
  ```

### 2. ESP32-C6 (V2.0 SlimBadge) 烧录

- **方式一：使用 `espflash` 自动烧录**:
  ```bash
  # 在 src/c6 目录执行
  cd src/c6
  espflash flash --release
  ```

- **方式二：直接使用 `esptool.py` 刷入预打包固件**:
  ```bash
  esptool.py --chip esp32c6 -p <PORT> -b 460800 write_flash 0x20000 firmware/epd-firmware-c6.bin
  ```

---

## 🧭 Flash 分区表规划 (Partitions Table)

4MB Flash 布局严格遵循项目根目录下的 `partitions.csv`：

| 分区名 (Name) | 类型 (Type) | 子类型 (SubType) | 偏移地址 (Offset) | 分区大小 (Size) | 作用说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nvs` | data | nvs | `0x9000` | 24 KB (`0x6000`) | 存储 Wi-Fi 凭据、蓝牙设备名与模式配置 |
| `phy_init` | data | phy | `0x11000` | 4 KB (`0x1000`) | 射频初始化校准数据 |
| `factory` | app | factory | `0x20000` | 2048 KB (`0x200000`, 2.0MB) | Rust ESP-IDF 完整主固件镜像 |
| `font` | data | 0x01 | `0x220000` | 288 KB (`0x48000`) | Flash MMU 零内存占用标准点阵中文字库 |
| `storage` | data | spiffs | `0x268000` | 1632 KB (`0x198000`, ~1.6MB)| 单片机内置 SPIFFS 效果库 (真实物理存储) |
