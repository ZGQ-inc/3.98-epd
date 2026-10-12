#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
Universal Image to 2bpp Converter & Open HTTP Push CLI / Python SDK

Screen Specifications:
  - Resolution: 768 × 552 pixels (Physical landscape)
  - Color Depth: 2-bit per pixel (2bpp, 4 pixels per byte)
  - Color Palette:
      0b00 (0) = Black  (#000000)
      0b01 (1) = White  (#ffffff)
      0b10 (2) = Yellow (#f4c430)
      0b11 (3) = Red    (#d32f2f)
  - Total Framebuffer: (768 * 552) / 4 = 105,984 Bytes

Open REST API Endpoint:
  POST http://<epd-ip-or-host>/api/push/raw
  Content-Type: application/octet-stream
  Body: 105,984 Bytes binary stream

Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
"""

import sys
import os
import argparse
from typing import Optional, Tuple, Union

# Windows 控制台 UTF-8 输出防乱码兼容
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from PIL import Image, ImageOps
except ImportError:
    print("❌ 缺少 Pillow 图像处理库，请先安装：pip install pillow")
    sys.exit(1)

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error

# ── 屏幕物理规格常量 ────────────────────────────────────────────────────────
EPD_WIDTH = 768
EPD_HEIGHT = 552
TOTAL_BUFFER_SIZE = (EPD_WIDTH * EPD_HEIGHT) // 4  # 105,984 字节

# BWRY 四色调色板 (R, G, B)
# 索引 0: 黑色, 1: 白色, 2: 黄色, 3: 红色
BWRY_PALETTE_RGB = [
    (0, 0, 0),        # 0: Black
    (255, 255, 255),  # 1: White
    (244, 196, 48),   # 2: Yellow (#f4c430)
    (211, 47, 47),    # 3: Red    (#d32f2f)
]

def _build_pillow_palette() -> Image.Image:
    """构建 Pillow 兼容的 256 色调色板基准图"""
    palette_img = Image.new("P", (1, 1))
    raw_palette = []
    for r, g, b in BWRY_PALETTE_RGB:
        raw_palette.extend([r, g, b])
    # 填充余下 252 种颜色为黑
    raw_palette.extend([0, 0, 0] * (256 - len(BWRY_PALETTE_RGB)))
    palette_img.putpalette(raw_palette)
    return palette_img

_GLOBAL_PALETTE_IMG = _build_pillow_palette()


def resize_and_fit(
    img: Image.Image,
    target_w: int = EPD_WIDTH,
    target_h: int = EPD_HEIGHT,
    fit: str = "contain",
    bg_color: Tuple[int, int, int] = (255, 255, 255)
) -> Image.Image:
    """
    自适应缩放图像至目标分辨率
    :param img: PIL.Image 原始图像
    :param target_w: 目标宽度 (默认 768)
    :param target_h: 目标高度 (默认 552)
    :param fit: 'contain' (等比缩放留白), 'cover' (等比居中裁切), 'stretch' (拉伸铺满)
    :param bg_color: 背景填充色 (默认纯白)
    """
    img = img.convert("RGB")
    src_w, src_h = img.size

    if fit == "stretch":
        return img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    if fit == "cover":
        # 等比缩放并居中裁剪
        src_aspect = src_w / src_h
        target_aspect = target_w / target_h
        if src_aspect > target_aspect:
            # 原图较宽，以高为准
            scale = target_h / src_h
            new_w = int(src_w * scale)
            resized = img.resize((new_w, target_h), Image.Resampling.LANCZOS)
            left = (new_w - target_w) // 2
            return resized.crop((left, 0, left + target_w, target_h))
        else:
            # 原图较高，以宽为准
            scale = target_w / src_w
            new_h = int(src_h * scale)
            resized = img.resize((target_w, new_h), Image.Resampling.LANCZOS)
            top = (new_h - target_h) // 2
            return resized.crop((0, top, target_w, top + target_h))

    # 默认 contain: 等比缩放并居中留白
    scale = min(target_w / src_w, target_h / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), bg_color)
    offset_x = (target_w - new_w) // 2
    offset_y = (target_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))
    return canvas


def dither_to_bwry(
    img: Image.Image,
    algorithm: str = "floyd"
) -> Image.Image:
    """
    将 RGB 图像量化并抖动为 BWRY 四色索引图像 (0:黑, 1:白, 2:黄, 3:红)
    :param img: 768 × 552 的 RGB 图像
    :param algorithm: 'floyd' (Floyd-Steinberg 误差扩散), 'none' (阈值最邻近)
    :return: 模式为 'P' 的图像，像素值为 0, 1, 2, 3
    """
    dither_mode = Image.Dither.FLOYDSTEINBERG if algorithm == "floyd" else Image.Dither.NONE
    quantized = img.quantize(palette=_GLOBAL_PALETTE_IMG, dither=dither_mode)
    return quantized


def pack_2bpp(quantized_img: Image.Image) -> bytes:
    """
    将 768 × 552 的 4 色索引图像压缩打包为 105,984 字节的 2bpp 二进制流
    每字节存放 4 个像素，自高位至低位排列：
      Bit [7:6] = 像素 0
      Bit [5:4] = 像素 1
      Bit [3:2] = 像素 2
      Bit [1:0] = 像素 3
    """
    if quantized_img.size != (EPD_WIDTH, EPD_HEIGHT):
        raise ValueError(f"图像尺寸必须为 {EPD_WIDTH}x{EPD_HEIGHT}，当前为 {quantized_img.size}")

    if HAS_NUMPY:
        arr = np.array(quantized_img, dtype=np.uint8)
        # 确保像素值被限制在 0..3
        arr = arr & 0x03
        p0 = arr[:, 0::4]
        p1 = arr[:, 1::4]
        p2 = arr[:, 2::4]
        p3 = arr[:, 3::4]
        packed = (p0 << 6) | (p1 << 4) | (p2 << 2) | p3
        return packed.tobytes()
    else:
        # 纯 Python 兜底实现
        pixels = list(quantized_img.getdata())
        packed = bytearray(TOTAL_BUFFER_SIZE)
        for i in range(0, len(pixels), 4):
            b0 = pixels[i] & 0x03
            b1 = (pixels[i + 1] & 0x03) if (i + 1) < len(pixels) else 1
            b2 = (pixels[i + 2] & 0x03) if (i + 2) < len(pixels) else 1
            b3 = (pixels[i + 3] & 0x03) if (i + 3) < len(pixels) else 1
            packed[i >> 2] = (b0 << 6) | (b1 << 4) | (b2 << 2) | b3
        return bytes(packed)


def unpack_2bpp_to_preview(raw_data: bytes) -> Image.Image:
    """
    将 105,984 字节 2bpp 二进制流还原为 768 × 552 RGB 预览图
    """
    if len(raw_data) != TOTAL_BUFFER_SIZE:
        raise ValueError(f"数据长度错误：预期 {TOTAL_BUFFER_SIZE} 字节，实际为 {len(raw_data)}")

    preview = Image.new("RGB", (EPD_WIDTH, EPD_HEIGHT))
    pixels = []

    for byte in raw_data:
        p0 = (byte >> 6) & 0x03
        p1 = (byte >> 4) & 0x03
        p2 = (byte >> 2) & 0x03
        p3 = byte & 0x03
        for p in (p0, p1, p2, p3):
            pixels.append(BWRY_PALETTE_RGB[p])

    preview.putdata(pixels)
    return preview


def image_to_2bpp(
    input_source: Union[str, Image.Image],
    fit: str = "contain",
    portrait: bool = False,
    rotate: int = 0,
    dither: str = "floyd"
) -> bytes:
    """
    全流程一键转换：任意图片 -> 768x552 2bpp 105KB 二进制流
    :param input_source: 文件路径或 PIL.Image 对象
    :param fit: 'contain', 'cover', 'stretch'
    :param portrait: 是否为立绘/工牌竖屏模式 (先按 552x768 排版再逆时针旋转映射至物理屏)
    :param rotate: 额外旋转角度 (0, 90, 180, 270)
    :param dither: 'floyd' 或 'none'
    """
    if isinstance(input_source, str):
        img = Image.open(input_source)
    else:
        img = input_source.copy()

    # 处理 EXIF 翻转信息
    img = ImageOps.exif_transpose(img)

    if portrait:
        # 竖屏立绘：目标画布为 552 宽 × 768 高
        fitted = resize_and_fit(img, target_w=552, target_h=768, fit=fit)
        # 旋转 270 度（顺时针 90 度）以水平匹配 768 × 552 物理显存
        fitted = fitted.rotate(270, expand=True)
    else:
        # 横屏模式：目标画布为 768 宽 × 552 高
        fitted = resize_and_fit(img, target_w=EPD_WIDTH, target_h=EPD_HEIGHT, fit=fit)

    if rotate in (90, 180, 270):
        fitted = fitted.rotate(rotate, expand=True)
        if fitted.size != (EPD_WIDTH, EPD_HEIGHT):
            fitted = fitted.resize((EPD_WIDTH, EPD_HEIGHT), Image.Resampling.LANCZOS)

    quantized = dither_to_bwry(fitted, algorithm=dither)
    return pack_2bpp(quantized)


def push_to_epd(
    raw_2bpp_data: bytes,
    host: str = "epd-display.local",
    refresh: bool = True,
    timeout: float = 25.0
) -> dict:
    """
    通过 HTTP POST 发送 105,984 字节点阵至墨水屏
    :param raw_2bpp_data: 105,984 字节 2bpp 二进制数据
    :param host: 单片机 IP 或 mDNS 主机名 (如 "epd-display.local" 或 "192.168.1.100")
    :param refresh: 是否触发物理波形硬件刷新 (True/False)
    :param timeout: 超时时间 (秒)
    :return: 响应 JSON 字典
    """
    if len(raw_2bpp_data) != TOTAL_BUFFER_SIZE:
        raise ValueError(f"点阵数据长度错误: 必须为 {TOTAL_BUFFER_SIZE} 字节，实际为 {len(raw_2bpp_data)} 字节")

    # 兼容传入完整 URL 或纯主机名
    if host.startswith("http://") or host.startswith("https://"):
        base_url = host.rstrip("/")
    else:
        base_url = f"http://{host}"

    url = f"{base_url}/api/push/raw"
    if not refresh:
        url += "?refresh=false"

    headers = {
        "Content-Type": "application/octet-stream",
        "X-Refresh": "true" if refresh else "false"
    }

    if HAS_REQUESTS:
        resp = requests.post(url, data=raw_2bpp_data, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            raise RuntimeError(f"设备返回 HTTP 异常状态 [{resp.status_code}]: {resp.text}")
        return resp.json()
    else:
        req = urllib.request.Request(url, data=raw_2bpp_data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as response:
            import json
            res_body = response.read().decode("utf-8")
            return json.loads(res_body)


# ── CLI 命令行入口 ─────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="3.98寸 BWRY 电子墨水屏图片转换与开放式 HTTP 推送工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  1. 一键推送图片至工牌 (局域网 mDNS 域名):
     python epd_push.py photo.png --host epd-display.local

  2. 针对指定 IP 推送竖屏二次元立绘 (自动旋转适配):
     python epd_push.py character.png --host 192.168.1.105 --portrait

  3. 仅转换并导出 .2bpp 点阵文件与四色预览图:
     python epd_push.py input.jpg --save-bin output.2bpp --preview preview.png --dry-run

  4. 无感推送到显存暂不触发波形刷新 (后台静默预载):
     python epd_push.py photo.png --no-refresh
        """
    )

    parser.add_argument("image", help="输入图像路径 (支持 PNG, JPG, WebP, BMP 等)")
    parser.add_argument("--host", default="epd-display.local", help="墨水屏 IP 地址或 mDNS 域名 (默认: epd-display.local)")
    parser.add_argument("-p", "--portrait", action="store_true", help="启用竖屏立绘模式 (552×768 自动等比缩放并旋转贴合物理屏)")
    parser.add_argument("--fit", choices=["contain", "cover", "stretch"], default="contain", help="图像适配模式: contain (留白), cover (裁切填充), stretch (拉伸) [默认: contain]")
    parser.add_argument("--dither", choices=["floyd", "none"], default="floyd", help="抖动算法: floyd (Floyd-Steinberg 误差扩散), none (纯阈值) [默认: floyd]")
    parser.add_argument("--rotate", type=int, choices=[0, 90, 180, 270], default=0, help="图像额外旋转角度 (0, 90, 180, 270)")
    parser.add_argument("--no-refresh", action="store_true", help="写入显存缓冲区但暂不触发 16 秒硬件波形物理刷新")
    parser.add_argument("-o", "--save-bin", help="导出 105,984 字节原始 2bpp 点阵二进制文件路径")
    parser.add_argument("--preview", help="导出转换后的四色点阵预览图路径 (PNG 格式)")
    parser.add_argument("--dry-run", action="store_true", help="仅执行转换处理，不向网络设备发送推送请求")

    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"❌ 找不到输入文件: {args.image}")
        sys.exit(1)

    print(f"🎨 正在读取图像: {args.image} ...")
    try:
        raw_bin = image_to_2bpp(
            args.image,
            fit=args.fit,
            portrait=args.portrait,
            rotate=args.rotate,
            dither=args.dither
        )
    except Exception as e:
        print(f"❌ 图像处理失败: {e}")
        sys.exit(1)

    print(f"✅ 转换成功: 生成 1:1 物理显存点阵 ({len(raw_bin):,} 字节, 768×552 BWRY 2bpp)")

    if args.save_bin:
        with open(args.save_bin, "wb") as f:
            f.write(raw_bin)
        print(f"💾 点阵二进制已保存至: {args.save_bin}")

    if args.preview:
        preview_img = unpack_2bpp_to_preview(raw_bin)
        preview_img.save(args.preview)
        print(f"🖼️ 四色预览图已保存至: {args.preview}")

    if args.dry_run:
        print("💡 Dry-run 模式：跳过网络推送。")
        return

    print(f"🚀 正在推送至设备 http://{args.host}/api/push/raw ...")
    try:
        res = push_to_epd(raw_bin, host=args.host, refresh=(not args.no_refresh))
        status = res.get("status", "ok")
        msg = res.get("message", "")
        if status == "ok":
            print(f"🎉 推送成功！设备响应: {msg}")
        elif status == "busy":
            print(f"⚠️ 设备当前繁忙 (正在物理刷新中): {msg}")
        else:
            print(f"ℹ️ 设备响应: {res}")
    except Exception as e:
        print(f"❌ 推送失败: {e}")
        print("💡 排查建议:")
        print("  1. 确认工牌已开机且处于 Wi-Fi 模式，并在同一局域网内；")
        print("  2. 若 mDNS 无法解析，请尝试使用实际 IP（例如 --host 192.168.1.100）；")
        print("  3. 检查电脑防火墙是否拦截了局域网 HTTP 请求。")
        sys.exit(1)


if __name__ == "__main__":
    main()
