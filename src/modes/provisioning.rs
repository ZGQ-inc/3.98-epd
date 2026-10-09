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
