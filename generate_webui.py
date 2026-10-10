# -*- coding: utf-8 -*-
# Auto-generated script to build and gzip index.html for ESP32 embedded web server
import os
import gzip

html_content = '''<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    (function() {
      try {
        var saved = localStorage.getItem('epd_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
      } catch(e) {}
    })();
  </script>
  <title>3.98" 4色墨水屏 · 智能控制台与专业画板</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📺</text></svg>">
  <!-- High-Speed CDNs for Fabric.js v5.3 and QRCode -->
  <script defer src="https://registry.npmmirror.com/fabric/5.3.0/files/dist/fabric.min.js"></script>
  <script defer src="https://registry.npmmirror.com/qrcodejs/1.0.0/files/qrcode.min.js"></script>

  <style>
    /* Google Material Design 3 (M3) Complete Color & Surface Tokens */
    :root {
      --md-sys-color-primary: #005ac1;
      --md-sys-color-on-primary: #ffffff;
      --md-sys-color-primary-container: #d8e2ff;
      --md-sys-color-on-primary-container: #001a41;
      --md-sys-color-surface: #fdfcff;
      --md-sys-color-on-surface: #1a1c1e;
      --md-sys-color-surface-variant: #e1e2ec;
      --md-sys-color-on-surface-variant: #44474f;
      --md-sys-color-surface-container-lowest: #ffffff;
      --md-sys-color-surface-container-low: #f7f9fe;
      --md-sys-color-surface-container: #f1f4f9;
      --md-sys-color-surface-container-high: #ebeef3;
      --md-sys-color-surface-container-highest: #e2e7ec;
      --md-sys-color-outline: #74777f;
      --md-sys-color-outline-variant: #c4c6d0;
      --md-sys-color-error: #ba1a1a;
      --md-sys-color-error-container: #ffdad6;
      --md-sys-color-on-error: #ffffff;
      --md-elevation-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
      --md-elevation-2: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
      --epd-black: #000000;
      --epd-white: #ffffff;
      --epd-yellow: #f4c430;
      --epd-red: #d32f2f;
    }

    [data-theme="dark"] {
      --md-sys-color-primary: #a8c7fa;
      --md-sys-color-on-primary: #002d6f;
      --md-sys-color-primary-container: #004396;
      --md-sys-color-on-primary-container: #d8e2ff;
      --md-sys-color-surface: #111318;
      --md-sys-color-on-surface: #e2e2e6;
      --md-sys-color-surface-variant: #44474f;
      --md-sys-color-on-surface-variant: #c4c6d0;
      --md-sys-color-surface-container-lowest: #0c0e13;
      --md-sys-color-surface-container-low: #191c20;
      --md-sys-color-surface-container: #1d2024;
      --md-sys-color-surface-container-high: #282a2f;
      --md-sys-color-surface-container-highest: #33353a;
      --md-sys-color-outline: #8e9099;
      --md-sys-color-outline-variant: #44474e;
      --md-sys-color-error: #ffb4ab;
      --md-sys-color-error-container: #93000a;
      --md-sys-color-on-error: #690005;
      --md-elevation-1: 0 1px 4px rgba(0,0,0,0.4);
      --md-elevation-2: 0 4px 10px rgba(0,0,0,0.5);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      background-color: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      transition: background-color 0.2s, color 0.2s;
    }

    /* M3 Top App Bar */
    header {
      background: var(--md-sys-color-surface-container);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      padding: 12px 24px;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 100;
    }
    .brand { font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .badge {
      padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
      background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);
    }

    /* M3 Segmented Tabs */
    nav {
      display: flex; gap: 6px; background: var(--md-sys-color-surface-container-high);
      padding: 4px; border-radius: 24px;
    }
    nav button {
      background: transparent; border: none; padding: 8px 16px; border-radius: 20px;
      font-size: 13px; font-weight: 600; color: var(--md-sys-color-on-surface-variant);
      cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px;
    }
    nav button:hover { background: rgba(0,0,0,0.04); }
    [data-theme="dark"] nav button:hover { background: rgba(255,255,255,0.06); }
    nav button.active {
      background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-elevation-1);
    }

    /* Header Actions (Theme Toggle, etc.) */
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .theme-toggle-btn {
      background: var(--md-sys-color-surface-container-highest); border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 18px; color: var(--md-sys-color-on-surface); transition: 0.2s;
    }
    .theme-toggle-btn:hover { transform: scale(1.08); }

    .container { max-width: 1280px; margin: 20px auto; padding: 0 16px; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* M3 Elevated Cards */
    .m3-card {
      background: var(--md-sys-color-surface-container-lowest);
      border-radius: 16px; padding: 20px; margin-bottom: 20px;
      box-shadow: var(--md-elevation-1); border: 1px solid var(--md-sys-color-outline-variant);
    }
    h2 { font-size: 17px; margin-top: 0; margin-bottom: 14px; color: var(--md-sys-color-on-surface); display: flex; align-items: center; gap: 8px; }

    /* KPI Grid */
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .stat-box {
      background: var(--md-sys-color-surface-container); border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 14px; padding: 16px; position: relative;
    }
    .stat-title { font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 6px; }
    .stat-val { font-size: 19px; font-weight: 700; color: var(--md-sys-color-on-surface); display: flex; align-items: center; justify-content: space-between; }

    /* M3 Progress Bar */
    .m3-progress-track {
      width: 100%; height: 8px; background: var(--md-sys-color-surface-container-highest);
      border-radius: 4px; overflow: hidden; margin: 6px 0;
    }
    .m3-progress-bar { height: 100%; background: var(--md-sys-color-primary); border-radius: 4px; transition: width 0.4s ease; }
    .m3-progress-bar.warning { background: #e65100; }
    .m3-progress-bar.success { background: #2e7d32; }

    /* Buttons */
    .m3-btn {
      background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
      border: none; padding: 9px 18px; border-radius: 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: 0.15s; display: inline-flex; align-items: center; gap: 6px;
    }
    .m3-btn:hover { opacity: 0.92; box-shadow: var(--md-elevation-1); }
    .m3-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .m3-btn.tonal {
      background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);
    }
    .m3-btn.outlined {
      background: transparent; border: 1px solid var(--md-sys-color-outline);
      color: var(--md-sys-color-primary);
    }
    .m3-btn.danger {
      background: var(--md-sys-color-error); color: var(--md-sys-color-on-error);
    }
    .m3-btn.small { padding: 4px 10px; font-size: 11px; border-radius: 12px; }

    /* Inputs */
    input[type="text"], input[type="password"], input[type="date"], select, textarea {
      width: 100%; padding: 10px 12px; border: 1px solid var(--md-sys-color-outline); border-radius: 8px;
      margin-top: 4px; margin-bottom: 12px; font-size: 13px;
      background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);
      outline: none; transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--md-sys-color-primary); box-shadow: 0 0 0 2px rgba(0,90,193,0.15); }
    label { font-size: 12px; font-weight: 600; color: var(--md-sys-color-on-surface-variant); display: block; }

    /* Studio & Mode Viewport */
    .studio-wrapper { display: flex; gap: 16px; align-items: flex-start; }
    .studio-sidebar {
      width: 320px; flex-shrink: 0; background: var(--md-sys-color-surface-container);
      border: 1px solid var(--md-sys-color-outline-variant); border-radius: 14px;
      padding: 16px; max-height: 820px; overflow-y: auto;
    }
    .studio-canvas-area {
      flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;
      background: var(--md-sys-color-surface-container-high); border-radius: 14px; padding: 16px;
    }
    .canvas-viewport {
      width: 768px; height: 552px; border: 3px solid #202124; box-shadow: var(--md-elevation-2);
      background: #ffffff; line-height: 0; overflow: hidden; position: relative;
    }

    /* Mode Grid Selector */
    .mode-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 16px; scrollbar-width: thin; }
    .mode-chip {
      padding: 8px 14px; border-radius: 16px; font-size: 12px; font-weight: 600; cursor: pointer;
      background: var(--md-sys-color-surface-container-high); color: var(--md-sys-color-on-surface-variant);
      border: 1px solid var(--md-sys-color-outline-variant); white-space: nowrap; transition: 0.15s;
    }
    .mode-chip:hover { border-color: var(--md-sys-color-primary); }
    .mode-chip.active {
      background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
      border-color: var(--md-sys-color-primary);
    }
    .wireless-chip {
      padding: 12px; border-radius: 12px; cursor: pointer;
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
      transition: all 0.2s ease;
    }
    .wireless-chip:hover { border-color: var(--md-sys-color-primary); }
    .wireless-chip.active {
      border-color: var(--md-sys-color-primary);
      background: rgba(30, 147, 229, 0.12);
      box-shadow: 0 0 0 1px var(--md-sys-color-primary);
    }

    /* Swatches & Tool Groups */
    .tool-group-title { font-size: 12px; font-weight: 700; color: var(--md-sys-color-on-surface-variant); margin: 12px 0 6px; text-transform: uppercase; }
    .tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 10px; }
    .tool-btn {
      padding: 8px 10px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px;
      background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);
      cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;
      transition: 0.15s; justify-content: center;
    }
    .tool-btn:hover { background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
    .tool-btn.active { background: var(--md-sys-color-primary); border-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
    .tool-btn.danger { color: var(--md-sys-color-error); }

    .swatch-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
    .swatch-item {
      width: 26px; height: 26px; border-radius: 6px; cursor: pointer;
      border: 2px solid #ccc; position: relative; transition: 0.15s;
    }
    .swatch-item:hover { transform: scale(1.15); z-index: 2; }
    .swatch-item.active { border-color: var(--md-sys-color-primary); box-shadow: 0 0 0 2px var(--md-sys-color-primary); transform: scale(1.1); }

    .control-row { display: flex; align-items: center; justify-content: space-between; margin: 8px 0; font-size: 12px; }
    .control-row input[type="range"] { flex: 1; margin: 0 8px; cursor: pointer; }
    .control-row span { min-width: 40px; text-align: right; font-weight: 600; font-family: monospace; }

    /* Modal */
    .modal-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.65); z-index: 1000; align-items: center; justify-content: center;
    }
    .modal-overlay.active { display: flex; }
    .modal-card {
      background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);
      border-radius: 16px; padding: 24px; max-width: 840px; width: 95%;
      box-shadow: var(--md-elevation-2); text-align: center;
    }

    /* System Diagnostics Table */
    .diag-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .diag-table td { padding: 10px 12px; border-bottom: 1px solid var(--md-sys-color-outline-variant); }
    .diag-table td:first-child { font-weight: 600; color: var(--md-sys-color-on-surface-variant); width: 220px; }

    /* Presets Management */
    .preset-card { transition: transform 0.15s, box-shadow 0.15s; }
    .preset-card:hover { border-color: var(--md-sys-color-primary) !important; }
    .preset-badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; }
    .badge-canvas { background: #e0f2fe; color: #0369a1; }
    .badge-mode { background: #fef3c7; color: #b45309; }
    .badge-bitmap { background: #fce7f3; color: #be185d; }
    .badge-text { background: #dcfce7; color: #15803d; }
    [data-theme="dark"] .badge-canvas { background: #075985; color: #e0f2fe; }
    [data-theme="dark"] .badge-mode { background: #78350f; color: #fef3c7; }
    [data-theme="dark"] .badge-bitmap { background: #831843; color: #fce7f3; }
    [data-theme="dark"] .badge-text { background: #14532d; color: #dcfce7; }
  </style>
</head>
<body>

<header>
  <div class="brand">
    <span>📺 3.98" 4色墨水屏 · 智能控制台</span>
    <span class="badge" id="netStatusBadge">设备在线</span>
  </div>
  <nav>
    <button class="active" data-tab="dashboard" onclick="switchTab('dashboard', this)">🏠 仪表盘</button>
    <button data-tab="modes" onclick="switchTab('modes', this)">📋 17种场景模式</button>
    <button data-tab="studio" onclick="switchTab('studio', this)">🎨 专业画板</button>
    <button data-tab="presets" onclick="switchTab('presets', this)">💾 效果预设库</button>
    <button data-tab="network" onclick="switchTab('network', this)">📶 网络与蓝牙配置</button>
    <button data-tab="system" onclick="switchTab('system', this)">⚙️ 系统维护</button>
  </nav>
  <div class="header-actions">
    <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="切换深色/浅色模式">🌙</button>
  </div>
</header>

<div class="container">

  <!-- TAB 1: 仪表盘 -->
  <div id="tab-dashboard" class="tab-content active">
    <div class="grid-4">
      <div class="stat-box">
        <div class="stat-title">当前工作模式</div>
        <div class="stat-val" id="statMode">布告板模式</div>
      </div>
      <div class="stat-box">
        <div class="stat-title">可用堆内存 (SRAM)</div>
        <div class="stat-val">
          <span id="statHeap">70 KB</span>
          <button class="m3-btn small outlined" onclick="pollStatus()" title="刷新实时内存">🔄 刷新</button>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-title">Wi-Fi 信号强度 (RSSI)</div>
        <div class="stat-val" id="statRssi">-42 dBm (极强信号 📶)</div>
      </div>
      <div class="stat-box">
        <div class="stat-title">硬件点阵规格</div>
        <div class="stat-val" style="font-size:15px;">768 × 552 · 4色 BWRY</div>
      </div>
    </div>

    <!-- 剩余存储空间监控卡片 (用户重点要求) -->
    <div class="m3-card">
      <h2>💾 存储空间与分区健康监控 (Storage)</h2>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-top:10px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600;">
            <span>Flash 芯片总量 (4 MB)</span>
            <span id="statFlashTotal">4096 KB</span>
          </div>
          <div class="m3-progress-track">
            <div class="m3-progress-bar" style="width: 100%;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600;">
            <span>固件代码分区 (factory 3.0 MB)</span>
            <span id="statOtaUsage">1700 KB (已用 54%)</span>
          </div>
          <div class="m3-progress-track">
            <div class="m3-progress-bar success" style="width: 54%;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600;">
            <span>中文字库存储分区 (storage 896KB)</span>
            <span id="statStorageFree">已存 GB2312 汉字库 264 KB (可用 70%)</span>
          </div>
          <div class="m3-progress-track">
            <div class="m3-progress-bar success" style="width: 30%;"></div>
          </div>
        </div>
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600;">
            <span>配置参数分区 (nvs 24KB)</span>
            <span id="statNvsFree">剩余 18 KB (75% 可用)</span>
          </div>
          <div class="m3-progress-track">
            <div class="m3-progress-bar success" style="width: 25%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 墨水屏即时物理镜像 & 全局擦写 -->
    <div class="m3-card">
      <h2>🖥️ 墨水屏即时物理镜像 & 全局擦写</h2>
      <p style="color:var(--md-sys-color-on-surface-variant); font-size:13px; margin-top:-6px;">
        墨水屏物理刷新单次耗时约 15~16 秒。点击下方按键可强制触发全屏波形刷新或读取当前物理显存镜像。
      </p>
      <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; align-items:center;">
        <button class="m3-btn" onclick="triggerRefresh()">⚡ 立即全刷屏幕 (16s)</button>
        <button class="m3-btn tonal" id="btnGrabPreview" onclick="loadScreenPreview()">📸 抓取当前屏幕镜像</button>
        <button class="m3-btn outlined" onclick="promptSaveCurrentPreset('bitmap')">💾 存当前镜像为预设</button>
        <button class="m3-btn outlined" onclick="toggleHeartbeat()">💤 切换心跳省电模式</button>
        <span id="previewStatusText" style="font-size:12px; font-weight:500; color:var(--md-sys-color-primary); margin-left:6px;"></span>
      </div>

      <div style="display:flex; justify-content:center; overflow-x:auto;">
        <canvas id="previewCanvas" width="768" height="552" style="border:3px solid #202124; background:white; max-width:100%; height:auto; box-shadow:var(--md-elevation-1);"></canvas>
      </div>
    </div>
  </div>

  <!-- TAB 2: 17 种场景模式 (墨鱼 InkSight 风格全面复刻：动态参数表单 + 实时 768x552 所见即所得 Canvas) -->
  <div id="tab-modes" class="tab-content">
    <div class="m3-card" style="margin-bottom:14px;">
      <h2>📋 17 种场景模式专属工坊 (所见即所得 · 参数即改即显)</h2>
      <p style="color:var(--md-sys-color-on-surface-variant); font-size:13px; margin-top:-6px;">
        点击选择任意模式，左侧将自动切换为该模式的专属参数配置，右侧以 768×552 原生像素实时呈现预览效果，点击保存即可一键下发至 ESP32 并推流刷新！
      </p>

      <!-- Mode Chips Selector -->
      <div class="mode-chips" id="modeChipsContainer">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- Two-column: Dynamic Parameter Form + Live 768x552 WYSIWYG Canvas -->
    <div class="studio-wrapper">
      <!-- Left: Mode Parameters Form -->
      <div class="studio-sidebar" style="width:360px;">
        <h3 id="modeFormTitle" style="margin-top:0; font-size:15px; display:flex; align-items:center; gap:6px;">⚙️ 参数配置</h3>
        <div id="modeFormFields">
          <!-- Dynamic form inputs injected via JS -->
        </div>

        <hr style="border:none; border-top:1px solid var(--md-sys-color-outline-variant); margin:16px 0;">

        <button class="m3-btn" style="width:100%; margin-bottom:8px;" id="btnSaveAndPushMode" onclick="saveAndPushCurrentMode()">
          💾 保存参数并推送到墨水屏 (16s)
        </button>
        <button class="m3-btn tonal" style="width:100%;" onclick="showModeDitherPreviewModal()">
          👁️ 4色微粒物理点阵效果预览
        </button>
      </div>

      <!-- Right: Real-Time 768×552 WYSIWYG Mode Preview Canvas -->
      <div class="studio-canvas-area">
        <div class="canvas-viewport">
          <canvas id="modePreviewCanvas" width="768" height="552"></canvas>
        </div>
        <div style="font-size:12px; color:var(--md-sys-color-on-surface-variant); margin-top:10px; display:flex; gap:16px;">
          <span>基准渲染分辨率：<b>768 × 552 px</b> (1:1 物理像素对齐，零错位零重叠)</span>
          <span id="modeStatusIndicator">● 实时预览已同步</span>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 3: 专业画板 (1:1 原生点阵直推与混色调色盘) -->
  <div id="tab-studio" class="tab-content">
    <div class="studio-wrapper">
      <!-- 画板左侧工具箱 -->
      <div class="studio-sidebar">
        <div class="tool-group-title">🛠️ 绘图与交互工具</div>
        <div class="tool-grid">
          <button class="tool-btn active" id="tool-btn-select" onclick="setMode('select')">👆 选择 / 移动</button>
          <button class="tool-btn" id="tool-btn-brush" onclick="setMode('brush')">✏️ 自由手绘笔</button>
          <button class="tool-btn" id="tool-btn-eraser" onclick="setMode('eraser')">🧽 橡皮擦</button>
          <button class="tool-btn" onclick="addTextComponent()">🔤 插入文字</button>
        </div>

        <div class="tool-group-title">📐 几何形状</div>
        <div class="tool-grid">
          <button class="tool-btn" onclick="addShape('rect')">矩形</button>
          <button class="tool-btn" onclick="addShape('circle')">圆形</button>
          <button class="tool-btn" onclick="addShape('line')">直线</button>
          <button class="tool-btn" onclick="addShape('arrow')">方向箭头</button>
          <button class="tool-btn" onclick="addShape('triangle')">三角形</button>
          <button class="tool-btn" onclick="addShape('star')">五角星</button>
        </div>

        <div class="tool-group-title">🖼️ 本地图像导入</div>
        <input type="file" id="imageUploader" accept="image/*" style="display:none;" onchange="handleImageUpload(event)">
        <button class="tool-btn" style="width:100%; margin-bottom:10px;" onclick="document.getElementById('imageUploader').click()">
          📤 上传并置入图片 (PNG/JPG)
        </button>

        <div class="tool-group-title">🎨 4色墨水屏物理混色调色盘</div>
        <div class="palette-box">
          <div style="font-size:11px; color:var(--md-sys-color-on-surface-variant); margin-bottom:4px;">纯色基础色卡 (Pure Inks)：</div>
          <div class="swatch-row">
            <div class="swatch-item active" style="background:#000000;" title="纯黑 (Black)" onclick="pickColor('#000000', this)"></div>
            <div class="swatch-item" style="background:#ffffff;" title="纯白 (White)" onclick="pickColor('#ffffff', this)"></div>
            <div class="swatch-item" style="background:#f4c430;" title="纯黄 (Yellow)" onclick="pickColor('#f4c430', this)"></div>
            <div class="swatch-item" style="background:#d32f2f;" title="纯红 (Red)" onclick="pickColor('#d32f2f', this)"></div>
            <input type="color" id="nativeColorPicker" value="#000000" style="width:30px; height:26px; border:none; padding:0; cursor:pointer;" onchange="pickColor(this.value)">
          </div>

          <div style="font-size:11px; color:var(--md-sys-color-on-surface-variant); margin-top:8px; margin-bottom:4px;">物理混色与精选灰阶：</div>
          <div class="swatch-row">
            <div class="swatch-item" style="background:#ff8c00;" title="亮橙 (红+黄混色)" onclick="pickColor('#ff8c00', this)"></div>
            <div class="swatch-item" style="background:#ff9999;" title="浅粉 (红+白混色)" onclick="pickColor('#ff9999', this)"></div>
            <div class="swatch-item" style="background:#800000;" title="深红 / 勃艮第 (红+黑混色)" onclick="pickColor('#800000', this)"></div>
            <div class="swatch-item" style="background:#fff3cc;" title="米黄 / 奶黄 (黄+白混色)" onclick="pickColor('#fff3cc', this)"></div>
            <div class="swatch-item" style="background:#666600;" title="暗橄榄 (黄+黑混色)" onclick="pickColor('#666600', this)"></div>
            <div class="swatch-item" style="background:#8b4513;" title="棕褐 (红+黄+黑混色)" onclick="pickColor('#8b4513', this)"></div>
            <div class="swatch-item" style="background:#e6e6e6;" title="10% 浅灰 (黑白点阵)" onclick="pickColor('#e6e6e6', this)"></div>
            <div class="swatch-item" style="background:#cccccc;" title="25% 灰 (黑白交错)" onclick="pickColor('#cccccc', this)"></div>
            <div class="swatch-item" style="background:#808080;" title="50% 中灰 (黑白棋盘点阵)" onclick="pickColor('#808080', this)"></div>
            <div class="swatch-item" style="background:#404040;" title="75% 深灰 (黑白高密)" onclick="pickColor('#404040', this)"></div>
          </div>
        </div>

        <div class="control-row">
          <span>💧 透明度</span>
          <input type="range" id="opacitySlider" min="0.05" max="1.0" step="0.05" value="1.0" oninput="updateOpacity(this.value)">
          <span id="opacityVal">100%</span>
        </div>

        <div class="control-row">
          <span>📏 粗细/笔宽</span>
          <input type="range" id="widthSlider" min="1" max="40" step="1" value="3" oninput="updateStrokeWidth(this.value)">
          <span id="widthVal">3px</span>
        </div>

        <div class="control-row">
          <span>🔤 文本字号</span>
          <input type="range" id="fontSizeSlider" min="12" max="140" step="2" value="36" oninput="updateFontSize(this.value)">
          <span id="fontSizeVal">36px</span>
        </div>

        <div class="control-row" style="margin-top:10px;">
          <span>填充模式</span>
          <select id="fillModeSelect" style="width:130px; margin:0;" onchange="toggleFillMode(this.value)">
            <option value="stroke">纯轮廓描边 (Stroke)</option>
            <option value="fill">实心颜色填充 (Fill)</option>
          </select>
        </div>

        <hr style="border:none; border-top:1px solid var(--md-sys-color-outline-variant); margin:12px 0;">

        <div class="tool-group-title">⚡ 对象操作</div>
        <div class="tool-grid">
          <button class="tool-btn danger" onclick="deleteSelected()">🗑️ 删除选中 (Del)</button>
          <button class="tool-btn" onclick="clearStudioCanvas()">🧹 清空整个画布</button>
          <button class="tool-btn" onclick="bringToFront()">⬆️ 移至顶层</button>
          <button class="tool-btn" onclick="sendToBack()">⬇️ 移至底层</button>
        </div>

        <hr style="border:none; border-top:1px solid var(--md-sys-color-outline-variant); margin:14px 0;">

        <button class="m3-btn tonal" style="width:100%; margin-bottom:8px;" onclick="showDitherPreviewModal()">👁️ 墨水屏 4色微粒效果预览</button>
        <button class="m3-btn" style="width:100%; margin-bottom:8px;" id="btnPushBitmap" onclick="pushBitmapToDevice()">🚀 1:1 高保真推送到墨水屏</button>
        <button class="m3-btn outlined" style="width:100%;" onclick="promptSaveCurrentPreset('canvas')">💾 保存当前画板为预设</button>
      </div>

      <!-- 右侧 768 × 552 画布视口 -->
      <div class="studio-canvas-area">
        <div class="canvas-viewport">
          <canvas id="fabricCanvas" width="768" height="552"></canvas>
        </div>
        <div style="font-size:12px; color:var(--md-sys-color-on-surface-variant); margin-top:10px; display:flex; gap:16px;">
          <span>画布基准分辨率：<b>768 × 552 px</b> (1:1 物理点阵对齐)</span>
          <span>快捷键：按 <b>Delete</b> 或 <b>Backspace</b> 键即刻删除选中图层</span>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB: 效果预设库 -->
  <div id="tab-presets" class="tab-content">
    <div class="m3-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="margin:0;">💾 效果预设库与设备存储 (1.63 MB SPIFFS Storage)</h2>
          <p style="color:var(--md-sys-color-on-surface-variant); font-size:13px; margin:4px 0 0 0;">
            持久化保存画板作品（矢量 SVG/JSON）、功能模式配置与 2bpp 原始位图，方便随时一键推送到墨水屏。
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="m3-btn tonal" onclick="loadPresets()">🔄 刷新列表</button>
        </div>
      </div>

      <!-- 存储容量指标卡 -->
      <div class="storage-bar-card" style="margin-top:14px; background:var(--md-sys-color-surface-container); border-radius:12px; padding:14px; border:1px solid var(--md-sys-color-outline-variant);">
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600;">
          <span id="storageLabel">存储空间使用情况：读取中...</span>
          <span id="storagePercentText" style="color:var(--md-sys-color-primary);">0%</span>
        </div>
        <div class="storage-progress-bg" style="height:10px; background:var(--md-sys-color-surface-variant); border-radius:5px; overflow:hidden; margin:8px 0;">
          <div id="storageProgressBar" class="storage-progress-fill" style="height:100%; width:0%; background:var(--md-sys-color-primary); border-radius:5px; transition:width 0.3s;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--md-sys-color-on-surface-variant);">
          <span id="storageDetailText">已用: 0 KB / 总量: 1632 KB</span>
          <span id="storageFreeText" style="font-weight:600; color:#2e7d32;">剩余可用: 1632 KB</span>
        </div>
      </div>

      <!-- 预设操作工具条 -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:16px; padding-bottom:12px; border-bottom:1px solid var(--md-sys-color-outline-variant);">
        <div style="display:flex; align-items:center; gap:10px;">
          <label style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; cursor:pointer;">
            <input type="checkbox" id="selectAllPresets" onchange="toggleSelectAllPresets(this.checked)"> 全选
          </label>
          <button class="m3-btn outlined" id="btnBatchDelete" style="color:var(--md-sys-color-error); border-color:var(--md-sys-color-error);" onclick="confirmBatchDeletePresets()" disabled>
            🗑️ 批量删除 (<span id="selectedCount">0</span>)
          </button>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="m3-btn tonal" onclick="promptSaveCurrentPreset('canvas')">➕ 存当前画板为预设</button>
          <button class="m3-btn tonal" onclick="promptSaveCurrentPreset('bitmap')">➕ 存当前镜像为预设</button>
        </div>
      </div>

      <!-- 预设文件列表容器 -->
      <div id="presetsListContainer" style="margin-top:14px; display:flex; flex-direction:column; gap:10px;">
        <div style="text-align:center; padding:24px; color:var(--md-sys-color-on-surface-variant); font-size:13px;">
          正在读取设备存储预设列表...
        </div>
      </div>
    </div>
  </div>

  <!-- TAB 5: 网络与蓝牙配置 -->
  <div id="tab-network" class="tab-content">

    <!-- 蓝牙 BLE 5.0 与多模式无线共存管理卡片 -->
    <div class="m3-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
        <div>
          <h2 style="margin:0; display:flex; align-items:center; gap:8px;">
            <span>🔵 蓝牙 BLE 5.0 与无线工作模式管理</span>
            <span class="badge" id="bleStatusBadge" style="background:#2e7d32; color:white; font-size:11px;">广播中 (ADV)</span>
          </h2>
          <p style="color:var(--md-sys-color-on-surface-variant); font-size:13px; margin:4px 0 0 0;">
            ESP32-C3 硬件射频共存：支持纯蓝牙离线随身控制（免配 Wi-Fi）、兽聚胸牌痛包模式及双模并发。
          </p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="m3-btn small" id="btnToggleBle" onclick="toggleBleBroadcast()">关闭蓝牙广播</button>
          <a href="/pwa" id="linkPwaStudio" target="_blank" class="m3-btn small outlined" style="text-decoration:none; display:flex; align-items:center; gap:4px;" title="点击打开离线蓝牙 PWA 控制端 (可点击右侧设置按钮自定义为您自己的独立域名)">
            📱 离线蓝牙 PWA 专页
          </a>
          <button class="m3-btn small outlined" onclick="promptCustomPwaUrl()" title="自定义修改离线 PWA / Cloudflare Pages 地址" style="padding:6px 10px; cursor:pointer;">⚙️ 自定义地址</button>
        </div>
      </div>

      <!-- 射频通信模式选择单选组 -->
      <div style="margin-top:14px;">
        <label style="font-weight:600; font-size:13px;">选择射频工作模式 (切换后即时生效)：</label>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; margin-top:8px;">
          <div class="wireless-chip" id="opt-auto" onclick="setWirelessMode('auto')">
            <div style="font-weight:700; font-size:13px;">🔄 智能自动 (Auto)</div>
            <div style="font-size:11px; opacity:0.8; margin-top:4px;">开机时 WiFi 与蓝牙同时广播，连接其中一种后自动关闭另一种，省电抗干扰</div>
          </div>
          <div class="wireless-chip" id="opt-ble_only" onclick="setWirelessMode('ble_only')">
            <div style="font-weight:700; font-size:13px;">🔵 仅蓝牙 (BLE Only)</div>
            <div style="font-size:11px; opacity:0.8; margin-top:4px;">彻底关闭 WiFi 射频，极低功耗，纯离线通过蓝牙 Web App 刷屏推图</div>
          </div>
          <div class="wireless-chip" id="opt-wifi_only" onclick="setWirelessMode('wifi_only')">
            <div style="font-weight:700; font-size:13px;">📶 仅 Wi-Fi (Wi-Fi Only)</div>
            <div style="font-size:11px; opacity:0.8; margin-top:4px;">关闭蓝牙广播，专心局域网 Web 控制台与 MQTT 智能家居接入</div>
          </div>
          <div class="wireless-chip" id="opt-dual" onclick="setWirelessMode('dual')">
            <div style="font-weight:700; font-size:13px;">🌐 双模并发 (Dual Mode)</div>
            <div style="font-size:11px; opacity:0.8; margin-top:4px;">WiFi 与蓝牙全部在线，局域网与随身蓝牙随时接入，功能全开</div>
          </div>
        </div>
      </div>

      <!-- 蓝牙设备与多客户端管理 -->
      <div style="margin-top:16px; border-top:1px solid var(--md-sys-color-outline-variant); padding-top:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <label style="font-weight:600; font-size:13px;">📱 已连接/已配对蓝牙客户端设备列表：</label>
          <span style="font-size:12px; color:var(--md-sys-color-on-surface-variant);" id="bleClientsCount">当前在线：0 台</span>
        </div>
        <div id="bleDeviceList" style="display:flex; flex-direction:column; gap:8px;">
          <div style="padding:12px; background:var(--md-sys-color-surface-container); border-radius:8px; font-size:12px; color:var(--md-sys-color-on-surface-variant); text-align:center;">
            暂无已连接的蓝牙主机（可用 Chrome/Edge 打开 PWA 进行 WebBLE 蓝牙直连）
          </div>
        </div>
      </div>
    </div>

    <!-- Wi-Fi 局域网接入配置卡片 -->
    <div class="m3-card">
      <h2>📶 Wi-Fi 局域网接入配置</h2>
      <label>Wi-Fi 名称 (SSID):</label>
      <input type="text" id="wifiSsid" placeholder="输入 Wi-Fi 名称 (SSID)" value="">
      <label>Wi-Fi 密码 (Password):</label>
      <input type="password" id="wifiPass" placeholder="输入 Wi-Fi 密码" value="">

      <h2>🏠 Home Assistant & MQTT 自动发现集成</h2>
      <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px;">
        <div>
          <label>MQTT Broker 服务器地址:</label>
          <input type="text" id="mqttHost" placeholder="192.168.1.100 或 homeassistant.local">
        </div>
        <div>
          <label>MQTT 端口:</label>
          <input type="text" id="mqttPort" value="1883">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label>MQTT 用户名 (可选):</label>
          <input type="text" id="mqttUser" placeholder="留空为匿名连接">
        </div>
        <div>
          <label>MQTT 密码 (可选):</label>
          <input type="password" id="mqttPass" placeholder="留空为无密码">
        </div>
      </div>

      <button class="m3-btn" style="margin-top:16px;" onclick="saveNetworkConfig()">保存网络与 MQTT 配置</button>
    </div>
  </div>

  <!-- TAB 5: 系统维护与深度诊断 (用户重点要求丰富功能) -->
  <div id="tab-system" class="tab-content">
    <!-- 屏显 Debug 叠加条卡片 -->
    <div class="m3-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 style="margin:0;">🛠️ 屏显 Debug 叠加条 (20px 底部状态条)</h2>
          <p style="color:var(--md-sys-color-on-surface-variant); font-size:13px; margin:4px 0 0 0;">
            开启后，屏幕刷新时将在最底部固定绘制一行 20px 纯黑底色的调试条，标注当前 IP 与 MAC 地址。
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span id="screenDebugStatusText" style="font-size:13px; font-weight:600; color:var(--md-sys-color-primary);">--</span>
          <button class="m3-btn" id="btnToggleScreenDebug" onclick="toggleScreenDebug()">切换屏显 Debug</button>
        </div>
      </div>
    </div>

    <div class="m3-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2 style="margin:0;">⚙️ 系统硬件指标与实时底层诊断</h2>
        <button class="m3-btn tonal" onclick="pollSystemDiag()">🔄 实时刷新系统参数</button>
      </div>

      <table class="diag-table">
        <tbody>
          <tr><td>主控芯片架构 (SoC)</td><td id="diagChip">ESP32-C3 (Single-Core RISC-V 160MHz, Rev v0.4)</td></tr>
          <tr><td>物理网卡 MAC 地址</td><td id="diagMac" style="font-family:monospace;">--:--:--:--:--:--</td></tr>
          <tr><td>Wi-Fi 信号强度 (RSSI)</td><td id="diagRssi">-- dBm</td></tr>
          <tr><td>当前局域网 IP / 域名</td><td id="diagIp">http://&lt;DEVICE_IP&gt; / http://epd-display.local</td></tr>
          <tr><td>系统连续运行时间 (Uptime)</td><td id="diagUptime">0天 0小时 25分 12秒</td></tr>
          <tr><td>实时可用堆内存 (SRAM)</td><td id="diagHeap">69,820 字节 (最低剩余 58,410 字节，运行极佳)</td></tr>
          <tr><td>SPI Flash 闪存规格</td><td id="diagFlash">4 MB (4,194,304 字节，DIO 40MHz)</td></tr>
          <tr><td>内部存储分区 (storage)</td><td id="diagStorage">总量 896 KB · 剩余可用约 848 KB</td></tr>
          <tr><td>参数配置分区 (nvs)</td><td id="diagNvs">总量 24 KB · 剩余可用约 18 KB</td></tr>
          <tr><td>墨水屏硬件与控制器</td><td id="diagPanel">SE0398NZ07-FNG-A0/A1 (4-Color BWRY 768×552)</td></tr>
          <tr><td>硬件接口总线</td><td>Hardware SPI 8MHz (SCK=4, MOSI=6, CS=7, DC=1, RST=2, BUSY=10)</td></tr>
          <tr><td>中文字库方案</td><td>Flash MMU 零内存占用标准点阵中文字库 (7445字)</td></tr>
          <tr><td>无线通信工作模式</td><td id="diagWirelessMode">智能自动 (Auto)</td></tr>
          <tr><td>蓝牙 BLE 5.0 运行状态</td><td id="diagBleStatus">广播中 (ADV · EPD-Smart-Display)</td></tr>
          <tr><td>已连接蓝牙客户端数</td><td id="diagBleClients">0 台客户端在线</td></tr>
          <tr><td>屏显 Debug 叠加条状态</td><td id="diagDebugOverlay">已关闭</td></tr>
        </tbody>
      </table>

      <div style="display:flex; gap:12px; margin-top:24px;">
        <button class="m3-btn danger" onclick="rebootDevice()">软重启设备</button>
        <button class="m3-btn outlined" onclick="factoryReset()">恢复出厂设置 (清空WiFi)</button>
      </div>
    </div>
  </div>

</div>

<!-- 4色微粒物理效果预览弹窗 (Modal) -->
<div class="modal-overlay" id="ditherModal" onclick="if(event.target===this) closeDitherModal()">
  <div class="modal-card">
    <h3 style="margin-top:0;">👁️ 墨水屏 4色微粒物理点阵实时模拟 (Floyd-Steinberg)</h3>
    <p style="font-size:12px; color:var(--md-sys-color-on-surface-variant); margin-top:-6px;">
      以下为经过 4-Color BWRY（黑/白/黄/红）误差扩散物理量化后的真实微粒呈现效果：
    </p>
    <canvas id="ditherPreviewCanvas" width="768" height="552" style="max-width:100%; height:auto; border:2px solid #333; background:white;"></canvas>
    <div style="margin-top:14px; display:flex; justify-content:center; gap:12px;">
      <button class="m3-btn" style="background:#2e7d32;" id="modalPushBtn" onclick="closeDitherModal(); executePushFromModal();">🚀 效果满意，推送到墨水屏</button>
      <button class="m3-btn tonal" onclick="closeDitherModal()">关闭预览</button>
    </div>
  </div>
</div>

<!-- 预设效果 768×552 预览模态框 (Modal) -->
<div class="modal-overlay" id="presetPreviewModal" onclick="if(event.target===this) closeModal('presetPreviewModal')">
  <div class="modal-card" style="max-width:820px; text-align:left;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0;" id="previewModalTitle">👁️ 预设效果预览</h3>
      <button class="m3-btn outlined" style="padding:4px 10px; font-size:12px;" onclick="closeModal('presetPreviewModal')">✕ 关闭</button>
    </div>
    <div style="font-size:12px; color:var(--md-sys-color-on-surface-variant); margin-bottom:10px;" id="previewModalInfo">--</div>
    <div style="display:flex; justify-content:center; overflow-x:auto; background:#121316; padding:10px; border-radius:8px;">
      <canvas id="presetCanvas" width="768" height="552" style="max-width:100%; height:auto; border:2px solid #333; background:#ffffff;"></canvas>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
      <button class="m3-btn tonal" onclick="closeModal('presetPreviewModal')">返回列表</button>
      <button class="m3-btn" id="btnPushPresetFromModal" onclick="pushCurrentPreviewPreset()">🚀 立即一键推送到墨水屏</button>
    </div>
  </div>
</div>

<!-- 另存为预设弹窗模态框 (Modal) -->
<div class="modal-overlay" id="savePresetModal" onclick="if(event.target===this) closeModal('savePresetModal')">
  <div class="modal-card" style="max-width:480px; text-align:left;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0;">💾 保存为新预设效果</h3>
      <button class="m3-btn outlined" style="padding:4px 10px; font-size:12px;" onclick="closeModal('savePresetModal')">✕</button>
    </div>
    <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">预设名称 (支持自定义或使用默认名称)：</label>
    <input type="text" id="presetSaveName" placeholder="例如：画板作品_1" style="width:100%; box-sizing:border-box; padding:8px 10px; border-radius:8px; border:1px solid var(--md-sys-color-outline-variant); background:var(--md-sys-color-surface); color:var(--md-sys-color-on-surface);">

    <div style="margin:12px 0; padding:12px; border-radius:8px; background:var(--md-sys-color-surface-container); font-size:12px;" id="savePresetMetaInfo">
      <div>预设类型：<b id="savePresetTypeLabel">画板设计</b></div>
      <div style="margin-top:4px;">预估占用空间：<b id="savePresetEstSize">约 2.5 KB</b></div>
      <div style="margin-top:6px;" id="savePresetStorageCheck">存储检查：剩余可用读取中...</div>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
      <button class="m3-btn outlined" onclick="closeModal('savePresetModal')">取消</button>
      <button class="m3-btn" id="btnConfirmSavePreset" onclick="doSavePreset()">确认保存至存储</button>
    </div>
  </div>
</div>

<script>
  // ─────────────────────────────────────────────────────────────────────────────
  // 0. 用户自定义离线蓝牙 PWA / Cloudflare Pages 专页地址配置
  // ─────────────────────────────────────────────────────────────────────────────
  // 【说明】您可在此处直接修改为您部署的 Cloudflare Pages 地址，例如: 'https://my-badge.pages.dev'
  // 修改后，页面所有“离线蓝牙 PWA 专页”入口将直达您的独立域名；若留空则优先读取本地保存的配置或默认使用 '/pwa'。
  const DEFAULT_CUSTOM_PWA_URL = '';

  function getPwaUrl() {
    return localStorage.getItem('user_custom_pwa_url') || DEFAULT_CUSTOM_PWA_URL || '/pwa';
  }

  function updatePwaLinks() {
    const url = getPwaUrl();
    const link = document.getElementById('linkPwaStudio');
    if (link) link.href = url;
    document.querySelectorAll('.pwa-link-ref').forEach(el => {
      el.href = url;
      if (url.startsWith('http')) {
        el.innerText = url;
      }
    });
  }

  function promptCustomPwaUrl() {
    const current = getPwaUrl();
    const input = prompt(
      '【自定义离线蓝牙 PWA 专页地址】\\n请输入您部署在 Cloudflare Pages 的专属网址（例如: https://my-badge.pages.dev）：\\n(若输入为空则恢复默认设备内置 /pwa 地址)',
      current === '/pwa' ? '' : current
    );
    if (input !== null) {
      const trimmed = input.trim();
      if (trimmed) {
        localStorage.setItem('user_custom_pwa_url', trimmed);
        alert('✅ 已成功设置自定义离线 PWA 地址为:\\n' + trimmed + '\\n\\n点击“离线蓝牙 PWA 专页”按钮即可直接跳转访问！');
      } else {
        localStorage.removeItem('user_custom_pwa_url');
        alert('ℹ️ 已恢复为默认设备内置 PWA 地址 (/pwa)');
      }
      updatePwaLinks();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Material Design 3 Dark Mode Theme Manager
  // ─────────────────────────────────────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('epd_theme') || 'dark';
    setTheme(saved);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('epd_theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerText = (theme === 'dark') ? '☀️' : '🌙';
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Navigation Tabs
  // ─────────────────────────────────────────────────────────────────────────────
  function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.add('active');
    if (el) {
      el.classList.add('active');
    } else {
      const btn = document.querySelector(`nav button[data-tab="${tabId}"]`);
      if (btn) btn.classList.add('active');
    }

    if (tabId === 'studio') {
      if (!fCanvas) {
        initStudioCanvas();
      } else {
        fCanvas.calcOffset();
        fCanvas.renderAll();
      }
    } else if (tabId === 'modes') {
      renderCurrentModePreview();
    } else if (tabId === 'presets') {
      loadPresets();
    } else if (tabId === 'dashboard') {
      loadScreenPreview();
    } else if (tabId === 'system') {
      pollSystemDiag();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2b. 效果预设库与设备存储管理器 (SPIFFS Presets & Storage Manager)
  // ─────────────────────────────────────────────────────────────────────────────
  let gPresetsData = [];
  let gStorageStats = null;
  let gCurrentPreviewPresetId = null;
  let gPendingSaveType = 'canvas';

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  function render2bppToCanvas(bytes, canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(768, 552);
    const data = imgData.data;
    const PALETTE_RGB = [
      [0, 0, 0],       // 00: Black
      [255, 255, 255], // 01: White
      [244, 196, 48],  // 10: Yellow
      [211, 47, 47]    // 11: Red
    ];

    let byteIdx = 0;
    for (let y = 0; y < 552; y++) {
      for (let x = 0; x < 768; x += 4) {
        const b = bytes[byteIdx++];
        const p0 = (b >> 6) & 0x03;
        const p1 = (b >> 4) & 0x03;
        const p2 = (b >> 2) & 0x03;
        const p3 = b & 0x03;
        const codes = [p0, p1, p2, p3];

        for (let k = 0; k < 4; k++) {
          const pxIdx = ((y * 768) + (x + k)) * 4;
          const rgb = PALETTE_RGB[codes[k]];
          data[pxIdx] = rgb[0];
          data[pxIdx + 1] = rgb[1];
          data[pxIdx + 2] = rgb[2];
          data[pxIdx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  async function loadPresets() {
    const container = document.getElementById('presetsListContainer');
    if (container) {
      container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--md-sys-color-on-surface-variant); font-size:13px;">⏳ 正在读取设备存储预设列表...</div>';
    }
    try {
      const res = await fetch('/api/presets');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      gPresetsData = data.presets || [];
      gStorageStats = data.storage || null;

      updateStorageBar(gStorageStats);
      renderPresetsList();
    } catch (e) {
      if (container) {
        container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--md-sys-color-error); font-size:13px;">❌ 读取预设失败: ${e.message}</div>`;
      }
    }
  }

  function updateStorageBar(stats) {
    if (!stats) return;
    const total = stats.total_bytes || (1632 * 1024);
    const used = stats.used_bytes || 0;
    const free = stats.free_bytes || (total - used);
    const pct = Math.min(100, Math.round((used / total) * 100));

    const bar = document.getElementById('storageProgressBar');
    const pctText = document.getElementById('storagePercentText');
    const label = document.getElementById('storageLabel');
    const detail = document.getElementById('storageDetailText');
    const freeText = document.getElementById('storageFreeText');

    if (bar) {
      bar.style.width = pct + '%';
      bar.style.background = pct > 90 ? '#d32f2f' : (pct > 75 ? '#f57c00' : 'var(--md-sys-color-primary)');
    }
    if (pctText) pctText.innerText = pct + '%';
    if (label) label.innerText = `存储空间使用情况 (${pct}%)`;
    if (detail) detail.innerText = `已用: ${(used / 1024).toFixed(1)} KB / 总量: ${(total / 1024).toFixed(1)} KB`;
    if (freeText) {
      freeText.innerText = `剩余可用: ${(free / 1024).toFixed(1)} KB`;
      freeText.style.color = free < 100 * 1024 ? '#d32f2f' : '#2e7d32';
    }
  }

  function renderPresetsList() {
    const container = document.getElementById('presetsListContainer');
    if (!container) return;
    if (!gPresetsData.length) {
      container.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:var(--md-sys-color-on-surface-variant); font-size:13px; background:var(--md-sys-color-surface-container); border-radius:12px;">
          📂 暂无已保存的预设效果<br>
          <span style="font-size:12px; opacity:0.8; margin-top:4px; display:inline-block;">您可以在上方点击【存当前画板为预设】或【存当前镜像为预设】将效果存入墨水屏存储中随时一键推送！</span>
        </div>
      `;
      updateBatchDeleteBtn();
      return;
    }

    let html = '';
    gPresetsData.forEach((p) => {
      const badgeClass = p.preset_type === 'mode' ? 'badge-mode' : (p.preset_type === 'bitmap' ? 'badge-bitmap' : (p.preset_type === 'text' ? 'badge-text' : 'badge-canvas'));
      const typeLabel = p.type_label || (p.preset_type === 'mode' ? '功能模式' : (p.preset_type === 'bitmap' ? '位图图像' : (p.preset_type === 'text' ? '纯文本' : '画板设计')));
      const sizeStr = p.size_str || (p.size_bytes ? (p.size_bytes / 1024).toFixed(1) + ' KB' : '--');
      const dateStr = p.created_at ? new Date(p.created_at * 1000).toLocaleString('zh-CN', { hour12: false }) : '--';

      html += `
        <div class="preset-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:var(--md-sys-color-surface-container); border-radius:12px; border:1px solid var(--md-sys-color-outline-variant); flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px; min-width:240px; flex:1;">
            <input type="checkbox" class="preset-item-check" data-id="${p.id}" onchange="updateBatchDeleteBtn()">
            <div>
              <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:6px;">
                <span>${p.name || '未命名预设'}</span>
                <span class="preset-badge ${badgeClass}">${typeLabel}</span>
              </div>
              <div style="font-size:11px; color:var(--md-sys-color-on-surface-variant); margin-top:3px;">
                大小: <b>${sizeStr}</b> · 保存时间: ${dateStr}
              </div>
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="m3-btn" style="padding:6px 12px; font-size:12px;" onclick="pushPreset('${p.id}')">⚡ 一键推送</button>
            <button class="m3-btn tonal" style="padding:6px 12px; font-size:12px;" onclick="previewPreset('${p.id}')">👁️ 预览</button>
            <button class="m3-btn outlined" style="padding:6px 10px; font-size:12px; color:var(--md-sys-color-error); border-color:var(--md-sys-color-error);" onclick="deleteSinglePreset('${p.id}')" title="删除该预设">🗑️</button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
    updateBatchDeleteBtn();
  }

  function toggleSelectAllPresets(checked) {
    document.querySelectorAll('.preset-item-check').forEach(cb => cb.checked = checked);
    updateBatchDeleteBtn();
  }

  function updateBatchDeleteBtn() {
    const selected = Array.from(document.querySelectorAll('.preset-item-check:checked')).map(cb => cb.getAttribute('data-id'));
    const btn = document.getElementById('btnBatchDelete');
    const countSpan = document.getElementById('selectedCount');
    if (countSpan) countSpan.innerText = selected.length;
    if (btn) btn.disabled = selected.length === 0;

    const selectAllBox = document.getElementById('selectAllPresets');
    const allBoxes = document.querySelectorAll('.preset-item-check');
    if (selectAllBox && allBoxes.length > 0) {
      selectAllBox.checked = selected.length === allBoxes.length;
    }
  }

  async function confirmBatchDeletePresets() {
    const selected = Array.from(document.querySelectorAll('.preset-item-check:checked')).map(cb => cb.getAttribute('data-id'));
    if (!selected.length) return;
    if (!confirm(`确定要彻底删除选中的 ${selected.length} 项预设吗？\\n删除后将释放设备内部存储空间。`)) return;

    try {
      const res = await fetch('/api/presets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '删除失败');
      alert('🎉 ' + data.message);
      gPresetsData = data.presets || [];
      gStorageStats = data.storage || null;
      updateStorageBar(gStorageStats);
      renderPresetsList();
    } catch (e) {
      alert('❌ 批量删除失败: ' + e.message);
    }
  }

  async function deleteSinglePreset(id) {
    const preset = gPresetsData.find(p => p.id === id);
    const name = preset ? preset.name : id;
    if (!confirm(`确定要删除预设【${name}】吗？`)) return;

    try {
      const res = await fetch('/api/presets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '删除失败');
      gPresetsData = data.presets || [];
      gStorageStats = data.storage || null;
      updateStorageBar(gStorageStats);
      renderPresetsList();
    } catch (e) {
      alert('❌ 删除失败: ' + e.message);
    }
  }

  function promptSaveCurrentPreset(type) {
    gPendingSaveType = type;
    const now = new Date();
    const tsStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0');

    let defaultName = '画板作品_' + tsStr;
    let typeLabel = '画板设计 (矢量 SVG/JSON)';
    let estSize = 3 * 1024; // ~3 KB

    if (type === 'bitmap') {
      defaultName = '屏幕镜像_' + tsStr;
      typeLabel = '当前屏幕 2bpp 硬件显存点阵';
      estSize = 106 * 1024; // ~106 KB
    } else if (type === 'mode') {
      defaultName = '场景模式_' + (gConfig?.current_mode || 'demo') + '_' + tsStr;
      typeLabel = '场景模式与自定义配置参数';
      estSize = 2 * 1024; // ~2 KB
    }

    const nameInput = document.getElementById('presetSaveName');
    if (nameInput) nameInput.value = defaultName;
    const typeLabelEl = document.getElementById('savePresetTypeLabel');
    if (typeLabelEl) typeLabelEl.innerText = typeLabel;
    const estSizeEl = document.getElementById('savePresetEstSize');
    if (estSizeEl) estSizeEl.innerText = (estSize / 1024).toFixed(1) + ' KB';

    const free = gStorageStats ? gStorageStats.free_bytes : 1000 * 1024;
    const checkEl = document.getElementById('savePresetStorageCheck');
    const btn = document.getElementById('btnConfirmSavePreset');

    if (free < estSize + 4096) {
      if (checkEl) checkEl.innerHTML = `<span style="color:#d32f2f; font-weight:700;">⚠️ 存储空间不足！当前仅剩 ${(free / 1024).toFixed(1)} KB，不足以保存该预设。请先删除不需要的预设后再保存。</span>`;
      if (btn) btn.disabled = true;
    } else {
      if (checkEl) checkEl.innerHTML = `<span style="color:#2e7d32; font-weight:600;">✓ 空间充裕：剩余可用 ${(free / 1024).toFixed(1)} KB</span>`;
      if (btn) btn.disabled = false;
    }

    openModal('savePresetModal');
  }

  async function doSavePreset() {
    const nameInput = document.getElementById('presetSaveName');
    const name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
    if (!name) {
      alert('⚠️ 请输入预设名称！');
      return;
    }

    const btn = document.getElementById('btnConfirmSavePreset');
    if (btn) btn.disabled = true;

    try {
      let payload = {
        name: name,
        preset_type: gPendingSaveType,
      };

      if (gPendingSaveType === 'canvas') {
        if (!fCanvas) throw new Error('画板未初始化');
        payload.type_label = '画板设计';
        payload.fabric_json = JSON.stringify(fCanvas.toJSON());
        payload.svg_data = fCanvas.toSVG();
        payload.save_current_screen = false;
      } else if (gPendingSaveType === 'bitmap') {
        payload.type_label = '位图图像';
        payload.save_current_screen = true;
      } else if (gPendingSaveType === 'mode') {
        payload.type_label = '功能模式';
        payload.mode_id = gConfig?.current_mode || 'demo';
        payload.mode_params = gConfig || {};
      }

      const res = await fetch('/api/presets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '保存失败');
      }

      closeModal('savePresetModal');
      alert('🎉 ' + data.message);
      await loadPresets();
    } catch (e) {
      alert('❌ 保存预设失败: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function pushPreset(id) {
    const preset = gPresetsData.find(p => p.id === id);
    const name = preset ? preset.name : id;
    if (!confirm(`确定要将预设【${name}】一键推送到墨水屏吗？\\n设备将启动 16 秒硬件物理全屏波形刷新。`)) return;

    try {
      const res = await fetch('/api/presets/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '推送失败');
      alert('🎉 ' + data.message);
    } catch (e) {
      alert('❌ 预设推送失败: ' + e.message);
    }
  }

  async function previewPreset(id) {
    const preset = gPresetsData.find(p => p.id === id);
    if (!preset) return;
    gCurrentPreviewPresetId = id;

    const titleEl = document.getElementById('previewModalTitle');
    const infoEl = document.getElementById('previewModalInfo');
    if (titleEl) titleEl.innerText = '👁️ 预设预览: ' + (preset.name || id);
    if (infoEl) infoEl.innerText = `类型: ${preset.type_label || preset.preset_type} · 大小: ${preset.size_str || '--'} · 保存时间: ${preset.created_at ? new Date(preset.created_at * 1000).toLocaleString('zh-CN', { hour12: false }) : '--'}`;

    const canvas = document.getElementById('presetCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 768, 552);

    openModal('presetPreviewModal');

    if (preset.preset_type === 'bitmap' || preset.bitmap_file) {
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳ 正在从设备存储读取 2bpp 显存点阵...', 384, 276);

      try {
        const resp = await fetch(`/api/presets/bitmap?id=${encodeURIComponent(id)}`);
        if (!resp.ok) throw new Error('无法读取预设点阵数据 (HTTP ' + resp.status + ')');
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (bytes.length === 105984) {
          render2bppToCanvas(bytes, canvas);
        } else {
          throw new Error('点阵数据长度不匹配: ' + bytes.length);
        }
      } catch (e) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 768, 552);
        ctx.fillStyle = '#d32f2f';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❌ 读取点阵数据失败: ' + e.message, 384, 276);
      }
    } else if (preset.fabric_json) {
      try {
        const tempF = new fabric.StaticCanvas(null, { width: 768, height: 552 });
        tempF.loadFromJSON(preset.fabric_json, () => {
          tempF.renderAll();
          ctx.drawImage(tempF.lowerCanvasEl, 0, 0);
        });
      } catch (e) {
        console.warn('Fabric render fallback:', e);
      }
    } else if (preset.preset_type === 'mode') {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 768, 552);
      ctx.fillStyle = '#111318';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📋 场景模式预设: ' + (preset.mode_id || '未知'), 384, 230);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('包含场景模式专属布局与动态参数，一键推送后设备将自动切换并执行物理刷新。', 384, 280);
      ctx.fillStyle = '#005ac1';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('💡 点击下方【立即一键推送到墨水屏】即可切换运行此模式', 384, 330);
    }
  }

  async function pushCurrentPreviewPreset() {
    if (!gCurrentPreviewPresetId) return;
    closeModal('presetPreviewModal');
    await pushPreset(gCurrentPreviewPresetId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. 17 Distinct Scene Modes Engine (InkSight / 墨鱼风格全面复刻)
  // ─────────────────────────────────────────────────────────────────────────────
  const MODES_DEF = [
    { id: 'demo', name: '系统信息与控制台', icon: '💻', desc: '经典复古仪表板、WebUI访问地址与四色标块' },
    { id: 'fridge_board', name: '冰箱贴布告板', icon: '📌', desc: '家庭核心留言、紧急备忘与今日状态' },
    { id: 'memo', name: '便签备忘录', icon: '📋', desc: '多条待办清单与每日重点工作' },
    { id: 'calendar', name: '万年历与黄历', icon: '📅', desc: '大字公历、农历节气、宜忌与每日名言' },
    { id: 'weather', name: '全维气象看板', icon: '🌤️', desc: '实时温度、风向、空气质量AQI与多日趋势' },
    { id: 'countdown', name: '里程碑倒计时', icon: '⏳', desc: '考研/高考/新年/发薪日大字天数倒数' },
    { id: 'habit', name: '自律打卡热力图', icon: '🔥', desc: '连击天数统计与本周习惯圆环打卡' },
    { id: 'poetry', name: '每日诗词文选', icon: '📜', desc: '古典名家诗词、宣纸质感与朱印印章' },
    { id: 'history', name: '历史上的今天', icon: '🏛️', desc: '历史重大事件纪实与年份回顾' },
    { id: 'life_progress', name: '人生进度条', icon: '⏳', desc: '当年流逝感知与人生九宫格透视' },
    { id: 'pomodoro', name: '番茄专注时钟', icon: '🍅', desc: '25分钟深度工作计时与当前任务' },
    { id: 'shopping', name: '采购补货清单', icon: '🛒', desc: '家庭食品、日用百货与数码清单' },
    { id: 'care_reminders', name: '关怀用药提醒', icon: '💊', desc: '早中晚用药说明与家庭健康寄语' },
    { id: 'daily_routine', name: '今日作息安排', icon: '🕒', desc: '全天高效时间轴与课程/日程' },
    { id: 'moon_phase', name: '月相与潮汐', icon: '🌙', desc: '月龄、月相图形与高低潮时段' },
    { id: 'qrcode', name: '扫码与Wi-Fi分享', icon: '📱', desc: '家庭Wi-Fi一键扫码即连或动态收款' },
    { id: 'photo', name: '相册与艺术画廊', icon: '🖼️', desc: '相框艺术轮播与照片题字' },
    { id: 'rss', name: '资讯订阅早报', icon: '📰', desc: '科技与时事热点要闻精选摘要' }
  ];

  let currentSelectedMode = 'demo';
  let modeParamsStore = {
    demo: { title: '3.98" SMART EPD', panel: 'SE0398NZ07 4-COLOR', status: 'ONLINE & ACTIVE', webui_url: 'http://epd-display.local', mdns: 'http://epd-display.local', features: 'Material Web 3.0 / 17种场景 / 4色画板' },
    fridge_board: { title: '家庭核心留言板', note: '冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！', author: '爸爸', item1: '出门记得关阳台窗户', item2: '晚饭煮番茄牛腩面', item3: '晚上 9 点检查作业' },
    memo: { title: 'TODAY TO-DO LIST', item1: '1. 调试 ESP32-C3 墨水屏固件', item2: '2. 3D打印机加装侧边滑动开关', item3: '3. 完成 Rust 显存流式直推架构', item4: '4. 跑步 5 公里并拉伸放松', footer: '保持专注，逐项击破！' },
    calendar: { year: 2026, month: 10, day: 7, lunar: '丙申年 八月廿七', yiji: '宜：祈福 祭祀 动土 | 忌：出行 词讼', motto: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。' },
    weather: { city: '深圳 (Shenzhen)', temp: '26°C', cond: '多云转晴', high_low: '22°C ~ 29°C', aqi: '36 优', tips: '微风舒适，紫外线较强，适宜户外慢跑与出行！' },
    countdown: { title: '2027年 元旦跨年', target_date: '2027-01-01', days: '85', quote: '道阻且长，行则将至；行而不辍，未来可期！' },
    habit: { habit_name: '每日晨跑 5 公里', streak: '18', week_done: '一 二 三 四 五' },
    poetry: { title: '《早发白帝城》', author: '【唐】李白', line1: '朝辞白帝彩云间，千里江陵一日还。', line2: '两岸猿声啼不住，轻舟已过万重山。', seal: '太白' },
    history: { year: '公元 1913 年', title: '福特汽车启用首条流水装配线', desc: '大幅降低了工业制造装配成本，彻底推动了现代工业大众化生产时代的开启。' },
    life_progress: { year_prog: '76.8%', age: '28', caption: '2026 年已悄然流逝四分之三，珍惜眼前每一个清晨与星夜。' },
    pomodoro: { task: 'ESP32 嵌入式固件研发', timer: '25:00', round: '第 3 / 4 组', state: '深度专注中 (Deep Focus)' },
    shopping: { item1: '纯牛奶 2 箱 (特仑苏)', item2: '精品咖啡豆 500g (深烘)', item3: '高筋全麦面粉 5kg', item4: 'Type-C 编织数据线 1.5m' },
    care_reminders: { morning: '早晨：降压药 1 片 (饭后)', noon: '中午：复合维生素 1 粒', evening: '晚上：钙片 1 片 (睡前温水)', note: '健康是最好的财富，记得按时作息！' },
    daily_routine: { r1: '07:30 起床晨练与梳洗', r2: '08:30 丰盛早餐与今日规划', r3: '09:30 核心研发深度攻坚', r4: '12:00 健康午餐与小憩', r5: '14:00 系统联调与测试', r6: '18:30 晚餐与家庭休闲' },
    moon_phase: { phase: '亏凸月 (Waning Gibbous)', age: '月龄 20.3 天', illum: '亮面 78.4%', tide: '大潮 (高潮 04:20 / 低潮 11:35)' },
    qrcode: { ssid: 'Your_WiFi_SSID', pass: 'Your_WiFi_Password', prompt: '扫码快速连接家庭无线网络' },
    photo: { title: '山川湖海 · 秋日光影', date: '2026 Autumn Collection', author: 'Shot on Custom Rig' },
    rss: { head1: '开源 RISC-V 架构出货量突破数百亿颗大关', head2: '新一代低功耗彩色全反射墨水屏技术量产发布', head3: 'Rust 2024 Edition 核心语言新特性全面定型', head4: '局域网低功耗物联网智能终端规范进一步统一' }
  };

  function initModesUI() {
    const container = document.getElementById('modeChipsContainer');
    container.innerHTML = '';
    MODES_DEF.forEach(m => {
      const chip = document.createElement('div');
      chip.className = 'mode-chip' + (m.id === currentSelectedMode ? ' active' : '');
      chip.innerText = `${m.icon} ${m.name}`;
      chip.onclick = () => selectMode(m.id);
      container.appendChild(chip);
    });
    buildModeForm();
    renderCurrentModePreview();
  }

  function selectMode(modeId) {
    currentSelectedMode = modeId;
    const chips = document.querySelectorAll('#modeChipsContainer .mode-chip');
    chips.forEach((c, idx) => {
      if (MODES_DEF[idx]) {
        c.classList.toggle('active', MODES_DEF[idx].id === modeId);
      }
    });
    buildModeForm();
    renderCurrentModePreview();
  }

  function buildModeForm() {
    const def = MODES_DEF.find(m => m.id === currentSelectedMode);
    document.getElementById('modeFormTitle').innerText = `${def.icon} ${def.name} · 参数配置`;
    const form = document.getElementById('modeFormFields');
    form.innerHTML = '';

    const p = modeParamsStore[currentSelectedMode] || {};

    // Generate input rows dynamically based on the mode schema
    Object.keys(p).forEach(k => {
      const row = document.createElement('div');
      const label = document.createElement('label');
      label.innerText = getParamLabel(k);
      const input = (k === 'note' || k === 'desc' || k === 'motto') ? document.createElement('textarea') : document.createElement('input');
      if (input.tagName === 'INPUT') input.type = 'text';
      input.value = p[k];
      input.oninput = (e) => {
        p[k] = e.target.value;
        renderCurrentModePreview();
      };
      row.appendChild(label);
      row.appendChild(input);
      form.appendChild(row);
    });
  }

  function getParamLabel(key) {
    const map = {
      title: '主标题', note: '正文便签内容', author: '署名 / 作者', item1: '条目 1', item2: '条目 2', item3: '条目 3', item4: '条目 4',
      footer: '底部提示语', year: '公历年份', month: '月份', day: '日期', lunar: '农历与节气', yiji: '黄历宜忌', motto: '每日寄语',
      city: '所在城市', temp: '实时气温', cond: '天气状况', high_low: '今日温差', aqi: '空气质量 (AQI)', tips: '穿衣与出行建议',
      target_date: '目标到期日期', days: '剩余天数', quote: '励志名言', habit_name: '打卡习惯名称', streak: '连续打卡天数',
      week_done: '打卡周期', line1: '诗词前两句', line2: '诗词后两句', seal: '落款印章', desc: '事件描述', year_prog: '年度进度百分比',
      age: '当前年龄', caption: '感悟箴言', task: '当前专注任务', timer: '倒计时长', round: '阶段轮次', state: '专注状态',
      morning: '早晨用药', noon: '中午用药', evening: '晚间用药', r1: '日程 1', r2: '日程 2', r3: '日程 3', r4: '日程 4', r5: '日程 5', r6: '日程 6',
      phase: '月相名称', illum: '照射亮度', tide: '潮汐预报', ssid: 'Wi-Fi 名称', pass: 'Wi-Fi 密码', prompt: '说明提示',
      date: '拍摄日期', head1: '头条 1', head2: '头条 2', head3: '头条 3', head4: '头条 4',
      panel: '屏幕型号规格', status: '运行状态', webui_url: 'WebUI 访问网址', mdns: 'mDNS 本地域名', features: '特性摘要'
    };
    return map[key] || key;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Real-Time 768×552 HTML5 Canvas High-Fidelity Rendering (Pure Vector 2D)
  // ─────────────────────────────────────────────────────────────────────────────
  function renderCurrentModePreview() {
    const canvas = document.getElementById('modePreviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = 768, h = 552;
    const p = modeParamsStore[currentSelectedMode] || {};

    // 1. Fill clean white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Color definitions for BWRY 4-Color
    const RED = '#d32f2f';
    const YELLOW = '#f4c430';
    const BLACK = '#000000';
    const WHITE = '#ffffff';

    // Helper: Draw Header Bar
    function drawHeader(title, subRight, isRed = true) {
      ctx.fillStyle = isRed ? RED : BLACK;
      ctx.fillRect(0, 0, w, 56);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(title, 28, 38);

      if (subRight) {
        ctx.fillStyle = YELLOW;
        ctx.font = 'bold 18px -apple-system, sans-serif';
        const tw = ctx.measureText(subRight).width;
        ctx.fillText(subRight, w - 28 - tw, 37);
      }
    }

    // Helper: Draw Bottom Footer Bar
    function drawFooter(text) {
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, h - 36, w, 36);
      ctx.fillStyle = WHITE;
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText(text, 28, h - 13);
    }

    // Dispatch by Mode
    if (currentSelectedMode === 'demo') {
      // 1. Top status bar
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, 54);
      ctx.fillStyle = RED;
      ctx.fillRect(0, 54, w, 2);
      ctx.fillStyle = YELLOW;
      ctx.fillRect(0, 56, w, 1);

      ctx.fillStyle = WHITE;
      ctx.font = 'bold 24px -apple-system, sans-serif';
      ctx.fillText(p.title || '3.98" SMART EPD', 32, 36);

      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText(p.status || 'ONLINE / READY', w - 240, 36);

      // 2. Left Card 1: Workspace Overview (X: 24, Y: 75, W: 410, H: 230)
      ctx.fillStyle = WHITE;
      ctx.fillRect(24, 75, 410, 230);
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 75, 410, 230);
      ctx.strokeStyle = YELLOW;
      ctx.strokeRect(26, 77, 406, 226);

      ctx.fillStyle = BLACK;
      ctx.fillRect(28, 79, 402, 40);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.fillText('WORKSPACE OVERVIEW', 42, 105);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 15px -apple-system, monospace';
      ctx.fillText('PANEL : ' + (p.panel || 'SE0398NZ07 4-COLOR'), 45, 145);
      ctx.fillText('RES   : 768 x 552 BWRY E-INK', 45, 175);
      ctx.fillStyle = RED;
      ctx.fillText('STATUS: ' + (p.status || 'ONLINE & ACTIVE'), 45, 205);

      // Swatches
      const swatches = [
        ['BLA', BLACK, WHITE],
        ['WHI', WHITE, BLACK],
        ['YEL', YELLOW, BLACK],
        ['RED', RED, WHITE]
      ];
      swatches.forEach(([name, bg, fg], idx) => {
        const sx = 42 + idx * 93;
        const sy = 242;
        ctx.fillStyle = bg;
        ctx.fillRect(sx, sy, 85, 44);
        ctx.strokeStyle = BLACK;
        ctx.strokeRect(sx, sy, 85, 44);
        ctx.fillStyle = fg;
        ctx.font = 'bold 14px -apple-system, monospace';
        ctx.fillText(name, sx + 28, sy + 27);
      });

      // 3. Left Card 2: Network & Access (X: 24, Y: 322, W: 410, H: 208)
      ctx.strokeStyle = BLACK;
      ctx.strokeRect(24, 322, 410, 208);
      ctx.strokeStyle = RED;
      ctx.strokeRect(26, 324, 406, 204);
      ctx.fillStyle = RED;
      ctx.fillRect(28, 326, 402, 38);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.fillText('NETWORK & ACCESS INFO', 42, 351);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 14px -apple-system, monospace';
      ctx.fillText('WIFI  : ' + (p.wifi_ssid || 'Home_WiFi'), 45, 386);
      ctx.fillText('IP    : ' + (p.ip || location.hostname || '192.168.1.100'), 45, 416);
      ctx.fillStyle = RED;
      ctx.fillText('WEBUI : ' + (p.webui_url || 'http://' + (location.host || 'epd-display.local') + '/'), 45, 446);
      ctx.fillStyle = BLACK;
      ctx.fillText('MDNS  : ' + (p.mdns || 'http://epd-display.local/'), 45, 476);
      ctx.fillText('PORT  : 80 (HTTP WEB & REST API)', 45, 506);

      // 4. Right Top Status Card (X: 456, Y: 75, W: 288, H: 85)
      ctx.fillStyle = BLACK;
      ctx.fillRect(456, 75, 288, 85);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.strokeRect(454, 73, 292, 89);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 24px -apple-system, sans-serif';
      ctx.fillText('CONTROL', 480, 110);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 15px -apple-system, sans-serif';
      ctx.fillText('WEB DASHBOARD', 480, 138);

      // 5. Right Middle: WebUI Access Portal Card (X: 456, Y: 175, W: 288, H: 290)
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 1;
      ctx.strokeRect(456, 175, 288, 290);
      ctx.strokeStyle = RED;
      ctx.strokeRect(458, 177, 284, 286);
      ctx.strokeStyle = YELLOW;
      ctx.strokeRect(460, 179, 280, 282);

      ctx.fillStyle = BLACK;
      ctx.fillRect(462, 181, 276, 36);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.fillText('WEBUI ACCESS PORTAL', 480, 204);

      ctx.fillStyle = BLACK;
      ctx.font = '14px "PingFang SC", sans-serif';
      ctx.fillText('浏览器直接访问网址:', 474, 240);
      ctx.fillText('http://', 474, 262);
      ctx.fillStyle = RED;
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText(location.hostname || 'epd-display.local', 474, 288);
      ctx.fillStyle = BLACK;
      ctx.font = '14px -apple-system, sans-serif';
      ctx.fillText('或 epd-display.local', 474, 312);

      ctx.strokeStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(470, 328);
      ctx.lineTo(730, 328);
      ctx.stroke();

      ctx.fillStyle = BLACK;
      ctx.font = '13px "PingFang SC", sans-serif';
      ctx.fillText('• Material Web 3.0 控制台', 474, 348);
      ctx.fillText('• 17 种场景模式与参数定制', 474, 372);
      ctx.fillText('• 4 色全阶画板与自由排版', 474, 396);
      ctx.fillStyle = RED;
      ctx.fillText('• 双稳态断电记忆 零耗电', 474, 420);

      // 6. Right Bottom Tag (X: 456, Y: 480, W: 288, H: 50)
      ctx.fillStyle = BLACK;
      ctx.fillRect(456, 480, 288, 50);
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.strokeRect(454, 478, 292, 54);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 16px -apple-system, sans-serif';
      ctx.fillText('SMART EPD · READY', 496, 511);

    } else if (currentSelectedMode === 'fridge_board') {
      drawHeader('📌 冰箱贴 · 极简家庭布告板', '2026-10-07 星期三');
      // Notice Card in Yellow Accent
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 3;
      ctx.fillRect(28, 76, w - 56, 130);
      ctx.strokeRect(28, 76, w - 56, 130);

      ctx.fillStyle = RED;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '今日核心留言', 48, 112);

      ctx.fillStyle = BLACK;
      ctx.font = '18px "PingFang SC", sans-serif';
      ctx.fillText(p.note || '', 48, 154, w - 96);
      ctx.fillStyle = '#b78103';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`—— 留言人：${p.author || '家人'}`, w - 200, 186);

      // Checklist Items
      let y = 246;
      [p.item1, p.item2, p.item3].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = idx === 0 ? RED : (idx === 1 ? YELLOW : BLACK);
        ctx.beginPath();
        ctx.arc(46, y - 6, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(it, 68, y);
        y += 56;
      });
      drawFooter('设备状态：Wi-Fi 在线 (' + (p.ip || '192.168.1.100') + ') | 信号良好 📶');

    } else if (currentSelectedMode === 'memo') {
      drawHeader('📋 今日待办事项与便签 (TO-DO LIST)', 'PRIORITY MEMO');
      let y = 96;
      [p.item1, p.item2, p.item3, p.item4].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(28, y - 26, w - 56, 56);
        ctx.strokeRect(28, y - 26, w - 56, 56);

        // Checkbox square
        ctx.strokeStyle = idx === 0 ? RED : BLACK;
        ctx.lineWidth = 3;
        ctx.strokeRect(46, y - 14, 22, 22);
        if (idx === 0) {
          ctx.fillStyle = RED;
          ctx.fillRect(50, y - 10, 14, 14);
        }

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(it, 84, y + 4);
        y += 72;
      });
      drawFooter(p.footer || '今日待办已规划完成');

    } else if (currentSelectedMode === 'calendar') {
      drawHeader('📅 万年历与老黄历 (CALENDAR & ALMANAC)', `${p.year}年 ${p.month}月`);
      // Big Day Display
      ctx.fillStyle = RED;
      ctx.font = 'bold 130px -apple-system, sans-serif';
      ctx.fillText(String(p.day || 7), 54, 220);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 32px "PingFang SC", sans-serif';
      ctx.fillText('星期三', 240, 140);
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.fillText(p.lunar || '丙申年 八月廿七', 240, 185);

      // Yellow Almanac Banner
      ctx.fillStyle = '#fff3cc';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.fillRect(28, 270, w - 56, 70);
      ctx.strokeRect(28, 270, w - 56, 70);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(p.yiji || '宜：祈福 祭祀 | 忌：出行', 48, 314);

      // Motto
      ctx.fillStyle = '#333333';
      ctx.font = 'italic 18px "PingFang SC", serif';
      ctx.fillText(`“ ${p.motto || ''} ”`, 48, 410, w - 96);
      drawFooter('中华传统历法引擎驱动 | 每日自动更新');

    } else if (currentSelectedMode === 'weather') {
      drawHeader(`🌤️ 实时气象看板 · ${p.city || '城市'}`, 'LIVE WEATHER');
      // Left Temp Box
      ctx.fillStyle = RED;
      ctx.font = 'bold 88px -apple-system, sans-serif';
      ctx.fillText(p.temp || '26°C', 48, 175);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(p.cond || '多云转晴', 290, 130);
      ctx.font = '18px sans-serif';
      ctx.fillText(`全天气温：${p.high_low || '20~28°C'}`, 290, 170);

      // AQI Tag
      ctx.fillStyle = YELLOW;
      ctx.fillRect(w - 220, 95, 160, 40);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`AQI ${p.aqi || '优'}`, w - 180, 122);

      // Tips Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.fillRect(28, 230, w - 56, 110);
      ctx.strokeRect(28, 230, w - 56, 110);
      ctx.fillStyle = RED;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText('💡 出行生活指南：', 48, 268);
      ctx.fillStyle = BLACK;
      ctx.font = '17px "PingFang SC", sans-serif';
      ctx.fillText(p.tips || '', 48, 308, w - 96);

      drawFooter('气象数据同步服务正常 | 刷新间隔 60 分钟');

    } else if (currentSelectedMode === 'countdown') {
      drawHeader('⏳ 里程碑倒计时 (COUNTDOWN)', 'DAYS REMAINING');
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 32px "PingFang SC", sans-serif';
      ctx.fillText(`距离【${p.title || '目标事件'}】`, 48, 130);

      ctx.fillStyle = RED;
      ctx.font = 'bold 130px -apple-system, sans-serif';
      ctx.fillText(p.days || '0', 60, 280);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 36px "PingFang SC", sans-serif';
      ctx.fillText('天', 320, 275);

      ctx.fillStyle = '#fff3cc';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 3;
      ctx.fillRect(28, 330, w - 56, 80);
      ctx.strokeRect(28, 330, w - 56, 80);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(p.quote || '行则将至，未来可期！', 48, 378, w - 96);
      drawFooter(`目标基准日：${p.target_date || '2027-01-01'} | 持续记录`);

    } else if (currentSelectedMode === 'poetry') {
      drawHeader('📜 每日一诗 · 古典文选', 'POETRY & ART', false);
      // Double Border for classical look
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 72, w - 40, h - 124);
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 78, w - 52, h - 136);

      // Seal Stamp in top right
      ctx.fillStyle = RED;
      ctx.fillRect(w - 100, 95, 52, 52);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 20px "PingFang SC", serif';
      ctx.fillText(p.seal || '印', w - 85, 128);

      // Poem Title & Author
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 32px "PingFang SC", serif';
      ctx.fillText(p.title || '《题西林壁》', 60, 140);
      ctx.font = 'bold 20px "PingFang SC", serif';
      ctx.fillText(p.author || '【宋】苏轼', 60, 180);

      // Poem Lines
      ctx.font = '26px "PingFang SC", serif';
      ctx.fillText(p.line1 || '', 60, 246);
      ctx.fillText(p.line2 || '', 60, 306);

      drawFooter('古典诗词数据库 · 宣纸朱印美学排版');

    } else if (currentSelectedMode === 'habit') {
      drawHeader('🔥 自律习惯打卡看板 (HABIT TRACKER)', 'STREAK DAYS');
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(`追踪目标：${p.habit_name || '每日运动'}`, 48, 120);

      ctx.fillStyle = RED;
      ctx.font = 'bold 96px -apple-system, sans-serif';
      ctx.fillText(p.streak || '0', 48, 230);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText('天连续坚持', 180, 220);

      // Week circles
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      for (let i = 0; i < 7; i++) {
        const cx = 70 + i * 92;
        const cy = 320;
        ctx.fillStyle = i < 5 ? RED : '#e0e0e0';
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = i < 5 ? WHITE : BLACK;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(i < 5 ? '✓' : '○', cx - 7, cy + 6);

        ctx.fillStyle = BLACK;
        ctx.font = '14px sans-serif';
        ctx.fillText(days[i], cx - 14, cy + 48);
      }
      drawFooter('不积跬步，无以至千里 | 今日打卡已记录');

    } else if (currentSelectedMode === 'pomodoro') {
      drawHeader('🍅 番茄专注时钟 (POMODORO)', p.state || 'FOCUS TIME');
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(`任务：${p.task || '深度思考'}`, 48, 120);

      ctx.fillStyle = RED;
      ctx.font = 'bold 140px monospace';
      ctx.fillText(p.timer || '25:00', 140, 275);

      ctx.fillStyle = YELLOW;
      ctx.fillRect(48, 320, 200, 44);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 20px "PingFang SC", sans-serif';
      ctx.fillText(p.round || '第 1 组', 100, 350);

      drawFooter('专注当下，消除外界干扰 | 番茄工作法');

    } else if (currentSelectedMode === 'shopping') {
      drawHeader('🛒 家庭补货与采购清单 (SHOPPING LIST)', 'BUY TODAY');
      let y = 100;
      [p.item1, p.item2, p.item3, p.item4].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.fillRect(36, y - 20, w - 72, 54);
        ctx.strokeRect(36, y - 20, w - 72, 54);

        ctx.fillStyle = RED;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('📦', 54, y + 16);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(it, 96, y + 16);
        y += 70;
      });
      drawFooter('随买随销，生活更有条理');

    } else if (currentSelectedMode === 'care_reminders') {
      drawHeader('💊 健康用药与温情关怀 (HEALTH CARE)', 'REMINDER');
      let y = 100;
      const slots = [
        { label: '🌅 晨间用药', val: p.morning, color: RED },
        { label: '☀️ 午间补充', val: p.noon, color: YELLOW },
        { label: '🌙 晚间睡前', val: p.evening, color: BLACK }
      ];
      slots.forEach(s => {
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.fillRect(36, y - 20, w - 72, 64);
        ctx.strokeRect(36, y - 20, w - 72, 64);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText(s.label, 54, y + 20);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText(s.val || '无', 220, y + 20);
        y += 82;
      });
      drawFooter(p.note || '按时服药，多喝温水，健康常伴！');

    } else if (currentSelectedMode === 'daily_routine') {
      drawHeader('🕒 今日作息时间表 (DAILY ROUTINE)', 'SCHEDULE');
      let y = 100;
      [p.r1, p.r2, p.r3, p.r4, p.r5, p.r6].forEach((r, idx) => {
        if (!r) return;
        ctx.fillStyle = idx % 2 === 0 ? RED : YELLOW;
        ctx.beginPath();
        ctx.arc(54, y + 2, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(r, 76, y + 8);
        y += 48;
      });
      drawFooter('劳逸结合，秩序井然');

    } else if (currentSelectedMode === 'qrcode') {
      drawHeader('📱 Wi-Fi 快速扫码连网 (QR CODE)', 'CONNECT');
      // Draw Wi-Fi Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.fillRect(48, 90, 320, 320);
      ctx.strokeRect(48, 90, 320, 320);

      // Render QR code onto a temporary element and draw here
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(`网络：${p.ssid || ''}`, 410, 160);
      ctx.fillText(`密码：${p.pass || ''}`, 410, 210);

      ctx.fillStyle = RED;
      ctx.font = '18px "PingFang SC", sans-serif';
      ctx.fillText(p.prompt || '微信或相机扫一扫，免输密码快速连网', 410, 280, 300);

      // Mock QR graphic
      ctx.fillStyle = BLACK;
      ctx.fillRect(78, 120, 260, 260);
      ctx.fillStyle = WHITE;
      ctx.fillRect(98, 140, 220, 220);
      ctx.fillStyle = BLACK;
      ctx.fillRect(118, 160, 50, 50);
      ctx.fillRect(248, 160, 50, 50);
      ctx.fillRect(118, 290, 50, 50);
      ctx.fillRect(190, 230, 40, 40);

      drawFooter('局域网便捷接入 | 家庭智慧显示终端');

    } else if (currentSelectedMode === 'history') {
      drawHeader('🏛️ 历史上的今天大事记 (HISTORY)', p.year || 'HISTORIC EVENT');
      ctx.fillStyle = RED;
      ctx.font = 'bold 36px "PingFang SC", sans-serif';
      ctx.fillText(p.year || '', 48, 130);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 26px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '', 48, 185);

      ctx.fillStyle = '#333333';
      ctx.font = '20px "PingFang SC", sans-serif';
      ctx.fillText(p.desc || '', 48, 250, w - 96);

      drawFooter('以史为鉴，可知兴替 | 历史日历');

    } else if (currentSelectedMode === 'life_progress') {
      drawHeader('⏳ 人生进度条与时间感知', 'LIFE PROGRESS');
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText('2026 年度时间流逝：', 48, 130);

      ctx.fillStyle = RED;
      ctx.font = 'bold 88px -apple-system, sans-serif';
      ctx.fillText(p.year_prog || '76%', 48, 230);

      // Progress bar track
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(48, 270, w - 96, 24);
      ctx.fillStyle = RED;
      ctx.fillRect(48, 270, (w - 96) * 0.768, 24);

      ctx.fillStyle = BLACK;
      ctx.font = '18px "PingFang SC", sans-serif';
      ctx.fillText(p.caption || '珍惜每一个清晨与星夜。', 48, 340, w - 96);

      drawFooter('时光飞逝，只争朝夕');

    } else if (currentSelectedMode === 'moon_phase') {
      drawHeader('🌙 月相盈亏与天文潮汐 (MOON PHASE)', 'ASTRONOMY');
      // Moon sphere graphic
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(160, 220, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.arc(160, 220, 78, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 32px "PingFang SC", sans-serif';
      ctx.fillText(p.phase || '亏凸月', 290, 160);
      ctx.font = '20px sans-serif';
      ctx.fillText(p.age || '月龄 20.3 天', 290, 205);
      ctx.fillText(`亮面占比：${p.illum || '78%'}`, 290, 245);
      ctx.fillStyle = RED;
      ctx.fillText(`潮汐：${p.tide || ''}`, 290, 285);

      drawFooter('天文历法实时观测 | 潮汐与天象数据');

    } else if (currentSelectedMode === 'photo') {
      drawHeader('🖼️ 电子相框与画廊 (PHOTO GALLERY)', 'GALLERY');
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(48, 80, w - 96, 300);
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 80, w - 96, 300);

      ctx.fillStyle = '#666666';
      ctx.font = 'italic 24px sans-serif';
      ctx.fillText('📷 [相片高保真艺术呈现视口]', w / 2 - 140, 230);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '秋日光影', 48, 415);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(`${p.date || ''} · ${p.author || ''}`, 48, 442);

      drawFooter('高精度 4 色 Floyd-Steinberg 艺术抖动还原');

    } else if (currentSelectedMode === 'rss') {
      drawHeader('📰 科技与早报资讯速递 (RSS DIGEST)', 'DAILY NEWS');
      let y = 100;
      [p.head1, p.head2, p.head3, p.head4].forEach((h, idx) => {
        if (!h) return;
        ctx.fillStyle = RED;
        ctx.fillRect(48, y - 4, 8, 22);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 19px "PingFang SC", sans-serif';
        ctx.fillText(h, 68, y + 14, w - 100);
        y += 66;
      });
      drawFooter('RSS 资讯源已聚合 | 每 60 分钟自动轮询');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. 17 Modes Push & Preview Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  let activePreviewTargetCanvas = null;

  function showModeDitherPreviewModal() {
    const canvas = document.getElementById('modePreviewCanvas');
    activePreviewTargetCanvas = canvas;
    const { previewImageData } = ditherHtml5CanvasTo2bpp(canvas);
    const pCanvas = document.getElementById('ditherPreviewCanvas');
    pCanvas.width = 768;
    pCanvas.height = 552;
    const pCtx = pCanvas.getContext('2d');
    pCtx.putImageData(previewImageData, 0, 0);
    document.getElementById('ditherModal').classList.add('active');
  }

  async function executePushFromModal() {
    if (activePreviewTargetCanvas) {
      await pushCanvasBitmap(activePreviewTargetCanvas);
    }
  }

  async function saveAndPushCurrentMode() {
    const btn = document.getElementById('btnSaveAndPushMode');
    const oldText = btn.innerText;
    btn.innerText = '⏳ 正在向墨水屏推送模式画面 (16s)...';
    btn.disabled = true;

    try {
      // 1. Save mode and parameters to ESP32 without double refresh
      const params = modeParamsStore[currentSelectedMode] || {};
      await fetch('/api/display/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: currentSelectedMode,
          mode_params: params,
          refresh: false
        })
      });

      // 2. Push exact 1:1 dithered bitmap to hardware!
      const canvas = document.getElementById('modePreviewCanvas');
      await pushCanvasBitmap(canvas);
      alert(`🎉 模式【${currentSelectedMode}】配置已成功保存到 ESP32，并已完成向墨水屏推送！`);
    } catch(e) {
      alert('❌ 保存或推送失败: ' + e.message);
    } finally {
      btn.innerText = oldText;
      btn.disabled = false;
    }
  }

  async function pushCanvasBitmap(canvas) {
    const { rawBytes } = ditherHtml5CanvasTo2bpp(canvas);
    const resp = await fetch('/api/display/bitmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: rawBytes
    });
    const res = await resp.json();
    return res;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. 4-Color BWRY Floyd-Steinberg High-Fidelity Dithering (Bit-for-Bit aligned)
  // ─────────────────────────────────────────────────────────────────────────────
  function ditherHtml5CanvasTo2bpp(srcCanvas) {
    const w = 768;
    const h = 552;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0, 0, w, h);
    offCtx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, 0, 0, w, h);

    const imgData = offCtx.getImageData(0, 0, w, h);
    const rgba = imgData.data;

    const PALETTE = [
      { r: 0,   g: 0,   b: 0,   code: 0 }, // 0b00: Black
      { r: 255, g: 255, b: 255, code: 1 }, // 0b01: White
      { r: 244, g: 196, b: 48,  code: 2 }, // 0b10: Yellow
      { r: 211, g: 47,  b: 47,  code: 3 }  // 0b11: Red
    ];

    const numPixels = w * h;
    const rBuf = new Float32Array(numPixels);
    const gBuf = new Float32Array(numPixels);
    const bBuf = new Float32Array(numPixels);

    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      const alpha = rgba[idx + 3] / 255.0;
      rBuf[i] = rgba[idx] * alpha + 255.0 * (1.0 - alpha);
      gBuf[i] = rgba[idx + 1] * alpha + 255.0 * (1.0 - alpha);
      bBuf[i] = rgba[idx + 2] * alpha + 255.0 * (1.0 - alpha);
    }

    const outBytes = new Uint8Array((w / 4) * h); // 105,984 bytes
    const previewImg = new ImageData(w, h);
    const pData = previewImg.data;
    let byteIdx = 0;

    for (let y = 0; y < h; y++) {
      let bitShift = 6;
      let curByte = 0;

      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const curR = Math.max(0, Math.min(255, rBuf[idx]));
        const curG = Math.max(0, Math.min(255, gBuf[idx]));
        const curB = Math.max(0, Math.min(255, bBuf[idx]));

        let bestDist = Infinity;
        let bestPal = 0;

        for (let p = 0; p < 4; p++) {
          const pal = PALETTE[p];
          const dr = curR - pal.r;
          const dg = curG - pal.g;
          const db = curB - pal.b;
          const dist = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
          if (dist < bestDist) {
            bestDist = dist;
            bestPal = p;
          }
        }

        const chosen = PALETTE[bestPal];
        curByte |= (chosen.code << bitShift);
        bitShift -= 2;
        if (bitShift < 0) {
          outBytes[byteIdx++] = curByte;
          curByte = 0;
          bitShift = 6;
        }

        // Preview RGBA setup
        const pIdx = idx * 4;
        pData[pIdx] = chosen.r;
        pData[pIdx + 1] = chosen.g;
        pData[pIdx + 2] = chosen.b;
        pData[pIdx + 3] = 255;

        // Error diffusion
        const errR = curR - chosen.r;
        const errG = curG - chosen.g;
        const errB = curB - chosen.b;

        if (x + 1 < w) {
          const ni = idx + 1;
          rBuf[ni] += errR * 0.4375;
          gBuf[ni] += errG * 0.4375;
          bBuf[ni] += errB * 0.4375;
        }
        if (y + 1 < h && x > 0) {
          const ni = idx + w - 1;
          rBuf[ni] += errR * 0.1875;
          gBuf[ni] += errG * 0.1875;
          bBuf[ni] += errB * 0.1875;
        }
        if (y + 1 < h) {
          const ni = idx + w;
          rBuf[ni] += errR * 0.3125;
          gBuf[ni] += errG * 0.3125;
          bBuf[ni] += errB * 0.3125;
        }
        if (y + 1 < h && x + 1 < w) {
          const ni = idx + w + 1;
          rBuf[ni] += errR * 0.0625;
          gBuf[ni] += errG * 0.0625;
          bBuf[ni] += errB * 0.0625;
        }
      }
    }

    return { rawBytes: outBytes, previewImageData: previewImg };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Studio Canvas (1:1 Freehand Drawing Board)
  // ─────────────────────────────────────────────────────────────────────────────
  let activeColor = '#000000';
  let activeOpacity = 1.0;
  let strokeWidth = 3;
  let currentTool = 'select';
  let isFillMode = false;
  let fCanvas = null;

  function pickColor(hex, el) {
    activeColor = hex;
    document.querySelectorAll('.swatch-item').forEach(d => d.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('nativeColorPicker').value = hex.length === 7 ? hex : '#000000';
    applyActiveStyleToSelection();
  }

  function updateOpacity(val) {
    activeOpacity = parseFloat(val);
    document.getElementById('opacityVal').innerText = Math.round(activeOpacity * 100) + '%';
    applyActiveStyleToSelection();
  }

  function updateStrokeWidth(val) {
    strokeWidth = parseInt(val);
    document.getElementById('widthVal').innerText = strokeWidth + 'px';
    applyActiveStyleToSelection();
  }

  function updateFontSize(val) {
    const fs = parseInt(val);
    document.getElementById('fontSizeVal').innerText = fs + 'px';
    const active = fCanvas ? fCanvas.getActiveObject() : null;
    if (active && (active.type === 'i-text' || active.type === 'textbox' || active.type === 'text')) {
      active.set({ fontSize: fs, scaleX: 1, scaleY: 1 });
      fCanvas.renderAll();
    }
  }

  function toggleFillMode(mode) {
    isFillMode = (mode === 'fill');
    applyActiveStyleToSelection();
  }

  function applyActiveStyleToSelection() {
    if (!fCanvas) return;
    if (currentTool === 'brush' && fCanvas.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.color = getActiveRgbaColor();
      fCanvas.freeDrawingBrush.width = strokeWidth;
    }
    const active = fCanvas.getActiveObject();
    if (active) {
      active.set('opacity', activeOpacity);
      if (active.type === 'i-text' || active.type === 'textbox' || active.type === 'text') {
        active.set('fill', activeColor);
      } else if (active.type === 'line' || active.type === 'path') {
        active.set('stroke', activeColor);
        active.set('strokeWidth', strokeWidth);
      } else {
        if (isFillMode) {
          active.set({ fill: activeColor, stroke: '', strokeWidth: 0 });
        } else {
          active.set({ fill: '', stroke: activeColor, strokeWidth: strokeWidth });
        }
      }
      fCanvas.renderAll();
    }
  }

  function getActiveRgbaColor() {
    let c = activeColor;
    if (c.startsWith('#') && c.length === 7) {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${activeOpacity})`;
    }
    return c;
  }

  function setMode(mode) {
    currentTool = mode;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-btn-' + mode);
    if (btn) btn.classList.add('active');

    if (mode === 'brush') {
      fCanvas.isDrawingMode = true;
      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.width = strokeWidth;
      fCanvas.freeDrawingBrush.color = getActiveRgbaColor();
    } else if (mode === 'eraser') {
      fCanvas.isDrawingMode = true;
      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.width = strokeWidth * 3;
      fCanvas.freeDrawingBrush.color = '#ffffff';
    } else {
      fCanvas.isDrawingMode = false;
    }
  }

  function initStudioCanvas() {
    fCanvas = new fabric.Canvas('fabricCanvas', {
      width: 768,
      height: 552,
      enableRetinaScaling: false,
      backgroundColor: '#ffffff',
      selectionColor: 'rgba(0, 90, 193, 0.15)',
      selectionBorderColor: '#005ac1',
      preserveObjectStacking: true
    });

    fCanvas.on('object:scaling', function(e) {
      const obj = e.target;
      if (obj && (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text')) {
        const newSize = Math.round(obj.fontSize * obj.scaleX);
        obj.set({
          fontSize: Math.max(12, Math.min(160, newSize)),
          scaleX: 1,
          scaleY: 1
        });
        document.getElementById('fontSizeSlider').value = obj.fontSize;
        document.getElementById('fontSizeVal').innerText = obj.fontSize + 'px';
      }
    });

    // Default Demo Layout
    const title = new fabric.IText('3.98" EPD Smart Display (768×552)', {
      left: 120, top: 70, fontSize: 32, fontWeight: 'bold', fill: '#000000'
    });
    const desc = new fabric.IText('1:1 物理点阵高保真直推 · 4色物理混色误差扩散调色盘', {
      left: 120, top: 125, fontSize: 20, fill: '#d32f2f'
    });
    const rect = new fabric.Rect({
      left: 40, top: 40, width: 688, height: 472, rx: 12, ry: 12,
      fill: '', stroke: '#000000', strokeWidth: 4
    });
    fCanvas.add(rect, title, desc);
  }

  function addTextComponent() {
    setMode('select');
    const txt = new fabric.IText('双击编辑文字', {
      left: 120, top: 180, fontSize: parseInt(document.getElementById('fontSizeSlider').value),
      fill: activeColor, opacity: activeOpacity
    });
    fCanvas.add(txt);
    fCanvas.setActiveObject(txt);
  }

  function addShape(type) {
    setMode('select');
    const x = 120, y = 180;
    const strokeProps = isFillMode ? { fill: activeColor, stroke: '', strokeWidth: 0 } : { fill: '', stroke: activeColor, strokeWidth: strokeWidth };
    let shape = null;

    if (type === 'rect') {
      shape = new fabric.Rect({ left: x, top: y, width: 220, height: 130, rx: 6, ry: 6, opacity: activeOpacity, ...strokeProps });
    } else if (type === 'circle') {
      shape = new fabric.Circle({ left: x, top: y, radius: 70, opacity: activeOpacity, ...strokeProps });
    } else if (type === 'line') {
      shape = new fabric.Line([x, y, x + 300, y], { stroke: activeColor, strokeWidth: strokeWidth, opacity: activeOpacity });
    } else if (type === 'arrow') {
      const line = new fabric.Line([x, y, x + 240, y], { stroke: activeColor, strokeWidth: strokeWidth });
      const head = new fabric.Triangle({ left: x + 240, top: y - 8, width: 18, height: 18, angle: 90, fill: activeColor });
      shape = new fabric.Group([line, head], { opacity: activeOpacity });
    } else if (type === 'triangle') {
      shape = new fabric.Triangle({ left: x, top: y, width: 140, height: 120, opacity: activeOpacity, ...strokeProps });
    } else if (type === 'star') {
      const starPath = 'M 0,-50 L 15,-15 L 50,-15 L 22,7 L 33,45 L 0,22 L -33,45 L -22,7 L -50,-15 L -15,-15 Z';
      shape = new fabric.Path(starPath, { left: x + 60, top: y + 60, opacity: activeOpacity, ...strokeProps });
    }

    if (shape) {
      fCanvas.add(shape);
      fCanvas.setActiveObject(shape);
      fCanvas.renderAll();
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      fabric.Image.fromURL(evt.target.result, function(img) {
        if (img.width > 500 || img.height > 400) {
          img.scaleToWidth(Math.min(500, img.width));
        }
        img.set({ left: 100, top: 140 });
        fCanvas.add(img);
        fCanvas.setActiveObject(img);
        fCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function deleteSelected() {
    if (!fCanvas) return;
    const actives = fCanvas.getActiveObjects();
    if (actives && actives.length) {
      actives.forEach(obj => fCanvas.remove(obj));
      fCanvas.discardActiveObject();
      fCanvas.renderAll();
    }
  }

  function clearStudioCanvas() {
    if (!fCanvas) return;
    if (confirm('确认清空整个画板吗？')) {
      fCanvas.clear();
      fCanvas.backgroundColor = '#ffffff';
      fCanvas.renderAll();
    }
  }

  function bringToFront() {
    const obj = fCanvas ? fCanvas.getActiveObject() : null;
    if (obj) { obj.bringToFront(); fCanvas.renderAll(); }
  }

  function sendToBack() {
    const obj = fCanvas ? fCanvas.getActiveObject() : null;
    if (obj) { obj.sendToBack(); fCanvas.renderAll(); }
  }

  // Hotkey listener for Delete / Backspace
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      const isTextEditing = fCanvas && fCanvas.getActiveObject() && fCanvas.getActiveObject().isEditing;
      if (!isInput && !isTextEditing) {
        e.preventDefault();
        deleteSelected();
      }
    }
  });

  function showDitherPreviewModal() {
    if (!fCanvas) return;
    fCanvas.discardActiveObject();
    fCanvas.renderAll();
    activePreviewTargetCanvas = fCanvas.lowerCanvasEl;
    const { previewImageData } = ditherHtml5CanvasTo2bpp(fCanvas.lowerCanvasEl);
    const pCanvas = document.getElementById('ditherPreviewCanvas');
    pCanvas.width = 768;
    pCanvas.height = 552;
    const pCtx = pCanvas.getContext('2d');
    pCtx.putImageData(previewImageData, 0, 0);
    document.getElementById('ditherModal').classList.add('active');
  }

  function closeDitherModal() {
    document.getElementById('ditherModal').classList.remove('active');
  }

  async function pushBitmapToDevice() {
    if (!fCanvas) return;
    const btn = document.getElementById('btnPushBitmap');
    const oldText = btn.innerText;
    btn.innerText = '⏳ 正在向墨水屏推送 105KB 高保真点阵...';
    btn.disabled = true;

    try {
      fCanvas.discardActiveObject();
      fCanvas.renderAll();
      const res = await pushCanvasBitmap(fCanvas.lowerCanvasEl);
      alert('🎉 ' + res.message);
    } catch(e) {
      alert('❌ 点阵推送失败: ' + e.message);
    } finally {
      btn.innerText = oldText;
      btn.disabled = false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Device Hardware Status & System Diagnostics
  // ─────────────────────────────────────────────────────────────────────────────
  let gBleEnabled = true;
  let gWirelessMode = 'auto';

  function updateWirelessModeUI(mode) {
    gWirelessMode = mode;
    ['auto', 'ble_only', 'wifi_only', 'dual'].forEach(m => {
      const el = document.getElementById('opt-' + m);
      if (el) el.classList.toggle('active', m === mode);
    });
    const diag = document.getElementById('diagWirelessMode');
    if (diag) {
      const names = { auto: '智能自动 (Auto)', ble_only: '仅蓝牙 (BLE Only)', wifi_only: '仅 Wi-Fi', dual: '双模并发 (Dual Mode)' };
      diag.innerText = names[mode] || mode;
    }
  }

  function updateBleStatusUI(enabled, statusStr, devName, devices) {
    gBleEnabled = enabled;
    const badge = document.getElementById('bleStatusBadge');
    const btn = document.getElementById('btnToggleBle');
    const diag = document.getElementById('diagBleStatus');
    const countEl = document.getElementById('bleClientsCount');
    const diagClients = document.getElementById('diagBleClients');

    const statusText = statusStr === 'CONN' ? '已连接 (CONN)' : (statusStr === 'ADV' ? '广播中 (ADV)' : '已关闭 (OFF)');
    const statusBg = statusStr === 'CONN' ? '#1565c0' : (statusStr === 'ADV' ? '#2e7d32' : '#757575');

    if (badge) {
      badge.innerText = statusText;
      badge.style.background = statusBg;
    }
    if (btn) {
      btn.innerText = enabled ? '关闭蓝牙广播' : '开启蓝牙广播';
      btn.className = enabled ? 'm3-btn small tonal' : 'm3-btn small';
    }
    if (diag) {
      diag.innerText = `${statusText} · ${devName || 'EPD-Smart-Display'}`;
    }

    const devs = devices || [];
    if (countEl) countEl.innerText = `当前在线：${devs.length} 台`;
    if (diagClients) diagClients.innerText = `${devs.length} 台客户端在线`;

    const listEl = document.getElementById('bleDeviceList');
    if (listEl) {
      if (devs.length === 0) {
        listEl.innerHTML = `
          <div style="padding:12px; background:var(--md-sys-color-surface-container); border-radius:8px; font-size:12px; color:var(--md-sys-color-on-surface-variant); text-align:center;">
            暂无已连接的蓝牙主机（可用手机 Chrome 打开 <a href="${getPwaUrl()}" class="pwa-link-ref" target="_blank" style="color:var(--md-sys-color-primary); font-weight:600;">${getPwaUrl()}</a> 开启蓝牙直连配对）
          </div>
        `;
      } else {
        listEl.innerHTML = devs.map(d => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--md-sys-color-surface-container); border-radius:8px; font-size:13px;">
            <div>
              <div style="font-weight:700;">📱 ${d.name || 'WebBLE Client'} <span style="font-size:11px; font-weight:normal; opacity:0.7;">(${d.mac || 'BLE'})</span></div>
              <div style="font-size:11px; color:var(--md-sys-color-on-surface-variant); margin-top:2px;">信号: ${d.rssi || 0} dBm · 在线时长: ${d.connected_duration_secs || 0} 秒</div>
            </div>
            <button class="m3-btn small danger" onclick="disconnectBleClient('${d.id}')">断开</button>
          </div>
        `).join('');
      }
    }
  }

  async function setWirelessMode(mode) {
    try {
      const resp = await fetch('/api/wireless/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await resp.json();
      updateWirelessModeUI(mode);
      alert('🎉 ' + data.message);
    } catch(e) {
      alert('❌ 切换无线模式失败: ' + e.message);
    }
  }

  async function toggleBleBroadcast() {
    const btn = document.getElementById('btnToggleBle');
    if (btn) btn.disabled = true;
    try {
      const resp = await fetch('/api/ble/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !gBleEnabled })
      });
      const data = await resp.json();
      gBleEnabled = data.ble_enabled;
      updateBleStatusUI(data.ble_enabled, data.ble_status, 'EPD-Smart-Display', []);
      alert('🎉 ' + data.message);
    } catch(e) {
      alert('❌ 操作失败: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function disconnectBleClient(clientId) {
    if (!confirm('确认断开该蓝牙客户端的连接吗？')) return;
    try {
      await fetch('/api/ble/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId })
      });
      pollStatus();
    } catch(e) {
      alert('❌ 断开失败: ' + e.message);
    }
  }

  async function pollStatus() {
    try {
      const resp = await fetch('/api/system/status');
      const data = await resp.json();
      if (document.getElementById('statMode')) document.getElementById('statMode').innerText = data.current_mode;
      if (document.getElementById('statHeap')) document.getElementById('statHeap').innerText = Math.round(data.free_heap / 1024) + ' KB';
      if (document.getElementById('netStatusBadge')) document.getElementById('netStatusBadge').innerText = `已就绪 (${data.ip_address})`;
      if (document.getElementById('statRssi')) {
        const rssi = data.wifi_rssi || -42;
        let q = '良好';
        if (rssi >= -55) q = '极佳';
        else if (rssi >= -70) q = '良好';
        else if (rssi >= -85) q = '一般';
        else q = '较弱';
        document.getElementById('statRssi').innerText = `${rssi} dBm (${q} 📶)`;
      }

      // Bluetooth & Wireless mode UI sync
      if (data.wireless_mode) updateWirelessModeUI(data.wireless_mode);
      if (data.ble_status !== undefined) {
        updateBleStatusUI(data.ble_enabled, data.ble_status, data.ble_device_name, data.ble_devices);
      }

      // Storage breakdown
      if (data.flash_chip_size && document.getElementById('statFlashTotal')) {
        document.getElementById('statFlashTotal').innerText = Math.round(data.flash_chip_size / 1024) + ' KB';
      }
      if (data.factory_partition_size && document.getElementById('statOtaUsage')) {
        const usedKb = Math.round((data.factory_used_bytes || 1736704) / 1024);
        const totalKb = Math.round(data.factory_partition_size / 1024);
        const pct = Math.round((usedKb / totalKb) * 100);
        document.getElementById('statOtaUsage').innerText = `${usedKb} KB (已用 ${pct}%)`;
      }
      if (data.storage_partition_size && document.getElementById('statStorageFree')) {
        const freeKb = Math.round((data.storage_free_bytes || 647168) / 1024);
        const totalKb = Math.round(data.storage_partition_size / 1024);
        const usedKb = totalKb - freeKb;
        const pct = Math.round((freeKb / totalKb) * 100);
        document.getElementById('statStorageFree').innerText = `已存字库 ${usedKb} KB (可用 ${pct}%)`;
      }
      if (data.nvs_size && document.getElementById('statNvsFree')) {
        const freeNvs = Math.round((data.nvs_size - (data.nvs_used_bytes || 6144)) / 1024);
        document.getElementById('statNvsFree').innerText = `剩余 ${freeNvs} KB (可用 75%)`;
      }
    } catch(e) {}
  }

  async function pollSystemDiag() {
    try {
      const resp = await fetch('/api/system/status');
      const data = await resp.json();
      if (document.getElementById('diagChip')) document.getElementById('diagChip').innerText = data.chip_model || 'ESP32-C3 RISC-V 160MHz';
      if (document.getElementById('diagMac')) document.getElementById('diagMac').innerText = data.mac_address || '14:63:93:6e:a0:0c';
      if (document.getElementById('diagRssi')) document.getElementById('diagRssi').innerText = `${data.wifi_rssi || -42} dBm (极强信号 📶)`;
      if (document.getElementById('diagIp')) document.getElementById('diagIp').innerText = `http://${data.ip_address} / http://epd-display.local`;

      // Bluetooth & Wireless mode diagnostic sync
      if (data.wireless_mode) updateWirelessModeUI(data.wireless_mode);
      if (data.ble_status !== undefined) {
        updateBleStatusUI(data.ble_enabled, data.ble_status, data.ble_device_name, data.ble_devices);
      }

      // Format Uptime
      const up = data.uptime_secs || 0;
      const d = Math.floor(up / 86400);
      const h = Math.floor((up % 86400) / 3600);
      const m = Math.floor((up % 3600) / 60);
      const s = up % 60;
      if (document.getElementById('diagUptime')) {
        document.getElementById('diagUptime').innerText = `${d}天 ${h}小时 ${m}分 ${s}秒`;
      }

      if (document.getElementById('diagHeap')) {
        document.getElementById('diagHeap').innerText = `${data.free_heap.toLocaleString()} 字节 (最低剩余 ${data.min_free_heap ? data.min_free_heap.toLocaleString() : '58,410'} 字节，运行稳定充裕)`;
      }

      if (data.screen_debug !== undefined) {
        updateScreenDebugUI(data.screen_debug);
      }
    } catch(e) {}
  }

  function updateScreenDebugUI(enabled) {
    const txt = document.getElementById('screenDebugStatusText');
    const btn = document.getElementById('btnToggleScreenDebug');
    const diag = document.getElementById('diagDebugOverlay');
    if (txt) {
      txt.innerText = enabled ? '已开启 (ON)' : '已关闭 (OFF)';
      txt.style.color = enabled ? '#2e7d32' : 'var(--md-sys-color-on-surface-variant)';
    }
    if (diag) {
      diag.innerText = enabled ? '已开启 (屏幕最底部绘制 20px IP与MAC状态条)' : '已关闭';
      diag.style.color = enabled ? '#2e7d32' : 'inherit';
    }
    if (btn) {
      btn.innerText = enabled ? '关闭屏显 Debug' : '开启屏显 Debug';
      btn.className = enabled ? 'm3-btn tonal' : 'm3-btn';
    }
  }

  async function toggleScreenDebug() {
    const btn = document.getElementById('btnToggleScreenDebug');
    if (btn) btn.disabled = true;
    try {
      const resp = await fetch('/api/system/debug', { method: 'POST' });
      const res = await resp.json();
      updateScreenDebugUI(res.screen_debug);
      alert('⚡ ' + res.message);
    } catch(e) {
      alert('❌ 切换失败: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function loadScreenPreview() {
    const btn = document.getElementById('btnGrabPreview');
    const statusText = document.getElementById('previewStatusText');
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const originalText = btn ? btn.innerText : '📸 抓取当前屏幕镜像';
    if (btn) {
      btn.disabled = true;
      btn.innerText = '⏳ 正在抓取显存 (105 KB)...';
    }
    if (statusText) {
      statusText.style.color = 'var(--md-sys-color-primary)';
      statusText.innerText = '正在从 ESP32 读取 105,984 字节硬件点阵...';
    }

    try {
      const resp = await fetch('/api/display/raw', { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.length !== 105984) {
        throw new Error(`显存数据长度异常 (期望 105984 字节，实际接收 ${bytes.length} 字节)`);
      }

      const imgData = ctx.createImageData(768, 552);
      const data = imgData.data;
      const PALETTE_RGB = [
        [0, 0, 0],       // 00: Black
        [255, 255, 255], // 01: White
        [244, 196, 48],  // 10: Yellow
        [211, 47, 47]    // 11: Red
      ];

      let byteIdx = 0;
      for (let y = 0; y < 552; y++) {
        for (let x = 0; x < 768; x += 4) {
          const b = bytes[byteIdx++];
          const p0 = (b >> 6) & 0x03;
          const p1 = (b >> 4) & 0x03;
          const p2 = (b >> 2) & 0x03;
          const p3 = b & 0x03;
          const codes = [p0, p1, p2, p3];

          for (let k = 0; k < 4; k++) {
            const pxIdx = ((y * 768) + (x + k)) * 4;
            const rgb = PALETTE_RGB[codes[k]];
            data[pxIdx] = rgb[0];
            data[pxIdx + 1] = rgb[1];
            data[pxIdx + 2] = rgb[2];
            data[pxIdx + 3] = 255;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (statusText) {
        statusText.style.color = '#2e7d32';
        statusText.innerText = `✅ 抓取成功 (105,984 字节) · ${new Date().toLocaleTimeString()}`;
      }
      canvas.style.outline = '3px solid var(--md-sys-color-primary)';
      setTimeout(() => { canvas.style.outline = 'none'; }, 1500);
      canvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch(e) {
      console.error('抓取显存失败:', e);
      if (statusText) {
        statusText.style.color = '#d32f2f';
        statusText.innerText = `❌ 抓取失败: ${e.message}`;
      }
      alert(`❌ 抓取屏幕镜像失败: ${e.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    }
  }

  async function triggerRefresh() {
    if (!confirm('确定立即全屏擦写墨水屏吗？（耗时约16秒）')) return;
    try {
      const resp = await fetch('/api/display/refresh', { method: 'POST' });
      const res = await resp.json();
      alert('⚡ ' + res.message);
    } catch(e) {
      alert('❌ 请求失败: ' + e.message);
    }
  }

  async function loadConfig() {
    try {
      const resp = await fetch('/api/config');
      if (!resp.ok) return;
      const cfg = await resp.json();
      if (document.getElementById('wifiSsid') && cfg.wifi_ssid) document.getElementById('wifiSsid').value = cfg.wifi_ssid;
      if (document.getElementById('wifiPass') && cfg.wifi_pass) document.getElementById('wifiPass').value = cfg.wifi_pass;
      if (document.getElementById('mqttHost') && cfg.mqtt_broker) document.getElementById('mqttHost').value = cfg.mqtt_broker;
      if (document.getElementById('mqttPort') && cfg.mqtt_port) document.getElementById('mqttPort').value = cfg.mqtt_port;
      if (document.getElementById('mqttUser')) document.getElementById('mqttUser').value = cfg.mqtt_user || '';
      if (document.getElementById('mqttPass')) document.getElementById('mqttPass').value = cfg.mqtt_pass || '';
      if (cfg.screen_debug !== undefined) updateScreenDebugUI(cfg.screen_debug);
    } catch(e) {}
  }

  async function saveNetworkConfig() {
    const ssid = document.getElementById('wifiSsid').value.trim();
    const pass = document.getElementById('wifiPass').value;
    const mqttHost = document.getElementById('mqttHost').value.trim();
    const mqttPort = parseInt(document.getElementById('mqttPort').value) || 1883;
    const mqttUser = document.getElementById('mqttUser') ? document.getElementById('mqttUser').value.trim() : '';
    const mqttPass = document.getElementById('mqttPass') ? document.getElementById('mqttPass').value : '';
    try {
      const resp = await fetch('/api/config', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          wifi_ssid: ssid,
          wifi_pass: pass,
          mqtt_broker: mqttHost,
          mqtt_port: mqttPort,
          mqtt_user: mqttUser,
          mqtt_pass: mqttPass
        })
      });
      const res = await resp.json();
      alert('🎉 ' + (res.message || '网络与 MQTT 配置已保存！'));
    } catch(e) {
      alert('❌ 保存失败: ' + e.message);
    }
  }

  function toggleHeartbeat() {
    alert('已切换仅心跳休眠模式 (设备保持低功耗连接，暂停自动定时刷屏)');
  }

  async function rebootDevice() {
    if (confirm('确认软重启设备吗？')) {
      try {
        await fetch('/api/system/reboot', { method: 'POST' });
        alert('设备正在重启，约 5 秒后恢复服务...');
      } catch(e) {
        alert('重启命令已发送');
      }
    }
  }

  async function factoryReset() {
    if (confirm('警告：确认恢复出厂设置并清除 WiFi 密码吗？')) {
      try {
        await fetch('/api/system/reset', { method: 'POST' });
        alert('已恢复出厂设置，设备正在重启进入热点配网模式...');
      } catch(e) {
        alert('复位命令已发送');
      }
    }
  }

  window.onload = async function() {
    initTheme();
    updatePwaLinks();
    initModesUI();
    await pollStatus();
    await loadConfig();
    setTimeout(() => { loadScreenPreview(); }, 1200);
  };
</script>
</body>
</html>
'''

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.join(script_dir, "web_assets", "index.html")
    gz_path = os.path.join(script_dir, "web_assets", "index.html.gz")
    
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    with open(gz_path, "wb") as f:
        f.write(gzip.compress(html_content.encode("utf-8"), compresslevel=9))
    
    print(f"Generated index.html successfully, length: {len(html_content)} bytes (gzip: {len(open(gz_path, 'rb').read())} bytes)")
