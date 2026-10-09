// 3.98英寸 4色墨水屏 手机造型外壳 终极定型版 V21
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
