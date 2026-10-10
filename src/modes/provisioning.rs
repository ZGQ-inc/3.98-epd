// src/modes/provisioning.rs — E-ink Screen Provisioning & Network Status Displays
//
// Shows clear Chinese status on the 3.98" 4-color e-ink display:
// 1. 等待配网 (Waiting for Setup / SoftAP Active)
// 2. 配网成功 (WiFi Connected & Ready with IP / mDNS)
// 3. 配网失败 (WiFi Connection Failed / Retry)

use crate::display::{
    color::BwryColor,
    font::{draw_chinese_text, draw_chinese_text_centered},
    framebuffer::{Framebuffer, EPD_HEIGHT, EPD_WIDTH},
};

/// 1. 等待配网界面：显示热点名称、IP 及详细手机配网向导
pub fn render_waiting_setup(fb: &mut Framebuffer, ap_ssid: &str, ap_ip: &str) {
    fb.clear_color(BwryColor::White);

    // 顶部红底标题横幅
    for y in 0..70 {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Red);
        }
    }
    draw_chinese_text_centered(fb, 22, "3.98英寸 4色墨水屏 · 设备等待配网", BwryColor::White, 2);

    // 黄色装饰副横条
    for y in 70..82 {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Yellow);
        }
    }

    // 中间引导卡片边框
    let box_x1 = 36;
    let box_x2 = EPD_WIDTH - 36;
    let box_y1 = 106;
    let box_y2 = 330;

    for x in box_x1..box_x2 {
        for t in 0..2 {
            fb.set_pixel(x, box_y1 + t, BwryColor::Black);
            fb.set_pixel(x, box_y2 - t, BwryColor::Black);
        }
    }
    for y in box_y1..box_y2 {
        for t in 0..2 {
            fb.set_pixel(box_x1 + t, y, BwryColor::Black);
            fb.set_pixel(box_x2 - t, y, BwryColor::Black);
        }
    }

    // 卡片内核心配网信息
    draw_chinese_text(fb, 60, 126, "【请使用手机或电脑连接设备热点】", BwryColor::Black, 2);

    let ssid_msg = format!("配网热点名称: {}", ap_ssid);
    draw_chinese_text(fb, 60, 172, &ssid_msg, BwryColor::Red, 2);

    draw_chinese_text(fb, 60, 218, "热点 Wi-Fi 密码: 无密码 (直接连接)", BwryColor::Black, 2);

    let ip_msg = format!("手机配置网址: http://{}/", ap_ip);
    draw_chinese_text(fb, 60, 264, &ip_msg, BwryColor::Red, 2);

    // 下方图文步骤说明
    draw_chinese_text(fb, 50, 350, "【快捷配网操作步骤】", BwryColor::Black, 2);
    draw_chinese_text(fb, 50, 392, "① 打开手机【设置】->【无线局域网 / Wi-Fi】。", BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 418, &format!("② 找到并连接名为 \"{}\" 的开放网络。", ap_ssid), BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 444, "③ 手机将自动弹出配置窗口；若未弹出，请在浏览器直接打开 192.168.4.1。", BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 470, "④ 在页面中填入您家中的 2.4GHz Wi-Fi 与密码，点击【连接并保存】。", BwryColor::Black, 1);

    // 底部状态栏
    for y in (EPD_HEIGHT - 36)..EPD_HEIGHT {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Black);
        }
    }
    draw_chinese_text_centered(
        fb,
        EPD_HEIGHT - 28,
        "ESP32-C3 SuperMini · 768x552 超清4色墨水屏 · 状态: 开放热点等待连接中",
        BwryColor::White,
        1,
    );
}

/// 2. 配网成功界面：显示连接成功的 SSID、局域网 IP 与 mDNS 本地域名
pub fn render_connected_success(
    fb: &mut Framebuffer,
    ssid: &str,
    ip: &str,
    mdns_domain: &str,
) {
    fb.clear_color(BwryColor::White);

    // 顶部黄底高亮横幅
    for y in 0..70 {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Yellow);
        }
    }
    draw_chinese_text_centered(fb, 22, "🎉 Wi-Fi 配网成功 · 设备已连网", BwryColor::Black, 2);

    // 红色装饰线
    for y in 70..80 {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Red);
        }
    }

    // 成功详情卡片
    let box_x1 = 36;
    let box_x2 = EPD_WIDTH - 36;
    let box_y1 = 106;
    let box_y2 = 330;

    for x in box_x1..box_x2 {
        for t in 0..2 {
            fb.set_pixel(x, box_y1 + t, BwryColor::Black);
            fb.set_pixel(x, box_y2 - t, BwryColor::Black);
        }
    }
    for y in box_y1..box_y2 {
        for t in 0..2 {
            fb.set_pixel(box_x1 + t, y, BwryColor::Black);
            fb.set_pixel(box_x2 - t, y, BwryColor::Black);
        }
    }

    let ssid_msg = format!("已连接网络: {}", ssid);
    draw_chinese_text(fb, 60, 130, &ssid_msg, BwryColor::Black, 2);

    let ip_msg = format!("局域网 IP : http://{}/", ip);
    draw_chinese_text(fb, 60, 180, &ip_msg, BwryColor::Red, 2);

    let mdns_msg = format!("免记网址  : http://{}/", mdns_domain);
    draw_chinese_text(fb, 60, 230, &mdns_msg, BwryColor::Red, 2);

    draw_chinese_text(fb, 60, 280, "控制台状态: HTTP Web 管理控制台已就绪", BwryColor::Black, 1);

    // 下方提示
    draw_chinese_text(fb, 50, 356, "【访问控制台指引】", BwryColor::Black, 2);
    draw_chinese_text(fb, 50, 396, "• 请将您的手机或电脑切回同一无线局域网 (Wi-Fi)。", BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 424, &format!("• 在浏览器输入 http://{}/ 即可直接打开智能控制台。", mdns_domain), BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 452, "• 控制台支持自由排版中心、实时天气预报、日历贴、备忘录与定时刷新。", BwryColor::Black, 1);
    draw_chinese_text(fb, 50, 480, "• 正在加载日常主工作界面，请稍候...", BwryColor::Black, 1);

    // 底部状态栏
    for y in (EPD_HEIGHT - 36)..EPD_HEIGHT {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Black);
        }
    }
    draw_chinese_text_centered(
        fb,
        EPD_HEIGHT - 28,
        "Wi-Fi 在线 · MQTT 准备就绪 · 墨水屏 768×552 工作正常",
        BwryColor::White,
        1,
    );
}

/// 3. 配网失败界面：显示连接失败提示与重试向导
pub fn render_connection_failed(fb: &mut Framebuffer, failed_ssid: &str, ap_ssid: &str) {
    fb.clear_color(BwryColor::White);

    // 顶部红底
    for y in 0..70 {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Red);
        }
    }
    draw_chinese_text_centered(fb, 22, "⚠️ Wi-Fi 连接失败 · 请重试", BwryColor::White, 2);

    // 失败信息
    let msg1 = format!("尝试连接网络: \"{}\" 失败", failed_ssid);
    draw_chinese_text(fb, 50, 110, &msg1, BwryColor::Red, 2);
    draw_chinese_text(fb, 50, 156, "可能的原因: 密码输入错误 / 路由器信号弱 / 路由器关闭了 DHCP", BwryColor::Black, 1);

    // 降级提示
    draw_chinese_text(fb, 50, 206, "【设备已自动恢复热点模式】", BwryColor::Black, 2);
    draw_chinese_text(fb, 50, 252, &format!("请重新连接设备热点: {}", ap_ssid), BwryColor::Red, 2);
    draw_chinese_text(fb, 50, 298, "并在浏览器打开: http://192.168.4.1/ 重新检查并输入 Wi-Fi 密码", BwryColor::Black, 1);

    // 底部状态栏
    for y in (EPD_HEIGHT - 36)..EPD_HEIGHT {
        for x in 0..EPD_WIDTH {
            fb.set_pixel(x, y, BwryColor::Black);
        }
    }
    draw_chinese_text_centered(
        fb,
        EPD_HEIGHT - 28,
        "请检查 Wi-Fi 密码后重新配置 · 热点模式已重启",
        BwryColor::White,
        1,
    );
}

/// 4. 全新刷机欢迎界面：项目开源地址、双模广播、Wi-Fi 与 蓝牙双向引导
pub fn render_welcome_screen(
    fb: &mut Framebuffer,
    ap_ssid: &str,
    ap_ip: &str,
    ble_name: &str,
) {
    fb.clear_color(BwryColor::White);

    // 顶部红底主标题栏 (H: 58)
    fb.fill_rect(0, 0, EPD_WIDTH, 56, BwryColor::Black);
    fb.hline(0, 56, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 57, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 58, EPD_WIDTH, BwryColor::Yellow);

    draw_chinese_text_centered(fb, 14, "欢迎使用 3.98\" BWRY 四色墨水屏伴侣", BwryColor::White, 2);

    // 项目地址展示横幅 (Y: 66..112)
    fb.rect(24, 66, EPD_WIDTH - 48, 46, BwryColor::Black);
    fb.rect(26, 68, EPD_WIDTH - 52, 42, BwryColor::Yellow);
    draw_chinese_text(fb, 38, 80, "★ 开源项目: https://github.com/ZGQ-inc/3.98-epd", BwryColor::Black, 1);
    draw_chinese_text(fb, 440, 80, "★ 随身工坊: https://398epd.zgqinc.gq", BwryColor::Red, 1);

    // 左右分栏双向指引卡片 (Y: 120..494)
    // 左栏：Wi-Fi 热点配网 (X: 24..380, W: 356)
    fb.rect(24, 120, 356, 374, BwryColor::Black);
    fb.rect(26, 122, 352, 370, BwryColor::Red);
    fb.fill_rect(28, 124, 348, 36, BwryColor::Red);
    draw_chinese_text(fb, 40, 134, "方案一 · Wi-Fi 热点配网", BwryColor::White, 1);

    draw_chinese_text(fb, 38, 172, "设备已启动 2.4GHz 无线配网热点:", BwryColor::Black, 1);
    let ap_line = format!("热点名称: {}", ap_ssid);
    draw_chinese_text(fb, 38, 198, &ap_line, BwryColor::Red, 1);
    draw_chinese_text(fb, 38, 224, "热点密码: 无密码 (直接连接)", BwryColor::Black, 1);
    let ip_line = format!("配置网址: http://{}/", ap_ip);
    draw_chinese_text(fb, 38, 250, &ip_line, BwryColor::Red, 1);

    fb.hline(38, 280, 328, BwryColor::Black);
    draw_chinese_text(fb, 38, 292, "【Wi-Fi 配网步骤指引】", BwryColor::Black, 1);
    draw_chinese_text(fb, 38, 320, "1. 手机连接上述开放 Wi-Fi 热点", BwryColor::Black, 1);
    draw_chinese_text(fb, 38, 346, "2. 自动弹出或在浏览器打开配置页", BwryColor::Black, 1);
    draw_chinese_text(fb, 38, 372, "3. 填入路由器 Wi-Fi 密码保存", BwryColor::Black, 1);
    draw_chinese_text(fb, 38, 398, "4. 配网成功自动切换局域网控制台", BwryColor::Black, 1);
    draw_chinese_text(fb, 38, 432, "适用: 接入家庭/办公室智能看板", BwryColor::Red, 1);

    // 右栏：蓝牙随身配对 (X: 388..744, W: 356)
    fb.rect(388, 120, 356, 374, BwryColor::Black);
    fb.rect(390, 122, 352, 370, BwryColor::Yellow);
    fb.fill_rect(392, 124, 348, 36, BwryColor::Black);
    draw_chinese_text(fb, 404, 134, "方案二 · 蓝牙随身配对 (免配网)", BwryColor::Yellow, 1);

    draw_chinese_text(fb, 402, 172, "设备已开启 BLE 5.0 蓝牙广播:", BwryColor::Black, 1);
    let ble_line = format!("蓝牙名称: {}", ble_name);
    draw_chinese_text(fb, 402, 198, &ble_line, BwryColor::Red, 1);
    draw_chinese_text(fb, 402, 224, "配对网址: https://398epd.zgqinc.gq", BwryColor::Red, 1);
    draw_chinese_text(fb, 402, 250, "浏览器要求: Chrome / Edge", BwryColor::Black, 1);

    fb.hline(402, 280, 328, BwryColor::Black);
    draw_chinese_text(fb, 402, 292, "【蓝牙随身直推步骤】", BwryColor::Black, 1);
    draw_chinese_text(fb, 402, 320, "1. 手机打开随身工坊网址 (支持PWA)", BwryColor::Black, 1);
    draw_chinese_text(fb, 402, 346, "2. 点击页面顶部【扫描连接】配对", BwryColor::Black, 1);
    draw_chinese_text(fb, 402, 372, "3. 蓝牙配对后屏幕自动显示PWA指引", BwryColor::Black, 1);
    draw_chinese_text(fb, 402, 398, "4. 自由设计工牌/痛卡一键直推屏幕", BwryColor::Black, 1);
    draw_chinese_text(fb, 402, 432, "适用: 随身工牌/兽聚痛卡/100%离线", BwryColor::Red, 1);

    // 底部状态栏 (Y: 504..552)
    fb.fill_rect(0, 504, EPD_WIDTH, 48, BwryColor::Black);
    draw_chinese_text_centered(
        fb,
        518,
        "全新设备就绪 · Wi-Fi 热点与蓝牙广播已同时开启 · 硬件双模并发运行中",
        BwryColor::White,
        1,
    );
}

/// 5. 蓝牙连接成功 PWA 指引界面：指引用户使用 398epd.zgqinc.gq 随身创作
pub fn render_pwa_connected_screen(
    fb: &mut Framebuffer,
    client_name: &str,
    client_mac: &str,
) {
    fb.clear_color(BwryColor::White);

    // 顶部黄底高亮标题栏 (H: 58)
    fb.fill_rect(0, 0, EPD_WIDTH, 56, BwryColor::Yellow);
    fb.hline(0, 56, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 57, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 58, EPD_WIDTH, BwryColor::Black);

    draw_chinese_text_centered(fb, 14, "蓝牙已成功配对 · 随身 PWA 控制端就绪", BwryColor::Black, 2);

    // 连接客户端状态条 (Y: 66..106)
    fb.rect(24, 66, EPD_WIDTH - 48, 40, BwryColor::Black);
    let dev_msg = format!("已连接设备: {} ({}) · 通信协议: WebBLE 2bpp 直推", client_name, client_mac);
    draw_chinese_text(fb, 38, 78, &dev_msg, BwryColor::Black, 1);

    // 中央核心 PWA 指引大卡片 (Y: 114..494)
    fb.rect(24, 114, EPD_WIDTH - 48, 380, BwryColor::Black);
    fb.rect(26, 116, EPD_WIDTH - 52, 376, BwryColor::Red);
    fb.rect(28, 118, EPD_WIDTH - 56, 372, BwryColor::Yellow);

    draw_chinese_text(fb, 45, 134, "【随身 PWA 控制端网址】", BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 156, "https://398epd.zgqinc.gq", BwryColor::Red, 2);

    fb.hline(45, 196, EPD_WIDTH - 90, BwryColor::Black);

    draw_chinese_text(fb, 45, 210, "★ 手机/电脑免装 App：打开 Chrome/Edge 浏览器即可 100% 离线直推", BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 238, "★ 五大随身创作工坊：", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 266, "1. 随身工牌 / 电子名片定制 (极客黑客、商务极简、兽聚名片、展会工作证)", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 294, "2. 兽聚痛卡 / 角色挂件 (相册自由选图、缩放旋转、四色微粒抖动、双挂绳孔)", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 322, "3. 随身便签 / 备忘待办 (32px 大字号事项、磁吸固定、随身随带)", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 350, "4. 4色手绘画板 / 涂鸦创作 (纯正黑白黄红调色盘、几何图形、题字与撤销)", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 378, "5. 全能图片调色工坊 (Atkinson、Floyd、Stucki、Sierra、Ostromoukhov 多算法)", BwryColor::Black, 1);

    draw_chinese_text(fb, 45, 416, "★ 极速推屏: 在网页点击【蓝牙直推至墨水屏】，16秒内完成四色全阶物理刷新！", BwryColor::Red, 1);
    draw_chinese_text(fb, 45, 444, "★ 双稳态省电: 屏幕刷新后断电永久记忆，不耗费电池一丝电量。", BwryColor::Black, 1);

    // 底部状态栏 (Y: 504..552)
    fb.fill_rect(0, 504, EPD_WIDTH, 48, BwryColor::Black);
    draw_chinese_text_centered(
        fb,
        518,
        "低功耗蓝牙链路畅通 · 硬件双稳态就绪 · 等待接收画作与数据推送...",
        BwryColor::White,
        1,
    );
}
