# 壳 3.98英寸 4色墨水屏 MicroPython 驱动
# 适用型号: SE0398NZ07-FNG-A0 / SE0398NZ07-FNG-A1
# 分辨率: 768 x 552 (4-Color BWRY: 黑 / 白 / 黄 / 红)
# 驱动架构: 交错式物理扫描线映射 (Command 0x83 + 0x10)
# By ZGQ Inc.

import framebuf
import time

# 4色像素编码 (2-bit per pixel, 对应 MicroPython framebuf.GS2_HMSB 规范):
# 0b00 (0): 黑色 BLACK
# 0b01 (1): 白色 WHITE
# 0b10 (2): 黄色 YELLOW
# 0b11 (3): 红色 RED
BLACK  = 0
WHITE  = 1
YELLOW = 2
RED    = 3

# 2-bit 像素位置重排对齐查找表 (MicroPython GS2_HMSB 与 SPI 硬件传输 MSB 顺序双向自反映射)
_LUT_REV = bytes(((b & 0x03) << 6) | ((b & 0x0C) << 2) | ((b & 0x30) >> 2) | ((b & 0xC0) >> 6) for b in range(256))

@micropython.viper
def _lut_transform(buf_ptr: ptr8, n: int, lut_ptr: ptr8):
    for i in range(n):
        buf_ptr[i] = lut_ptr[buf_ptr[i]]

class EPD_3in98:
    BLACK  = BLACK
    WHITE  = WHITE
    YELLOW = YELLOW
    RED    = RED

    WIDTH  = 768
    HEIGHT = 552

    def __init__(self, spi, cs, dc, rst, busy, rotation=0, panel_version='A0'):
        """
        初始化 3.98 英寸 4 色墨水屏驱动
        :param spi: machine.SPI 实例 (推荐 baudrate >= 8MHz, polarity=0, phase=0)
        :param cs: machine.Pin (片选, 低电平使能)
        :param dc: machine.Pin (数据/指令选择, 0=CMD, 1=DATA)
        :param rst: machine.Pin (硬件复位引脚, 低电平复位)
        :param busy: machine.Pin (忙碌状态检测, 低电平=忙碌, 高电平=就绪)
        :param rotation: 旋转方向 (0=正常横屏 768x552, 2=翻转 180 度横屏)
        :param panel_version: 屏幕版本 ('A0' 或 'A1')
        """
        self.spi = spi
        self.cs = cs
        self.dc = dc
        self.rst = rst
        self.busy = busy
        self.panel_version = panel_version.upper()
        self.rotation = rotation

        self.width = self.WIDTH
        self.height = self.HEIGHT

        # 物理显存分配: 768 宽度 * 552 高度 // 4 = 105,984 字节 (~103.5 KB)
        self.buffer = bytearray(self.width * self.height // 4)
        self.fb = framebuf.FrameBuffer(self.buffer, self.width, self.height, framebuf.GS2_HMSB)
        
        # 预先分配 Command 0x83 扫描线区域指令缓冲区 (9 字节)，避免循环内频繁申请内存
        self._area_buf = bytearray([0x00, 0x00, 0x02, 0xFF, 0, 0, 0, 0, 0x01])

        # 初始化屏幕硬件
        self.init_hw()

    # FrameBuffer 标准绘图 API 穿透封装
    def fill(self, c): self.fb.fill(c)
    def pixel(self, x, y, c=None):
        if c is None: return self.fb.pixel(x, y)
        self.fb.pixel(x, y, c)
    def text(self, s, x, y, c=1): self.fb.text(s, x, y, c)
    def rect(self, x, y, w, h, c): self.fb.rect(x, y, w, h, c)
    def fill_rect(self, x, y, w, h, c): self.fb.fill_rect(x, y, w, h, c)
    def line(self, x1, y1, x2, y2, c): self.fb.line(x1, y1, x2, y2, c)
    def hline(self, x, y, w, c): self.fb.hline(x, y, w, c)
    def vline(self, x, y, h, c): self.fb.vline(x, y, h, c)
    def blit(self, fbuf, x, y, key=-1): self.fb.blit(fbuf, x, y, key)
    def show(self): self.display()

    def draw_text(self, s, x, y, color=0, scale=2, bold=True):
        """
        绘制大字号文本 (支持 scale 放大倍数与加粗描边)
        :param s: 待绘制字符串 (ASCII)
        :param x: 起始 X 坐标
        :param y: 起始 Y 坐标
        :param color: 颜色 (BLACK=0, WHITE=1, YELLOW=2, RED=3)
        :param scale: 放大倍数 (1=8x8, 2=16x16, 3=24x24, 4=32x32...)
        :param bold: 是否开启粗体描边
        """
        if scale <= 1 and not bold:
            self.fb.text(s, x, y, color)
            return

        w = len(s) * 8
        h = 8
        tmp_buf = bytearray(w * h // 8)
        tfb = framebuf.FrameBuffer(tmp_buf, w, h, framebuf.MONO_HLSB)
        tfb.text(s, 0, 0, 1)

        b_ext = 1 if bold else 0
        for py in range(8):
            y_pos = y + py * scale
            for px in range(w):
                if tfb.pixel(px, py):
                    x_pos = x + px * scale
                    self.fb.fill_rect(x_pos, y_pos, scale + b_ext, scale, color)

    def blit_raw_2bpp(self, file_path, x, y, w, h):
        """
        将 2-bit 原生点阵图片 (GS2_HMSB 格式) 直接从文件零内存开销流式载入显存
        :param file_path: 文件路径
        :param x: 目标左上角 X 坐标 (需为 4 的倍数)
        :param y: 目标左上角 Y 坐标
        :param w: 图片宽度 (像素, 需为 4 的倍数)
        :param h: 图片高度 (像素)
        """
        row_bytes = w // 4
        x_byte = x // 4
        mv = memoryview(self.buffer)
        stride = self.width // 4
        with open(file_path, 'rb') as f:
            for r in range(h):
                start = (y + r) * stride + x_byte
                f.readinto(mv[start : start + row_bytes])

    def _send_cmd(self, cmd):
        self.dc.value(0)
        self.cs.value(0)
        self.spi.write(bytearray([cmd]))
        self.cs.value(1)

    def _send_data(self, data):
        self.dc.value(1)
        self.cs.value(0)
        if isinstance(data, int):
            self.spi.write(bytearray([data]))
        else:
            self.spi.write(data)
        self.cs.value(1)

    def _wait_busy(self, timeout_ms=35000):
        """等待 BUSY 引脚变高（空闲）"""
        t0 = time.ticks_ms()
        time.sleep_ms(20)
        while self.busy.value() == 0:
            if time.ticks_diff(time.ticks_ms(), t0) > timeout_ms:
                print("[WARN] EPD BUSY wait timeout (%d ms)!" % timeout_ms)
                break
            time.sleep_ms(50)

    def init_hw(self):
        """执行硬件复位与官方固件标准启动序列"""
        # 1. 硬件复位脉冲
        self.rst.value(0)
        time.sleep_ms(40)
        self.rst.value(1)
        time.sleep_ms(50)
        self._wait_busy(2000)
        time.sleep_ms(30)

        # 2. 面板设定 (PSR 0x00 -> 0x0B)
        self._send_cmd(0x00)
        self._send_data(0x0B)

        # 3. 分辨率设置 (TRES 0x61 -> 768 x 600)
        self._send_cmd(0x61)
        self._send_data(bytearray([0x03, 0x00, 0x02, 0x58]))

        # 4. 启动高压驱动回路 (Power On 0x04)
        self._send_cmd(0x04)
        self._wait_busy(2000)

    def display(self):
        """将显存数据按交错扫描线地址映射写入屏幕并触发全屏波形刷新"""
        # 唤醒并启动升压
        self.init_hw()

        # 硬件传输前，将 MicroPython 显存快速转为 SPI 硬件字节序 (仅耗时约 23ms)
        _lut_transform(self.buffer, len(self.buffer), _LUT_REV)

        area = self._area_buf
        buf_mv = memoryview(self.buffer)
        is_a1 = (self.panel_version == 'A1')
        flip_180 = (self.rotation == 2)

        try:
            # 逐行设置局部 RAM 地址并传输 192 字节 (768 像素)
            for s2 in range(552):
                # 支持 180 度翻转输出
                row = (551 - s2) if flip_180 else s2

                # 逆向提取的 A0 / A1 芯片内部物理栅极交错映射公式:
                if is_a1:
                    y = (s2 * 2) - 599 if s2 <= 299 else (s2 * 2)
                else: # A0
                    y = (s2 * 2) if s2 <= 275 else (1103 - 2 * s2)

                area[4] = y >> 8
                area[5] = y & 0xFF
                area[6] = y >> 8
                area[7] = y & 0xFF

                # 0x83: Set Partial RAM Area
                self._send_cmd(0x83)
                self._send_data(area)

                # 0x10: Write RAM Data
                self._send_cmd(0x10)
                self._send_data(buf_mv[row * 192 : (row + 1) * 192])

            # 恢复 RAM 扫描范围默认值 (0, 767, 0, 599)
            self._send_cmd(0x83)
            self._send_data(bytearray([0x00, 0x00, 0x02, 0xFF, 0x00, 0x00, 0x02, 0x57, 0x01]))

            # 触发 4 色物理波形驱动刷新 (0x12, 0x01) - 约耗时 15~16 秒
            self._send_cmd(0x12)
            self._send_data(0x01)
            self._wait_busy(timeout_ms=35000)

            # 关断升压回路，防止屏幕过充损耗 (Power Off 0x02, 0x00)
            self._send_cmd(0x02)
            self._send_data(0x00)
            self._wait_busy(timeout_ms=5000)

        finally:
            # 恢复显存为 MicroPython 格式，以便后续继续绘图
            _lut_transform(self.buffer, len(self.buffer), _LUT_REV)

    def clear(self, color=WHITE):
        """以指定颜色清屏"""
        self.fill(color)
        self.display()

    def sleep(self):
        """关断高压并使屏幕主控进入超低功耗休眠模式"""
        self._send_cmd(0x02)
        self._send_data(0x00)
        self._wait_busy(timeout_ms=3000)
        self._send_cmd(0x07)
        self._send_data(0xA5)
        time.sleep_ms(200)
