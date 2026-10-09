# 壳 3.98英寸 4色墨水屏 演示程序
# 适用型号: SE0398NZ07-FNG-A0 / A1 (768 x 552)
# MCU: ESP32-C3 SuperMini
# 引脚定义: SCK=4, MOSI=6, CS=7, DC=1, RST=2, BUSY=10
# By ZGQ Inc.

from machine import Pin, SPI
import time
from epd3in98 import EPD_3in98, BLACK, WHITE, YELLOW, RED

def draw_layout(epd):
    print("1. 正在绘制 768 x 552 大字号 UI 布局...")

    # 1. 纯白底色
    epd.fill(WHITE)

    # 2. 顶部主状态栏 (Y: 0 ~ 54)
    epd.fill_rect(0, 0, epd.width, 54, BLACK)
    epd.hline(0, 54, epd.width, RED)
    epd.hline(0, 55, epd.width, RED)
    epd.hline(0, 56, epd.width, YELLOW)
    epd.draw_text("3.98\" EPD", 32, 14, WHITE, scale=3, bold=True)
    epd.draw_text("ESP32-C3", epd.width - 240, 14, YELLOW, scale=3, bold=True)

    # 3. 左侧卡片 1: 品牌工作区概览 (X: 24, Y: 75, W: 410, H: 230)
    epd.fill_rect(24, 75, 410, 230, WHITE)
    epd.rect(24, 75, 410, 230, BLACK)
    epd.rect(26, 77, 406, 226, YELLOW)
    epd.fill_rect(28, 79, 402, 40, BLACK)
    epd.draw_text("WORKSPACE", 42, 88, WHITE, scale=2, bold=True)

    epd.draw_text("PANEL : SE0398NZ07 (A0)", 45, 135, BLACK, scale=2, bold=True)
    epd.draw_text("RES   : 768 x 552 BWRY", 45, 170, BLACK, scale=2, bold=True)
    epd.draw_text("STATUS: ONLINE / READY", 45, 205, RED, scale=2, bold=True)

    # 4 颜色色块展示
    swatches = [("BLA", BLACK, WHITE), ("WHI", WHITE, BLACK), ("YEL", YELLOW, BLACK), ("RED", RED, WHITE)]
    for i, (name, bg_c, fg_c) in enumerate(swatches):
        sx = 42 + i * 93
        sy = 250
        epd.fill_rect(sx, sy, 85, 36, bg_c)
        epd.rect(sx, sy, 85, 36, BLACK)
        epd.draw_text(name, sx + 18, sy + 10, fg_c, scale=2, bold=True)

    # 4. 左侧卡片 2: 硬件与总线信息 (X: 24, Y: 322, W: 410, H: 208)
    epd.rect(24, 322, 410, 208, BLACK)
    epd.rect(26, 324, 406, 204, RED)
    epd.fill_rect(28, 326, 402, 38, RED)
    epd.draw_text("HARDWARE & BUS INFO", 42, 334, WHITE, scale=2, bold=True)

    epd.draw_text("MCU:ESP32-C3", 45, 376, BLACK, scale=2, bold=True)
    epd.draw_text("BUS:SPI1 @ 8MHz MODE 0", 45, 406, BLACK, scale=2, bold=True)
    epd.draw_text("SPI:SCK=4 MOSI=6 CS=7", 45, 436, BLACK, scale=2, bold=True)
    epd.draw_text("CTL:DC=1 RST=2 BUSY=10", 45, 466, BLACK, scale=2, bold=True)
    epd.draw_text("OS :MicroPython v1.29.0", 45, 496, BLACK, scale=2, bold=True)

    # 5. 右上侧状态小挂件 (X: 456, Y: 75, W: 288, H: 85)
    epd.fill_rect(456, 75, 288, 85, BLACK)
    epd.rect(454, 73, 292, 89, RED)
    epd.draw_text("DEMO", 480, 88, YELLOW, scale=3, bold=True)
    epd.draw_text("PIC", 480, 125, WHITE, scale=2, bold=True)

    # 6. 右下侧头像区域 (X: 460, Y: 180, W: 280, H: 280)
    print("2. 正在载入 280x280 4 色头像 (avatar.raw)...")
    try:
        epd.blit_raw_2bpp("avatar.raw", 460, 180, 280, 280)
    except Exception as e:
        print("[WARN] 载入头像失败:", e)
        epd.fill_rect(460, 180, 280, 280, YELLOW)
        epd.draw_text("AVATAR", 520, 310, BLACK, scale=3, bold=True)

    # 头像精致外框 (黑/红/黄三层线框)
    epd.rect(457, 177, 286, 286, BLACK)
    epd.rect(458, 178, 284, 284, RED)
    epd.rect(459, 179, 282, 282, YELLOW)

    # 7. 头像下方品牌签名标牌 (X: 456, Y: 480, W: 288, H: 50)
    epd.fill_rect(456, 480, 288, 50, BLACK)
    epd.rect(454, 478, 292, 54, YELLOW)
    epd.draw_text("ZGQ Inc.", 520, 492, YELLOW, scale=3, bold=True)

def main():

    # 硬件 SPI 与 GPIO 配置 (对应实际物理连线)
    spi = SPI(1, baudrate=8000000, polarity=0, phase=0, sck=Pin(4), mosi=Pin(6))
    cs = Pin(7, Pin.OUT, value=1)
    dc = Pin(1, Pin.OUT, value=0)
    rst = Pin(2, Pin.OUT, value=1)
    busy = Pin(10, Pin.IN)

    print("正在初始化屏幕驱动对象 (如果是A1就把 panel_version 改成 A1)...")
    epd = EPD_3in98(spi, cs, dc, rst, busy, rotation=0, panel_version='A0')

    # 绘制全新大字号与头像布局
    draw_layout(epd)

    # 传输显存数据并触发物理全屏刷新
    print("正在传输显存数据并触发物理波形刷新...")
    t0 = time.ticks_ms()
    epd.display()
    print("屏幕刷新完成！总耗时: %d 毫秒" % time.ticks_diff(time.ticks_ms(), t0))

if __name__ == '__main__':
    main()
