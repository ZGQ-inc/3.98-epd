"""
build_epd_case.py
=================
3.98英寸 4色墨水屏 专属定制手机造型外壳 V22 终极定型版 STL 生成脚本
作者: ZGQ Inc.

包含五大零件全套导出:
1. acrylic_template.stl - 91.0 x 64.0 x 1.5mm 亚克力视窗保护板 1:1 裁切样板
2. switch_cap.stl       - 手摸接触区Z轴加厚至7.0mm + 拓宽至1.50mm + 法兰全高3.65mm(紧密碰触背盖防脱) + 上下全对称45°大倒角 + 左右立角0.8mm倒角 + 4道梯形防滑竖纹 + 原生开放式方柄插槽(零干涉)
3. case_front.stl        - 手机造型前框 (视窗82.2x60.2mm, 上下右边距严格恒等于6.90mm, M2热熔螺母柱)
4. case_middle.stl       - 手机造型中框 (中央2cm排线防折大空间+3.5mm紧贴外壁细槽+零元件重叠+平整开关底座Z=2.0+IEC开关标识+双Type-C+全套Gerber卡槽)
5. case_back.stl         - 手机造型背板 (标准净版: 1.0mm超薄+1.5mm开关贴合限位块+电池0.5mm凹槽(带R7圆角)+正中央2cm NFC贴片凹槽+正中央正方形对称4处隆起磁铁座)
6. case_back_logo.stl    - 手机造型背板定制副本 (外表面凹槽激光级雕刻小字"Made by", 大字"ZGQ Inc.")
7. epd_case.scad         - OpenSCAD 全参数化源码工程
"""

import os
import math
import struct
import numpy as np
from scipy.spatial import Delaunay
from matplotlib.textpath import TextPath
from matplotlib.font_manager import FontProperties

OUT_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "3d_models")),
    r"f:\test\epd"
]

def calc_normal(v1, v2, v3):
    ax, ay, az = v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]
    bx, by, bz = v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]
    nx = ay * bz - az * by
    ny = az * bx - ax * bz
    nz = ax * by - ay * bx
    length = math.sqrt(nx * nx + ny * ny + nz * nz)
    if length > 1e-9:
        return (nx / length, ny / length, nz / length)
    return (0.0, 0.0, 1.0)

def add_quad(triangles, v1, v2, v3, v4):
    n1 = calc_normal(v1, v2, v3)
    triangles.append((n1, v1, v2, v3))
    n2 = calc_normal(v1, v3, v4)
    triangles.append((n2, v1, v3, v4))

def make_box(x1, x2, y1, y2, z1, z2):
    tris = []
    # Bottom (-Z)
    tris.append(((0, 0, -1), (x1, y1, z1), (x2, y1, z1), (x2, y2, z1)))
    tris.append(((0, 0, -1), (x1, y1, z1), (x2, y2, z1), (x1, y2, z1)))
    # Top (+Z)
    tris.append(((0, 0, 1), (x1, y1, z2), (x2, y2, z2), (x2, y1, z2)))
    tris.append(((0, 0, 1), (x1, y1, z2), (x1, y2, z2), (x2, y2, z2)))
    # Front (-Y)
    tris.append(((0, -1, 0), (x1, y1, z1), (x2, y1, z2), (x2, y1, z1)))
    tris.append(((0, -1, 0), (x1, y1, z1), (x1, y1, z2), (x2, y1, z2)))
    # Back (+Y)
    tris.append(((0, 1, 0), (x1, y2, z1), (x2, y2, z1), (x2, y2, z2)))
    tris.append(((0, 1, 0), (x1, y2, z1), (x2, y2, z2), (x1, y2, z2)))
    # Left (-X)
    tris.append(((-1, 0, 0), (x1, y1, z1), (x1, y2, z1), (x1, y2, z2)))
    tris.append(((-1, 0, 0), (x1, y1, z1), (x1, y2, z2), (x1, y1, z2)))
    # Right (+X)
    tris.append(((1, 0, 0), (x2, y1, z1), (x2, y2, z2), (x2, y2, z1)))
    tris.append(((1, 0, 0), (x2, y1, z1), (x2, y1, z2), (x2, y2, z2)))
    return tris

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    p1x, p1y = poly[0]
    for i in range(n + 1):
        p2x, p2y = poly[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def make_rounded_rect_2d(width, height, radius, n_segs=16, cx_off=0.0, cy_off=0.0):
    pts = []
    corners = [
        (width/2 - radius + cx_off, height/2 - radius + cy_off, 0, math.pi/2),
        (-width/2 + radius + cx_off, height/2 - radius + cy_off, math.pi/2, math.pi),
        (-width/2 + radius + cx_off, -height/2 + radius + cy_off, math.pi, 3*math.pi/2),
        (width/2 - radius + cx_off, -height/2 + radius + cy_off, 3*math.pi/2, 2*math.pi)
    ]
    for cx, cy, a1, a2 in corners:
        for i in range(n_segs + 1):
            ang = a1 + (a2 - a1) * i / float(n_segs)
            pts.append((cx + radius * math.cos(ang), cy + radius * math.sin(ang)))
    # Remove consecutive duplicates
    cleaned = [pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0]-cleaned[-1][0], p[1]-cleaned[-1][1]) > 1e-4:
            cleaned.append(p)
    return cleaned

def make_circle_2d(cx, cy, r, n_segs=12):
    pts = []
    for i in range(n_segs):
        ang = 2 * math.pi * i / float(n_segs)
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts

def triangulate_2d_with_holes(outer_poly, hole_polys):
    all_pts = outer_poly.copy()
    for h in hole_polys:
        all_pts.extend(h)
    all_pts = np.array(all_pts)
    
    delaunay = Delaunay(all_pts)
    valid_tris = []
    for sim in delaunay.simplices:
        cx = np.mean(all_pts[sim, 0])
        cy = np.mean(all_pts[sim, 1])
        if point_in_polygon(cx, cy, outer_poly):
            in_any_hole = False
            for h in hole_polys:
                if point_in_polygon(cx, cy, h):
                    in_any_hole = True
                    break
            if not in_any_hole:
                valid_tris.append((sim[0], sim[1], sim[2]))
    return all_pts, valid_tris

def extrude_prism_with_holes(outer_poly, hole_polys, z1, z2):
    tris = []
    all_pts, face_tris = triangulate_2d_with_holes(outer_poly, hole_polys)
    
    # 1. Bottom face (-Z normal)
    for i1, i2, i3 in face_tris:
        p1 = (all_pts[i1, 0], all_pts[i1, 1], z1)
        p2 = (all_pts[i2, 0], all_pts[i2, 1], z1)
        p3 = (all_pts[i3, 0], all_pts[i3, 1], z1)
        n = calc_normal(p1, p3, p2)
        if n[2] > 0:
            tris.append(((-n[0], -n[1], -n[2]), p1, p2, p3))
        else:
            tris.append((n, p1, p3, p2))
            
    # 2. Top face (+Z normal)
    for i1, i2, i3 in face_tris:
        p1 = (all_pts[i1, 0], all_pts[i1, 1], z2)
        p2 = (all_pts[i2, 0], all_pts[i2, 1], z2)
        p3 = (all_pts[i3, 0], all_pts[i3, 1], z2)
        n = calc_normal(p1, p2, p3)
        if n[2] < 0:
            tris.append(((-n[0], -n[1], -n[2]), p1, p3, p2))
        else:
            tris.append((n, p1, p2, p3))
            
    # 3. Outer walls (facing outward)
    n_out = len(outer_poly)
    for i in range(n_out):
        nxt = (i + 1) % n_out
        p1 = (outer_poly[i][0], outer_poly[i][1], z1)
        p2 = (outer_poly[nxt][0], outer_poly[nxt][1], z1)
        p1_top = (outer_poly[i][0], outer_poly[i][1], z2)
        p2_top = (outer_poly[nxt][0], outer_poly[nxt][1], z2)
        add_quad(tris, p1, p2, p2_top, p1_top)
        
    # 4. Hole walls (facing inward into hole)
    for h in hole_polys:
        nh = len(h)
        for i in range(nh):
            nxt = (i + 1) % nh
            p1 = (h[i][0], h[i][1], z1)
            p2 = (h[nxt][0], h[nxt][1], z1)
            p1_top = (h[i][0], h[i][1], z2)
            p2_top = (h[nxt][0], h[nxt][1], z2)
            add_quad(tris, p2, p1, p1_top, p2_top)
            
    return tris

def make_capsule_wall_x(x1, x2, y1, y2, z1, z2, xc, zc, L, H, n_segs=8):
    tris = []
    r = H / 2.0
    d = L - H
    x_left = xc - d / 2.0
    x_right = xc + d / 2.0
    
    cap_pts = []
    for i in range(n_segs + 1):
        ang = -math.pi/2 + math.pi * i / float(n_segs)
        cap_pts.append((x_right + r * math.cos(ang), zc + r * math.sin(ang)))
    for i in range(n_segs + 1):
        ang = math.pi/2 + math.pi * i / float(n_segs)
        cap_pts.append((x_left + r * math.cos(ang), zc + r * math.sin(ang)))
        
    outer_box_2d = [(x1, z1), (x2, z1), (x2, z2), (x1, z2)]
    all_pts_xz, face_tris = triangulate_2d_with_holes(outer_box_2d, [cap_pts])
    
    # Front face at y1
    for i1, i2, i3 in face_tris:
        p1 = (all_pts_xz[i1, 0], y1, all_pts_xz[i1, 1])
        p2 = (all_pts_xz[i2, 0], y1, all_pts_xz[i2, 1])
        p3 = (all_pts_xz[i3, 0], y1, all_pts_xz[i3, 1])
        tris.append(((0, -1, 0), p1, p3, p2))
    # Back face at y2
    for i1, i2, i3 in face_tris:
        p1 = (all_pts_xz[i1, 0], y2, all_pts_xz[i1, 1])
        p2 = (all_pts_xz[i2, 0], y2, all_pts_xz[i2, 1])
        p3 = (all_pts_xz[i3, 0], y2, all_pts_xz[i3, 1])
        tris.append(((0, 1, 0), p1, p2, p3))
        
    # Perimeter
    add_quad(tris, (x1, y1, z1), (x2, y1, z1), (x2, y2, z1), (x1, y2, z1))
    add_quad(tris, (x1, y1, z2), (x1, y2, z2), (x2, y2, z2), (x2, y1, z2))
    add_quad(tris, (x1, y1, z1), (x1, y2, z1), (x1, y2, z2), (x1, y1, z2))
    add_quad(tris, (x2, y1, z1), (x2, y1, z2), (x2, y2, z2), (x2, y2, z1))
    
    # Internal tunnel
    nc = len(cap_pts)
    for i in range(nc):
        nxt = (i + 1) % nc
        p1 = (cap_pts[i][0], y1, cap_pts[i][1])
        p2 = (cap_pts[nxt][0], y1, cap_pts[nxt][1])
        p1_far = (cap_pts[i][0], y2, cap_pts[i][1])
        p2_far = (cap_pts[nxt][0], y2, cap_pts[nxt][1])
        add_quad(tris, p1, p1_far, p2_far, p2)
        
    return tris

def make_capsule_wall_y(x1, x2, y1, y2, z1, z2, yc, zc, L, H, n_segs=8):
    tris = []
    r = H / 2.0
    d = L - H
    y_bot = yc - d / 2.0
    y_top = yc + d / 2.0
    
    cap_pts = []
    for i in range(n_segs + 1):
        ang = -math.pi/2 + math.pi * i / float(n_segs)
        cap_pts.append((y_top + r * math.cos(ang), zc + r * math.sin(ang)))
    for i in range(n_segs + 1):
        ang = math.pi/2 + math.pi * i / float(n_segs)
        cap_pts.append((y_bot + r * math.cos(ang), zc + r * math.sin(ang)))
        
    outer_box_2d = [(y1, z1), (y2, z1), (y2, z2), (y1, z2)]
    all_pts_yz, face_tris = triangulate_2d_with_holes(outer_box_2d, [cap_pts])
    
    # Left face at x1
    for i1, i2, i3 in face_tris:
        p1 = (x1, all_pts_yz[i1, 0], all_pts_yz[i1, 1])
        p2 = (x1, all_pts_yz[i2, 0], all_pts_yz[i2, 1])
        p3 = (x1, all_pts_yz[i3, 0], all_pts_yz[i3, 1])
        tris.append(((-1, 0, 0), p1, p3, p2))
    # Right face at x2
    for i1, i2, i3 in face_tris:
        p1 = (x2, all_pts_yz[i1, 0], all_pts_yz[i1, 1])
        p2 = (x2, all_pts_yz[i2, 0], all_pts_yz[i2, 1])
        p3 = (x2, all_pts_yz[i3, 0], all_pts_yz[i3, 1])
        tris.append(((1, 0, 0), p1, p2, p3))
        
    # Perimeter
    add_quad(tris, (x1, y1, z1), (x2, y1, z1), (x2, y2, z1), (x1, y2, z1))
    add_quad(tris, (x1, y1, z2), (x1, y2, z2), (x2, y2, z2), (x2, y1, z2))
    add_quad(tris, (x1, y1, z1), (x1, y1, z2), (x2, y1, z2), (x2, y1, z1))
    add_quad(tris, (x1, y2, z1), (x2, y2, z1), (x2, y2, z2), (x1, y2, z2))
    
    # Internal tunnel
    nc = len(cap_pts)
    for i in range(nc):
        nxt = (i + 1) % nc
        p1 = (x1, cap_pts[i][0], cap_pts[i][1])
        p2 = (x1, cap_pts[nxt][0], cap_pts[nxt][1])
        p1_far = (x2, cap_pts[i][0], cap_pts[i][1])
        p2_far = (x2, cap_pts[nxt][0], cap_pts[nxt][1])
        add_quad(tris, p1, p2, p2_far, p1_far)
        
    return tris

def write_stl(filename, triangles):
    for out_dir in OUT_DIRS:
        os.makedirs(out_dir, exist_ok=True)
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'wb') as f:
            header = f"STL Binary export: {filename} - ZGQ Inc. V8 (Watertight/Zero-Defect)"
            f.write(header.encode('ascii')[:80].ljust(80, b'\0'))
            f.write(struct.pack('<I', len(triangles)))
            for tri in triangles:
                n, v1, v2, v3 = tri
                f.write(struct.pack('<3f', float(n[0]), float(n[1]), float(n[2])))
                f.write(struct.pack('<3f', float(v1[0]), float(v1[1]), float(v1[2])))
                f.write(struct.pack('<3f', float(v2[0]), float(v2[1]), float(v2[2])))
                f.write(struct.pack('<3f', float(v3[0]), float(v3[1]), float(v3[2])))
                f.write(struct.pack('<H', 0))
        file_size = os.path.getsize(filepath)
        print(f"成功: {filepath} ({len(triangles)} 三角片, {file_size} 字节)")

# -----------------------------------------------------------------------------
# 0. 梯形剖分算法 (Trapezoidal Decomposition - 100% 完美无瑕疵字体矢量剖分)
# -----------------------------------------------------------------------------
def polygon_to_trapezoids(poly_loops):
    edges = []
    y_events = set()
    for loop in poly_loops:
        nl = len(loop)
        for i in range(nl):
            p1 = loop[i]
            p2 = loop[(i + 1) % nl]
            if abs(p1[1] - p2[1]) > 1e-4:
                if p1[1] > p2[1]:
                    p1, p2 = p2, p1
                edges.append((p1, p2))
                y_events.add(p1[1])
                y_events.add(p2[1])
    y_sorted = sorted(list(y_events))
    tris = []
    for i in range(len(y_sorted) - 1):
        y_bot = y_sorted[i]
        y_top = y_sorted[i + 1]
        if y_top - y_bot < 1e-4:
            continue
        y_mid = (y_bot + y_top) / 2.0
        x_intersects = []
        for p1, p2 in edges:
            if p1[1] <= y_mid <= p2[1]:
                t_mid = (y_mid - p1[1]) / (p2[1] - p1[1])
                t_bot = (y_bot - p1[1]) / (p2[1] - p1[1])
                t_top = (y_top - p1[1]) / (p2[1] - p1[1])
                x_mid = p1[0] + t_mid * (p2[0] - p1[0])
                x_bot = p1[0] + t_bot * (p2[0] - p1[0])
                x_top = p1[0] + t_top * (p2[0] - p1[0])
                x_intersects.append((x_mid, x_bot, x_top))
        x_intersects.sort(key=lambda item: item[0])
        for j in range(0, len(x_intersects) - 1, 2):
            _, x1_bot, x1_top = x_intersects[j]
            _, x2_bot, x2_top = x_intersects[j + 1]
            p_bl = (x1_bot, y_bot)
            p_br = (x2_bot, y_bot)
            p_tr = (x2_top, y_top)
            p_tl = (x1_top, y_top)
            tris.append((p_bl, p_br, p_tr))
            tris.append((p_bl, p_tr, p_tl))
    return tris

def get_text_mesh(text, size, cx, cy, z1, z2, weight='bold', tol=0.12):
    tp = TextPath((0, 0), text, size=size, prop=FontProperties(family='sans-serif', weight=weight))
    bb = tp.get_extents()
    loops_raw = tp.to_polygons()
    loops = []
    for p in loops_raw:
        pts = [p[0]]
        for pt in p[1:]:
            if np.linalg.norm(pt - pts[-1]) > tol:
                pts.append(pt)
        if np.linalg.norm(pts[0] - pts[-1]) < tol:
            pts = pts[:-1]
        pts = np.array(pts) - [bb.x0 + bb.width/2, bb.y0 + bb.height/2] + [cx, cy]
        if len(pts) >= 3:
            loops.append(pts)
            
    tris_2d = polygon_to_trapezoids(loops)
    mesh_tris = []
    
    # 顶面 (+Z 方向)
    for p_bl, p_br, p_tr in tris_2d:
        p1 = (p_bl[0], p_bl[1], z2)
        p2 = (p_br[0], p_br[1], z2)
        p3 = (p_tr[0], p_tr[1], z2)
        mesh_tris.append(((0, 0, 1), p1, p2, p3))
        
    # 底面 (-Z 方向)
    for p_bl, p_br, p_tr in tris_2d:
        p1 = (p_bl[0], p_bl[1], z1)
        p2 = (p_br[0], p_br[1], z1)
        p3 = (p_tr[0], p_tr[1], z1)
        mesh_tris.append(((0, 0, -1), p1, p3, p2))
        
    # 侧立壁 (面对文字外侧)
    for loop in loops:
        nl = len(loop)
        for i in range(nl):
            nxt = (i + 1) % nl
            p1 = (loop[i][0], loop[i][1], z1)
            p2 = (loop[nxt][0], loop[nxt][1], z1)
            p1_t = (loop[i][0], loop[i][1], z2)
            p2_t = (loop[nxt][0], loop[nxt][1], z2)
            add_quad(mesh_tris, p1, p2, p2_t, p1_t)
            
    return mesh_tris

def get_text_loops(text, size, cx, cy, weight='bold', tol=0.10):
    tp = TextPath((0, 0), text, size=size, prop=FontProperties(family='sans-serif', weight=weight))
    bb = tp.get_extents()
    loops_raw = tp.to_polygons()
    loops = []
    for p in loops_raw:
        pts = [p[0]]
        for pt in p[1:]:
            if np.linalg.norm(pt - pts[-1]) > tol:
                pts.append(pt)
        if np.linalg.norm(pts[0] - pts[-1]) < tol:
            pts = pts[:-1]
        pts = np.array(pts) - [bb.x0 + bb.width/2, bb.y0 + bb.height/2] + [cx, cy]
        if len(pts) >= 3:
            loops.append([(pt[0], pt[1]) for pt in pts])
    return loops

def gen_debossed_letters_mesh(loops, xmin, xmax, ymin, ymax, z1, z2):
    edges = []
    y_events = set([ymin, ymax])
    for loop in loops:
        nl = len(loop)
        for i in range(nl):
            p1 = loop[i]
            p2 = loop[(i + 1) % nl]
            if abs(p1[1] - p2[1]) > 1e-4:
                if p1[1] > p2[1]:
                    p1, p2 = p2, p1
                edges.append((p1, p2))
                y_events.add(p1[1])
                y_events.add(p2[1])

    y_sorted = sorted(list(y_events))
    tris_2d = []
    for i in range(len(y_sorted) - 1):
        y_bot = y_sorted[i]
        y_top = y_sorted[i + 1]
        if y_top - y_bot < 1e-4:
            continue
        y_mid = (y_bot + y_top) / 2.0
        x_intersects = []
        for p1, p2 in edges:
            if p1[1] <= y_mid <= p2[1]:
                t_mid = (y_mid - p1[1]) / (p2[1] - p1[1])
                t_bot = (y_bot - p1[1]) / (p2[1] - p1[1])
                t_top = (y_top - p1[1]) / (p2[1] - p1[1])
                x_mid = p1[0] + t_mid * (p2[0] - p1[0])
                x_bot = p1[0] + t_bot * (p2[0] - p1[0])
                x_top = p1[0] + t_top * (p2[0] - p1[0])
                x_intersects.append((x_mid, x_bot, x_top))
                
        x_intersects.sort(key=lambda item: item[0])
        
        all_pts_mid = [xmin] + [item[0] for item in x_intersects] + [xmax]
        all_pts_bot = [xmin] + [item[1] for item in x_intersects] + [xmax]
        all_pts_top = [xmin] + [item[2] for item in x_intersects] + [xmax]
        
        for j in range(0, len(all_pts_mid) - 1, 2):
            x1_bot = all_pts_bot[j]
            x2_bot = all_pts_bot[j + 1]
            x1_top = all_pts_top[j]
            x2_top = all_pts_top[j + 1]
            if x2_bot - x1_bot > 1e-4 or x2_top - x1_top > 1e-4:
                p_bl = (x1_bot, y_bot)
                p_br = (x2_bot, y_bot)
                p_tr = (x2_top, y_top)
                p_tl = (x1_top, y_top)
                tris_2d.append((p_bl, p_br, p_tr))
                tris_2d.append((p_bl, p_tr, p_tl))

    mesh_tris = []
    # 底面 (Z=z1, 朝向 -Z 外表面)
    for p1, p2, p3 in tris_2d:
        p1_3d = (p1[0], p1[1], z1)
        p2_3d = (p2[0], p2[1], z1)
        p3_3d = (p3[0], p3[1], z1)
        mesh_tris.append(((0, 0, -1), p1_3d, p3_3d, p2_3d))
        
    # 顶面 (Z=z2, 朝向 +Z 内部实心底板)
    for p1, p2, p3 in tris_2d:
        p1_3d = (p1[0], p1[1], z2)
        p2_3d = (p2[0], p2[1], z2)
        p3_3d = (p3[0], p3[1], z2)
        mesh_tris.append(((0, 0, 1), p1_3d, p2_3d, p3_3d))
        
    # 字母凹槽侧壁 (法向量朝向凹槽内侧)
    for loop in loops:
        nl = len(loop)
        for i in range(nl):
            nxt = (i + 1) % nl
            p1 = (loop[i][0], loop[i][1], z1)
            p2 = (loop[nxt][0], loop[nxt][1], z1)
            p1_t = (loop[i][0], loop[i][1], z2)
            p2_t = (loop[nxt][0], loop[nxt][1], z2)
            add_quad(mesh_tris, p2, p1, p1_t, p2_t)
            
    # 外框4个侧壁 (法向量朝外，确保该块网格成为100%完全闭合的水密实体)
    # (1) 底侧壁 (-Y 面)
    add_quad(mesh_tris, (xmin, ymin, z1), (xmax, ymin, z1), (xmax, ymin, z2), (xmin, ymin, z2))
    # (2) 右侧壁 (+X 面)
    add_quad(mesh_tris, (xmax, ymin, z1), (xmax, ymax, z1), (xmax, ymax, z2), (xmax, ymin, z2))
    # (3) 顶侧壁 (+Y 面)
    add_quad(mesh_tris, (xmax, ymax, z1), (xmin, ymax, z1), (xmin, ymax, z2), (xmax, ymax, z2))
    # (4) 左侧壁 (-X 面)
    add_quad(mesh_tris, (xmin, ymax, z1), (xmin, ymin, z1), (xmin, ymin, z2), (xmin, ymax, z2))
            
    return mesh_tris

# -----------------------------------------------------------------------------
# 1. 亚克力保护板 1:1 裁切样板 (91.0 x 64.0 x 1.5mm, R=5.0mm, 取件指孔 Phi=16mm)
# -----------------------------------------------------------------------------
def gen_acrylic_template():
    outer = make_rounded_rect_2d(91.0, 64.0, 5.0, 16)
    finger_hole = make_circle_2d(0.0, 0.0, 8.0, 24)
    return extrude_prism_with_holes(outer, [finger_hole], 0.0, 1.5)

# -----------------------------------------------------------------------------
# 2. 边框嵌入式滑动按键套子 (switch_cap - 开放式方柄槽 + 上下全对称双向大倒角 + 中框与背板防卡死公差优化)
# -----------------------------------------------------------------------------
def make_trapezoid_ridge_sym(rx, y_base=4.0, y_crest=4.25, z_min=0.8, z_max=6.2, z_slope=0.4, w_base=0.6, w_crest=0.35):
    """
    生成高触感防滑梯形导角竖纹 (上下斜坡平缓收口，与顶底倒角无缝融合)。
    """
    tris = []
    wb2 = w_base / 2.0
    wc2 = w_crest / 2.0
    z_c_min = z_min + z_slope
    z_c_max = z_max - z_slope
    
    b_bl = (rx - wb2, y_base, z_min)
    b_br = (rx + wb2, y_base, z_min)
    b_tr = (rx + wb2, y_base, z_max)
    b_tl = (rx - wb2, y_base, z_max)
    
    c_bl = (rx - wc2, y_crest, z_c_min)
    c_br = (rx + wc2, y_crest, z_c_min)
    c_tr = (rx + wc2, y_crest, z_c_max)
    c_tl = (rx - wc2, y_crest, z_c_max)
    
    add_quad(tris, c_bl, c_br, c_tr, c_tl)
    add_quad(tris, b_bl, b_br, c_br, c_bl)
    add_quad(tris, c_tl, c_tr, b_tr, b_tl)
    add_quad(tris, b_tl, b_bl, c_bl, c_tl)
    add_quad(tris, b_br, b_tr, c_tr, c_br)
    add_quad(tris, b_br, b_bl, b_tl, b_tr)
    return tris

def make_symmetric_chamfered_knob(x_half=4.3, y_back=2.50, y_front=4.00, z_min=0.0, z_max=7.00, c_corner=0.8, c_top_bot=0.6):
    """
    生成上下左右全对称圆润大倒角手摸拨头 (Symmetric Chamfered Knob):
    - 手摸的地方Z轴加厚到 7.0mm: Z in [0.0, 7.00], 宽裕大面积指尖推按
    - 手摸的地方拓宽到 1.50mm: Y in [2.50, 4.00], 凸出于中框外壁恰好 1.50mm, 触感充沛好发力
    - 上下对称: 底部在 [z_min, z_min + c_top_bot] 做 45° 倒角，顶部在 [z_max - c_top_bot, z_max] 做 45° 倒角
    - 左右对称: 左右前立角做 45° 倒角 (0.8 x 0.8mm)
    - 侧沿对称: 顶部与底部侧沿均带 45° 倒角，与前后倒角自然衔接为复合切角，彻底杜绝单边割手直角！
    """
    tris = []
    z0 = z_min
    z1 = z_min + c_top_bot
    z2 = z_max - c_top_bot
    z3 = z_max
    
    def get_profile(x_w, y_f, y_b, c_c):
        p_rb = ( x_w, y_b)
        p_rf = ( x_w, y_f - c_c)
        p_fr = ( x_w - c_c, y_f)
        p_fl = (-x_w + c_c, y_f)
        p_lf = (-x_w, y_f - c_c)
        p_lb = (-x_w, y_b)
        return p_rb, p_rf, p_fr, p_fl, p_lf, p_lb
    
    p_mid = get_profile(x_half, y_front, y_back, c_corner)
    p_top_bot = get_profile(x_half - c_top_bot, y_front - c_top_bot, y_back, c_corner)
    
    v0 = [(p[0], p[1], z0) for p in p_top_bot] # Z0 底面平顶多边形
    v1 = [(p[0], p[1], z1) for p in p_mid]     # Z1 下倒角腰线
    v2 = [(p[0], p[1], z2) for p in p_mid]     # Z2 上倒角腰线
    v3 = [(p[0], p[1], z3) for p in p_top_bot] # Z3 顶面平顶多边形
    
    # 1. 底面 (-Z 法向, Z = z0):
    add_quad(tris, v0[5], v0[4], v0[1], v0[0])
    add_quad(tris, v0[4], v0[3], v0[2], v0[1])
    
    # 2. 底部 45° 倒角斜面 (Z0 -> Z1):
    add_quad(tris, v0[0], v0[1], v1[1], v1[0]) # 右侧底倒角
    add_quad(tris, v0[1], v0[2], v1[2], v1[1]) # 右前底倒角
    add_quad(tris, v0[2], v0[3], v1[3], v1[2]) # 前沿底倒角
    add_quad(tris, v0[3], v0[4], v1[4], v1[3]) # 左前底倒角
    add_quad(tris, v0[4], v0[5], v1[5], v1[4]) # 左侧底倒角
    
    # 3. 中间直立侧壁 (Z1 -> Z2):
    add_quad(tris, v1[0], v1[1], v2[1], v2[0]) # 右侧壁
    add_quad(tris, v1[1], v1[2], v2[2], v2[1]) # 右前立角倒角面
    add_quad(tris, v1[2], v1[3], v2[3], v2[2]) # 前立面
    add_quad(tris, v1[3], v1[4], v2[4], v2[3]) # 左前立角倒角面
    add_quad(tris, v1[4], v1[5], v2[5], v2[4]) # 左侧壁
    
    # 4. 顶部 45° 倒角斜面 (Z2 -> Z3):
    add_quad(tris, v2[0], v2[1], v3[1], v3[0]) # 右侧顶倒角
    add_quad(tris, v2[1], v2[2], v3[2], v3[1]) # 右前顶倒角
    add_quad(tris, v2[2], v2[3], v3[3], v3[2]) # 前沿顶倒角
    add_quad(tris, v2[3], v2[4], v3[4], v3[3]) # 左前顶倒角
    add_quad(tris, v2[4], v2[5], v3[5], v3[4]) # 左侧顶倒角
    
    # 5. 顶面 (+Z 法向, Z = z3):
    add_quad(tris, v3[0], v3[1], v3[4], v3[5])
    add_quad(tris, v3[1], v3[2], v3[3], v3[4])
    
    # 6. 后表面 (-Y 法向, Y = y_back):
    add_quad(tris, v0[0], v1[0], v1[5], v0[5]) # 下倒角段
    add_quad(tris, v1[0], v2[0], v2[5], v1[5]) # 直立段
    add_quad(tris, v2[0], v3[0], v3[5], v2[5]) # 上倒角段
    
    return tris

def gen_switch_cap(z_knob=7.00, z_flange=3.65):
    tris = []
    # 尺寸参数根据用户最新指示精修 (手摸的地方Z轴加厚到7mm + 碰触背盖防脱 + 手摸处拓宽到1.5mm):
    # 1. 内侧防脱法兰基座 (全宽 7.6mm, 厚 2.0mm, 全高 3.65mm, 居中配置 Z in [1.675, 5.325]):
    # 坐落于中框滑槽底座 Z=2.0，顶面达 Z=5.65mm，与背盖压块 Z=5.70mm 紧密贴合 (留 0.05mm 丝滑游隙，完美碰触背盖防脱防晃):
    # 针对 1.5x1.5mm 开关方柄，设 1.8mm 宽开放式导向插槽 (柄槽开放式，方便方柄卡入与顺滑拨动，绝不顶死):
    z_flange_bot = (z_knob - z_flange) / 2.0   # 1.675mm
    z_flange_top = z_flange_bot + z_flange     # 5.325mm
    z_slot_height = 2.75                       # 内部净高 2.75mm
    z_roof_bot = z_flange_bot + z_slot_height  # 4.425mm
    
    # (a) 左翼法兰: X in [-3.8, -0.9], Y in [-2.0, 0.0], Z in [z_flange_bot, z_flange_top]
    tris.extend(make_box(-3.8, -0.9, -2.0, 0.0, z_flange_bot, z_flange_top))
    # (b) 右翼法兰: X in [0.9, 3.8], Y in [-2.0, 0.0], Z in [z_flange_bot, z_flange_top]
    tris.extend(make_box(0.9, 3.8, -2.0, 0.0, z_flange_bot, z_flange_top))
    # (c) 方槽前止推挡板 (贴颈部): X in [-0.9, 0.9], Y in [-0.3, 0.0], Z in [z_flange_bot, z_flange_top]
    tris.extend(make_box(-0.9, 0.9, -0.3, 0.0, z_flange_bot, z_flange_top))
    # (d) 方槽顶封盖: X in [-0.9, 0.9], Y in [-2.0, -0.3], Z in [z_roof_bot, z_flange_top]
    tris.extend(make_box(-0.9, 0.9, -2.0, -0.3, z_roof_bot, z_flange_top))
    
    # (e) 向背板方向增高的防脱卡位翼脚 (Z in [0.85, z_flange_bot], 深入背盖内侧防脱凹槽，完全锁死卡住，防掉):
    # 左延伸翼:
    tris.extend(make_box(-3.5, -0.9, -2.0, 0.0, 0.85, z_flange_bot))
    # 右延伸翼:
    tris.extend(make_box(0.9, 3.5, -2.0, 0.0, 0.85, z_flange_bot))
    # 中前止推延伸:
    tris.extend(make_box(-0.9, 0.9, -0.5, 0.0, 0.85, z_flange_bot))
    # 注意: Y in [-2.0, -0.3], Z in [z_flange_bot, z_roof_bot] 保持彻底开放 (开放式方柄槽，方便装配卡合，零深度干涉)
    
    # 2. 中间跨壁滑动颈部 (宽 4.8mm, 跨壁厚 2.50mm[中框外壁厚2.50mm], 高 3.45mm, X in [-2.4, 2.4], Y in [0.0, 2.50], Z in [1.775, 5.225]):
    z_neck_bot = z_flange_bot + 0.10
    z_neck_top = z_flange_top - 0.10
    tris.extend(make_box(-2.4, 2.4, 0.0, 2.50, z_neck_bot, z_neck_top))
    
    # 3. 外侧指尖手摸拨头 (手摸的地方Z轴加厚到 7.0mm! 拓宽到 1.50mm! 宽度 8.6mm, 全高 7.00mm, Y in [2.50, 4.00]):
    # 全方位上下对称 45° 倒角 (0.60x0.60mm) + 左右立角 0.8mm 45° 倒角:
    tris.extend(make_symmetric_chamfered_knob(x_half=4.3, y_back=2.50, y_front=4.00, z_min=0.0, z_max=z_knob, c_corner=0.8, c_top_bot=0.6))
    
    # 4. 外立面 4 道高触感防滑梯形导角竖纹 (Y in [4.00, 4.25], Z in [0.8, 6.2], 上下斜坡平缓收口):
    for rx in [-2.4, -0.8, 0.8, 2.4]:
        tris.extend(make_trapezoid_ridge_sym(rx, y_base=4.00, y_crest=4.25, z_min=0.8, z_max=6.2, z_slope=0.4, w_base=0.6, w_crest=0.35))
        
    return tris

# -----------------------------------------------------------------------------
# 3. 外壳前框 (Front Frame - 上下右边距严格恒等于 6.90mm! 同心沉台与四角螺母柱)
# -----------------------------------------------------------------------------
def gen_case_front():
    tris = []
    outer = make_rounded_rect_2d(103.0, 74.0, 10.0, 16)
    window = make_rounded_rect_2d(82.2, 60.2, 4.5, 16, cx_off=3.5, cy_off=0.0)
    # 第一层 (Z: 0.0 ~ 1.2mm): 前框视窗面板 (上下右三边等宽 6.90mm)
    tris.extend(extrude_prism_with_holes(outer, [window], 0.0, 1.2))
    
    pocket = make_rounded_rect_2d(93.0, 64.0, 5.0, 16)
    screw_holes = []
    for sx in [-46.80, 46.80]:
        for sy in [-32.30, 32.30]:
            screw_holes.append(make_circle_2d(sx, sy, 1.45, 12))
            
    # 第二层 (Z: 1.2 ~ 3.8mm): 93.0x64.0mm 屏幕容纳沉台 + 4角螺母柱
    tris.extend(extrude_prism_with_holes(outer, [pocket] + screw_holes, 1.2, 3.8))
    
    # 盲孔底面封底 (Z: 0.8 ~ 1.2mm, 确保前框正面完整无穿孔)
    for sx in [-46.80, 46.80]:
        for sy in [-32.30, 32.30]:
            c_pts = make_circle_2d(sx, sy, 1.45, 12)
            tris.extend(extrude_prism_with_holes(c_pts, [], 0.8, 1.2))
            
    return tris

# -----------------------------------------------------------------------------
# 4. 外壳中框 (Middle Frame - 中央2cm排线防折大空间 + 3.5mm紧贴外壁细槽 + 零元件重叠)
# -----------------------------------------------------------------------------
def make_lanyard_wall(x1=-51.5, x2=-46.5, y1=-8.0, y2=8.0, z1=0.8, z2=7.2, n_segs=12):
    # 外侧侧壁 x in [x1, xm] 带有2个直径 1.5mm 的挂绳穿线孔 (y=-3.0 与 y=+3.0, z=3.6)
    # 内侧侧壁 x in [xm, x2] 带有贯通的挂绳掉头回路凹槽 (y in [-4.5, 4.5], z in [2.1, 5.1])
    tris = []
    xm = -48.5
    
    # 双挂绳孔: 直径 1.5mm (r=0.75), 间距 6.0mm
    h1 = make_circle_2d(-3.0, 3.6, 0.75, n_segs)
    h2 = make_circle_2d( 3.0, 3.6, 0.75, n_segs)
    
    outer_box_yz = [(y1, z1), (y2, z1), (y2, z2), (y1, z2)]
    all_pts_yz, face_tris = triangulate_2d_with_holes(outer_box_yz, [h1, h2])
    
    # 外侧部分 (x in [x1, xm])
    for i1, i2, i3 in face_tris:
        p1 = (x1, all_pts_yz[i1, 0], all_pts_yz[i1, 1])
        p2 = (x1, all_pts_yz[i2, 0], all_pts_yz[i2, 1])
        p3 = (x1, all_pts_yz[i3, 0], all_pts_yz[i3, 1])
        tris.append(((-1, 0, 0), p1, p3, p2))
    for i1, i2, i3 in face_tris:
        p1 = (xm, all_pts_yz[i1, 0], all_pts_yz[i1, 1])
        p2 = (xm, all_pts_yz[i2, 0], all_pts_yz[i2, 1])
        p3 = (xm, all_pts_yz[i3, 0], all_pts_yz[i3, 1])
        tris.append(((1, 0, 0), p1, p2, p3))
        
    add_quad(tris, (x1, y1, z1), (xm, y1, z1), (xm, y2, z1), (x1, y2, z1))
    add_quad(tris, (x1, y1, z2), (x1, y2, z2), (xm, y2, z2), (xm, y1, z2))
    add_quad(tris, (x1, y1, z1), (x1, y1, z2), (xm, y1, z2), (xm, y1, z1))
    add_quad(tris, (x1, y2, z1), (xm, y2, z1), (xm, y2, z2), (x1, y2, z2))
    
    # 2个穿线通道内部圆柱曲面
    for hole in [h1, h2]:
        nc = len(hole)
        for i in range(nc):
            nxt = (i + 1) % nc
            p1 = (x1, hole[i][0], hole[i][1])
            p2 = (x1, hole[nxt][0], hole[nxt][1])
            p1_far = (xm, hole[i][0], hole[i][1])
            p2_far = (xm, hole[nxt][0], hole[nxt][1])
            add_quad(tris, p1, p2, p2_far, p1_far)
            
    # 内侧掉头槽部分 (x in [xm, x2]): y in [-4.5, 4.5], z in [2.1, 5.1]
    pocket_yz = [(-4.5, 2.1), (4.5, 2.1), (4.5, 5.1), (-4.5, 5.1)]
    all_pts_in, face_tris_in = triangulate_2d_with_holes(outer_box_yz, [pocket_yz])
    
    for i1, i2, i3 in face_tris_in:
        p1 = (xm, all_pts_in[i1, 0], all_pts_in[i1, 1])
        p2 = (xm, all_pts_in[i2, 0], all_pts_in[i2, 1])
        p3 = (xm, all_pts_in[i3, 0], all_pts_in[i3, 1])
        tris.append(((-1, 0, 0), p1, p3, p2))
    for i1, i2, i3 in face_tris_in:
        p1 = (x2, all_pts_in[i1, 0], all_pts_in[i1, 1])
        p2 = (x2, all_pts_in[i2, 0], all_pts_in[i2, 1])
        p3 = (x2, all_pts_in[i3, 0], all_pts_in[i3, 1])
        tris.append(((1, 0, 0), p1, p2, p3))
        
    add_quad(tris, (xm, y1, z1), (x2, y1, z1), (x2, y2, z1), (xm, y2, z1))
    add_quad(tris, (xm, y1, z2), (xm, y2, z2), (x2, y2, z2), (x2, y1, z2))
    add_quad(tris, (xm, y1, z1), (xm, y1, z2), (x2, y1, z2), (x2, y1, z1))
    add_quad(tris, (xm, y2, z1), (x2, y2, z1), (x2, y2, z2), (xm, y2, z2))
    
    for i in range(4):
        nxt = (i + 1) % 4
        p1 = (xm, pocket_yz[i][0], pocket_yz[i][1])
        p2 = (xm, pocket_yz[nxt][0], pocket_yz[nxt][1])
        p1_far = (x2, pocket_yz[i][0], pocket_yz[i][1])
        p2_far = (x2, pocket_yz[nxt][0], pocket_yz[nxt][1])
        add_quad(tris, p1, p2, p2_far, p1_far)
        
    return tris

def make_lanyard_wall_y(x1=-8.0, x2=8.0, y1=-37.0, y2=-32.0, z1=0.8, z2=7.2, n_segs=12):
    # 开关对面底壁 (-Y) 居中双挂绳孔
    # 外侧侧壁 y in [y1, ym] 带有2个直径 1.5mm 的挂绳穿线孔 (x=-3.0 与 x=+3.0, z=3.6)
    # 内侧侧壁 y in [ym, y2] 带有贯通的挂绳掉头回路凹槽 (x in [-4.5, 4.5], z in [2.1, 5.1])
    tris = []
    ym = -34.0
    
    # 双挂绳孔: 直径 1.5mm (r=0.75), 间距 6.0mm
    h1 = make_circle_2d(-3.0, 3.6, 0.75, n_segs)
    h2 = make_circle_2d( 3.0, 3.6, 0.75, n_segs)
    
    outer_box_xz = [(x1, z1), (x2, z1), (x2, z2), (x1, z2)]
    all_pts_xz, face_tris = triangulate_2d_with_holes(outer_box_xz, [h1, h2])
    
    # 外侧部分 (y in [y1, ym])
    for i1, i2, i3 in face_tris:
        p1 = (all_pts_xz[i1, 0], y1, all_pts_xz[i1, 1])
        p2 = (all_pts_xz[i2, 0], y1, all_pts_xz[i2, 1])
        p3 = (all_pts_xz[i3, 0], y1, all_pts_xz[i3, 1])
        tris.append(((0, -1, 0), p1, p3, p2))
    for i1, i2, i3 in face_tris:
        p1 = (all_pts_xz[i1, 0], ym, all_pts_xz[i1, 1])
        p2 = (all_pts_xz[i2, 0], ym, all_pts_xz[i2, 1])
        p3 = (all_pts_xz[i3, 0], ym, all_pts_xz[i3, 1])
        tris.append(((0, 1, 0), p1, p2, p3))
        
    add_quad(tris, (x1, y1, z1), (x2, y1, z1), (x2, ym, z1), (x1, ym, z1))
    add_quad(tris, (x1, y1, z2), (x1, ym, z2), (x2, ym, z2), (x2, y1, z2))
    add_quad(tris, (x1, y1, z1), (x1, ym, z1), (x1, ym, z2), (x1, y1, z2))
    add_quad(tris, (x2, y1, z1), (x2, y1, z2), (x2, ym, z2), (x2, ym, z1))
    
    # 2个穿线通道内部圆柱曲面
    for hole in [h1, h2]:
        nc = len(hole)
        for i in range(nc):
            nxt = (i + 1) % nc
            p1 = (hole[i][0], y1, hole[i][1])
            p2 = (hole[nxt][0], y1, hole[nxt][1])
            p1_far = (hole[i][0], ym, hole[i][1])
            p2_far = (hole[nxt][0], ym, hole[nxt][1])
            add_quad(tris, p1, p1_far, p2_far, p2)
            
    # 内侧掉头槽部分 (y in [ym, y2]): x in [-4.5, 4.5], z in [2.1, 5.1]
    pocket_xz = [(-4.5, 2.1), (4.5, 2.1), (4.5, 5.1), (-4.5, 5.1)]
    all_pts_in, face_tris_in = triangulate_2d_with_holes(outer_box_xz, [pocket_xz])
    
    for i1, i2, i3 in face_tris_in:
        p1 = (all_pts_in[i1, 0], ym, all_pts_in[i1, 1])
        p2 = (all_pts_in[i2, 0], ym, all_pts_in[i2, 1])
        p3 = (all_pts_in[i3, 0], ym, all_pts_in[i3, 1])
        tris.append(((0, -1, 0), p1, p3, p2))
    for i1, i2, i3 in face_tris_in:
        p1 = (all_pts_in[i1, 0], y2, all_pts_in[i1, 1])
        p2 = (all_pts_in[i2, 0], y2, all_pts_in[i2, 1])
        p3 = (all_pts_in[i3, 0], y2, all_pts_in[i3, 1])
        tris.append(((0, 1, 0), p1, p2, p3))
        
    add_quad(tris, (x1, ym, z1), (x2, ym, z1), (x2, y2, z1), (x1, y2, z1))
    add_quad(tris, (x1, ym, z2), (x1, y2, z2), (x2, y2, z2), (x2, ym, z2))
    add_quad(tris, (x1, ym, z1), (x1, y2, z1), (x1, y2, z2), (x1, ym, z2))
    add_quad(tris, (x2, ym, z1), (x2, ym, z2), (x2, y2, z2), (x2, y2, z1))
    
    for i in range(4):
        nxt = (i + 1) % 4
        p1 = (pocket_xz[i][0], ym, pocket_xz[i][1])
        p2 = (pocket_xz[nxt][0], ym, pocket_xz[nxt][1])
        p1_far = (pocket_xz[i][0], y2, pocket_xz[i][1])
        p2_far = (pocket_xz[nxt][0], y2, pocket_xz[nxt][1])
        add_quad(tris, p1, p1_far, p2_far, p2)
        
    return tris

def gen_case_middle():
    tris = []
    
    # -------------------------------------------------------------------------
    # (A) 100% 确定性规整隔热底板 (Z: 0.0 ~ 0.8mm 纯平实体，无下沉凹槽)
    # -------------------------------------------------------------------------
    # 规整实体底板 (开槽严格按照用户红框: 全长细槽 X in [-41.5, -37.5], 中央2cm拓展 X in [-46.5, -41.5])
    floor_boxes = [
        # (1) 上半部底板 (X in [-37.5, 41.5], Y in [27.0, 37.0])
        (-37.5, 41.5, 27.0, 37.0, 0.0, 0.8),
        # (2) 上方实体 (X in [-41.5, -37.5], Y in [32.5, 37.0])
        (-41.5, -37.5, 32.5, 37.0, 0.0, 0.8),
        
        # (3) 中心周围底板分块 (避开中心 [-15, 15] x [-15, 15] 的 NFC 凹槽区):
        (-37.5, -15.0, -27.0, 27.0, 0.0, 0.8),   # 中心左侧
        ( 15.0,  41.5, -27.0, 27.0, 0.0, 0.8),   # 中心右侧
        (-15.0,  15.0,  15.0, 27.0, 0.0, 0.8),   # 中心上方
        (-15.0,  15.0, -27.0, -15.0, 0.0, 0.8),  # 中心下方
        ( 41.5,  51.5, -27.0, 27.0, 0.0, 0.8),   # 右侧远端
        
        # (4) 底部底板 (Y in [-37.0, -27.0]):
        (-37.5, 41.5, -37.0, -27.0, 0.0, 0.8),
        (-41.5, -37.5, -37.0, -32.5, 0.0, 0.8),
        
        # (5) 左侧排线区底板
        (-51.5, -46.5, -27.0, 27.0, 0.0, 0.8),
        (-46.5, -41.5, 10.0, 27.0, 0.0, 0.8),
        (-46.5, -41.5, -27.0, -10.0, 0.0, 0.8),
    ]
    for fb in floor_boxes:
        tris.extend(make_box(*fb))
        
    # 前置 2.5cm NFC 凹槽 (X=0, Y=0, 直径 25.5mm, 半径 12.75mm, 深度 0.5mm)
    # Z: 0.0 ~ 0.5mm 为圆形贴片沉槽，Z: 0.5 ~ 0.8mm 为 0.3mm 实体支撑底
    nfc_front_circle = make_circle_2d(0.0, 0.0, 12.75, 24)
    tris.extend(extrude_prism_with_holes([(-15.0, -15.0), (15.0, -15.0), (15.0, 15.0), (-15.0, 15.0)], [nfc_front_circle], 0.0, 0.5))
    tris.extend(make_box(-15.0, 15.0, -15.0, 15.0, 0.5, 0.8))
        
    # 四角标准凸扇区底板 (Corner Arc Sectors, R=10.0mm，含 M2 穿孔)
    corners_info = [
        (41.5, 27.0, 0.0, math.pi/2, 46.80, 32.30),           # NE corner
        (-41.5, 27.0, math.pi/2, math.pi, -46.80, 32.30),      # NW corner
        (-41.5, -27.0, math.pi, 3*math.pi/2, -46.80, -32.30),  # SW corner
        (41.5, -27.0, 3*math.pi/2, 2*math.pi, 46.80, -32.30)  # SE corner
    ]
    for cx, cy, a1, a2, sx, sy in corners_info:
        poly = [(cx, cy)]
        n_segs = 16
        for i in range(n_segs + 1):
            ang = a1 + (a2 - a1) * i / float(n_segs)
            poly.append((cx + 10.0 * math.cos(ang), cy + 10.0 * math.sin(ang)))
        hole = make_circle_2d(sx, sy, 1.30, 12)
        tris.extend(extrude_prism_with_holes(poly, [hole], 0.0, 0.8))
        
    # -------------------------------------------------------------------------
    # (B) 四周 5.0mm 坚固外壁 (Z: 0.8 ~ 7.2mm)
    # -------------------------------------------------------------------------
    # 1. 底壁 (-Y 侧, Y in [-37.0, -32.0]): 开关对面正中心双挂绳孔
    tris.extend(make_box(-41.5, -37.5, -37.0, -32.5, 0.8, 7.2))
    tris.extend(make_box(-37.5, -8.0, -37.0, -32.0, 0.8, 7.2))
    tris.extend(make_lanyard_wall_y(-8.0, 8.0, -37.0, -32.0, 0.8, 7.2, n_segs=12))
    tris.extend(make_box(8.0, 41.5, -37.0, -32.0, 0.8, 7.2))
    
    # 2. 左壁 (-X 侧, X in [-51.5, -46.5]): 排线侧正中心双挂绳孔 (直径 1.5mm, 间距 6mm, 内设回路掉头槽)
    tris.extend(make_box(-51.5, -46.5, -27.0, -8.0, 0.8, 7.2))
    tris.extend(make_lanyard_wall(-51.5, -46.5, -8.0, 8.0, 0.8, 7.2, n_segs=12))
    tris.extend(make_box(-51.5, -46.5, 8.0, 27.0, 0.8, 7.2))
    
    # 3. 右壁 (+X 侧, X in [46.5, 51.5]):
    # (a) 下段实心外壁 (Y in [-27.0, 8.0])
    tris.extend(make_box(46.5, 51.5, -27.0, 8.0, 0.8, 7.2))
    # (b) TP4056 Type-C 区域外壁削薄一半至 2.5mm (X in [49.0, 51.5], 内侧 46.5~49.0 开放供模块与C口嵌入), 含 C 口胶囊通孔 (Yc=17.0, Zc=3.6)
    tris.extend(make_capsule_wall_y(49.0, 51.5, 8.0, 26.0, 0.8, 7.2, 17.0, 3.6, 9.5, 3.6, n_segs=8))
    # (c) 上段实心过渡壁 (Y in [26.0, 27.0])
    tris.extend(make_box(46.5, 51.5, 26.0, 27.0, 0.8, 7.2))
    
    # 4. 顶壁 (+Y 侧, Y in [32.0, 37.0]):
    # (a) 直通口上方壁: X in [-41.5, -37.5]
    tris.extend(make_box(-41.5, -37.5, 32.5, 37.0, 0.8, 7.2))
    # (b) 开口至 ESP32 C口过渡段: X in [-37.5, -35.5]
    tris.extend(make_box(-37.5, -35.5, 32.0, 37.0, 0.8, 7.2))
    # (c) ESP32 C口区域外壁削薄一半至 2.5mm (Y in [34.5, 37.0], 内侧 32.0~34.5 开放供模块与C口嵌入), 含 C 口胶囊通孔: Xc=-26.25, Zc=3.6, L=9.5, H=3.6
    tris.extend(make_capsule_wall_x(-35.5, -17.0, 34.5, 37.0, 0.8, 7.2, -26.25, 3.6, 9.5, 3.6, n_segs=8))
    # (d) ESP32 至开关过渡段: X in [-17.0, 21.0]
    tris.extend(make_box(-17.0, 21.0, 32.0, 37.0, 0.8, 7.2))
    
    # (e) 边框按键滑槽与清晰可见的 'O' 和 '|' 开关标识 (X in [21.0, 36.0], Y in [32.0, 37.0]):
    # 内滑槽 (Y in [32.0, 34.5]): 宽 13.0mm (X in [22.0, 35.0]), 顶部开放至 Z=7.2mm
    tris.extend(make_box(21.0, 22.0, 32.0, 34.5, 0.8, 7.2))
    tris.extend(make_box(35.0, 36.0, 32.0, 34.5, 0.8, 7.2))
    tris.extend(make_box(22.0, 35.0, 32.0, 34.5, 0.8, 2.0))
    
    # 外滑槽基底 (Y in [34.5, 37.0]): 宽 9.0mm (X in [24.0, 33.0]), 开放至 Z=7.2mm 供按键滑动 (基底拉平至 Z=2.0 与内槽齐平，消除 0.2mm 台阶卡滞)
    tris.extend(make_box(24.0, 33.0, 34.5, 37.0, 0.8, 2.0))
    
    # 左侧外滑槽壁 (X in [21.0, 24.0], Y in [34.5, 37.0]):
    # 顶部 (Z=7.2) 雕刻清晰 'O' 凹槽 + 外立面 (Y=37.0) 雕刻清晰 'O' 凹槽 (拨向排线为关 'O'):
    # 基础段 (Z: 0.8 ~ 3.0mm)
    tris.extend(make_box(21.0, 24.0, 34.5, 37.0, 0.8, 3.0))
    # 立面雕刻段 (Z: 3.0 ~ 5.0mm): 内侧实心，外侧雕刻 0.8mm 深 'O' 凹槽
    tris.extend(make_box(21.0, 24.0, 34.5, 36.2, 3.0, 5.0))
    tris.extend(make_box(21.0, 21.7, 36.2, 37.0, 3.0, 5.0))
    tris.extend(make_box(23.3, 24.0, 36.2, 37.0, 3.0, 5.0))
    tris.extend(make_box(21.7, 23.3, 36.2, 37.0, 3.0, 3.3))
    tris.extend(make_box(21.7, 23.3, 36.2, 37.0, 4.7, 5.0))
    tris.extend(make_box(22.2, 22.8, 36.2, 37.0, 3.7, 4.3))
    # 过渡段 (Z: 5.0 ~ 6.4mm)
    tris.extend(make_box(21.0, 24.0, 34.5, 37.0, 5.0, 6.4))
    # 顶面雕刻段 (Z: 6.4 ~ 7.2mm): 顶面雕刻 0.8mm 深 'O' 凹槽 (切片俯视立即可见!)
    tris.extend(make_box(21.0, 21.7, 34.5, 37.0, 6.4, 7.2))
    tris.extend(make_box(23.3, 24.0, 34.5, 37.0, 6.4, 7.2))
    tris.extend(make_box(21.7, 23.3, 34.5, 34.9, 6.4, 7.2))
    tris.extend(make_box(21.7, 23.3, 36.6, 37.0, 6.4, 7.2))
    tris.extend(make_box(22.2, 22.8, 35.4, 36.1, 6.4, 7.2))
    
    # 右侧外滑槽壁 (X in [33.0, 36.0], Y in [34.5, 37.0]):
    # 顶部 (Z=7.2) 雕刻清晰 '|' 凹槽 + 外立面 (Y=37.0) 雕刻清晰 '|' 凹槽 (反向为开 '|'):
    # 基础段 (Z: 0.8 ~ 3.0mm)
    tris.extend(make_box(33.0, 36.0, 34.5, 37.0, 0.8, 3.0))
    # 立面雕刻段 (Z: 3.0 ~ 5.0mm): 内侧实心，外侧雕刻 0.8mm 深 '|' 凹槽
    tris.extend(make_box(33.0, 36.0, 34.5, 36.2, 3.0, 5.0))
    tris.extend(make_box(33.0, 34.2, 36.2, 37.0, 3.0, 5.0))
    tris.extend(make_box(34.8, 36.0, 36.2, 37.0, 3.0, 5.0))
    # 过渡段 (Z: 5.0 ~ 6.4mm)
    tris.extend(make_box(33.0, 36.0, 34.5, 37.0, 5.0, 6.4))
    # 顶面雕刻段 (Z: 6.4 ~ 7.2mm): 顶面雕刻 0.8mm 深 '|' 凹槽 (切片俯视立即可见!)
    tris.extend(make_box(33.0, 34.2, 34.5, 37.0, 6.4, 7.2))
    tris.extend(make_box(34.8, 36.0, 34.5, 37.0, 6.4, 7.2))
    tris.extend(make_box(34.2, 34.8, 34.5, 34.9, 6.4, 7.2))
    tris.extend(make_box(34.2, 34.8, 36.6, 37.0, 6.4, 7.2))
    
    # (f) 右实心段: X in [36.0, 41.5]
    tris.extend(make_box(36.0, 41.5, 32.0, 37.0, 0.8, 7.2))
    
    # 6. 四个圆润转角外壁扇区 (Z: 0.8 ~ 7.2mm, R_in=5.0, R_out=10.0, 含 M2 穿孔)
    for cx, cy, a1, a2, sx, sy in corners_info:
        sector_poly = []
        n_segs = 12
        for i in range(n_segs + 1):
            ang = a1 + (a2 - a1) * i / float(n_segs)
            sector_poly.append((cx + 10.0 * math.cos(ang), cy + 10.0 * math.sin(ang)))
        for i in range(n_segs, -1, -1):
            ang = a1 + (a2 - a1) * i / float(n_segs)
            sector_poly.append((cx + 5.0 * math.cos(ang), cy + 5.0 * math.sin(ang)))
            
        screw_hole = make_circle_2d(sx, sy, 1.30, 12)
        tris.extend(extrude_prism_with_holes(sector_poly, [screw_hole], 0.8, 7.2))
        
    # -------------------------------------------------------------------------
    # (C) 隔热底板上方元器件限位凹槽卡框 (Z: 0.8 ~ 4.5mm)
    # -------------------------------------------------------------------------
    # 1. ESP32-C3 SuperMini 凹槽 (宽 X 拓宽 0.5mm 至 18.5mm, X in [-35.5, -17.0]; 尾部往前推 1mm 至 Y=11.5, 深入削薄外壁至 Y=34.5)
    # 尾端出线挡板横贯连接左右限位槽全截面 (一体坚固连接，彻底消除断开不连接问题)
    # 与底层驱动板重叠段全线镂空 0.5mm (Z in [0.8, 1.3mm] 纯平悬空供驱动板滑入，切片软件自动算支撑):
    tris.extend(make_box(-37.0, -35.5, 11.5, 13.0, 1.3, 4.5))   # 左限位挡边 (重叠段底空 0.5mm)
    tris.extend(make_box(-37.0, -35.5, 13.0, 34.5, 0.8, 4.5))   # 左限位挡边 (非重叠段实心)
    tris.extend(make_box(-17.0, -15.5, 11.5, 13.0, 1.3, 4.5))   # 右隔离挡板 (重叠段底空 0.5mm)
    tris.extend(make_box(-17.0, -15.5, 13.0, 34.5, 0.8, 4.5))   # 右隔离挡板 (非重叠段实心)
    tris.extend(make_box(-37.0, -15.5, 10.7, 11.5, 1.3, 4.5))   # 尾端出线挡板横贯连接左右限位槽全截面 (一体坚固连接，底部 0.5mm 镂空悬空 Z: 1.3 ~ 4.5mm)
    
    # 2. 9x4mm 卧式微型拨动开关座 (右上: X in [23.8, 33.2], Y in [28.0, 32.0]):
    # 左右限位槽严格削薄至 0.5mm (极简限位)，尾部彻底镂空 1.4mm 供引脚/焊脚与导线出线:
    tris.extend(make_box(23.3, 23.8, 28.0, 32.0, 0.8, 4.5))     # 左限位 (严格 0.5mm 极简限位)
    tris.extend(make_box(33.2, 33.7, 28.0, 32.0, 0.8, 4.5))     # 右限位 (严格 0.5mm 极简限位)
    tris.extend(make_box(23.3, 33.7, 27.2, 28.0, 2.2, 4.5))     # 尾部防退挡板 (底部镂空 1.4mm Z in [0.8, 2.2mm] 供引脚焊脚出线)
    
    # 3. TP4056 充电板凹槽 (尾部往前推 1mm 至 X=21.0, 深入削薄外壁至 X=49.0, 宽 Y in [8.0, 26.0])
    tris.extend(make_box(19.5, 21.0, 8.0, 26.0, 0.8, 4.5))    # 尾部防退卡扣
    tris.extend(make_box(34.0, 49.0, 26.0, 27.5, 0.8, 4.5))   # 上端隔离肋 (开关区域 X < 34.0 彻底开放，确保开关引脚与导线出线通道全线贯通)
    # 下端靠近电池与驱动板过渡区完全削平开放，消除与电池干涉
    
    # 4. 663032 锂电池底板凹槽 (拓宽 1.5mm 与 2mm: X in [14.5, 46.5], Y in [-32.5, 3.0])
    # 彻底削去与驱动板插口重叠部分及靠近TP4056的限位槽，驱动板先入底，电池胶粘叠在上方:
    tris.extend(make_box(13.2, 14.5, -32.5, -15.0, 0.8, 2.0)) # 靠排线侧底部导引 (-X, 避开驱动板正中区域)
    tris.extend(make_box(14.5, 46.5, -33.5, -32.5, 0.8, 3.5)) # 下边界限位 (-Y)
    
    # 5. FPC 驱动板严格居中限位与底部暂留插口通道:
    # (a) 驱动板严格居中在正中间 (左右距屏幕主体均为 2.0cm, 宽 24.5mm 含 0.5mm 公差: Y in [-12.25, 12.25])
    # 位于最底层 (Z: 0.8 ~ 2.0mm)，导轨高度 1.2mm
    tris.extend(make_box(-34.0, 6.0, -13.5, -12.25, 0.8, 2.0))  # 下导轨限位
    tris.extend(make_box(-17.0, 6.0, 12.25, 13.5, 0.8, 2.0))   # 上导轨限位 (ESP32重叠区 X < -17.0 保持纯平开放供滑动)
    # 靠近屏幕排线一侧 (-X 侧) 完全移除突出限位槽，排线入口保持绝对纯平顺畅无阻碍
    
    # (b) 尾部中央 0.6mm 厚 FPC 暂留扁平插口通道 (沿中央 Y in [-5.0, 5.0], X in [6.0, 49.0] 彻底贯通到底)
    # 此区域在底层保持绝对纯平开放，两侧元件可在其上方轻微重叠跨越
    
    return tris

# -----------------------------------------------------------------------------
# -----------------------------------------------------------------------------
# 5. 外壳背板标准净版 (case_back.stl - 1.0mm 超薄后盖 + 电池仓 0.5mm 凹槽(带R7圆角) + 正中2cm NFC贴片凹槽 + 正中正方形对称4处边缘隆起磁铁座 + C口/按键卡位突起)
# -----------------------------------------------------------------------------
def make_battery_polygon(r_fillet=7.0, n_arc=12):
    pts = []
    # 底边缘: (14.5, -4.0) 至 (46.5, -4.0)
    for x in np.linspace(14.5, 46.5, 17):
        pts.append((round(float(x), 4), -4.0))
    # 右边缘直边: (46.5, -4.0) 至 (46.5, 25.0)
    for y in np.linspace(-4.0, 25.0, 15)[1:]:
        pts.append((46.5, round(float(y), 4)))
    # 右下角 R=7.0mm 优雅圆角:
    cx = 46.5 - r_fillet
    cy = 32.0 - r_fillet
    for i in range(1, n_arc + 1):
        ang = (math.pi/2) * i / float(n_arc)
        x = cx + r_fillet * math.cos(ang)
        y = cy + r_fillet * math.sin(ang)
        pts.append((round(x, 4), round(y, 4)))
    # 顶边缘: (39.5, 32.0) 至 (14.5, 32.0)
    for x in np.linspace(39.5, 14.5, 13)[1:]:
        pts.append((round(float(x), 4), 32.0))
    # 左边界直边 (严格隔断 X=14.5 实体壁面，防止 Delaunay 跨壁穿透):
    for y in np.linspace(32.0, -4.0, 19)[1:-1]:
        pts.append((14.5, round(float(y), 4)))
        
    cleaned = [pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0]-cleaned[-1][0], p[1]-cleaned[-1][1]) > 1e-4:
            cleaned.append(p)
    return cleaned

def gen_case_back(with_branding=False):
    tris = []
    outer = make_rounded_rect_2d(103.0, 74.0, 10.0, 16)
    
    # 4 颗 M2 沉头螺丝通孔 (孔径 2.4mm, 沉头孔 4.4mm 沉入 0.5mm)
    screw_holes_through = []
    screw_holes_sink = []
    for sx in [-46.80, 46.80]:
        for sy in [-32.30, 32.30]:
            screw_holes_through.append(make_circle_2d(sx, sy, 1.20, 12))
            screw_holes_sink.append(make_circle_2d(sx, sy, 2.20, 12))
            
    # 4 处正中央严格正方形对称磁铁座 (中心点连成 21x21mm 正方形, 对称在 NFC 圆形贴片外围 4 个角 (+-10.5, +-10.5), 直径 6.2mm, Z: 0.25 ~ 1.0mm, 底壁保留0.25mm超薄外皮)
    mag_coords = [(-10.5, -10.5), (-10.5, 10.5), (10.5, -10.5), (10.5, 10.5)]
    magnet_holes = [make_circle_2d(mx, my, 3.10, 16) for mx, my in mag_coords]
    
    # 正中央 2cm NFC 贴片圆形凹槽 (直径 20.0mm + 0.5mm 公差 = 20.5mm -> 半径 10.25mm, 深度 0.5mm, 底壁保留 0.5mm 实体)
    # 屏幕排线半面中心 2.5cm NFC 贴片凹槽 (X=-25.75, Y=0.0, 直径 25.5mm, 半径 12.75mm, 深 0.5mm)
    nfc_circle = make_circle_2d(-25.75, 0.0, 12.75, 32)
        
    # 电池仓 0.5mm 深度内凹沉槽多边形 (从内表面 Z=1.0 下沉挖至 Z=0.5，底板保留 0.5mm 实体外皮)
    # 右下角带 R=7.0mm 优雅圆角，完美贴合外框圆角并避让 M2 螺栓沉孔:
    battery_poly = make_battery_polygon(r_fillet=7.0, n_arc=12)
    
    # 定制文字雕刻嵌板凹槽 (避让中央 NFC 与磁铁区域，移至 Y in [-29.5, -16.5], 居中于下部黄金比例区):
    pocket_box = [(-18.5, -29.5), (18.5, -29.5), (18.5, -16.5), (-18.5, -16.5)]
    
    if with_branding:
        # 第一层 (Z: 0.0 ~ 0.25mm): 沉头孔 + 铭牌字槽孔 (磁铁底皮封闭)
        tris.extend(extrude_prism_with_holes(outer, screw_holes_sink + [pocket_box], 0.0, 0.25))
        # 第二层 (Z: 0.25 ~ 0.50mm): 沉头孔 + 4颗磁铁孔开始下陷 + 铭牌字槽孔 (电池仓与NFC区在此层仍为实体外皮)
        tris.extend(extrude_prism_with_holes(outer, screw_holes_sink + magnet_holes + [pocket_box], 0.25, 0.50))
        # 第三层 (Z: 0.50 ~ 1.00mm): 螺丝通孔 + 磁铁孔 + NFC圆形沉槽 + 电池仓圆角沉槽 (文字区在此完全封底为 0.5mm 实体底板)
        tris.extend(extrude_prism_with_holes(outer, screw_holes_through + magnet_holes + [nfc_circle, battery_poly], 0.50, 1.00))
        
        # 凹槽文字嵌板: 嵌入 Z in [0.0, 0.50mm], 生成 0.5mm 深真凹槽字 (挖凹槽字)
        loops = get_text_loops("Made by", size=3.2, cx=0.0, cy=-19.5, weight='medium')
        loops += get_text_loops("ZGQ Inc.", size=6.5, cx=0.0, cy=-25.5, weight='bold')
        tris.extend(gen_debossed_letters_mesh(loops, -18.5, 18.5, -29.5, -16.5, 0.0, 0.50))
    else:
        # 标准净版背板:
        # 第一层 (Z: 0.0 ~ 0.25mm): 完全实心外皮，仅带 4.4mm 沉头孔
        tris.extend(extrude_prism_with_holes(outer, screw_holes_sink, 0.0, 0.25))
        # 第二层 (Z: 0.25 ~ 0.50mm): 4.4mm 沉头孔 + 4颗磁铁孔开始下陷 (电池仓与NFC区在此层仍为实体外皮)
        tris.extend(extrude_prism_with_holes(outer, screw_holes_sink + magnet_holes, 0.25, 0.50))
        # 第三层 (Z: 0.50 ~ 1.00mm): 螺丝通孔 + 4颗磁铁孔 + NFC圆形沉槽 + 电池仓圆角沉槽
        tris.extend(extrude_prism_with_holes(outer, screw_holes_through + magnet_holes + [nfc_circle, battery_poly], 0.50, 1.00))
    
    # -------------------------------------------------------------------------
    # (B) 4 处磁铁座边缘隆起 (自 Z=1.0mm 隆起 0.45mm 至 Z=1.45mm，外径 7.8mm，内径 6.2mm，总深 1.20mm 稳妥固定磁铁)
    # -------------------------------------------------------------------------
    for mx, my in mag_coords:
        c_out = make_circle_2d(mx, my, 3.90, 16)
        c_in = make_circle_2d(mx, my, 3.10, 16)
        tris.extend(extrude_prism_with_holes(c_out, [c_in], 1.00, 1.45))
        
    # -------------------------------------------------------------------------
    # (C) 背板内侧严丝合缝卡位突起 (从基板内表面 Z: 1.0mm 向中框内腔延伸，精确抵住C口与按钮)
    # -------------------------------------------------------------------------
    # 1. 开关外移限位肋与防脱凹槽 (外移到边缘，内侧留出防脱凹槽，卡死按钮绝不脱落):
    # 外侧边缘限位立柱 (外移至 Yb in [-36.2, -34.0], 高度 1.5mm, Z: 1.0 ~ 2.5mm)
    tris.extend(make_box(23.5, 33.5, -36.2, -34.0, 1.0, 2.5))
    # 靠内侧那一边挖个凹槽 (Yb in [-34.0, -32.2] 留空作为卡位凹槽，深度 1.5mm，容纳按钮向背板增高的翼脚卡入)
    # 开关本体压块: Xb in [24.0, 33.0], Yb in [-32.2, -28.4], 高 2.2mm (Z: 1.0 ~ 3.2mm)
    tris.extend(make_box(24.0, 33.0, -32.2, -28.4, 1.0, 3.2))
    
    # 2. ESP32-C3 Type-C 抵紧块 (翻转至 -X 侧，宽 5mm 抵住 C 口，距磁铁 >7.0mm，彻底避让磁铁):
    # Xb in [-31.5, -21.0], Yb in [-34.5, -29.5], 高 2.2mm (Z: 1.0 ~ 3.2mm)
    tris.extend(make_box(-31.5, -21.0, -34.5, -29.5, 1.0, 3.2))
    
    # 3. TP4056 Type-C 抵紧块 (翻转至 +X 侧，宽 5mm 抵住 C 口，距磁铁 >11.0mm，彻底避让磁铁):
    # Xb in [44.0, 49.0], Yb in [-22.5, -11.5], 高 2.4mm (Z: 1.0 ~ 3.4mm)
    tris.extend(make_box(44.0, 49.0, -22.5, -11.5, 1.0, 3.4))
    
    # 4. 驱动板限位槽: 完全移除 (零凸起，消除干涉)
    # 5. 电池限位槽: 完全移除 (零凸起，消除挤压干涉风险)
    
    return tris

def generate_openscad_source():
    scad_code = """// 3.98英寸 4色墨水屏 手机造型外壳 终极定型版 V21
// 架构: [前框 (等边距6.9mm视窗+螺母盲孔柱)] + [中框 (实心隔热板+平整开关滑槽基底Z=2.0+IEC开闭标识)] + [背板 (1.0mm超薄+1.5mm开关贴合限位块+0.5mm圆角电池槽+2cm NFC贴片槽+正方形4隆起磁铁座)] + [背板定制副本 (凹槽立体小字Made by/大字ZGQ Inc.)] + [按键套子 (开放式拨柄插槽+手摸处拓宽至1.5mm+全高增厚0.5mm至3.65mm碰触背盖+上下对称45°双倒角+4道防滑竖纹)]
// 视窗: 82.2 x 60.2mm, X偏置 +3.5mm, 上边距=下边距=右边距=严格恒等于 6.90mm！
// 驱动板槽: 完美匹配 39.24x24.26mm + 11.94x20.86mm Gerber 板！

$fn = 40;

case_w = 103.0;
case_h = 74.0;
case_r = 10.0;

module rounded_rect_2d(w, h, r) {
    hull() {
        translate([ w/2 - r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r, -h/2 + r]) circle(r=r);
        translate([ w/2 - r, -h/2 + r]) circle(r=r);
    }
}

// 1. 前框
module case_front() {
    difference() {
        linear_extrude(height = 3.8)
            rounded_rect_2d(case_w, case_h, case_r);
        translate([3.5, 0, -1])
            linear_extrude(height = 2.4)
                rounded_rect_2d(82.2, 60.2, 4.5);
        translate([0, 0, 1.2])
            linear_extrude(height = 3.0)
                rounded_rect_2d(93.0, 64.0, 5.0);
        // 4角 M2 螺母盲孔 (Z: 1.2 ~ 3.8)
        for (sx = [-46.80, 46.80]) {
            for (sy = [-32.30, 32.30]) {
                translate([sx, sy, 1.2])
                    cylinder(h = 2.8, r = 1.45);
            }
        }
    }
}

// 2. 中框
module case_middle() {
    difference() {
        linear_extrude(height = 7.2)
            rounded_rect_2d(case_w, case_h, case_r);
        // 内腔挖空
        translate([0, 0, 0.8])
            linear_extrude(height = 6.5)
                rounded_rect_2d(case_w - 10.0, case_h - 10.0, 5.0);
        // 墨水屏与排线穿过镂空 (严格按红框定位):
        // (a) 全长穿屏细槽 (长 65.0mm, 宽 4.0mm, 零元件重叠)
        translate([-39.5, 0, -1])
            cube([4.0, 65.0, 3.0], center = true);
        // (b) 中央 2cm 排线防折大空间 (长 20.0mm, 宽 5.0mm, 直通外壁)
        translate([-44.0, 0, -1])
            cube([5.0, 20.0, 3.0], center = true);
        // 4角 M2 通孔
        for (sx = [-46.80, 46.80]) {
            for (sy = [-32.30, 32.30]) {
                translate([sx, sy, -1])
                    cylinder(h = 10.0, r = 1.30);
            }
        }
        // 顶开按键槽
        translate([28.5, 34.5, 4.6])
            cube([9.0, 3.0, 5.4], center = true);
        // ESP32 Type-C 跑道通孔
        translate([-26.0, 34.5, 3.6])
            rotate([90, 0, 0])
                hull() {
                    translate([-2.9, 0, 0]) cylinder(h=6.0, r=1.75, center=true);
                    translate([ 2.9, 0, 0]) cylinder(h=6.0, r=1.75, center=true);
                }
        // TP4056 Type-C 跑道通孔
        translate([49.0, 17.0, 3.6])
            rotate([0, 90, 0])
                hull() {
                    translate([0, -2.9, 0]) cylinder(h=6.0, r=1.75, center=true);
                    translate([0,  2.9, 0]) cylinder(h=6.0, r=1.75, center=true);
                }
        // 开关标识: 靠排线方向为关 'O', 反之为开 '|' (顶部边缘与垂直外立面均雕刻)
        translate([22.5, 35.75, 6.4])
            linear_extrude(height = 0.81)
                text("O", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([34.5, 35.75, 6.4])
            linear_extrude(height = 0.81)
                text("|", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([22.5, 37.01, 4.0])
            rotate([90, 0, 0])
                linear_extrude(height = 0.81)
                    text("O", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([34.5, 37.01, 4.0])
            rotate([90, 0, 0])
                linear_extrude(height = 0.81)
                    text("|", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        // 前中框居中 2.5cm NFC 贴片槽 (直径 25.5mm, 深度 0.5mm, Z: -0.01 ~ 0.50)
        translate([0, 0, -0.01])
            cylinder(h = 0.51, r = 12.75);
        // 屏幕FPC一侧居中双挂绳孔 (直径 1.5mm, 间距 6mm, Z=3.6, 左外壁向内通孔)
        translate([-49.0, -3.0, 3.6])
            rotate([0, 90, 0])
                cylinder(h = 7.0, r = 0.75, center = true);
        translate([-49.0,  3.0, 3.6])
            rotate([0, 90, 0])
                cylinder(h = 7.0, r = 0.75, center = true);
        // 挂绳内侧穿绳导向引线槽 (长 9mm, 高 3mm, 深 3mm)
        translate([-47.5, 0, 3.6])
            cube([3.0, 9.0, 3.0], center = true);
        // 开关对面(下外壁 -Y)居中双挂绳孔 (直径 1.5mm, 间距 6mm, Z=3.6, 下外壁向内通孔)
        translate([-3.0, -34.5, 3.6])
            rotate([90, 0, 0])
                cylinder(h = 7.0, r = 0.75, center = true);
        translate([ 3.0, -34.5, 3.6])
            rotate([90, 0, 0])
                cylinder(h = 7.0, r = 0.75, center = true);
        // 下侧挂绳内侧穿绳导向引线槽 (长 9mm, 高 3mm, 深 3mm)
        translate([0, -33.0, 3.6])
            cube([9.0, 3.0, 3.0], center = true);
    }
}

// 3. 标准净版背板 (case_back) - 1.0mm 超薄后盖 + 电池仓 0.5mm 凹槽(带R7圆角) + 正中2cm NFC贴片凹槽 + 4处边缘隆起磁铁座
module case_back() {
    difference() {
        linear_extrude(height = 1.0)
            rounded_rect_2d(case_w, case_h, case_r);
        // 电池仓 0.5mm 深度内凹沉槽 (从内表面 Z=1.0 下沉挖至 Z=0.5，底板保留 0.5mm 实体外皮，右下角 R7 优雅圆角)
        translate([0, 0, 0.5])
            linear_extrude(height = 0.51)
                hull() {
                    translate([14.5, -4.0]) square([25.0, 36.0]);
                    translate([14.5, -4.0]) square([32.0, 29.0]);
                    translate([39.5, 25.0]) circle(r=7.0);
                }
        // 正中央 2cm NFC 贴片圆形凹槽 (直径 20.5mm, 半径 10.25mm, 深度 0.5mm, Z: 0.5 ~ 1.01)
        translate([0, 0, 0.5])
            // 屏幕排线侧半面中心 2.5cm NFC 凹槽 (X=-25.75, Y=0.0, 直径 25.5mm, 深 0.5mm)
        translate([-25.75, 0, 0.5]) cylinder(h = 0.51, r = 12.75);
        // 4角 M2 沉头螺栓孔
        for (sx = [-46.80, 46.80]) {
            for (sy = [-32.30, 32.30]) {
                translate([sx, sy, -0.1]) cylinder(h = 1.2, r = 1.2);
                translate([sx, sy, -0.1]) cylinder(h = 0.5, r = 2.2);
            }
        }
        // 4 处正中央严格正方形对称磁铁座盲孔 ((+-10.5, +-10.5), 孔径 6.2mm, 半径 3.1mm, Z: 0.25 ~ 1.01, 底壁留 0.25mm 超薄高透磁外皮)
        for (mx = [-10.5, 10.5]) {
            for (my = [-10.5, 10.5]) {
                translate([mx, my, 0.25]) cylinder(h = 0.76, r = 3.1);
            }
        }
    }
    // 4 处磁铁座边缘隆起 (从 Z=1.0 隆起 0.45mm 至 Z=1.45mm，外径 7.8mm，内径 6.2mm，总深 1.20mm 稳妥固定磁铁)
    for (mx = [-10.5, 10.5]) {
        for (my = [-10.5, 10.5]) {
            translate([mx, my, 1.0])
                difference() {
                    cylinder(h = 0.45, r = 3.9);
                    translate([0, 0, -0.01]) cylinder(h = 0.47, r = 3.1);
                }
        }
    }
    // 内侧按键防脱卡舌与 C口压块 (从基板内表面 Z: 1.0mm 向中框内腔延伸，精确抵住C口与按钮)
    // 内侧按键防脱卡舌与 C口压块 (从基板内表面 Z: 1.0mm 向中框内腔延伸，精确抵住C口与按钮)
    // 1. 开关压块 (高度 1.5mm, 探至中框 Z=5.7mm 与 3.65mm 开关套子紧密贴合限位)
    // (a) 外侧边缘限位立柱 (外移至边缘 Yb in [-36.2, -34.0], 高度 1.5mm, Z: 1.0 ~ 2.5mm)
    translate([28.5, -35.1, 1.75]) cube([10.0, 2.2, 1.5], center = true);
    // (b) 靠内侧留出防脱凹槽 (Yb in [-34.0, -32.2] 留空作为卡位凹槽，容纳按钮向背板增高的翼脚卡入)
    // (c) 开关本体压块 (Yb in [-32.2, -28.4], 高度 2.2mm, Z: 1.0 ~ 3.2mm)
    translate([28.5, -30.3, 2.1])   cube([9.0, 3.8, 2.2], center = true);
    // 2. ESP32 C口压块 (宽 5mm 抵住 C 口，彻底避开磁铁)
    translate([-26.25, -32.0, 2.1]) cube([10.5, 5.0, 2.2], center = true);
    // 3. TP4056 C口压块 (宽 5mm 抵住 C 口，彻底避开磁铁)
    translate([46.5, -17.0, 2.2])   cube([5.0, 11.0, 2.4], center = true);
    // 4. 驱动板与电池限位槽已完全移除 (零凸起，消除挤压干涉)
}

// 4. 定制带铭牌背板副本 (case_back_logo - 外表面直接雕刻 0.50mm 深凹槽字 "Made by ZGQ Inc.")
module case_back_logo() {
    difference() {
        case_back();
        // 外表面直接挖 0.50mm 凹槽字 (背面为 Z=0 处，向内凹进 0.50mm，已避让中央 NFC 与磁铁区域)
        translate([0, -19.5, -0.01])
            linear_extrude(height = 0.51)
                text("Made by", size = 3.2, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([0, -25.5, -0.01])
            linear_extrude(height = 0.51)
                text("ZGQ Inc.", size = 6.5, font = "Arial:style=Bold", halign = "center", valign = "center");
    }
}

// 5. 侧边框滑动按键 (switch_cap - 指按处Z加厚7.0mm + 拨扣1.50mm长 + 全长0.5mm卡脚3.65mm高 + 上下对称45度双倒角 + 防掉凸块 + 4道防滑齿)
module switch_cap() {
    union() {
        // (a) 内部 T 型防脱滑块 (全长 7.6mm, 宽 2.0mm, 全长 3.65mm, Z: 1.675 ~ 5.325, 内嵌 1.8mm 拔销口)
        difference() {
            union() {
                translate([0, -1.0, 3.50])
                    cube([7.6, 2.0, 3.65], center = true);
                // 向背板方向延展的防脱卡位凸块 (加高卡住后盖限位槽，Z: 0.85 ~ 1.675mm)
                translate([0, -1.0, 1.2625])
                    cube([7.0, 2.0, 0.825], center = true);
            }
            // 开关插销插孔: 宽 1.8mm, 深 1.7mm, 高 2.75mm
            translate([0, -1.15, 3.05])
                cube([1.8, 1.72, 2.76], center = true);
        }
        // (b) 中间滑动颈 (宽 4.8mm, 穿过中框滑动槽, Y: 0 ~ 2.5mm, Z: 1.775 ~ 5.225)
        translate([0, 1.25, 3.50])
            cube([4.8, 2.5, 3.45], center = true);
        // (c) 拨动指按头 (外露指按长度 1.50mm: Y in [2.50, 4.00], 宽 8.6mm, 全高 7.00mm)
        translate([0, 3.25, 3.50])
            cube([8.6, 1.50, 7.00], center = true);
        // (d) 4 道微米防滑齿 (防滑手感, Y: 4.00 ~ 4.25, 高度 5.4mm)
        for (rx = [-2.4, -0.8, 0.8, 2.4]) {
            hull() {
                translate([rx, 4.00, 3.50]) cube([0.60, 0.01, 5.40], center = true);
                translate([rx, 4.25, 3.50]) cube([0.35, 0.01, 4.60], center = true);
            }
        }
    }
}


// -----------------------------------------------------------------------------
// 三维装配预览
// -----------------------------------------------------------------------------
translate([0, 0, 0]) case_front();
translate([0, 0, 15]) case_middle();
translate([0, -90, 0]) case_back();
translate([0, 90, 0]) case_back_logo();
translate([0, 50, 0]) switch_cap();
"""
    for out_dir in OUT_DIRS:
        filepath = os.path.join(out_dir, "epd_case.scad")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(scad_code)
        print(f"成功保存 OpenSCAD 源码: {filepath}")

if __name__ == '__main__':
    print(">>> 正在生成 3.98英寸墨水屏 终极定型版 V22 3D 模型 (ZGQ Inc.)...")
    write_stl("acrylic_template.stl", gen_acrylic_template())
    write_stl("switch_cap.stl", gen_switch_cap())
    write_stl("case_front.stl", gen_case_front())
    write_stl("case_middle.stl", gen_case_middle())
    write_stl("case_back.stl", gen_case_back(with_branding=False))
    write_stl("case_back_logo.stl", gen_case_back(with_branding=True))
    generate_openscad_source()
    print("\n>>> 全套 3D 模型与参数化源码已成功导出并同步至两处目录！")
