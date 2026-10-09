# 壳 3.98英寸 4色墨水屏 图片取模与转码工具
# 将任意 PNG / JPG 图片转换为 4 色 (黑/白/黄/红) Floyd-Steinberg 误差扩散抖动点阵
# 输出可在 MicroPython 中零内存流式加载的 .raw 二进制文件
# By ZGQ Inc.

import sys
import os
import numpy as np
from PIL import Image, ImageEnhance

def convert_image(input_path, output_raw, target_w=280, target_h=280, contrast=1.25, sharpness=1.5):
    """
    转换图片为 4 色墨水屏点阵
    :param input_path: 输入图片路径
    :param output_raw: 输出 .raw 文件路径
    :param target_w: 目标宽度 (像素, 建议 4 的倍数)
    :param target_h: 目标高度 (像素)
    """
    if target_w % 4 != 0:
        raise ValueError("目标宽度必须为 4 的整数倍！")

    print(f"正在读取图片: {input_path}")
    im = Image.open(input_path).convert('RGB')

    # 适度增强对比度和清晰度，使墨水屏显示效果更通透
    if contrast != 1.0:
        im = ImageEnhance.Contrast(im).enhance(contrast)
    if sharpness != 1.0:
        im = ImageEnhance.Sharpness(im).enhance(sharpness)

    im_resized = im.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # 4 色调色板 (标准 BWRY 调色板)
    # 0: 黑色 (0, 0, 0)
    # 1: 白色 (255, 255, 255)
    # 2: 黄色 (255, 215, 0)
    # 3: 红色 (220, 20, 40)
    palette_colors = [
        (0, 0, 0),
        (255, 255, 255),
        (255, 215, 0),
        (220, 20, 40)
    ]

    palette_img = Image.new('P', (1, 1))
    flat_palette = []
    for c in palette_colors:
        flat_palette.extend(c)
    flat_palette.extend([0] * (768 - len(flat_palette)))
    palette_img.putpalette(flat_palette)

    # Floyd-Steinberg 误差扩散抖动量化
    dithered = im_resized.quantize(palette=palette_img, dither=Image.Dither.FLOYDSTEINBERG)
    pixels = np.array(dithered, dtype=np.uint8)

    # 生成预览 PNG
    preview_path = os.path.splitext(output_raw)[0] + "_preview.png"
    dithered.convert('RGB').save(preview_path)
    print(f"已生成 4 色预览图: {preview_path}")

    # 打包为 MicroPython GS2_HMSB 显存格式:
    # 1 字节容纳 4 个像素: p0 at bits [1:0], p1 at bits [3:2], p2 at bits [5:4], p3 at bits [7:6]
    row_bytes = target_w // 4
    packed_rows = []
    for r in range(target_h):
        row_buf = bytearray(row_bytes)
        for c in range(row_bytes):
            p0 = pixels[r, c*4 + 0]
            p1 = pixels[r, c*4 + 1]
            p2 = pixels[r, c*4 + 2]
            p3 = pixels[r, c*4 + 3]
            row_buf[c] = (p3 << 6) | (p2 << 4) | (p1 << 2) | p0
        packed_rows.append(row_buf)

    raw_data = b''.join(packed_rows)
    with open(output_raw, 'wb') as f:
        f.write(raw_data)

    print(f"已生成点阵文件: {output_raw} (大小: {len(raw_data)} 字节, {target_w}x{target_h})")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python convert_image.py <输入图片> <输出raw文件> [宽=280] [高=280]")
        print("示例: python convert_image.py my_avatar.png avatar.raw 280 280")
    else:
        in_file = sys.argv[1]
        out_file = sys.argv[2]
        w = int(sys.argv[3]) if len(sys.argv) > 3 else 280
        h = int(sys.argv[4]) if len(sys.argv) > 4 else 280
        convert_image(in_file, out_file, w, h)
