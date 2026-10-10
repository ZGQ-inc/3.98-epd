/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Scenes Studio (18 种场景模式工作台与单片机画布渲染引擎)
 * High-precision 768×552 BWRY Canvas Rendering Engine
 * Ported faithfully from MCU firmware & Web Assets
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

(function (window) {
  'use strict';

  // 18 Scene Mode Definitions
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
    { id: 'life_progress', name: '人生进度条', icon: '⌛', desc: '当年流逝感知与人生九宫格透视' },
    { id: 'pomodoro', name: '番茄专注时钟', icon: '🍅', desc: '25分钟深度工作计时与当前任务' },
    { id: 'shopping', name: '采购补货清单', icon: '🛒', desc: '家庭食品、日用百货与数码清单' },
    { id: 'care_reminders', name: '关怀用药提醒', icon: '💊', desc: '早中晚用药说明与家庭健康寄语' },
    { id: 'daily_routine', name: '今日作息安排', icon: '🕒', desc: '全天高效时间轴与课程/日程' },
    { id: 'moon_phase', name: '月相与潮汐', icon: '🌙', desc: '月龄、月相图形与高低潮时段' },
    { id: 'qrcode', name: '扫码与Wi-Fi分享', icon: '📱', desc: '家庭Wi-Fi一键扫码即连或动态收款' },
    { id: 'photo', name: '相册与艺术画廊', icon: '🖼️', desc: '相框艺术轮播与照片题字' },
    { id: 'rss', name: '资讯订阅早报', icon: '📰', desc: '科技与时事热点要闻精选摘要' }
  ];

  // Default Parameters Store for all 18 scenes
  const defaultParamsStore = {
    demo: {
      title: '3.98" SMART EPD',
      panel: 'SE0398NZ07 4-COLOR',
      status: 'ONLINE & ACTIVE',
      wifi_ssid: 'Home_WiFi',
      ip: '192.168.1.100',
      webui_url: 'http://epd-display.local/',
      mdns: 'http://epd-display.local/',
      features: 'Material Web 3.0 / 18种场景 / 4色画板'
    },
    fridge_board: {
      title: '家庭核心留言板',
      note: '冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！',
      author: '爸爸',
      date: '2026-10-07 星期三',
      item1: '出门记得关阳台窗户',
      item2: '晚饭煮番茄牛腩面',
      item3: '晚上 9 点检查作业'
    },
    memo: {
      title: 'TODAY TO-DO LIST',
      subtitle: 'PRIORITY MEMO',
      item1: '1. 调试 ESP32-C3 墨水屏固件',
      item2: '2. 3D打印机加装侧边滑动开关',
      item3: '3. 完成 Rust 显存流式直推架构',
      item4: '4. 跑步 5 公里并拉伸放松',
      footer: '保持专注，逐项击破！ | 墨水屏双稳态零功耗保持'
    },
    calendar: {
      year: '2026',
      month: '10',
      day: '7',
      weekday: '星期三',
      lunar: '丙申年 八月廿七',
      yiji: '宜：祈福 祭祀 动土 | 忌：出行 词讼',
      motto: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。'
    },
    weather: {
      city: '深圳 (Shenzhen)',
      temp: '26°C',
      cond: '多云转晴',
      high_low: '22°C ~ 29°C',
      aqi: '36 优',
      tips: '微风舒适，紫外线较强，适宜户外慢跑与出行！'
    },
    countdown: {
      title: '2027年 元旦跨年',
      target_date: '2027-01-01',
      days: '85',
      quote: '道阻且长，行则将至；行而不辍，未来可期！'
    },
    habit: {
      habit_name: '每日晨跑 5 公里',
      streak: '18',
      completion: '87%',
      week_done: '一 二 三 四 五'
    },
    poetry: {
      title: '《早发白帝城》',
      author: '【唐】李白',
      line1: '朝辞白帝彩云间，千里江陵一日还。',
      line2: '两岸猿声啼不住，轻舟已过万重山。',
      seal: '太白'
    },
    history: {
      year: '公元 1913 年',
      title: '福特汽车启用首条流水装配线',
      desc: '大幅降低了工业制造装配成本，彻底推动了现代工业大众化生产时代的开启。',
      event2_year: '1985 年',
      event2_title: '深海科考队在北大西洋首次发现泰坦尼克号残骸'
    },
    life_progress: {
      year_prog: '76.8%',
      month_prog: '22.5%',
      day_prog: '50.0%',
      age: '28',
      caption: '2026 年已悄然流逝四分之三，珍惜眼前每一个清晨与星夜。'
    },
    pomodoro: {
      task: 'ESP32 嵌入式固件研发',
      timer: '25:00',
      round: '第 3 / 4 组',
      state: '深度专注中 (Deep Focus)',
      tip: '专注当下，消除外界干扰'
    },
    shopping: {
      item1: '纯牛奶 2 箱 (特仑苏)',
      item2: '精品咖啡豆 500g (深烘)',
      item3: '高筋全麦面粉 5kg',
      item4: 'Type-C 编织数据线 1.5m'
    },
    care_reminders: {
      morning: '早晨：降压药 1 片 (饭后)',
      noon: '中午：复合维生素 1 粒',
      evening: '晚上：钙片 1 片 (睡前温水)',
      note: '健康是最好的财富，记得按时作息！'
    },
    daily_routine: {
      r1: '07:30 起床晨练与梳洗',
      r2: '08:30 丰盛早餐与今日规划',
      r3: '09:30 核心研发深度攻坚',
      r4: '12:00 健康午餐与小憩',
      r5: '14:00 系统联调与测试',
      r6: '18:30 晚餐与家庭休闲'
    },
    moon_phase: {
      phase: '亏凸月 (Waning Gibbous)',
      age: '月龄 20.3 天',
      illum: '亮面 78.4%',
      tide: '大潮 (高潮 04:20 / 低潮 11:35)'
    },
    qrcode: {
      ssid: 'Your_WiFi_SSID',
      pass: 'Your_WiFi_Password',
      prompt: '微信或相机扫一扫，免输密码快速连网'
    },
    photo: {
      title: '山川湖海 · 秋日光影',
      date: '2026 Autumn Collection',
      author: 'Shot on Custom Rig'
    },
    rss: {
      head1: '开源 RISC-V 架构出货量突破数百亿颗大关',
      head2: '新一代低功耗彩色全反射墨水屏技术量产发布',
      head3: 'Rust 2024 Edition 核心语言新特性全面定型',
      head4: '局域网低功耗物联网智能终端规范进一步统一'
    }
  };

  const ScenesStudio = {
    MODES_DEF: MODES_DEF,
    modeParamsStore: JSON.parse(JSON.stringify(defaultParamsStore)),
    currentSelectedMode: 'demo',
    canvas: null,
    ctx: null,

    // BWRY Palette Constants
    COLORS: {
      RED: '#d32f2f',
      YELLOW: '#f4c430',
      BLACK: '#000000',
      WHITE: '#ffffff'
    },

    /**
     * Initialize Scenes Studio
     */
    init() {
      console.log('[ScenesStudio] Initializing Scenes Studio...');

      // Restore saved params if available
      try {
        const saved = localStorage.getItem('epd_scenes_params');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(this.modeParamsStore, parsed);
        }
      } catch (e) {}

      // Locate canvas
      this.canvas = document.getElementById('scenesPreviewCanvas') || document.getElementById('modePreviewCanvas');
      if (!this.canvas) {
        console.warn('[ScenesStudio] #scenesPreviewCanvas not found; creating fallback canvas.');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'scenesPreviewCanvas';
      }
      this.canvas.width = 768;
      this.canvas.height = 552;
      this.ctx = this.canvas.getContext('2d');

      // Render mode chips into #modeChipsContainer
      this._renderModeChips();

      // Build initial form
      this.buildForm();

      // Render initial preview
      this.renderPreview();

      // Bind quick remote control buttons if present in DOM
      this._bindRemoteButtons();

      // Listen to tabchange event
      window.addEventListener('tabchange', (e) => {
        if (e.detail && e.detail.tabId === 'scenes') {
          this.renderPreview();
        }
      });

      console.log('[ScenesStudio] Ready with 18 scenes!');
    },

    /**
     * Render mode chips into #modeChipsContainer
     */
    _renderModeChips() {
      const container = document.getElementById('modeChipsContainer');
      if (!container) return;

      container.innerHTML = '';
      this.MODES_DEF.forEach(m => {
        const chip = document.createElement('div');
        chip.className = 'mode-chip' + (m.id === this.currentSelectedMode ? ' active' : '');
        chip.setAttribute('data-mode', m.id);

        chip.innerHTML = `
          <span class="mode-chip-icon">${m.icon}</span>
          <span class="mode-chip-title">${m.name}</span>
          <span class="mode-chip-desc">${m.desc}</span>
        `;

        chip.addEventListener('click', () => this.selectMode(m.id));
        container.appendChild(chip);
      });
    },

    /**
     * Switch active mode, rebuild form, trigger render
     * @param {string} modeId
     */
    selectMode(modeId) {
      if (!this.modeParamsStore[modeId]) return;
      this.currentSelectedMode = modeId;

      // Update chip active classes
      const chips = document.querySelectorAll('#modeChipsContainer .mode-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-mode') === modeId);
      });

      // Rebuild dynamic parameter form
      this.buildForm();

      // Re-render canvas preview
      this.renderPreview();
    },

    /**
     * Build dynamic parameter form into #modeFormFields
     */
    buildForm() {
      const form = document.getElementById('modeFormFields');
      if (!form) return;
      form.innerHTML = '';

      const def = this.MODES_DEF.find(m => m.id === this.currentSelectedMode);
      const titleEl = document.getElementById('modeFormTitle');
      if (titleEl && def) {
        titleEl.textContent = `${def.icon} ${def.name} · 参数配置`;
      }

      const p = this.modeParamsStore[this.currentSelectedMode] || {};

      Object.keys(p).forEach(k => {
        const row = document.createElement('div');
        row.className = 'form-group scene-form-row';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = this.getParamLabel(k);

        const isTextarea = (k === 'note' || k === 'desc' || k === 'motto' || k === 'tips' || k === 'quote' || k === 'caption');
        const input = isTextarea ? document.createElement('textarea') : document.createElement('input');

        if (isTextarea) {
          input.className = 'm3-textarea';
          input.rows = 3;
        } else {
          input.className = 'm3-input';
          input.type = 'text';
        }

        input.value = p[k];
        input.addEventListener('input', (e) => {
          p[k] = e.target.value;
          this._saveParamsDebounced();
          this.renderPreview();
        });

        row.appendChild(label);
        row.appendChild(input);
        form.appendChild(row);
      });
    },

    /**
     * Parameter key to human-readable label
     */
    getParamLabel(key) {
      const map = {
        title: '主标题',
        note: '正文便签内容',
        author: '署名 / 作者',
        item1: '条目 1',
        item2: '条目 2',
        item3: '条目 3',
        item4: '条目 4',
        footer: '底部提示语',
        year: '公历年份',
        month: '月份',
        day: '日期',
        weekday: '星期',
        lunar: '农历与节气',
        yiji: '黄历宜忌',
        motto: '每日寄语',
        city: '所在城市',
        temp: '实时气温',
        cond: '天气状况',
        high_low: '今日温差',
        aqi: '空气质量 (AQI)',
        tips: '出行生活建议',
        target_date: '目标到期日期',
        days: '剩余天数',
        quote: '励志名言',
        habit_name: '打卡习惯名称',
        streak: '连续打卡天数',
        completion: '季度达成率',
        week_done: '打卡周期',
        line1: '诗词前两句',
        line2: '诗词后两句',
        seal: '落款印章',
        desc: '事件描述',
        year_prog: '年度进度百分比',
        month_prog: '月度进度百分比',
        day_prog: '今日进度百分比',
        age: '当前年龄',
        caption: '感悟箴言',
        task: '当前专注任务',
        timer: '倒计时长',
        round: '阶段轮次',
        state: '专注状态',
        tip: '状态提醒',
        morning: '早晨用药',
        noon: '中午用药',
        evening: '晚间用药',
        r1: '日程 1 (早晨)',
        r2: '日程 2 (上午)',
        r3: '日程 3 (攻坚)',
        r4: '日程 4 (午间)',
        r5: '日程 5 (下午)',
        r6: '日程 6 (晚间)',
        phase: '月相名称',
        illum: '照射亮度',
        tide: '潮汐预报',
        ssid: 'Wi-Fi 名称',
        pass: 'Wi-Fi 密码',
        prompt: '说明提示',
        date: '拍摄日期',
        head1: '头条 1',
        head2: '头条 2',
        head3: '头条 3',
        head4: '头条 4',
        panel: '屏幕型号规格',
        status: '运行状态',
        wifi_ssid: 'Wi-Fi SSID',
        ip: '局域网 IP',
        webui_url: 'WebUI 访问网址',
        mdns: 'mDNS 本地域名',
        features: '特性摘要',
        event2_year: '补充历史年份',
        event2_title: '补充历史事件'
      };
      return map[key] || key;
    },

    /**
     * Debounced save to localStorage
     */
    _saveParamsDebounced() {
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        try {
          localStorage.setItem('epd_scenes_params', JSON.stringify(this.modeParamsStore));
        } catch (e) {}
      }, 500);
    },

    /**
     * Full 768×552 BWRY Canvas Rendering Engine for all 18 Modes
     */
    renderPreview() {
      if (!this.canvas) {
        this.canvas = document.getElementById('scenesPreviewCanvas') || document.getElementById('modePreviewCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
      }

      const canvas = this.canvas;
      const ctx = this.ctx || canvas.getContext('2d');
      const w = 768;
      const h = 552;
      canvas.width = w;
      canvas.height = h;

      const p = this.modeParamsStore[this.currentSelectedMode] || {};
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;

      // 1. Fill clean White base
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, w, h);

      // Helper: Header bar
      const drawHeader = (title, subRight, isRed = true) => {
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
      };

      // Helper: Bottom footer bar
      const drawFooter = (text) => {
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, h - 36, w, 36);
        ctx.fillStyle = WHITE;
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(text, 28, h - 13);
      };

      // ────────────────── Dispatch by Active Mode ──────────────────

      if (this.currentSelectedMode === 'demo') {
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

        // 4 Color Swatches
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
          ctx.font = 'bold 14px monospace';
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
        ctx.font = 'bold 14px monospace';
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

        // 5. Right Middle: WebUI Access Portal (X: 456, Y: 175, W: 288, H: 290)
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
        ctx.fillText(p.ip || location.hostname || '192.168.1.100', 474, 288);
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
        ctx.fillText('• 18 种场景模式与参数定制', 474, 372);
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

      } else if (this.currentSelectedMode === 'fridge_board') {
        drawHeader('📌 冰箱贴 · 极简家庭布告板', p.date || '2026-10-07 星期三');
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
        this._wrapText(ctx, p.note || '', 48, 154, w - 96, 26, 2);

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

      } else if (this.currentSelectedMode === 'memo') {
        drawHeader('📋 今日待办事项与便签 (TO-DO LIST)', p.subtitle || 'PRIORITY MEMO');
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

      } else if (this.currentSelectedMode === 'calendar') {
        drawHeader('📅 万年历与老黄历 (CALENDAR & ALMANAC)', `${p.year || 2026}年 ${p.month || 10}月`);
        // Big Day Display
        ctx.fillStyle = RED;
        ctx.font = 'bold 130px -apple-system, sans-serif';
        ctx.fillText(String(p.day || 7), 54, 220);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 32px "PingFang SC", sans-serif';
        ctx.fillText(p.weekday || '星期三', 240, 140);
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
        this._wrapText(ctx, `“ ${p.motto || ''} ”`, 48, 410, w - 96, 26, 2);
        drawFooter('中华传统历法引擎驱动 | 每日自动更新');

      } else if (this.currentSelectedMode === 'weather') {
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
        this._wrapText(ctx, p.tips || '', 48, 308, w - 96, 24, 2);

        drawFooter('气象数据同步服务正常 | 刷新间隔 60 分钟');

      } else if (this.currentSelectedMode === 'countdown') {
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
        this._wrapText(ctx, p.quote || '行则将至，未来可期！', 48, 378, w - 96, 24, 2);
        drawFooter(`目标基准日：${p.target_date || '2027-01-01'} | 持续记录`);

      } else if (this.currentSelectedMode === 'poetry') {
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

      } else if (this.currentSelectedMode === 'habit') {
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

      } else if (this.currentSelectedMode === 'pomodoro') {
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

      } else if (this.currentSelectedMode === 'shopping') {
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

      } else if (this.currentSelectedMode === 'care_reminders') {
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

      } else if (this.currentSelectedMode === 'daily_routine') {
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

      } else if (this.currentSelectedMode === 'qrcode') {
        drawHeader('📱 Wi-Fi 快速扫码连网 (QR CODE)', 'CONNECT');
        // Draw Wi-Fi Card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(48, 90, 320, 320);
        ctx.strokeRect(48, 90, 320, 320);

        // Draw QR code with QRCodeLib or fallback
        const wifiQrPayload = `WIFI:S:${p.ssid || 'Your_WiFi_SSID'};T:WPA;P:${p.pass || ''};;`;
        if (window.QRCodeLib && typeof window.QRCodeLib.drawQRCode === 'function') {
          window.QRCodeLib.drawQRCode(ctx, wifiQrPayload, 68, 110, 280);
        } else {
          // Fallback vector simulated QR
          ctx.fillStyle = BLACK;
          ctx.fillRect(78, 120, 260, 260);
          ctx.fillStyle = WHITE;
          ctx.fillRect(98, 140, 220, 220);
          ctx.fillStyle = BLACK;
          ctx.fillRect(118, 160, 50, 50);
          ctx.fillRect(248, 160, 50, 50);
          ctx.fillRect(118, 290, 50, 50);
          ctx.fillRect(190, 230, 40, 40);
        }

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(`网络：${p.ssid || ''}`, 410, 160);
        ctx.fillText(`密码：${p.pass || ''}`, 410, 210);

        ctx.fillStyle = RED;
        ctx.font = '18px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.prompt || '微信或相机扫一扫，免输密码快速连网', 410, 280, 300, 26, 2);

        drawFooter('局域网便捷接入 | 家庭智慧显示终端');

      } else if (this.currentSelectedMode === 'history') {
        drawHeader('🏛️ 历史上的今天大事记 (HISTORY)', p.year || 'HISTORIC EVENT');
        ctx.fillStyle = RED;
        ctx.font = 'bold 36px "PingFang SC", sans-serif';
        ctx.fillText(p.year || '', 48, 130);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 26px "PingFang SC", sans-serif';
        ctx.fillText(p.title || '', 48, 185);

        ctx.fillStyle = '#333333';
        ctx.font = '20px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.desc || '', 48, 250, w - 96, 28, 4);

        drawFooter('以史为鉴，可知兴替 | 历史日历');

      } else if (this.currentSelectedMode === 'life_progress') {
        drawHeader('⏳ 人生进度条与时间感知', 'LIFE PROGRESS');
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 28px "PingFang SC", sans-serif';
        ctx.fillText('2026 年度时间流逝：', 48, 130);

        ctx.fillStyle = RED;
        ctx.font = 'bold 88px -apple-system, sans-serif';
        ctx.fillText(p.year_prog || '76.8%', 48, 230);

        // Progress bar track
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(48, 270, w - 96, 24);
        const pct = Math.min(1.0, Math.max(0, parseFloat(p.year_prog) / 100)) || 0.768;
        ctx.fillStyle = RED;
        ctx.fillRect(48, 270, (w - 96) * pct, 24);

        ctx.fillStyle = BLACK;
        ctx.font = '18px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.caption || '珍惜每一个清晨与星夜。', 48, 340, w - 96, 26, 2);

        drawFooter('时光飞逝，只争朝夕');

      } else if (this.currentSelectedMode === 'moon_phase') {
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

      } else if (this.currentSelectedMode === 'photo') {
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

      } else if (this.currentSelectedMode === 'rss') {
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
    },

    /**
     * Send remote command to hardware via DeviceManager
     * @param {string} cmd - 'refresh' | 'clear' | 'clear_white' | 'reboot' | 'rf:<mode>' | 'mode:<id>'
     */
    async sendRemoteCmd(cmd) {
      console.log(`[ScenesStudio] Executing remote command: ${cmd}`);
      if (window.UI?.showToast) {
        window.UI.showToast(`正在发送硬件指令「${cmd}」...`, 'info', 3000);
      }

      try {
        const dm = window.DeviceManager;
        if (!dm) throw new Error('DeviceManager 未初始化');

        if (cmd === 'refresh') {
          if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('refresh');
            await dm.rxChar.writeValueWithoutResponse(enc);
          } else if (dm.isLanConnected && dm.lanIp) {
            await fetch(`http://${dm.lanIp}/api/display/refresh`, { method: 'POST' });
          } else {
            throw new Error('未连接设备 (请先在顶部连接蓝牙或局域网 IP)');
          }
          if (window.UI?.showToast) window.UI.showToast('已触发 16s 全屏物理波形擦写！', 'success');

        } else if (cmd === 'clear' || cmd === 'clear_white' || cmd === 'clear:white') {
          if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('clear:white');
            await dm.rxChar.writeValueWithoutResponse(enc);
          } else if (dm.isLanConnected && dm.lanIp) {
            await fetch(`http://${dm.lanIp}/api/display/clear`, { method: 'POST' });
          } else {
            throw new Error('未连接设备');
          }
          if (window.UI?.showToast) window.UI.showToast('已触发纯白清屏！', 'success');

        } else if (cmd === 'reboot') {
          if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('reboot');
            await dm.rxChar.writeValueWithoutResponse(enc);
          } else if (dm.isLanConnected && dm.lanIp) {
            await fetch(`http://${dm.lanIp}/api/system/reboot`, { method: 'POST' });
          } else {
            throw new Error('未连接设备');
          }
          if (window.UI?.showToast) window.UI.showToast('设备正在软重启，请稍候...', 'success');

        } else if (cmd.startsWith('rf:') || cmd.startsWith('wireless:')) {
          let mode = cmd.replace(/^(rf:|wireless:)/, '').trim();
          if (mode === 'ble') mode = 'ble_only';
          if (mode === 'wifi') mode = 'wifi_only';

          if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode(`wireless:${mode}`);
            await dm.rxChar.writeValueWithoutResponse(enc);
          } else if (dm.isLanConnected && dm.lanIp) {
            await fetch(`http://${dm.lanIp}/api/wireless/mode`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode })
            });
          } else {
            throw new Error('未连接设备');
          }
          if (window.UI?.showToast) window.UI.showToast(`射频共存模式已切换为「${mode}」`, 'success');

        } else if (cmd.startsWith('mode:')) {
          const modeId = cmd.replace(/^mode:/, '');
          await dm.switchMode(modeId);
          if (window.UI?.showToast) window.UI.showToast(`屏幕模式已切换为「${modeId}」`, 'success');

        } else {
          // Direct mode switch fallback
          await dm.switchMode(cmd);
          if (window.UI?.showToast) window.UI.showToast(`已切换至「${cmd}」模式`, 'success');
        }
      } catch (err) {
        console.error('[ScenesStudio] Command execution error:', err);
        if (window.UI?.showToast) {
          window.UI.showToast(`指令执行失败: ${err.message}`, 'error', 4000);
        }
        throw err;
      }
    },

    /**
     * Push current scene canvas to hardware display
     */
    async pushCurrentScene() {
      if (!this.canvas) return;
      try {
        if (window.UI?.showToast) {
          window.UI.showToast(`正在量化并推送【${this.currentSelectedMode}】场景至墨水屏...`, 'info', 4000);
        }
        if (window.App && typeof window.App.pushCanvas === 'function') {
          await window.App.pushCanvas(this.canvas, `场景: ${this.currentSelectedMode}`);
        } else if (window.BWRY && window.DeviceManager) {
          const packed = window.BWRY.ditherCanvasTo2bpp(this.canvas, 'floyd');
          await window.DeviceManager.pushBitmap2bpp(packed);
          if (window.UI?.showToast) window.UI.showToast('🎉 推送场景成功！', 'success');
        }
      } catch (e) {
        if (window.UI?.showToast) window.UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
      }
    },

    /**
     * Save current scene as preset
     */
    async saveCurrentSceneAsPreset() {
      if (!this.canvas) return;
      const def = this.MODES_DEF.find(m => m.id === this.currentSelectedMode);
      const name = prompt('请输入预设名称:', `${def ? def.name : '场景'}_${new Date().toLocaleTimeString('zh-CN')}`);
      if (!name) return;

      try {
        if (window.BWRY && window.PresetHub) {
          const packed = window.BWRY.ditherCanvasTo2bpp(this.canvas, 'floyd');
          await window.PresetHub.savePreset({
            name,
            type: 'scene',
            typeLabel: `场景 · ${def ? def.name : this.currentSelectedMode}`,
            rawBitmap: packed
          });
          if (window.App?.renderPresetsUI) window.App.renderPresetsUI();
          if (window.UI?.showToast) window.UI.showToast(`已成功保存场景预设「${name}」！`, 'success');
        }
      } catch (e) {
        if (window.UI?.showToast) window.UI.showToast(`保存失败: ${e.message}`, 'error');
      }
    },

    /**
     * Bind remote control quick action buttons if present
     */
    _bindRemoteButtons() {
      // Refresh 16s
      document.querySelectorAll('#sceneRefreshBtn, [data-remote-cmd="refresh"]').forEach(btn => {
        btn.addEventListener('click', () => this.sendRemoteCmd('refresh'));
      });

      // Clear white
      document.querySelectorAll('#sceneClearBtn, [data-remote-cmd="clear"]').forEach(btn => {
        btn.addEventListener('click', () => this.sendRemoteCmd('clear'));
      });

      // Reboot
      document.querySelectorAll('#sceneRebootBtn, [data-remote-cmd="reboot"]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('确认软重启墨水屏设备？')) {
            this.sendRemoteCmd('reboot');
          }
        });
      });

      // Push scene
      document.querySelectorAll('#scenePushBtn, #btnSaveAndPushMode').forEach(btn => {
        btn.addEventListener('click', () => this.pushCurrentScene());
      });

      // Save preset
      document.querySelectorAll('#sceneSavePresetBtn').forEach(btn => {
        btn.addEventListener('click', () => this.saveCurrentSceneAsPreset());
      });

      // RF switch buttons
      document.querySelectorAll('[data-rf-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-rf-mode');
          this.sendRemoteCmd(`rf:${mode}`);
        });
      });
    },

    /**
     * Helper text wrap
     */
    _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
      const words = String(text || '').split('');
      let line = '';
      let currentY = y;
      let lineCount = 1;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          if (lineCount >= maxLines) {
            ctx.fillText(line + '...', x, currentY);
            return;
          }
          ctx.fillText(line, x, currentY);
          line = words[n];
          currentY += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    },

    /**
     * Returns the target canvas (#scenesPreviewCanvas)
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
      if (!this.canvas) {
        this.canvas = document.getElementById('scenesPreviewCanvas') || document.getElementById('modePreviewCanvas');
      }
      return this.canvas;
    }
  };

  // Expose ScenesStudio to global window
  window.ScenesStudio = ScenesStudio;

  // Auto-init on DOM ready if canvas or container exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('modeChipsContainer') || document.getElementById('scenesPreviewCanvas')) {
        ScenesStudio.init();
      }
    });
  } else {
    if (document.getElementById('modeChipsContainer') || document.getElementById('scenesPreviewCanvas')) {
      ScenesStudio.init();
    }
  }

})(window);
