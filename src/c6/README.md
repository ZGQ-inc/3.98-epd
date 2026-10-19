# Project SlimBadge C6 Firmware (V2.0)

本目录为 **Project SlimBadge C6 (3.98" BWRY 5.4mm 极限超薄墨水屏徽章)** 的专用 V2.0 固件工程。

与仓库根目录的 **V1.0 (ESP32-C3 极简原型机)** 实行同仓独立解耦管理，两者互不干扰。

---

## 硬件配置与对比

| 硬件配置项 | V1.0 (根目录工程) | **V2.0 (本工程 `firmware_v2_c6`)** |
| :--- | :--- | :--- |
| **目标主控** | ESP32-C3 SuperMini (`riscv32imc`) | **ESP32-C6-MINI-1-N4 (`riscv32imac`)** |
| **墨水屏 BUSY 引脚** | **GPIO 10** | **GPIO 22** (因为 C6-MINI 的 IO10 在内部连接 Flash) |
| **充电管理** | TP4056 线性充 (无通信) | **SY6970 15W 降压开关快充 (I2C 通信 + 库仑计遥测)** |
| **快充诱骗** | 无 | **CH224K 9V PD/QC 协议诱骗** |
| **传感器阵列** | 无 | **QMI8658C (IMU) + SHT40 + OPT3001 + PCF8563 (RTC) + ST25DV04K (NFC)** |
| **外部存储** | 无 | **沉板 MicroSD / TF 卡座 (SPI2 模式)** |
| **状态指示灯** | 单色指示灯 | **SK6805-EC15 全彩 RGB + ACT 白灯 + CHG/DONE 双色灯** |

---

## 编译与烧录指南

### 1. 编译 V2.0 (ESP32-C6)
```powershell
cd c:\Users\ZGQ\Documents\antigravity\epd\src\c6
cargo +esp build --release
```

### 2. 一键烧录到 C6
```powershell
espflash flash target/riscv32imac-esp-espidf/release/epd-firmware-v2
```

### 3. 如果需要切回编译 V1.0 (老款 ESP32-C3 手搓板)
返回项目根目录即可直接编译，原有 C3 引脚与环境 100% 保持原样：
```powershell
cd c:\Users\ZGQ\Documents\antigravity\epd
cargo build --release
```
