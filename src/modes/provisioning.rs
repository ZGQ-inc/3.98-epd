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
        512,
        "出厂默认开启双工模式与屏幕 PIN 码配对 · 绑定后建议制作 NFC 钥匙并关闭 PIN 配对防蹭屏",
        BwryColor::Yellow,
        1,
    );
    draw_chinese_text_centered(
        fb,
        532,
        "支持 三星 Fold7 / 红米 / GPD 掌机 / Windows 台式机 · 访问 https://398epd.zgqinc.gq 即可直连",
        BwryColor::White,
        1,
    );
}

/// 5. 动态 6 位随机 PIN 码配对授权屏 (仅在手机端明确发起配对时按需刷新)
pub fn render_pin_pairing_screen(fb: &mut Framebuffer, pin: &str) {
    fb.clear_color(BwryColor::White);

    // 顶部红底警示主标题栏 (H: 58)
    fb.fill_rect(0, 0, EPD_WIDTH, 56, BwryColor::Red);
    fb.hline(0, 56, EPD_WIDTH, BwryColor::Black);
    fb.hline(0, 57, EPD_WIDTH, BwryColor::Black);
    fb.hline(0, 58, EPD_WIDTH, BwryColor::Yellow);

    draw_chinese_text_centered(fb, 14, "🔐 正在进行新设备蓝牙绑定 · 屏幕配对码", BwryColor::White, 2);

    // 中央核心卡片 (Y: 86..476)
    let card_x = 48;
    let card_w = EPD_WIDTH - 96;
    let card_y = 86;
    let card_h = 390;

    fb.rect(card_x, card_y, card_w, card_h, BwryColor::Black);
    fb.rect(card_x + 2, card_y + 2, card_w - 4, card_h - 4, BwryColor::Yellow);
    fb.rect(card_x + 4, card_y + 4, card_w - 8, card_h - 8, BwryColor::Red);

    draw_chinese_text_centered(fb, card_y + 28, "【检测到新控制端正在请求绑定本墨水屏】", BwryColor::Black, 2);
    draw_chinese_text_centered(
        fb,
        card_y + 72,
        "请在您的 主力机三星 Fold7 / 备用机红米 / GPD 掌机 网页弹窗中输入下方 6 位数字:",
        BwryColor::Black,
        1,
    );

    // 超大醒目黄色配对码矩形框
    let pin_box_x = 110;
    let pin_box_y = card_y + 116;
    let pin_box_w = EPD_WIDTH - 220;
    let pin_box_h = 96;

    fb.fill_rect(pin_box_x, pin_box_y, pin_box_w, pin_box_h, BwryColor::Yellow);
    fb.rect(pin_box_x, pin_box_y, pin_box_w, pin_box_h, BwryColor::Black);
    fb.rect(pin_box_x + 2, pin_box_y + 2, pin_box_w - 4, pin_box_h - 4, BwryColor::Black);

    let pin_formatted = if pin.len() == 6 {
        format!("{}  {}  {}  {}  {}  {}", &pin[0..1], &pin[1..2], &pin[2..3], &pin[3..4], &pin[4..5], &pin[5..6])
    } else {
        pin.to_string()
    };
    draw_chinese_text_centered(fb, pin_box_y + 32, &format!("配 对 码 :  [ {} ]", pin_formatted), BwryColor::Red, 2);

    // 安全提示与超时说明
    draw_chinese_text_centered(fb, card_y + 240, "★ 本配对码单次有效，120 秒后自动失效超时", BwryColor::Red, 1);
    draw_chinese_text_centered(fb, card_y + 272, "★ 验证通过后将生成独一无二的设备 ID 写入墨水屏 NVS 硬件白名单", BwryColor::Black, 1);
    draw_chinese_text_centered(fb, card_y + 304, "★ 若非本人操作，请直接在手机端点击【取消断开】，本屏不会记录任何权限", BwryColor::Black, 1);
    draw_chinese_text_centered(fb, card_y + 336, "★ 绑定完成后可在随身工坊设置中【关闭 PIN 配对】，杜绝漫展公共场合蹭屏！", BwryColor::Red, 1);

    // 底部状态栏 (Y: 504..552)
    fb.fill_rect(0, 504, EPD_WIDTH, 48, BwryColor::Black);
    draw_chinese_text_centered(
        fb,
        518,
        "等待控制端输入并校验中... (校验成功将自动跳转至完成向导屏)",
        BwryColor::White,
        1,
    );
}

/// 6. 蓝牙绑定成功 & NFC 钥匙制作引导屏
pub fn render_pairing_success_screen(fb: &mut Framebuffer, device_name: &str) {
    fb.clear_color(BwryColor::White);

    // 顶部黄底高亮标题栏 (H: 58)
    fb.fill_rect(0, 0, EPD_WIDTH, 56, BwryColor::Yellow);
    fb.hline(0, 56, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 57, EPD_WIDTH, BwryColor::Red);
    fb.hline(0, 58, EPD_WIDTH, BwryColor::Black);

    draw_chinese_text_centered(fb, 14, "🎉 蓝牙绑定成功 · 控制端专属信任已建立", BwryColor::Black, 2);

    // 授权设备通知栏 (Y: 66..106)
    fb.rect(24, 66, EPD_WIDTH - 48, 40, BwryColor::Black);
    let dev_msg = format!("已授权设备: 「{}」 · 硬件唯一凭证已成功存入 NVS 白名单", device_name);
    draw_chinese_text(fb, 38, 78, &dev_msg, BwryColor::Black, 1);

    // 中央核心引导卡片 (Y: 114..494)
    fb.rect(24, 114, EPD_WIDTH - 48, 380, BwryColor::Black);
    fb.rect(26, 116, EPD_WIDTH - 52, 376, BwryColor::Red);
    fb.rect(28, 118, EPD_WIDTH - 56, 372, BwryColor::Yellow);

    draw_chinese_text(fb, 45, 134, "【后续推荐操作指引】", BwryColor::Black, 1);
    draw_chinese_text(fb, 45, 156, "随身工坊网址: https://398epd.zgqinc.gq", BwryColor::Red, 2);

    fb.hline(45, 196, EPD_WIDTH - 90, BwryColor::Black);

    draw_chinese_text(fb, 45, 212, "① 制作 NFC 碰一碰钥匙 (推荐):", BwryColor::Black, 2);
    draw_chinese_text(fb, 75, 244, "在随身工坊【设备管理】中点击【写入 NFC 标签】，手机背部轻触徽章 NFC 贴纸；", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 270, "以后任何时候碰一下标签，即可一碰免密秒连，彻底免去输 PIN 步骤！", BwryColor::Red, 1);

    draw_chinese_text(fb, 45, 306, "② 关闭屏幕 PIN 码配对防蹭保护:", BwryColor::Black, 2);
    draw_chinese_text(fb, 75, 338, "绑定完主力机和备用机后，在设置中关闭【允许屏幕 PIN 配对】；", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 364, "在漫展、漫展地铁等公开场合，陌生人即便发现蓝牙也绝无法发起配对刷屏骚扰！", BwryColor::Red, 1);

    draw_chinese_text(fb, 45, 400, "③ 开始随身创作与推图:", BwryColor::Black, 2);
    draw_chinese_text(fb, 75, 432, "现在可在工坊自由设计兽聚痛卡立绘、个性工牌、备忘便签，16 秒一键推屏！", BwryColor::Black, 1);
    draw_chinese_text(fb, 75, 458, "墨水屏双稳态特性：物理全刷后断电永久记忆画面，零耗电常显。", BwryColor::Black, 1);

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

/// 7. 蓝牙连接成功 PWA 指引界面 (向后兼容)
pub fn render_pwa_connected_screen(
    fb: &mut Framebuffer,
    client_name: &str,
    client_mac: &str,
) {
    render_pairing_success_screen(fb, &format!("{} ({})", client_name, client_mac));
}
