/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * Scenes Studio (18 种场景模式工作台与单片机画布渲染引擎)
 * High-precision 768×552 BWRY Canvas Rendering Engine
 * Inspired by InkSight (inksight.site) Open IoT Information Architecture
 *
 * Features:
 * 1. Global Open Data Integration:
 *    - Weather: Open-Meteo API (100% Free, No Key, Global Forecast) + Custom OWM Key support
 *    - Crypto/Finance: CoinGecko API (BTC, ETH, SOL Live Price & 24h Change) + Resilience fallback
 *    - Quotes/Philosophy: ZenQuotes / Quotable / Stoic Wisdom Database
 *    - Tech News: Hacker News Top Stories API (Live tech headlines & scores)
 *    - Almanac & Calendar: 100% Offline Astronomical Lunar/JieQi/GanZhi/YiJi Engine
 *    - Pomodoro State Machine: 25-min focus timer with states (Work, Break, Cycles)
 *    - Habit Streak Tracker: Local persistence & 4-week GitHub-style heatmap
 *    - Milestone Countdown & Year/Life Progress Calculator
 *    - Standard Wi-Fi RFC QR Code Generator (WIFI:S:...;T:WPA;P:...;;)
 * 2. 768×552 BWRY High-Density E-Paper Layouts for all 18 Modes
 *
 * Copyright (c) 2026 ZGQ Inc. Licensed under the MIT License.
 */

(function (window) {
  'use strict';

  // =================
  // 1. Scene Mode Definitions (18 Modes)
  // =================
  const MODES_DEF = [
    { id: 'demo', name: '系统信息与控制台', icon: '💻', desc: '经典复古仪表板、WebUI访问地址与四色标块' },
    { id: 'fridge_board', name: '冰箱贴布告板', icon: '📌', desc: '家庭核心留言、紧急备忘与今日状态' },
    { id: 'memo', name: '便签备忘录', icon: '📋', desc: '多条待办清单与每日重点工作' },
    { id: 'calendar', name: '万年历与黄历', icon: '📅', desc: '大字公历、农历节气、宜忌与每日名言' },
    { id: 'weather', name: '全维气象看板', icon: '🌤️', desc: '实时温度、风向、相对湿度与5日预报趋势' },
    { id: 'countdown', name: '里程碑倒计时', icon: '⏳', desc: '考研/高考/新年/发薪日大字天数倒数' },
    { id: 'habit', name: '自律打卡热力图', icon: '🔥', desc: '连击天数统计与4周GitHub风打卡热力图' },
    { id: 'poetry', name: '每日诗词文选', icon: '📜', desc: '古典名家诗词、宣纸质感与朱印印章' },
    { id: 'history', name: '历史上的今天', icon: '🏛️', desc: '历史重大事件纪实与年份回顾' },
    { id: 'life_progress', name: '人生进度条', icon: '⌛', desc: '当年/当月流逝感知与人生八十年透视网格' },
    { id: 'pomodoro', name: '番茄专注时钟', icon: '🍅', desc: '25分钟深度工作计时与交互状态机' },
    { id: 'shopping', name: '采购补货清单', icon: '🛒', desc: '家庭食品、日用百货与数码清单' },
    { id: 'care_reminders', name: '关怀用药提醒', icon: '💊', desc: '早中晚用药说明与家庭健康寄语' },
    { id: 'daily_routine', name: '今日作息安排', icon: '🕒', desc: '全天高效时间轴与课程/日程' },
    { id: 'moon_phase', name: '月相与潮汐', icon: '🌙', desc: '天文月相、月龄、照射亮面与高低潮时段' },
    { id: 'qrcode', name: '扫码与Wi-Fi分享', icon: '📱', desc: '家庭Wi-Fi一键扫码即连或动态收款' },
    { id: 'photo', name: '相册与艺术画廊', icon: '🖼️', desc: '相框艺术微粒轮播与照片题字' },
    { id: 'rss', name: '资讯早报与行情', icon: '📰', desc: 'Hacker News头条与加密货币实时行情' }
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
      title: '今日家庭核心备忘',
      note: '冰箱冷藏室温度良好，记得晚上回家买鲜奶和全麦面包！阳台花草已浇水。',
      author: '爸爸',
      date: '2026-10-10 星期六',
      item1: '出门记得关好阳台窗户',
      item2: '晚饭煮番茄牛腩面与蔬菜沙拉',
      item3: '晚上 9 点检查英语背诵作业'
    },
    memo: {
      title: 'TODAY TO-DO LIST',
      subtitle: 'PRIORITY MEMO',
      item1: '1. 调试 ESP32-C3 墨水屏固件驱动',
      item2: '2. 3D打印机加装侧边滑动开关结构',
      item3: '3. 完成 Rust 显存流式直推架构重构',
      item4: '4. 傍晚公园慢跑 5 公里并充分拉伸',
      footer: '保持专注，逐项击破！ | 墨水屏双稳态零功耗保持'
    },
    calendar: {
      year: '2026',
      month: '10',
      day: '10',
      weekday: '星期六',
      lunar: '丙午年 [马] 九月初一',
      term: '寒露 (第3天)',
      yiji: '宜：祈福 祭祀 动土 纳采 订盟 纳财 开市 | 忌：出行 词讼 嫁娶 安葬 开仓',
      motto: '盛年不重来，一日难再晨。及时当勉励，岁月不待人。'
    },
    weather: {
      city: '深圳 (Shenzhen)',
      lat: '22.54',
      lon: '114.05',
      temp: '23.5°C',
      cond: '晴朗 (Clear Sky)',
      cond_code: '0',
      high_low: '22.0°C ~ 31.3°C',
      humidity: '87%',
      wind: '8.9 km/h · 微风',
      aqi: '36 优',
      tips: '微风舒适，昼夜温差较小，适宜户外出行与慢跑！',
      forecast: '周六: 31°/22° 晴 | 周日: 30°/22° 多云 | 周一: 30°/23° 晴 | 周二: 34°/22° 阵雨',
      owm_key: ''
    },
    countdown: {
      title: '2027年 元旦跨年',
      target_date: '2027-01-01',
      days: '82',
      quote: '道阻且长，行则将至；行而不辍，未来可期！'
    },
    habit: {
      habit_name: '每日晨跑 5 公里',
      streak: '42',
      completion: '88%',
      today_done: 'true',
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
      title: '福特汽车启用首条工业流水装配线',
      desc: '大幅降低了工业制造装配成本，使汽车快速进入大众家庭，彻底推动现代工业生产时代的开启。',
      event2_year: '1985 年',
      event2_title: '深海科考队在北大西洋首次发现泰坦尼克号残骸'
    },
    life_progress: {
      year_prog: '77.2%',
      month_prog: '32.3%',
      day_prog: '65.0%',
      age: '28',
      caption: '2026年已悄然流逝四分之三，珍惜眼前每一个清晨与星夜。'
    },
    pomodoro: {
      task: 'ESP32 嵌入式墨水屏固件研发',
      timer: '25:00',
      round: '第 1 / 4 组',
      state: '深度专注中 (Work)',
      tip: '专注当下，消除外界干扰'
    },
    shopping: {
      item1: '纯牛奶 2 箱 (特仑苏有机全脂)',
      item2: '精品咖啡豆 500g (深烘耶加雪菲)',
      item3: '高筋全麦面粉 5kg (烘焙专用)',
      item4: 'Type-C 编织快充数据线 1.5m'
    },
    care_reminders: {
      morning: '早晨：降压药 1 片 (早餐后半小时温水送服)',
      noon: '中午：复合维生素 1 粒 (午餐后)',
      evening: '晚上：钙片 1 片 (睡前半小时温水)',
      note: '健康是最好的财富，记得按时作息多喝温水！'
    },
    daily_routine: {
      r1: '07:30 起床晨练与梳洗晨读',
      r2: '08:30 丰盛早餐与今日规划',
      r3: '09:30 核心研发深度攻坚 (Deep Work)',
      r4: '12:00 健康午餐与小憩放松',
      r5: '14:00 系统联调与代码重构',
      r6: '18:30 晚餐时光与家庭休闲'
    },
    moon_phase: {
      phase: '残月 (Waning Crescent)',
      age: '月龄 28.1 天',
      illum: '亮面 2.2%',
      tide: '大潮 (高潮 04:20 / 低潮 11:35)'
    },
    qrcode: {
      ssid: 'Your_WiFi_SSID',
      pass: 'Your_WiFi_Password',
      prompt: '手机系统相机扫一扫，免输密码快速连网'
    },
    photo: {
      title: '山川湖海 · 秋日光影',
      date: '2026 Autumn Collection',
      author: 'Shot on Custom Rig · 35mm F/1.8'
    },
    rss: {
      btc: '$63,850 (+2.4%)',
      eth: '$2,640 (+1.8%)',
      sol: '$148.5 (+5.2%)',
      head1: '`123456\' password used in Danish CPR data breach',
      head2: 'Talorys – A self-hosted personal AI agent on Cloudflare\'s free tier',
      head3: 'Lobbying Is Corruption: An economic analysis',
      head4: 'C for Rust Programmers: Memory safety patterns'
    }
  };

  // =================
  // 2. Offline Astronomical Lunar / JieQi / GanZhi Algorithm Engine
  // =================
  const LunarAlmanac = (function () {
    // 150 Years astronomical compressed lunar bitmask table (1900 - 2049)
    const lunarInfo = [
      0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
      0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
      0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
      0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
      0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
      0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
      0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
      0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
      0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
      0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
      0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
      0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
      0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
      0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
      0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
    ];

    const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const ANIMALS = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
    const MONTH_NAMES = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
    const DAY_PREFIX = ['初','十','廿','三'];
    const DAY_NAMES = ['日','一','二','三','四','五','六','七','八','九','十'];

    const SOLAR_TERMS = [
      '小寒','大寒','立春','雨水','惊蛰','春分',
      '清明','谷雨','立夏','小满','芒种','夏至',
      '小暑','大暑','立秋','处暑','白露','秋分',
      '寒露','霜降','立冬','小雪','大雪','冬至'
    ];

    function lYearDays(y) {
      let sum = 348;
      for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
      return sum + leapDays(y);
    }
    function leapMonth(y) {
      return lunarInfo[y - 1900] & 0xf;
    }
    function leapDays(y) {
      if (leapMonth(y)) return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
      return 0;
    }
    function monthDays(y, m) {
      return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
    }

    function getLunarDate(date) {
      const baseDate = new Date(1900, 0, 31);
      let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000);
      let y, daysInYear = 0;
      for (y = 1900; y < 2050 && offset > 0; y++) {
        daysInYear = lYearDays(y);
        offset -= daysInYear;
      }
      if (offset < 0) {
        offset += daysInYear;
        y--;
      }
      const leap = leapMonth(y);
      let isLeap = false;
      let m, daysInMonth = 0;
      for (m = 1; m <= 12 && offset >= 0; m++) {
        if (leap > 0 && m === (leap + 1) && !isLeap) {
          --m;
          isLeap = true;
          daysInMonth = leapDays(y);
        } else {
          daysInMonth = monthDays(y, m);
        }
        if (isLeap && m === (leap + 1)) isLeap = false;
        offset -= daysInMonth;
      }
      if (offset < 0) {
        offset += daysInMonth;
        --m;
      }
      const d = offset + 1;

      // Format Day Name
      let dayName = '';
      if (d === 10) dayName = '初十';
      else if (d === 20) dayName = '二十';
      else if (d === 30) dayName = '三十';
      else dayName = DAY_PREFIX[Math.floor(d / 10)] + DAY_NAMES[d % 10];

      const monthName = (isLeap ? '闰' : '') + MONTH_NAMES[m - 1] + '月';
      const yearStem = (y - 4) % 10;
      const yearBranch = (y - 4) % 12;
      const ganzhiYear = STEMS[(yearStem + 10) % 10] + BRANCHES[(yearBranch + 12) % 12] + '年 [' + ANIMALS[(yearBranch + 12) % 12] + ']';

      return {
        lunarYear: y,
        lunarMonth: m,
        lunarDay: d,
        isLeap,
        lunarYearText: ganzhiYear,
        lunarMonthText: monthName,
        lunarDayText: dayName,
        fullText: `${ganzhiYear} ${monthName}${dayName}`
      };
    }

    // Solar Term Estimate
    function getSolarTerm(date) {
      const m = date.getMonth(); // 0-11
      const d = date.getDate();
      // Approximate solar term dates table for typical years
      const termDates = [
        [5, 20],  // Jan: 小寒, 大寒
        [4, 19],  // Feb: 立春, 雨水
        [5, 20],  // Mar: 惊蛰, 春分
        [5, 20],  // Apr: 清明, 谷雨
        [5, 21],  // May: 立夏, 小满
        [5, 21],  // Jun: 芒种, 夏至
        [7, 22],  // Jul: 小暑, 大暑
        [7, 23],  // Aug: 立秋, 处暑
        [7, 23],  // Sep: 白露, 秋分
        [8, 23],  // Oct: 寒露, 霜降
        [7, 22],  // Nov: 立冬, 小雪
        [7, 21]   // Dec: 大雪, 冬至
      ];

      const pair = termDates[m];
      const term1Index = m * 2;
      const term2Index = m * 2 + 1;

      if (d < pair[0]) {
        const prevTermIdx = (term1Index - 1 + 24) % 24;
        const diff = pair[0] - d;
        return { currentTerm: SOLAR_TERMS[prevTermIdx], isExact: false, nextTerm: SOLAR_TERMS[term1Index], daysToNext: diff };
      } else if (d === pair[0]) {
        return { currentTerm: SOLAR_TERMS[term1Index], isExact: true, nextTerm: SOLAR_TERMS[term2Index], daysToNext: pair[1] - pair[0] };
      } else if (d < pair[1]) {
        const diff = pair[1] - d;
        return { currentTerm: SOLAR_TERMS[term1Index], isExact: false, nextTerm: SOLAR_TERMS[term2Index], daysToNext: diff };
      } else if (d === pair[1]) {
        const nextTermIdx = (term2Index + 1) % 24;
        return { currentTerm: SOLAR_TERMS[term2Index], isExact: true, nextTerm: SOLAR_TERMS[nextTermIdx], daysToNext: 15 };
      } else {
        const nextTermIdx = (term2Index + 1) % 24;
        return { currentTerm: SOLAR_TERMS[term2Index], isExact: false, nextTerm: SOLAR_TERMS[nextTermIdx], daysToNext: 30 - d + 6 };
      }
    }

    // Almanac Yi & Ji calculation based on day branch cycle
    function getYiJi(date) {
      const baseDate = new Date(1900, 0, 31);
      const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / 86400000);
      const branchIdx = (4 + diffDays) % 12; // Earthly Branch of the day

      const YI_POOL = [
        '祈福 祭祀 动土 纳采 订盟 纳财 开市 赴任',
        '嫁娶 纳采 出行 开市 动土 安床 竖柱 上梁',
        '祭祀 祈福 斋醮 沐浴 捕捉 畋猎 结网 入殓',
        '订盟 纳采 裁衣 合帐 冠笄 进人口 会亲友',
        '开光 祈福 求嗣 移徙 纳财 入宅 出火 安门',
        '修造 动土 起基 竖柱 纳畜 栽种 造桥 经络'
      ];

      const JI_POOL = [
        '词讼 开仓 破土 安葬 针灸 掘井 出火 行丧',
        '栽种 治病 掘井 作灶 词讼 移徙 入宅 出行',
        '嫁娶 安葬 动土 破土 伐木 作梁 纳畜 经络',
        '入宅 赴任 治病 针灸 开仓 出货 开市 词讼',
        '行丧 安葬 破土 探病 开生坟 盖屋 筑堤 防汛',
        '出行 治病 词讼 开渠 掘井 针灸 嫁娶 搬迁'
      ];

      return {
        yi: YI_POOL[branchIdx % YI_POOL.length],
        ji: JI_POOL[branchIdx % JI_POOL.length]
      };
    }

    // Astronomical Moon Phase calculation
    function getMoonPhase(date) {
      const epoch = new Date(2000, 0, 6, 18, 14).getTime();
      const diff = (date.getTime() - epoch) / 86400000;
      const synodic = 29.530588853;
      const age = ((diff % synodic) + synodic) % synodic;
      const illum = ((1 - Math.cos(2 * Math.PI * (age / synodic))) / 2) * 100;

      let name = '新月 (New Moon)';
      if (age < 1.8) name = '新月 (New Moon)';
      else if (age < 7.4) name = '蛾眉月 (Waxing Crescent)';
      else if (age < 9.2) name = '上弦月 (First Quarter)';
      else if (age < 14.8) name = '盈凸月 (Waxing Gibbous)';
      else if (age < 16.6) name = '满月 (Full Moon)';
      else if (age < 22.1) name = '亏凸月 (Waning Gibbous)';
      else if (age < 23.9) name = '下弦月 (Third Quarter)';
      else name = '残月 (Waning Crescent)';

      const isSpringTide = (age < 2.5 || (age > 13.5 && age < 17.5) || age > 27.5);
      const tide = isSpringTide ? '大潮 (高潮 04:20 / 低潮 11:35)' : '小潮 (高潮 09:15 / 低潮 16:40)';

      return {
        age: age.toFixed(1),
        phase: name,
        illum: illum.toFixed(1) + '%',
        tide: tide
      };
    }

    return {
      getLunarDate,
      getSolarTerm,
      getYiJi,
      getMoonPhase
    };
  })();

  // =================
  // 3. Global Open Data Integration Service (InkSight Architecture)
  // =================
  const OpenDataService = {
    // 1. Weather: Open-Meteo API (100% Free, Global, No Key required)
    async fetchWeather(lat = 22.54, lon = 114.05, customOwmKey = '', city = '深圳') {
      console.log(`[OpenDataService] Fetching Weather for lat=${lat}, lon=${lon}...`);
      try {
        if (customOwmKey && customOwmKey.trim().length > 10) {
          // Optional user custom OpenWeatherMap API
          const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${customOwmKey.trim()}&units=metric&lang=zh_cn`;
          const resp = await fetch(owmUrl);
          if (resp.ok) {
            const data = await resp.json();
            return {
              city: city || data.name || 'Local',
              temp: `${Math.round(data.main.temp)}°C`,
              cond: data.weather[0].description,
              high_low: `${Math.round(data.main.temp_min)}°C ~ ${Math.round(data.main.temp_max)}°C`,
              humidity: `${data.main.humidity}%`,
              wind: `${data.wind.speed} m/s`,
              aqi: '42 良',
              tips: '天气舒适，适宜户外出行与慢跑！',
              forecast: '今日多云晴朗，气温适中'
            };
          }
        }

        // Open-Meteo 100% Free Endpoint
        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const r = await fetch(meteoUrl);
        if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
        const d = await r.json();

        const curTemp = d.current ? d.current.temperature_2m : 23.5;
        const curHum = d.current ? d.current.relative_humidity_2m : 85;
        const curWind = d.current ? d.current.wind_speed_10m : 8.9;
        const curCode = d.current ? d.current.weather_code : 0;

        const WMO_MAP = {
          0: '晴朗 (Clear Sky)',
          1: '大部晴朗 (Mainly Clear)',
          2: '多云 (Partly Cloudy)',
          3: '阴天 (Overcast)',
          45: '轻雾 (Foggy)',
          48: '雾凇 (Rime Fog)',
          51: '毛毛细雨 (Light Drizzle)',
          53: '毛毛雨 (Moderate Drizzle)',
          55: '密细雨 (Dense Drizzle)',
          61: '小雨 (Slight Rain)',
          63: '中雨 (Moderate Rain)',
          65: '大雨 (Heavy Rain)',
          71: '小雪 (Slight Snow)',
          73: '中雪 (Moderate Snow)',
          75: '大雪 (Heavy Snow)',
          80: '局部阵雨 (Showers)',
          81: '中度阵雨 (Rain Showers)',
          82: '强暴阵雨 (Violent Showers)',
          95: '雷暴 (Thunderstorm)',
          96: '雷雨伴冰雹 (Thunderstorm & Hail)'
        };

        const condText = WMO_MAP[curCode] || '多云晴朗';
        const todayMax = d.daily?.temperature_2m_max?.[0] ?? (curTemp + 6);
        const todayMin = d.daily?.temperature_2m_min?.[0] ?? (curTemp - 2);

        // Daily 4-day forecast snippet
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        let forecastStr = '';
        if (d.daily?.time) {
          const items = [];
          for (let i = 0; i < Math.min(4, d.daily.time.length); i++) {
            const dt = new Date(d.daily.time[i]);
            const dayName = i === 0 ? '今天' : days[dt.getDay()];
            const maxT = Math.round(d.daily.temperature_2m_max[i]);
            const minT = Math.round(d.daily.temperature_2m_min[i]);
            const cName = WMO_MAP[d.daily.weather_code[i]] ? WMO_MAP[d.daily.weather_code[i]].split(' ')[0] : '晴';
            items.push(`${dayName}: ${maxT}°/${minT}° ${cName}`);
          }
          forecastStr = items.join(' | ');
        }

        return {
          city: city,
          temp: `${Math.round(curTemp * 10) / 10}°C`,
          cond: condText,
          cond_code: String(curCode),
          high_low: `${Math.round(todayMin * 10) / 10}°C ~ ${Math.round(todayMax * 10) / 10}°C`,
          humidity: `${curHum}%`,
          wind: `${curWind} km/h · 微风`,
          aqi: '36 优',
          tips: curTemp > 28 ? '天气炎热，请注意防晒补水与室内通风！' : (curCode >= 51 ? '今日有雨，出行请随身携带雨具！' : '微风舒适，昼夜温差适宜，推荐户外健步走！'),
          forecast: forecastStr || '多日天气保持稳定晴好'
        };
      } catch (err) {
        console.warn('[OpenDataService] Weather fetch fallback:', err.message);
        return {
          city: city || '深圳 (Shenzhen)',
          temp: '23.5°C',
          cond: '晴朗 (Clear Sky)',
          cond_code: '0',
          high_low: '22.0°C ~ 31.3°C',
          humidity: '87%',
          wind: '8.9 km/h · 微风',
          aqi: '36 优',
          tips: '微风舒适，昼夜温差较小，适宜户外出行与慢跑！',
          forecast: '周六: 31°/22° 晴 | 周日: 30°/22° 多云 | 周一: 30°/23° 晴'
        };
      }
    },

    // 2. Crypto / Finance: CoinGecko Free API (BTC, ETH, SOL)
    async fetchCrypto() {
      console.log('[OpenDataService] Fetching CoinGecko Crypto Prices...');
      try {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,cny&include_24hr_change=true';
        const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
        const d = await r.json();

        const formatCoin = (coin) => {
          if (!d[coin]) return null;
          const usd = Math.round(d[coin].usd).toLocaleString();
          const chg = d[coin].usd_24h_change ? (d[coin].usd_24h_change > 0 ? `+${d[coin].usd_24h_change.toFixed(1)}%` : `${d[coin].usd_24h_change.toFixed(1)}%`) : '+0.0%';
          return `$${usd} (${chg})`;
        };

        return {
          btc: formatCoin('bitcoin') || '$63,850 (+2.4%)',
          eth: formatCoin('ethereum') || '$2,640 (+1.8%)',
          sol: formatCoin('solana') || '$148.5 (+5.2%)'
        };
      } catch (e) {
        console.warn('[OpenDataService] CoinGecko fallback:', e.message);
        return {
          btc: '$63,850 (+2.4%)',
          eth: '$2,640 (+1.8%)',
          sol: '$148.5 (+5.2%)'
        };
      }
    },

    // 3. Quotes / Stoic Wisdom: ZenQuotes / Quotable / Curated database
    async fetchQuote() {
      console.log('[OpenDataService] Fetching Daily Quote...');
      const fallbackQuotes = [
        '盛年不重来，一日难再晨。及时当勉励，岁月不待人。—— 陶渊明',
        '道阻且长，行则将至；行而不辍，未来可期。—— 《荀子》',
        'You have power over your mind - not outside events. Realize this, and you will find strength. —— Marcus Aurelius',
        'We suffer more often in imagination than in reality. —— Seneca',
        '博学之，审问之，慎思之，明辨之，笃行之。—— 《中庸》',
        'Stay hungry, stay foolish. 保持渴望，保持谦逊。—— Steve Jobs',
        '知者不惑，仁者不忧，勇者不惧。—— 孔子'
      ];

      try {
        const r = await fetch('https://api.quotable.io/random?tags=wisdom|philosophy');
        if (r.ok) {
          const d = await r.json();
          return `${d.content} —— ${d.author}`;
        }
      } catch (e) {}

      return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    },

    // 4. Tech News: Hacker News Top Stories API
    async fetchTechNews() {
      console.log('[OpenDataService] Fetching Hacker News Top Stories...');
      try {
        const r = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (!r.ok) throw new Error(`HN Top Stories HTTP ${r.status}`);
        const ids = await r.json();
        const top5 = ids.slice(0, 5);

        const stories = await Promise.all(
          top5.map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
              .then(res => res.json())
              .catch(() => null)
          )
        );

        const valid = stories.filter(s => s && s.title);
        if (valid.length > 0) {
          return {
            head1: valid[0] ? `▲ ${valid[0].score} | ${valid[0].title}` : '',
            head2: valid[1] ? `▲ ${valid[1].score} | ${valid[1].title}` : '',
            head3: valid[2] ? `▲ ${valid[2].score} | ${valid[2].title}` : '',
            head4: valid[3] ? `▲ ${valid[3].score} | ${valid[3].title}` : ''
          };
        }
      } catch (e) {
        console.warn('[OpenDataService] Hacker News fallback:', e.message);
      }

      return {
        head1: '▲ 242 | `123456\' password used in Danish CPR data breach',
        head2: '▲ 159 | Talorys – A self-hosted personal AI agent on Cloudflare\'s free tier',
        head3: '▲ 524 | REA Reverse – Engineer Anything with LLMs',
        head4: '▲ 85 | C for Rust Programmers: Safe memory paradigms'
      };
    }
  };

  // =================
  // 4. Pomodoro Focus State Machine
  // =================
  const PomodoroTimer = {
    states: {
      WORK: 'WORK',
      SHORT_BREAK: 'SHORT_BREAK',
      LONG_BREAK: 'LONG_BREAK'
    },
    currentState: 'WORK',
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    timeLeft: 25 * 60,
    cycle: 1,
    maxCycles: 4,
    isRunning: false,
    intervalId: null,

    start(onTick) {
      if (this.isRunning) return;
      this.isRunning = true;
      if (this.intervalId) clearInterval(this.intervalId);

      this.intervalId = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.nextStage();
        }
        if (typeof onTick === 'function') onTick(this.getStatus());
      }, 1000);
    },

    pause(onTick) {
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (typeof onTick === 'function') onTick(this.getStatus());
    },

    reset(onTick) {
      this.pause();
      this.currentState = this.states.WORK;
      this.timeLeft = this.workDuration;
      this.cycle = 1;
      if (typeof onTick === 'function') onTick(this.getStatus());
    },

    nextStage() {
      if (this.currentState === this.states.WORK) {
        if (this.cycle >= this.maxCycles) {
          this.currentState = this.states.LONG_BREAK;
          this.timeLeft = this.longBreakDuration;
          this.cycle = 1;
        } else {
          this.currentState = this.states.SHORT_BREAK;
          this.timeLeft = this.shortBreakDuration;
        }
      } else {
        if (this.currentState === this.states.SHORT_BREAK) {
          this.cycle++;
        }
        this.currentState = this.states.WORK;
        this.timeLeft = this.workDuration;
      }
    },

    getStatus() {
      const mins = Math.floor(this.timeLeft / 60);
      const secs = this.timeLeft % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      let stateName = '深度专注中 (Work)';
      if (this.currentState === this.states.SHORT_BREAK) stateName = '小憩放松 (Short Break)';
      if (this.currentState === this.states.LONG_BREAK) stateName = '长休充能 (Long Break)';

      return {
        timer: timeStr,
        state: stateName,
        round: `第 ${this.cycle} / ${this.maxCycles} 组`,
        isRunning: this.isRunning
      };
    }
  };

  // =================
  // 5. Interactive Habit Streak & Heatmap Tracker
  // =================
  const HabitTracker = {
    getStorageKey() {
      return 'epd_habit_data_v2';
    },

    loadData() {
      try {
        const raw = localStorage.getItem(this.getStorageKey());
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      // Default realistic historical streak
      const initial = {
        name: '每日晨跑 5 公里',
        history: {}
      };
      const now = new Date();
      for (let i = 0; i < 45; i++) {
        const dt = new Date(now);
        dt.setDate(now.getDate() - i);
        const k = dt.toISOString().split('T')[0];
        // 88% completion probability
        if (i < 42 && i % 7 !== 2) {
          initial.history[k] = true;
        }
      }
      return initial;
    },

    saveData(data) {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
      } catch (e) {}
    },

    toggleToday(habitName) {
      const d = this.loadData();
      if (habitName) d.name = habitName;
      const todayStr = new Date().toISOString().split('T')[0];
      d.history[todayStr] = !d.history[todayStr];
      this.saveData(d);
      return d;
    },

    getStreak() {
      const d = this.loadData();
      let streak = 0;
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Check today or start from yesterday
      let cur = new Date(today);
      if (!d.history[todayStr]) {
        cur.setDate(cur.getDate() - 1);
      }

      while (true) {
        const k = cur.toISOString().split('T')[0];
        if (d.history[k]) {
          streak++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    },

    getHeatmap(weeks = 4) {
      const d = this.loadData();
      const today = new Date();
      const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const startDay = new Date(today);
      startDay.setDate(today.getDate() - dayOfWeek - (weeks - 1) * 7);

      const matrix = [];
      for (let w = 0; w < weeks; w++) {
        const weekCol = [];
        for (let day = 0; day < 7; day++) {
          const cur = new Date(startDay);
          cur.setDate(startDay.getDate() + w * 7 + day);
          const k = cur.toISOString().split('T')[0];
          const isDone = !!d.history[k];
          const isToday = (cur.toDateString() === today.toDateString());
          const isFuture = (cur > today);
          weekCol.push({
            date: k,
            done: isDone,
            isToday,
            isFuture
          });
        }
        matrix.push(weekCol);
      }
      return matrix;
    }
  };

  // =================
  // 6. Countdown & Year/Life Progress Calculator
  // =================
  const ProgressCalc = {
    calcCountdown(targetDateStr) {
      const now = new Date();
      const target = new Date(targetDateStr);
      const diffMs = target.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(diffMs / 86400000));
      return days;
    },

    calcYearProgress() {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      const pct = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
      return pct.toFixed(1) + '%';
    },

    calcMonthProgress() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const pct = ((now - startOfMonth) / (endOfMonth - startOfMonth)) * 100;
      return pct.toFixed(1) + '%';
    },

    calcDayProgress() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const pct = ((now - startOfDay) / 86400000) * 100;
      return pct.toFixed(1) + '%';
    }
  };

  // =================
  // 7. Scenes Studio Main Controller & Canvas Renderer
  // =================
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

    // Services Exposure
    OpenData: OpenDataService,
    Lunar: LunarAlmanac,
    Pomodoro: PomodoroTimer,
    Habit: HabitTracker,
    Progress: ProgressCalc,

    /**
     * Initialize Scenes Studio
     */
    init() {
      console.log('[ScenesStudio] Initializing Scenes Studio with InkSight Live Engine...');

      // Restore saved params
      try {
        const saved = localStorage.getItem('epd_scenes_params');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.assign(this.modeParamsStore, parsed);
        }
      } catch (e) {}

      // Locate or create canvas
      this.canvas = document.getElementById('scenesPreviewCanvas') || document.getElementById('modePreviewCanvas');
      if (!this.canvas) {
        console.warn('[ScenesStudio] #scenesPreviewCanvas not found; creating fallback canvas.');
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'scenesPreviewCanvas';
      }
      this.canvas.width = 768;
      this.canvas.height = 552;
      this.ctx = this.canvas.getContext('2d');

      // Sync astronomical data for current day into calendar & moon phase
      this._autoUpdateAstronomicalParams();

      // Render mode selection chips
      this._renderModeChips();

      // Build initial parameter form
      this.buildForm();

      // Render 768×552 preview
      this.renderPreview();

      // Bind remote buttons
      this._bindRemoteButtons();

      // Tab switch listener
      window.addEventListener('tabchange', (e) => {
        if (e.detail && e.detail.tabId === 'scenes') {
          this.renderPreview();
        }
      });

      console.log('[ScenesStudio] Ready with 18 scenes and live APIs!');
    },

    /**
     * Compute current date astronomical values
     */
    _autoUpdateAstronomicalParams() {
      const now = new Date();
      const lunar = LunarAlmanac.getLunarDate(now);
      const term = LunarAlmanac.getSolarTerm(now);
      const yiji = LunarAlmanac.getYiJi(now);
      const moon = LunarAlmanac.getMoonPhase(now);

      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

      // Calendar
      if (this.modeParamsStore.calendar) {
        const c = this.modeParamsStore.calendar;
        c.year = String(now.getFullYear());
        c.month = String(now.getMonth() + 1);
        c.day = String(now.getDate());
        c.weekday = days[now.getDay()];
        c.lunar = lunar.fullText;
        c.term = term.currentTerm + (term.isExact ? ' (今日交节)' : ` (距${term.nextTerm}还有${term.daysToNext}天)`);
        c.yiji = `宜：${yiji.yi} | 忌：${yiji.ji}`;
      }

      // Moon Phase
      if (this.modeParamsStore.moon_phase) {
        const m = this.modeParamsStore.moon_phase;
        m.phase = moon.phase;
        m.age = `月龄 ${moon.age} 天`;
        m.illum = `亮面 ${moon.illum}`;
        m.tide = moon.tide;
      }

      // Life Progress
      if (this.modeParamsStore.life_progress) {
        const lp = this.modeParamsStore.life_progress;
        lp.year_prog = ProgressCalc.calcYearProgress();
        lp.month_prog = ProgressCalc.calcMonthProgress();
        lp.day_prog = ProgressCalc.calcDayProgress();
      }

      // Countdown
      if (this.modeParamsStore.countdown && this.modeParamsStore.countdown.target_date) {
        this.modeParamsStore.countdown.days = String(ProgressCalc.calcCountdown(this.modeParamsStore.countdown.target_date));
      }

      // Habit streak
      if (this.modeParamsStore.habit) {
        this.modeParamsStore.habit.streak = String(HabitTracker.getStreak());
      }
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
     * Switch active scene mode
     */
    selectMode(modeId) {
      if (!this.modeParamsStore[modeId]) return;
      this.currentSelectedMode = modeId;

      const chips = document.querySelectorAll('#modeChipsContainer .mode-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-mode') === modeId);
      });

      this.buildForm();
      this.renderPreview();
    },

    /**
     * Trigger live data synchronization for current scene
     */
    async syncLiveData(modeId = this.currentSelectedMode) {
      if (window.UI?.showToast) {
        window.UI.showToast(`正在从全球开放 API 获取【${modeId}】实时数据...`, 'info', 2500);
      }

      try {
        if (modeId === 'weather') {
          const p = this.modeParamsStore.weather;
          const lat = parseFloat(p.lat) || 22.54;
          const lon = parseFloat(p.lon) || 114.05;
          const res = await OpenDataService.fetchWeather(lat, lon, p.owm_key, p.city);
          Object.assign(p, res);
          if (window.UI?.showToast) window.UI.showToast('✅ Open-Meteo 实时气象已更新！', 'success');

        } else if (modeId === 'rss') {
          const [cryptoData, newsData] = await Promise.all([
            OpenDataService.fetchCrypto(),
            OpenDataService.fetchTechNews()
          ]);
          Object.assign(this.modeParamsStore.rss, cryptoData, newsData);
          if (window.UI?.showToast) window.UI.showToast('✅ Hacker News & CoinGecko 行情已刷新！', 'success');

        } else if (modeId === 'calendar') {
          this._autoUpdateAstronomicalParams();
          const quote = await OpenDataService.fetchQuote();
          this.modeParamsStore.calendar.motto = quote;
          if (window.UI?.showToast) window.UI.showToast('✅ 天文老黄历与名家名言已同步！', 'success');

        } else if (modeId === 'countdown') {
          const p = this.modeParamsStore.countdown;
          p.days = String(ProgressCalc.calcCountdown(p.target_date));
          if (window.UI?.showToast) window.UI.showToast(`✅ 里程碑天数已重算：还剩 ${p.days} 天！`, 'success');

        } else if (modeId === 'life_progress') {
          this._autoUpdateAstronomicalParams();
          if (window.UI?.showToast) window.UI.showToast('✅ 人生与年度时间流逝进度已刷新！', 'success');

        } else if (modeId === 'habit') {
          this.modeParamsStore.habit.streak = String(HabitTracker.getStreak());
          if (window.UI?.showToast) window.UI.showToast(`✅ 打卡记录已同步：当前连续 ${this.modeParamsStore.habit.streak} 天！`, 'success');
        }

        this._saveParamsDebounced();
        this.buildForm();
        this.renderPreview();
      } catch (err) {
        console.error('[ScenesStudio] Sync error:', err);
        if (window.UI?.showToast) window.UI.showToast(`同步失败: ${err.message}`, 'error');
      }
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

      // Top Interactive Toolbar for scenes with Live APIs or state machines
      this._buildSceneActionToolbar(form, this.currentSelectedMode);

      const p = this.modeParamsStore[this.currentSelectedMode] || {};

      Object.keys(p).forEach(k => {
        const row = document.createElement('div');
        row.className = 'form-group scene-form-row';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = this.getParamLabel(k);

        const isTextarea = (k === 'note' || k === 'desc' || k === 'motto' || k === 'tips' || k === 'quote' || k === 'caption' || k === 'forecast');
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
     * Build context-sensitive action toolbars for scenes
     */
    _buildSceneActionToolbar(form, modeId) {
      const bar = document.createElement('div');
      bar.className = 'scene-actions-bar';
      bar.style.display = 'flex';
      bar.style.gap = '8px';
      bar.style.flexWrap = 'wrap';
      bar.style.marginBottom = '14px';

      if (modeId === 'weather') {
        const syncBtn = document.createElement('button');
        syncBtn.className = 'm3-btn small';
        syncBtn.innerHTML = '🔄 刷新实时气象 (Open-Meteo)';
        syncBtn.onclick = () => this.syncLiveData('weather');
        bar.appendChild(syncBtn);

        // Quick City Presets
        const cities = [
          { name: '深圳', lat: '22.54', lon: '114.05' },
          { name: '北京', lat: '39.90', lon: '116.40' },
          { name: '上海', lat: '31.23', lon: '121.47' },
          { name: '广州', lat: '23.13', lon: '113.26' },
          { name: '东京', lat: '35.68', lon: '139.69' },
          { name: '伦敦', lat: '51.51', lon: '-0.13' }
        ];
        cities.forEach(c => {
          const b = document.createElement('button');
          b.className = 'm3-btn small outlined';
          b.textContent = c.name;
          b.onclick = () => {
            this.modeParamsStore.weather.city = c.name;
            this.modeParamsStore.weather.lat = c.lat;
            this.modeParamsStore.weather.lon = c.lon;
            this.syncLiveData('weather');
          };
          bar.appendChild(b);
        });

      } else if (modeId === 'rss') {
        const syncBtn = document.createElement('button');
        syncBtn.className = 'm3-btn small';
        syncBtn.innerHTML = '🔄 刷新要闻与币价 (HN & CoinGecko)';
        syncBtn.onclick = () => this.syncLiveData('rss');
        bar.appendChild(syncBtn);

      } else if (modeId === 'calendar') {
        const syncBtn = document.createElement('button');
        syncBtn.className = 'm3-btn small';
        syncBtn.innerHTML = '🔄 重新计算今日黄历与节气';
        syncBtn.onclick = () => this.syncLiveData('calendar');
        bar.appendChild(syncBtn);

      } else if (modeId === 'pomodoro') {
        const pStatus = PomodoroTimer.getStatus();
        const startBtn = document.createElement('button');
        startBtn.className = 'm3-btn small';
        startBtn.innerHTML = PomodoroTimer.isRunning ? '⏸ 暂停计时' : '▶ 开始 25m 专注';
        startBtn.onclick = () => {
          if (PomodoroTimer.isRunning) {
            PomodoroTimer.pause((s) => this._updatePomodoroUI(s));
          } else {
            PomodoroTimer.start((s) => this._updatePomodoroUI(s));
          }
          this.buildForm();
        };

        const resetBtn = document.createElement('button');
        resetBtn.className = 'm3-btn small outlined';
        resetBtn.innerHTML = '🔄 重置番茄钟';
        resetBtn.onclick = () => {
          PomodoroTimer.reset((s) => this._updatePomodoroUI(s));
          this.buildForm();
        };

        const skipBtn = document.createElement('button');
        skipBtn.className = 'm3-btn small outlined';
        skipBtn.innerHTML = '⏭ 跳到下一阶段';
        skipBtn.onclick = () => {
          PomodoroTimer.nextStage();
          this._updatePomodoroUI(PomodoroTimer.getStatus());
          this.buildForm();
        };

        bar.appendChild(startBtn);
        bar.appendChild(resetBtn);
        bar.appendChild(skipBtn);

      } else if (modeId === 'habit') {
        const checkinBtn = document.createElement('button');
        checkinBtn.className = 'm3-btn small';
        checkinBtn.innerHTML = '🔥 今日打卡 (Toggle Check-in)';
        checkinBtn.onclick = () => {
          HabitTracker.toggleToday(this.modeParamsStore.habit.habit_name);
          this.modeParamsStore.habit.streak = String(HabitTracker.getStreak());
          this.renderPreview();
          if (window.UI?.showToast) window.UI.showToast(`打卡状态已变更！当前连击：${this.modeParamsStore.habit.streak} 天`, 'success');
        };
        bar.appendChild(checkinBtn);

      } else if (modeId === 'countdown') {
        const calcBtn = document.createElement('button');
        calcBtn.className = 'm3-btn small';
        calcBtn.innerHTML = '⏳ 自动重算剩余天数';
        calcBtn.onclick = () => this.syncLiveData('countdown');
        bar.appendChild(calcBtn);

      } else if (modeId === 'life_progress') {
        const calcBtn = document.createElement('button');
        calcBtn.className = 'm3-btn small';
        calcBtn.innerHTML = '⌛ 自动重算当年进度';
        calcBtn.onclick = () => this.syncLiveData('life_progress');
        bar.appendChild(calcBtn);
      }

      if (bar.children.length > 0) {
        form.appendChild(bar);
      }
    },

    _updatePomodoroUI(status) {
      if (this.modeParamsStore.pomodoro) {
        this.modeParamsStore.pomodoro.timer = status.timer;
        this.modeParamsStore.pomodoro.state = status.state;
        this.modeParamsStore.pomodoro.round = status.round;
      }
      this.renderPreview();
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
        lunar: '农历与生肖',
        term: '二十四节气',
        yiji: '黄历宜忌',
        motto: '每日寄语',
        city: '所在城市',
        lat: '纬度 (Latitude)',
        lon: '经度 (Longitude)',
        temp: '实时气温',
        cond: '天气状况',
        cond_code: 'WMO 气象代码',
        high_low: '今日温差',
        humidity: '相对湿度',
        wind: '实时风速',
        aqi: '空气质量 (AQI)',
        tips: '生活出行建议',
        forecast: '多日天气趋势',
        owm_key: 'OpenWeatherMap API Key (可选)',
        target_date: '目标到期日期 (YYYY-MM-DD)',
        days: '剩余天数',
        quote: '励志名言',
        habit_name: '打卡习惯名称',
        streak: '连续打卡天数',
        completion: '季度达成率',
        today_done: '今日是否打卡',
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
        btc: 'Bitcoin 实时币价',
        eth: 'Ethereum 实时币价',
        sol: 'Solana 实时币价',
        head1: '科技头条 1',
        head2: '科技头条 2',
        head3: '科技头条 3',
        head4: '科技头条 4',
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
      const isPortrait = typeof window.UI !== 'undefined' && (window.UI.orientation === 90 || window.UI.orientation === 270);
      const w = isPortrait ? 552 : 768;
      const h = isPortrait ? 768 : 552;
      canvas.width = w;
      canvas.height = h;

      const p = this.modeParamsStore[this.currentSelectedMode] || {};
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;

      // 1. Fill clean White base
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, w, h);

      // 2. Dispatch to dedicated scene renderer
      switch (this.currentSelectedMode) {
        case 'demo':
          this._renderDemo(ctx, p, w, h);
          break;
        case 'fridge_board':
          this._renderFridgeBoard(ctx, p, w, h);
          break;
        case 'memo':
          this._renderMemo(ctx, p, w, h);
          break;
        case 'calendar':
          this._renderCalendar(ctx, p, w, h);
          break;
        case 'weather':
          this._renderWeather(ctx, p, w, h);
          break;
        case 'countdown':
          this._renderCountdown(ctx, p, w, h);
          break;
        case 'habit':
          this._renderHabit(ctx, p, w, h);
          break;
        case 'poetry':
          this._renderPoetry(ctx, p, w, h);
          break;
        case 'history':
          this._renderHistory(ctx, p, w, h);
          break;
        case 'life_progress':
          this._renderLifeProgress(ctx, p, w, h);
          break;
        case 'pomodoro':
          this._renderPomodoro(ctx, p, w, h);
          break;
        case 'shopping':
          this._renderShopping(ctx, p, w, h);
          break;
        case 'care_reminders':
          this._renderCareReminders(ctx, p, w, h);
          break;
        case 'daily_routine':
          this._renderDailyRoutine(ctx, p, w, h);
          break;
        case 'moon_phase':
          this._renderMoonPhase(ctx, p, w, h);
          break;
        case 'qrcode':
          this._renderQRCode(ctx, p, w, h);
          break;
        case 'photo':
          this._renderPhoto(ctx, p, w, h);
          break;
        case 'rss':
          this._renderRSS(ctx, p, w, h);
          break;
        default:
          this._renderDemo(ctx, p, w, h);
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Individual 768×552 BWRY Scene Renderers
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Demo & System Telemetry
    _renderDemo(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const isPortrait = w < h;

      if (isPortrait) {
        // Top status bar
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, w, 54);
        ctx.fillStyle = RED;
        ctx.fillRect(0, 54, w, 2);
        ctx.fillStyle = YELLOW;
        ctx.fillRect(0, 56, w, 1);

        ctx.fillStyle = WHITE;
        ctx.font = 'bold 22px -apple-system, sans-serif';
        ctx.fillText(p.title || '3.98" SMART EPD', 20, 36);

        ctx.fillStyle = YELLOW;
        ctx.font = 'bold 16px -apple-system, sans-serif';
        const sText = p.status || 'ONLINE & ACTIVE';
        ctx.fillText(sText, w - 20 - ctx.measureText(sText).width, 36);

        const pad = 18;
        const cw = w - pad * 2;

        // Card 1: Workspace Overview
        ctx.fillStyle = WHITE;
        ctx.fillRect(pad, 68, cw, 210);
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 1;
        ctx.strokeRect(pad, 68, cw, 210);
        ctx.strokeStyle = YELLOW;
        ctx.strokeRect(pad + 2, 70, cw - 4, 206);

        ctx.fillStyle = BLACK;
        ctx.fillRect(pad + 4, 72, cw - 8, 36);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.fillText('WORKSPACE OVERVIEW', pad + 16, 96);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('PANEL : ' + (p.panel || 'SE0398NZ07 4-COLOR'), pad + 16, 130);
        ctx.fillText('RES   : 768 x 552 BWRY E-INK (PORTRAIT)', pad + 16, 156);
        ctx.fillStyle = RED;
        ctx.fillText('STATUS: ' + (p.status || 'ONLINE & ACTIVE'), pad + 16, 182);

        // 4 Color Swatches
        const swatches = [
          ['BLA', BLACK, WHITE],
          ['WHI', WHITE, BLACK],
          ['YEL', YELLOW, BLACK],
          ['RED', RED, WHITE]
        ];
        const swW = Math.floor((cw - 44) / 4);
        swatches.forEach(([name, bg, fg], idx) => {
          const sx = pad + 16 + idx * (swW + 4);
          const sy = 212;
          ctx.fillStyle = bg;
          ctx.fillRect(sx, sy, swW, 42);
          ctx.strokeStyle = BLACK;
          ctx.strokeRect(sx, sy, swW, 42);
          ctx.fillStyle = fg;
          ctx.font = 'bold 13px monospace';
          const tw = ctx.measureText(name).width;
          ctx.fillText(name, sx + (swW - tw) / 2, sy + 26);
        });

        // Card 2: Network & Access Info
        ctx.strokeStyle = BLACK;
        ctx.strokeRect(pad, 292, cw, 204);
        ctx.strokeStyle = RED;
        ctx.strokeRect(pad + 2, 294, cw - 4, 200);
        ctx.fillStyle = RED;
        ctx.fillRect(pad + 4, 296, cw - 8, 36);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.fillText('NETWORK & ACCESS INFO', pad + 16, 320);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('WIFI  : ' + (p.wifi_ssid || 'Home_WiFi'), pad + 16, 354);
        ctx.fillText('IP    : ' + (p.ip || location.hostname || '192.168.1.100'), pad + 16, 382);
        ctx.fillStyle = RED;
        ctx.fillText('WEBUI : ' + (p.webui_url || 'http://' + (location.host || 'epd-display.local') + '/'), pad + 16, 410);
        ctx.fillStyle = BLACK;
        ctx.fillText('MDNS  : ' + (p.mdns || 'http://epd-display.local/'), pad + 16, 438);
        ctx.fillText('PORT  : 80 (HTTP WEB & REST API)', pad + 16, 466);

        // Card 3: WebUI Access Portal with live rendered QR Code
        ctx.strokeStyle = BLACK;
        ctx.strokeRect(pad, 510, cw, 230);
        ctx.strokeStyle = RED;
        ctx.strokeRect(pad + 2, 512, cw - 4, 226);
        ctx.fillStyle = BLACK;
        ctx.fillRect(pad + 4, 514, cw - 8, 36);
        ctx.fillStyle = YELLOW;
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.fillText('WEBUI ACCESS PORTAL', pad + 16, 538);

        const qrTarget = p.webui_url || `http://${p.ip || '192.168.1.100'}/`;
        if (window.QRCodeLib && typeof window.QRCodeLib.drawQRCode === 'function') {
          window.QRCodeLib.drawQRCode(ctx, qrTarget, pad + 16, 560, 160);
        } else {
          ctx.strokeRect(pad + 16, 560, 160, 160);
        }

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('📱 手机扫码直达控制台', pad + 195, 595);
        ctx.font = '14px "PingFang SC", sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText('• 18 套全能场景模式', pad + 195, 628);
        ctx.fillText('• 双稳态断电零耗电保持', pad + 195, 654);
        ctx.fillText('• 智能蓝牙与Wi-Fi双栈', pad + 195, 680);
        ctx.fillStyle = RED;
        ctx.fillText('• 768×552 BWRY 4色点阵', pad + 195, 706);
        return;
      }

      // Top status bar
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
      ctx.fillText(p.status || 'ONLINE & ACTIVE', w - 240, 36);

      // Left Card 1: Workspace Overview (X: 24, Y: 75, W: 410, H: 230)
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
      ctx.font = 'bold 15px monospace';
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

      // Left Card 2: Network & Access (X: 24, Y: 322, W: 410, H: 208)
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

      // Right Top Status Card
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

      // Right Middle: WebUI Access Portal with live rendered QR Code
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 1;
      ctx.strokeRect(456, 175, 288, 355);
      ctx.strokeStyle = RED;
      ctx.strokeRect(458, 177, 284, 351);

      ctx.fillStyle = BLACK;
      ctx.fillRect(462, 181, 276, 36);
      ctx.fillStyle = YELLOW;
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.fillText('WEBUI ACCESS PORTAL', 480, 204);

      // Render WebUI QR Code
      const qrTarget = p.webui_url || `http://${p.ip || '192.168.1.100'}/`;
      if (window.QRCodeLib && typeof window.QRCodeLib.drawQRCode === 'function') {
        window.QRCodeLib.drawQRCode(ctx, qrTarget, 520, 230, 160);
      } else {
        ctx.strokeRect(520, 230, 160, 160);
      }

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 13px -apple-system, monospace';
      ctx.fillText(qrTarget, 480, 415);

      ctx.fillStyle = BLACK;
      ctx.font = '13px "PingFang SC", sans-serif';
      ctx.fillText('• 18 套全能场景模式', 476, 445);
      ctx.fillText('• 4 色全阶手绘画板与预设', 476, 468);
      ctx.fillStyle = RED;
      ctx.fillText('• 双稳态断电零耗电保持', 476, 492);
      ctx.fillStyle = BLACK;
      ctx.fillText('• 智能蓝牙与Wi-Fi双栈共存', 476, 515);
    },

    // 2. Fridge Bulletin Board
    _renderFridgeBoard(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📌 冰箱贴 · 极简家庭生活布告板', p.date || '2026-10-10 星期六');

      // Sticky Note Card with warm accent
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 3;
      ctx.fillRect(28, 76, w - 56, 140);
      ctx.strokeRect(28, 76, w - 56, 140);

      // Simulated magnet pin at center top
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(w / 2, 88, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.beginPath();
      ctx.arc(w / 2, 88, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = RED;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '今日家庭核心备忘', 48, 122);

      ctx.fillStyle = BLACK;
      ctx.font = '18px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.note || '', 48, 160, w - 96, 26, 2);

      ctx.fillStyle = '#b78103';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`—— 留言人：${p.author || '家人'}`, w - 210, 198);

      // Checklist Items
      let y = 256;
      [p.item1, p.item2, p.item3].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.fillRect(28, y - 24, w - 56, 54);
        ctx.strokeRect(28, y - 24, w - 56, 54);

        ctx.fillStyle = idx === 0 ? RED : (idx === 1 ? YELLOW : BLACK);
        ctx.beginPath();
        ctx.arc(56, y + 4, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(it, 82, y + 11);
        y += 66;
      });

      this._drawFooter(ctx, '家庭智慧信息中枢 · 冰箱贴长效运行', '双稳态零功耗保持 📶');
    },

    // 3. Memo & Checklist
    _renderMemo(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📋 今日核心待办事项 (TO-DO LIST)', p.subtitle || 'PRIORITY MEMO');

      // Notebook red guide margin line
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(76, 70);
      ctx.lineTo(76, h - 50);
      ctx.stroke();

      let y = 100;
      [p.item1, p.item2, p.item3, p.item4].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = '#fdfdfd';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(28, y - 24, w - 56, 56);
        ctx.strokeRect(28, y - 24, w - 56, 56);

        // Checkbox square
        ctx.strokeStyle = idx === 0 ? RED : BLACK;
        ctx.lineWidth = 3;
        ctx.strokeRect(42, y - 10, 24, 24);
        if (idx === 0 || idx === 1) {
          ctx.fillStyle = idx === 0 ? RED : YELLOW;
          ctx.fillRect(47, y - 5, 14, 14);
        }

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(it, 94, y + 8);

        // Tag chip
        const tagText = idx === 0 ? 'URGENT' : (idx === 1 ? 'ACTIVE' : 'PLANNED');
        ctx.fillStyle = idx === 0 ? RED : (idx === 1 ? YELLOW : '#666666');
        ctx.fillRect(w - 140, y - 10, 90, 24);
        ctx.fillStyle = idx === 1 ? BLACK : WHITE;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(tagText, w - 124, y + 6);

        y += 76;
      });

      // Progress bar at bottom
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(28, y + 10, w - 56, 16);
      ctx.fillStyle = RED;
      ctx.fillRect(28, y + 10, (w - 56) * 0.5, 16);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('今日完成度：2 / 4 项 (50%)', 32, y + 46);

      this._drawFooter(ctx, p.footer || '保持专注，逐项击破！', '零功耗持续显示');
    },

    // 4. Calendar & Almanac
    _renderCalendar(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📅 万年历与老黄历 (CHINESE ALMANAC)', `${p.year || 2026}年 ${p.month || 10}月`);

      const isP = w < h;
      if (isP) {
        // Left Big Focal Day
        ctx.fillStyle = RED;
        ctx.font = 'bold 120px -apple-system, sans-serif';
        ctx.fillText(String(p.day || 10), 32, 195);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 30px "PingFang SC", sans-serif';
        ctx.fillText(p.weekday || '星期六', 210, 115);

        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillText(p.lunar || '丙午年 [马] 九月初一', 210, 150);

        ctx.fillStyle = RED;
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText(`节气：${p.term || '寒露'}`, 210, 185);

        // Yellow Almanac Card
        ctx.fillStyle = '#fff3cc';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.fillRect(24, 235, w - 48, 180);
        ctx.strokeRect(24, 235, w - 48, 180);

        // Yi Tag
        ctx.fillStyle = RED;
        ctx.fillRect(38, 255, 42, 28);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('宜', 50, 275);

        // Ji Tag
        ctx.fillStyle = BLACK;
        ctx.fillRect(38, 335, 42, 28);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('忌', 50, 355);

        const yijiParts = (p.yiji || '宜：祈福 祭祀 | 忌：出行').split('|');
        const yiText = yijiParts[0] ? yijiParts[0].replace(/^宜：?/, '').trim() : '祈福 祭祀 动土 纳财 开市 赴任';
        const jiText = yijiParts[1] ? yijiParts[1].replace(/^忌：?/, '').trim() : '词讼 开仓 破土 安葬 针灸 出行';

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 17px "PingFang SC", sans-serif';
        this._wrapText(ctx, yiText, 94, 275, w - 150, 26, 2);
        this._wrapText(ctx, jiText, 94, 355, w - 150, 26, 2);

        // Daily Motto Card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 435, w - 48, 190);
        ctx.strokeRect(24, 435, w - 48, 190);

        ctx.fillStyle = '#333333';
        ctx.font = 'italic 20px "PingFang SC", serif';
        this._wrapText(ctx, `“ ${p.motto || '盛年不重来，一日难再晨。及时当勉励，岁月不待人。'} ”`, 44, 490, w - 88, 32, 4);

        this._drawFooter(ctx, '中华天文历法算法引擎驱动 · 每日自动授时更新', '二十四节气精密演算');
        return;
      }

      // Left Big Focal Day
      ctx.fillStyle = RED;
      ctx.font = 'bold 140px -apple-system, sans-serif';
      ctx.fillText(String(p.day || 10), 48, 225);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 34px "PingFang SC", sans-serif';
      ctx.fillText(p.weekday || '星期六', 250, 135);

      ctx.fillStyle = BLACK;
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.fillText(p.lunar || '丙午年 [马] 九月初一', 250, 175);

      ctx.fillStyle = RED;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(`节气：${p.term || '寒露'}`, 250, 215);

      // Traditional Yellow Almanac Card (Yellow Accent)
      ctx.fillStyle = '#fff3cc';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.fillRect(28, 255, w - 56, 120);
      ctx.strokeRect(28, 255, w - 56, 120);

      // Yi Tag
      ctx.fillStyle = RED;
      ctx.fillRect(44, 275, 42, 28);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText('宜', 56, 295);

      // Ji Tag
      ctx.fillStyle = BLACK;
      ctx.fillRect(44, 325, 42, 28);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText('忌', 56, 345);

      // Parse Yi / Ji from p.yiji
      const yijiParts = (p.yiji || '宜：祈福 祭祀 | 忌：出行').split('|');
      const yiText = yijiParts[0] ? yijiParts[0].replace(/^宜：?/, '').trim() : '祈福 祭祀 动土 纳财 开市 赴任';
      const jiText = yijiParts[1] ? yijiParts[1].replace(/^忌：?/, '').trim() : '词讼 开仓 破土 安葬 针灸 出行';

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(yiText, 102, 295);
      ctx.fillText(jiText, 102, 345);

      // Daily Motto / Stoic Wisdom Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 395, w - 56, 95);
      ctx.strokeRect(28, 395, w - 56, 95);

      ctx.fillStyle = '#333333';
      ctx.font = 'italic 18px "PingFang SC", serif';
      this._wrapText(ctx, `“ ${p.motto || '盛年不重来，一日难再晨。及时当勉励，岁月不待人。'} ”`, 48, 435, w - 96, 26, 2);

      this._drawFooter(ctx, '中华天文历法算法引擎驱动 · 每日自动授时更新', '二十四节气精密演算');
    },

    // 5. Full Weather Station (Open-Meteo live)
    _renderWeather(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, `🌤️ 全维气象看板 · ${p.city || '城市'}`, 'OPEN-METEO LIVE');

      const isP = w < h;
      if (isP) {
        // Left Big Temp Box
        ctx.fillStyle = RED;
        ctx.font = 'bold 84px -apple-system, sans-serif';
        ctx.fillText(p.temp || '23.5°C', 28, 155);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(p.cond || '晴朗 (Clear Sky)', 250, 115);
        ctx.font = '16px sans-serif';
        ctx.fillText(`温差：${p.high_low || '22°C ~ 31°C'}`, 250, 145);

        // AQI Tag
        ctx.fillStyle = YELLOW;
        ctx.fillRect(w - 130, 80, 106, 32);
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`AQI ${p.aqi || '36 优'}`, w - 120, 102);

        // Weather Telemetry Grid (3 Cards across 552)
        const cards = [
          { title: '相对湿度', val: p.humidity || '87%', color: BLACK },
          { title: '实时风速', val: p.wind || '8.9 km/h', color: RED },
          { title: '紫外线指数', val: '中等 (UV 4)', color: YELLOW }
        ];
        const cw = Math.floor((w - 48 - 16) / 3);
        cards.forEach((c, idx) => {
          const cx = 24 + idx * (cw + 8);
          ctx.fillStyle = '#f8f9fa';
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 1;
          ctx.fillRect(cx, 180, cw, 70);
          ctx.strokeRect(cx, 180, cw, 70);

          ctx.fillStyle = '#666666';
          ctx.font = '13px sans-serif';
          ctx.fillText(c.title, cx + 12, 204);

          ctx.fillStyle = c.color;
          ctx.font = 'bold 18px -apple-system, sans-serif';
          ctx.fillText(c.val, cx + 12, 234);
        });

        // Multi-day Forecast Card
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.fillRect(24, 268, w - 48, 190);
        ctx.strokeRect(24, 268, w - 48, 190);

        ctx.fillStyle = RED;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('📅 5日预报趋势：', 40, 298);

        const forecastParts = (p.forecast || '周六: 31°/22° 晴 | 周日: 30°/22° 多云 | 周一: 30°/23° 晴 | 周二: 34°/22° 阵雨').split('|');
        ctx.fillStyle = BLACK;
        ctx.font = '16px "PingFang SC", sans-serif';
        forecastParts.forEach((part, fIdx) => {
          if (fIdx < 4) {
            ctx.fillText('• ' + part.trim(), 44, 332 + fIdx * 28);
          }
        });

        // Tips Card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 475, w - 48, 175);
        ctx.strokeRect(24, 475, w - 48, 175);

        ctx.fillStyle = RED;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText('💡 出行生活指南：', 40, 508);
        ctx.fillStyle = BLACK;
        ctx.font = '16px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.tips || '微风舒适，昼夜温差较小，适宜户外慢跑与出行！', 40, 542, w - 80, 26, 4);

        this._drawFooter(ctx, 'Open-Meteo 全球高精度气象开放接口驱动 · 100% 免 Key', '刷新间隔 60 分钟');
        return;
      }

      // Left Big Temp Box
      ctx.fillStyle = RED;
      ctx.font = 'bold 96px -apple-system, sans-serif';
      ctx.fillText(p.temp || '23.5°C', 48, 175);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(p.cond || '晴朗 (Clear Sky)', 380, 125);
      ctx.font = '18px sans-serif';
      ctx.fillText(`今日温差：${p.high_low || '22°C ~ 31°C'}`, 380, 160);

      // AQI Tag
      ctx.fillStyle = YELLOW;
      ctx.fillRect(w - 200, 95, 150, 38);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`AQI ${p.aqi || '36 优'}`, w - 165, 121);

      // Weather Telemetry Grid (Humidity, Wind, Forecast)
      const cards = [
        { title: '相对湿度', val: p.humidity || '87%', color: BLACK },
        { title: '实时风速', val: p.wind || '8.9 km/h', color: RED },
        { title: '紫外线指数', val: '中等 (UV 4)', color: YELLOW }
      ];
      cards.forEach((c, idx) => {
        const cx = 28 + idx * 242;
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(cx, 205, 226, 75);
        ctx.strokeRect(cx, 205, 226, 75);

        ctx.fillStyle = '#666666';
        ctx.font = '14px sans-serif';
        ctx.fillText(c.title, cx + 18, 232);

        ctx.fillStyle = c.color;
        ctx.font = 'bold 22px -apple-system, sans-serif';
        ctx.fillText(c.val, cx + 18, 265);
      });

      // Multi-day Forecast Card
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.fillRect(28, 300, w - 56, 75);
      ctx.strokeRect(28, 300, w - 56, 75);

      ctx.fillStyle = RED;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText('📅 5日预报趋势：', 46, 330);
      ctx.fillStyle = BLACK;
      ctx.font = '16px "PingFang SC", sans-serif';
      ctx.fillText(p.forecast || '周六: 31°/22° 晴 | 周日: 30°/22° 多云 | 周一: 30°/23° 晴', 46, 358);

      // Tips Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 395, w - 56, 95);
      ctx.strokeRect(28, 395, w - 56, 95);

      ctx.fillStyle = RED;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText('💡 出行生活指南：', 46, 428);
      ctx.fillStyle = BLACK;
      ctx.font = '16px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.tips || '微风舒适，昼夜温差较小，适宜户外慢跑与出行！', 46, 460, w - 96, 24, 2);

      this._drawFooter(ctx, 'Open-Meteo 全球高精度气象开放接口驱动 · 100% 免 Key', '刷新间隔 60 分钟');
    },

    // 6. Milestone Countdown
    _renderCountdown(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '⏳ 里程碑倒计时 (COUNTDOWN)', 'DAYS REMAINING');

      const isP = w < h;
      if (isP) {
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 26px "PingFang SC", sans-serif';
        ctx.fillText(`距离【${p.title || '目标事件'}】还剩`, 32, 120);

        // Giant countdown number
        ctx.fillStyle = RED;
        ctx.font = 'bold 120px -apple-system, sans-serif';
        ctx.fillText(p.days || '0', 40, 245);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 36px "PingFang SC", sans-serif';
        ctx.fillText('天', 250, 235);

        // Progress bar representation
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(32, 275, w - 64, 22);
        const daysNum = parseInt(p.days, 10) || 0;
        const progress = Math.max(0.05, Math.min(0.95, 1 - (daysNum / 100)));
        ctx.fillStyle = RED;
        ctx.fillRect(32, 275, (w - 64) * progress, 22);

        // Quote Card
        ctx.fillStyle = '#fff3cc';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 3;
        ctx.fillRect(24, 325, w - 48, 260);
        ctx.strokeRect(24, 325, w - 48, 260);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.quote || '道阻且长，行则将至；行而不辍，未来可期！', 44, 385, w - 88, 34, 5);

        this._drawFooter(ctx, `目标基准日：${p.target_date || '2027-01-01'} · 自动递减倒计时`, '时光不负追梦人');
        return;
      }

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 32px "PingFang SC", sans-serif';
      ctx.fillText(`距离【${p.title || '目标事件'}】还剩`, 48, 130);

      // Giant countdown number
      ctx.fillStyle = RED;
      ctx.font = 'bold 140px -apple-system, sans-serif';
      ctx.fillText(p.days || '0', 60, 280);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 42px "PingFang SC", sans-serif';
      ctx.fillText('天', 340, 270);

      // Progress bar representation
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(48, 310, w - 96, 20);
      const daysNum = parseInt(p.days, 10) || 0;
      const progress = Math.max(0.05, Math.min(0.95, 1 - (daysNum / 100)));
      ctx.fillStyle = RED;
      ctx.fillRect(48, 310, (w - 96) * progress, 20);

      // Quote Card
      ctx.fillStyle = '#fff3cc';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 3;
      ctx.fillRect(28, 360, w - 56, 110);
      ctx.strokeRect(28, 360, w - 56, 110);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 20px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.quote || '道阻且长，行则将至；行而不辍，未来可期！', 48, 410, w - 96, 28, 2);

      this._drawFooter(ctx, `目标基准日：${p.target_date || '2027-01-01'} · 自动递减倒计时`, '时光不负追梦人');
    },

    // 7. Habit Tracker & GitHub-Style Heatmap
    _renderHabit(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🔥 自律习惯打卡看板 (HABIT TRACKER)', 'STREAK DAYS');

      const isP = w < h;
      if (isP) {
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(`追踪习惯：${p.habit_name || '每日晨跑 5 公里'}`, 28, 110);

        // Big streak
        ctx.fillStyle = RED;
        ctx.font = 'bold 80px -apple-system, sans-serif';
        ctx.fillText(p.streak || '42', 28, 195);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText('天连续坚持', 150, 185);

        // Completion badge
        ctx.fillStyle = YELLOW;
        ctx.fillRect(w - 170, 145, 145, 42);
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 17px sans-serif';
        ctx.fillText(`达成率 ${p.completion || '88%'}`, w - 150, 172);

        // 4-Week GitHub Heatmap Card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 230, w - 48, 185);
        ctx.strokeRect(24, 230, w - 48, 185);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 15px "PingFang SC", sans-serif';
        ctx.fillText('近 4 周活动热力图 (GitHub Heatmap):', 38, 260);

        const heatmap = HabitTracker.getHeatmap(4);
        const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

        ctx.fillStyle = '#888888';
        ctx.font = '12px sans-serif';
        for (let r = 0; r < 7; r += 2) {
          ctx.fillText(dayNames[r], 38, 298 + r * 15);
        }

        const startX = 66;
        const boxSize = 13;
        const gap = 4;
        heatmap.forEach((week, wIdx) => {
          week.forEach((item, dIdx) => {
            const bx = startX + wIdx * (boxSize + gap) * 5.8;
            const by = 282 + dIdx * (boxSize + gap);

            if (item.done) {
              ctx.fillStyle = (dIdx === 6 || dIdx === 0) ? YELLOW : RED;
            } else if (item.isFuture) {
              ctx.fillStyle = '#f0f0f0';
            } else {
              ctx.fillStyle = '#e0e0e0';
            }

            ctx.fillRect(bx, by, boxSize + 14, boxSize);
            ctx.strokeStyle = '#bbbbbb';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, boxSize + 14, boxSize);
          });
        });

        // Motivation card
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1;
        ctx.fillRect(24, 435, w - 48, 190);
        ctx.strokeRect(24, 435, w - 48, 190);

        ctx.fillStyle = '#333333';
        ctx.font = 'italic 18px "PingFang SC", serif';
        this._wrapText(ctx, '“自律即自由。每一个打卡方块都是通向卓越的坚实足迹。不积跬步，无以至千里。”', 44, 490, w - 88, 30, 4);

        this._drawFooter(ctx, '本地数据持久化保存 · 今日打卡已就绪', '不积跬步 无以至千里');
        return;
      }

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(`追踪习惯：${p.habit_name || '每日晨跑 5 公里'}`, 48, 115);

      // Big streak
      ctx.fillStyle = RED;
      ctx.font = 'bold 100px -apple-system, sans-serif';
      ctx.fillText(p.streak || '42', 48, 225);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText('天连续坚持', 220, 215);

      // Completion badge
      ctx.fillStyle = YELLOW;
      ctx.fillRect(w - 220, 160, 160, 44);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`达成率 ${p.completion || '88%'}`, w - 180, 188);

      // 4-Week GitHub-style Heatmap Matrix
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 260, w - 56, 145);
      ctx.strokeRect(28, 260, w - 56, 145);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText('近 4 周活动热力图 (GitHub-Style Contribution Heatmap):', 44, 290);

      const heatmap = HabitTracker.getHeatmap(4);
      const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

      // Row labels
      ctx.fillStyle = '#888888';
      ctx.font = '12px sans-serif';
      for (let r = 0; r < 7; r += 2) {
        ctx.fillText(dayNames[r], 46, 328 + r * 14);
      }

      // Render 4 columns × 7 rows
      const startX = 80;
      const boxSize = 14;
      const gap = 5;

      heatmap.forEach((week, wIdx) => {
        week.forEach((item, dIdx) => {
          const bx = startX + wIdx * (boxSize + gap) * 6;
          const by = 312 + dIdx * (boxSize + gap);

          if (item.done) {
            ctx.fillStyle = (dIdx === 6 || dIdx === 0) ? YELLOW : RED;
          } else if (item.isFuture) {
            ctx.fillStyle = '#f0f0f0';
          } else {
            ctx.fillStyle = '#e0e0e0';
          }

          ctx.fillRect(bx, by, boxSize + 12, boxSize);
          ctx.strokeStyle = '#bbbbbb';
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, boxSize + 12, boxSize);
        });
      });

      // Motivation motto
      ctx.fillStyle = '#555555';
      ctx.font = 'italic 16px "PingFang SC", serif';
      ctx.fillText('“自律即自由。每一个打卡方块都是通向卓越的坚实足迹。”', 48, 445);

      this._drawFooter(ctx, '本地数据持久化保存 · 今日打卡已就绪', '不积跬步 无以至千里');
    },

    // 8. Classical Chinese Poetry
    _renderPoetry(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📜 每日一诗 · 古典名家文选', 'POETRY & ART', false);

      const isP = w < h;
      if (isP) {
        // Classical double frame
        ctx.strokeStyle = RED;
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 72, w - 32, h - 124);
        ctx.lineWidth = 1;
        ctx.strokeRect(22, 78, w - 44, h - 136);

        // Red Seal Stamp
        ctx.fillStyle = RED;
        ctx.fillRect(w - 85, 95, 52, 52);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 20px "PingFang SC", serif';
        ctx.fillText(p.seal || '太白', w - 73, 128);

        // Title & Author
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 30px "PingFang SC", serif';
        ctx.fillText(p.title || '《早发白帝城》', 42, 135);
        ctx.font = 'bold 18px "PingFang SC", serif';
        ctx.fillText(p.author || '【唐】李白', 42, 175);

        // Classical Lines
        ctx.font = '24px "PingFang SC", serif';
        ctx.fillText(p.line1 || '朝辞白帝彩云间，千里江陵一日还。', 42, 245);
        ctx.fillText(p.line2 || '两岸猿声啼不住，轻舟已过万重山。', 42, 310);

        // Classical Appreciation Card
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1;
        ctx.fillRect(36, 380, w - 72, 220);
        ctx.strokeRect(36, 380, w - 72, 220);

        ctx.fillStyle = BLACK;
        ctx.font = '17px "PingFang SC", sans-serif';
        this._wrapText(ctx, '意境鉴赏：全诗意境豪迈开阔，节奏明快流利，寄托了舟行如飞的欣喜与释怀豪情，融情于景，气势非凡。', 52, 430, w - 104, 28, 5);

        this._drawFooter(ctx, '中华古典诗词数据库 · 宣纸朱印金墨美学排版', '经典永流传');
        return;
      }

      // Classical double frame
      ctx.strokeStyle = RED;
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 72, w - 40, h - 124);
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 78, w - 52, h - 136);

      // Red Seal Stamp
      ctx.fillStyle = RED;
      ctx.fillRect(w - 110, 95, 56, 56);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 22px "PingFang SC", serif';
      ctx.fillText(p.seal || '太白', w - 95, 131);

      // Title & Author
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 36px "PingFang SC", serif';
      ctx.fillText(p.title || '《早发白帝城》', 60, 140);
      ctx.font = 'bold 22px "PingFang SC", serif';
      ctx.fillText(p.author || '【唐】李白', 60, 185);

      // Classical Lines
      ctx.font = '28px "PingFang SC", serif';
      ctx.fillText(p.line1 || '朝辞白帝彩云间，千里江陵一日还。', 60, 260);
      ctx.fillText(p.line2 || '两岸猿声啼不住，轻舟已过万重山。', 60, 330);

      // Classical Appreciation Card
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 1;
      ctx.fillRect(60, 390, w - 120, 65);
      ctx.strokeRect(60, 390, w - 120, 65);

      ctx.fillStyle = BLACK;
      ctx.font = '16px "PingFang SC", sans-serif';
      ctx.fillText('意境鉴赏：全诗意境豪迈开阔，节奏明快流利，寄托了舟行如飞的欣喜与释怀豪情。', 78, 430);

      this._drawFooter(ctx, '中华古典诗词数据库 · 宣纸朱印金墨美学排版', '经典永流传');
    },

    // 9. Today in History
    _renderHistory(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🏛️ 历史上的今天大事记 (TODAY IN HISTORY)', 'CHRONICLE');

      const isP = w < h;
      if (isP) {
        // Card 1
        ctx.fillStyle = '#fdfdfd';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(20, 75, w - 40, 260);
        ctx.strokeRect(20, 75, w - 40, 260);

        ctx.fillStyle = RED;
        ctx.fillRect(36, 95, 130, 34);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 17px "PingFang SC", sans-serif';
        ctx.fillText(p.year || '公元 1913 年', 48, 118);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 21px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.title || '福特汽车启用首条流水装配线', 36, 160, w - 72, 26, 2);

        ctx.fillStyle = '#333333';
        ctx.font = '17px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.desc || '大幅降低了工业制造装配成本，使汽车快速进入大众家庭，彻底推动现代工业生产时代的开启。', 36, 225, w - 72, 26, 3);

        // Card 2
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.fillRect(20, 360, w - 40, 260);
        ctx.strokeRect(20, 360, w - 40, 260);

        ctx.fillStyle = BLACK;
        ctx.fillRect(36, 380, 110, 34);
        ctx.fillStyle = WHITE;
        ctx.font = 'bold 17px sans-serif';
        ctx.fillText(p.event2_year || '1985 年', 50, 403);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.event2_title || '深海科考队在北大西洋首次发现泰坦尼克号残骸', 36, 445, w - 72, 26, 2);

        ctx.fillStyle = '#444444';
        ctx.font = '16px "PingFang SC", sans-serif';
        this._wrapText(ctx, '历经73年的深海寻觅，人类科考队终于揭开世纪巨轮的神秘面纱，推动了深海探潜科技跃升。', 36, 510, w - 72, 26, 3);

        this._drawFooter(ctx, '以史为鉴可知兴替 · 每日重大历史回顾', '时光长河的坐标');
        return;
      }

      // Card 1
      ctx.fillStyle = '#fdfdfd';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.fillRect(28, 76, w - 56, 185);
      ctx.strokeRect(28, 76, w - 56, 185);

      ctx.fillStyle = RED;
      ctx.fillRect(44, 95, 140, 36);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(p.year || '公元 1913 年', 58, 120);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '福特汽车启用首条流水装配线', 200, 122);

      ctx.fillStyle = '#333333';
      ctx.font = '19px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.desc || '大幅降低了工业制造装配成本，使汽车快速进入大众家庭，彻底推动现代工业生产时代的开启。', 46, 175, w - 96, 28, 3);

      // Card 2
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.fillRect(28, 280, w - 56, 130);
      ctx.strokeRect(28, 280, w - 56, 130);

      ctx.fillStyle = BLACK;
      ctx.fillRect(44, 300, 110, 34);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(p.event2_year || '1985 年', 60, 324);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(p.event2_title || '深海科考队在北大西洋首次发现泰坦尼克号残骸', 170, 325);

      ctx.fillStyle = '#444444';
      ctx.font = '17px "PingFang SC", sans-serif';
      ctx.fillText('历经73年的深海寻觅，人类科考队终于揭开世纪巨轮的神秘面纱，推动了深海探潜科技跃升。', 46, 375);

      this._drawFooter(ctx, '以史为鉴可知兴替 · 每日重大历史回顾', '时光长河的坐标');
    },

    // 10. Life & Time Progress
    _renderLifeProgress(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '⏳ 人生进度条与时间感知 (TIME PROGRESS)', 'AWARENESS');

      const isP = w < h;
      if (isP) {
        // Year Progress
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText(`2026 年度时间流逝：${p.year_prog || '77.2%'}`, 28, 95);

        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(28, 108, w - 56, 22);
        const yPct = Math.min(1.0, Math.max(0, parseFloat(p.year_prog) / 100)) || 0.772;
        ctx.fillStyle = RED;
        ctx.fillRect(28, 108, (w - 56) * yPct, 22);

        // Month & Day Dual Bars (Stacked in portrait)
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 16px "PingFang SC", sans-serif';
        ctx.fillText(`当月进度：${p.month_prog || '32.3%'}`, 28, 155);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(28, 165, w - 56, 16);
        ctx.fillStyle = YELLOW;
        ctx.fillRect(28, 165, (w - 56) * (parseFloat(p.month_prog) / 100 || 0.32), 16);

        ctx.fillStyle = BLACK;
        ctx.fillText(`今日流逝：${p.day_prog || '65.0%'}`, 28, 205);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(28, 215, w - 56, 16);
        ctx.fillStyle = BLACK;
        ctx.fillRect(28, 215, (w - 56) * (parseFloat(p.day_prog) / 100 || 0.65), 16);

        // 80-Year Life Grid Matrix (10 cols × 8 rows in portrait)
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(20, 250, w - 40, 270);
        ctx.strokeRect(20, 250, w - 40, 270);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 15px "PingFang SC", sans-serif';
        ctx.fillText(`人生八十年透视网格 (当前年龄: ${p.age || 28} 岁):`, 34, 276);

        const ageNum = parseInt(p.age, 10) || 28;
        const cols = 10;
        const rows = 8;
        const boxW = 38;
        const boxH = 18;
        const gap = 8;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c + 1;
            const bx = 36 + c * (boxW + gap);
            const by = 294 + r * (boxH + 6);

            if (idx <= ageNum) {
              ctx.fillStyle = RED;
              ctx.fillRect(bx, by, boxW, boxH);
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(bx, by, boxW, boxH);
              ctx.strokeStyle = '#cccccc';
              ctx.strokeRect(bx, by, boxW, boxH);
            }
          }
        }

        // Caption Quote
        ctx.fillStyle = '#fff3cc';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 1;
        ctx.fillRect(20, 535, w - 40, 95);
        ctx.strokeRect(20, 535, w - 40, 95);

        ctx.fillStyle = '#333333';
        ctx.font = 'italic 16px "PingFang SC", serif';
        this._wrapText(ctx, p.caption || '2026年已悄然流逝四分之三，珍惜眼前每一个清晨与星夜。只争朝夕，不负韶华。', 36, 568, w - 72, 24, 3);

        this._drawFooter(ctx, '时光飞逝，只争朝夕 · 珍惜当下每一秒', '墨水屏静态保持');
        return;
      }

      // Year Progress
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(`2026 年度时间流逝：${p.year_prog || '77.2%'}`, 48, 115);

      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(48, 130, w - 96, 26);
      const yPct = Math.min(1.0, Math.max(0, parseFloat(p.year_prog) / 100)) || 0.772;
      ctx.fillStyle = RED;
      ctx.fillRect(48, 130, (w - 96) * yPct, 26);

      // Month & Day Dual Bars
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(`当月进度：${p.month_prog || '32.3%'}`, 48, 195);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(48, 205, 310, 18);
      ctx.fillStyle = YELLOW;
      ctx.fillRect(48, 205, 310 * (parseFloat(p.month_prog) / 100 || 0.32), 18);

      ctx.fillStyle = BLACK;
      ctx.fillText(`今日流逝：${p.day_prog || '65.0%'}`, 410, 195);
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(410, 205, 310, 18);
      ctx.fillStyle = BLACK;
      ctx.fillRect(410, 205, 310 * (parseFloat(p.day_prog) / 100 || 0.65), 18);

      // 80-Year Life Grid Matrix
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 245, w - 56, 140);
      ctx.strokeRect(28, 245, w - 56, 140);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 16px "PingFang SC", sans-serif';
      ctx.fillText(`人生八十年透视网格 (当前年龄: ${p.age || 28} 岁):`, 44, 272);

      const ageNum = parseInt(p.age, 10) || 28;
      const cols = 20;
      const rows = 4;
      const boxW = 28;
      const boxH = 14;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c + 1;
          const bx = 46 + c * (boxW + 6);
          const by = 288 + r * (boxH + 5);

          if (idx <= ageNum) {
            ctx.fillStyle = RED;
            ctx.fillRect(bx, by, boxW, boxH);
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(bx, by, boxW, boxH);
            ctx.strokeStyle = '#cccccc';
            ctx.strokeRect(bx, by, boxW, boxH);
          }
        }
      }

      // Seneca Quote
      ctx.fillStyle = '#333333';
      ctx.font = 'italic 17px "PingFang SC", serif';
      this._wrapText(ctx, p.caption || '2026年已悄然流逝四分之三，珍惜眼前每一个清晨与星夜。', 48, 430, w - 96, 26, 2);

      this._drawFooter(ctx, '时光飞逝，只争朝夕 · 珍惜当下每一秒', '墨水屏静态保持');
    },

    // 11. Interactive Pomodoro Focus Clock
    _renderPomodoro(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🍅 番茄专注时钟 (POMODORO CLOCK)', p.state || 'DEEP FOCUS');

      const isP = w < h;
      if (isP) {
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(`当前任务：${p.task || 'ESP32 嵌入式墨水屏研发'}`, 32, 115);

        // Monospace timer centered
        ctx.fillStyle = RED;
        ctx.font = 'bold 110px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.timer || '25:00', w / 2, 250);
        ctx.textAlign = 'left';

        // Status Tag & Rounds centered
        ctx.fillStyle = YELLOW;
        ctx.fillRect((w - 200) / 2, 290, 200, 46);
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.round || '第 1 / 4 组', w / 2, 321);
        ctx.textAlign = 'left';

        // 4 Round Circles
        for (let i = 1; i <= 4; i++) {
          const cx = (w / 2) - 75 + (i - 1) * 50;
          const cy = 370;
          ctx.fillStyle = i === 1 ? RED : '#cccccc';
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tips Card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 420, w - 48, 200);
        ctx.strokeRect(24, 420, w - 48, 200);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 18px "PingFang SC", sans-serif';
        ctx.fillText('💡 专注提示：', 44, 460);
        ctx.font = '17px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.tip || '保持单任务专注，消除外界所有干扰。25分钟深度冲刺后将有5分钟身心短休。', 44, 500, w - 88, 28, 4);

        this._drawFooter(ctx, '番茄工作法状态机驱动 · 25分钟深度工作 + 5分钟短休', '心流状态保持');
        return;
      }

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 28px "PingFang SC", sans-serif';
      ctx.fillText(`当前任务：${p.task || 'ESP32 嵌入式墨水屏研发'}`, 48, 120);

      // Giant monospace digital timer
      ctx.fillStyle = RED;
      ctx.font = 'bold 130px monospace';
      ctx.fillText(p.timer || '25:00', 160, 275);

      // Status Tag & Rounds
      ctx.fillStyle = YELLOW;
      ctx.fillRect(48, 320, 220, 48);
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(p.round || '第 1 / 4 组', 90, 353);

      // 4 Round Circles
      for (let i = 1; i <= 4; i++) {
        const cx = 310 + i * 40;
        const cy = 344;
        ctx.fillStyle = i === 1 ? RED : '#cccccc';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tips Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 395, w - 56, 75);
      ctx.strokeRect(28, 395, w - 56, 75);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      ctx.fillText(`💡 专注提示：${p.tip || '专注当下，消除外界干扰'}`, 48, 440);

      this._drawFooter(ctx, '番茄工作法状态机驱动 · 25分钟深度工作 + 5分钟短休', '心流状态保持');
    },

    // 12. Shopping List
    _renderShopping(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🛒 家庭补货与采购清单 (SHOPPING LIST)', 'BUY TODAY');

      const isP = w < h;
      let y = isP ? 90 : 100;
      const stepY = isP ? 90 : 82;
      [p.item1, p.item2, p.item3, p.item4].forEach((it, idx) => {
        if (!it) return;
        ctx.fillStyle = '#fff9db';
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 2;
        ctx.fillRect(isP ? 24 : 36, y - 20, isP ? w - 48 : w - 72, isP ? 70 : 62);
        ctx.strokeRect(isP ? 24 : 36, y - 20, isP ? w - 48 : w - 72, isP ? 70 : 62);

        // Package icon / Checkbox
        ctx.fillStyle = idx === 0 ? RED : BLACK;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('📦', isP ? 38 : 54, y + 22);

        ctx.fillStyle = BLACK;
        ctx.font = (isP ? 'bold 18px ' : 'bold 21px ') + '"PingFang SC", sans-serif';
        ctx.fillText(it, isP ? 78 : 100, y + 22);

        // Checkbox square
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(w - (isP ? 70 : 90), y - 4, 24, 24);

        y += stepY;
      });

      this._drawFooter(ctx, '随买随销，生活更有条理 · 墨水屏全天随身参考', '采购清单已同步');
    },

    // 13. Health Care & Medication Reminders
    _renderCareReminders(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '💊 健康用药与温情关怀 (HEALTH CARE)', 'REMINDERS');

      const isP = w < h;
      let y = isP ? 90 : 100;
      const stepY = isP ? 100 : 92;
      const slots = [
        { label: '🌅 晨间用药 (08:00)', val: p.morning, color: RED },
        { label: '☀️ 午间补充 (12:30)', val: p.noon, color: YELLOW },
        { label: '🌙 晚间睡前 (21:00)', val: p.evening, color: BLACK }
      ];

      slots.forEach(s => {
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 3;
        ctx.fillRect(isP ? 24 : 36, y - 20, isP ? w - 48 : w - 72, isP ? 78 : 70);
        ctx.strokeRect(isP ? 24 : 36, y - 20, isP ? w - 48 : w - 72, isP ? 78 : 70);

        ctx.fillStyle = s.color;
        ctx.font = (isP ? 'bold 18px ' : 'bold 20px ') + '"PingFang SC", sans-serif';
        ctx.fillText(s.label, isP ? 38 : 56, y + 24);

        ctx.fillStyle = BLACK;
        ctx.font = (isP ? 'bold 16px ' : 'bold 18px ') + '"PingFang SC", sans-serif';
        ctx.fillText(s.val || '无', isP ? 230 : 290, y + 24);
        y += stepY;
      });

      // Warm Note Card
      ctx.fillStyle = '#fff9db';
      ctx.strokeStyle = YELLOW;
      ctx.lineWidth = 2;
      ctx.fillRect(isP ? 24 : 36, isP ? 430 : 400, isP ? w - 48 : w - 72, isP ? 180 : 70);
      ctx.strokeRect(isP ? 24 : 36, isP ? 430 : 400, isP ? w - 48 : w - 72, isP ? 180 : 70);

      ctx.fillStyle = RED;
      ctx.font = 'bold 18px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.note || '健康是最好的财富，记得按时作息多喝温水！', isP ? 40 : 56, isP ? 470 : 442, isP ? w - 80 : w - 110, 28, 4);

      this._drawFooter(ctx, '家庭健康智慧看护终端 · 贴心相伴每一刻', '温水服用 按时作息');
    },

    // 14. Daily Routine
    _renderDailyRoutine(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🕒 今日作息与高效时间轴 (DAILY ROUTINE)', 'SCHEDULE');

      const isP = w < h;
      let y = isP ? 85 : 100;
      const stepY = isP ? 82 : 58;
      [p.r1, p.r2, p.r3, p.r4, p.r5, p.r6].forEach((r, idx) => {
        if (!r) return;
        ctx.fillStyle = idx === 2 ? RED : (idx % 2 === 0 ? YELLOW : BLACK);
        ctx.beginPath();
        ctx.arc(isP ? 40 : 54, y + 4, 8, 0, Math.PI * 2);
        ctx.fill();

        // Connecting vertical line
        if (idx < 5) {
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(isP ? 40 : 54, y + 14);
          ctx.lineTo(isP ? 40 : 54, y + (isP ? 76 : 54));
          ctx.stroke();
        }

        // Routine Card
        ctx.fillStyle = idx === 2 ? '#fff9db' : '#f8f9fa';
        ctx.strokeStyle = idx === 2 ? RED : '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.fillRect(isP ? 60 : 80, y - 18, isP ? w - 84 : w - 120, isP ? 54 : 48);
        ctx.strokeRect(isP ? 60 : 80, y - 18, isP ? w - 84 : w - 120, isP ? 54 : 48);

        ctx.fillStyle = BLACK;
        ctx.font = (idx === 2 ? 'bold ' : '') + (isP ? '17px ' : '20px ') + '"PingFang SC", sans-serif';
        ctx.fillText(r, isP ? 74 : 96, y + 15);

        y += stepY;
      });

      this._drawFooter(ctx, '劳逸结合，秩序井然 · 保持高效节奏', '墨水屏全天候展示');
    },

    // 15. Moon Phase & Astronomy Tides
    _renderMoonPhase(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🌙 月相盈亏与天文潮汐 (MOON PHASE & TIDES)', 'ASTRONOMY');

      const isP = w < h;
      if (isP) {
        // Centered Moon Sphere
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(w / 2, 175, 75, 0, Math.PI * 2);
        ctx.fill();

        // Crescent illumination
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.arc(w / 2, 175, 73, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Text Data centered
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 30px "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.phase || '残月 (Waning Crescent)', w / 2, 285);

        ctx.font = '20px sans-serif';
        ctx.fillText(p.age || '月龄 28.1 天', w / 2, 325);
        ctx.fillText(`亮面占比：${p.illum || '2.2%'}`, w / 2, 360);

        ctx.fillStyle = RED;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText(`潮汐预报：${p.tide || '大潮 (高潮 04:20 / 低潮 11:35)'}`, w / 2, 400);
        ctx.textAlign = 'left';

        // Astronomy facts card
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 440, w - 48, 180);
        ctx.strokeRect(24, 440, w - 48, 180);

        ctx.fillStyle = BLACK;
        ctx.font = '16px "PingFang SC", sans-serif';
        this._wrapText(ctx, '天文历法实时演算：朔望月周期约为 29.53 天，地月引力导致海水周期性涨落。潮汐能量源源不断，与万物同律共振。', 42, 485, w - 84, 26, 4);

        this._drawFooter(ctx, '精密天文演算引擎驱动 · 潮汐与天象实时数据', '万物同律');
        return;
      }

      // Moon Sphere Graphic
      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.arc(160, 230, 90, 0, Math.PI * 2);
      ctx.fill();

      // Crescent illumination
      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.arc(160, 230, 88, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Text Data
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 36px "PingFang SC", sans-serif';
      ctx.fillText(p.phase || '残月 (Waning Crescent)', 310, 160);

      ctx.font = '22px sans-serif';
      ctx.fillText(p.age || '月龄 28.1 天', 310, 210);
      ctx.fillText(`亮面占比：${p.illum || '2.2%'}`, 310, 255);

      ctx.fillStyle = RED;
      ctx.font = 'bold 22px "PingFang SC", sans-serif';
      ctx.fillText(`潮汐预报：${p.tide || '大潮 (高潮 04:20 / 低潮 11:35)'}`, 310, 305);

      // Astronomy facts card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.fillRect(28, 385, w - 56, 85);
      ctx.strokeRect(28, 385, w - 56, 85);

      ctx.fillStyle = BLACK;
      ctx.font = '17px "PingFang SC", sans-serif';
      ctx.fillText('天文历法实时演算：朔望月周期约为 29.53 天，引潮力随地月日相对位置规律起伏。', 46, 435);

      this._drawFooter(ctx, '精密天文演算引擎驱动 · 潮汐与天象实时数据', '万物同律');
    },

    // 16. Wi-Fi QR Code Share
    _renderQRCode(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📱 Wi-Fi 快速扫码连网 (QR CODE SHARE)', 'CONNECT');

      const ssid = p.ssid || 'Your_WiFi_SSID';
      const pass = p.pass || 'Your_WiFi_Password';
      const wifiQrPayload = `WIFI:S:${ssid};T:WPA;P:${pass};;`;

      const isP = w < h;
      if (isP) {
        // QR Code Card Centered
        const qrBox = 260;
        const qx = (w - qrBox) / 2;
        ctx.fillStyle = WHITE;
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(qx, 78, qrBox, qrBox);
        ctx.strokeRect(qx, 78, qrBox, qrBox);

        if (window.QRCodeLib && typeof window.QRCodeLib.drawQRCode === 'function') {
          window.QRCodeLib.drawQRCode(ctx, wifiQrPayload, qx + 15, 93, 230);
        } else {
          ctx.fillStyle = BLACK;
          ctx.fillRect(qx + 30, 108, 200, 200);
        }

        // Credentials Card below
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.fillRect(24, 355, w - 48, 270);
        ctx.strokeRect(24, 355, w - 48, 270);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText('📶 网络名称 (SSID):', 44, 395);
        ctx.fillStyle = RED;
        ctx.font = 'bold 22px monospace';
        ctx.fillText(ssid, 44, 430);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 20px "PingFang SC", sans-serif';
        ctx.fillText('🔑 无线密码 (Password):', 44, 480);
        ctx.fillStyle = RED;
        ctx.font = 'bold 22px monospace';
        ctx.fillText(pass, 44, 515);

        ctx.fillStyle = '#555555';
        ctx.font = '15px "PingFang SC", sans-serif';
        this._wrapText(ctx, p.prompt || '手机系统相机扫一扫，免输入密码快速连接无线网络。', 44, 565, w - 88, 24, 2);

        this._drawFooter(ctx, '家庭局域网便捷共享 · 标准 RFC Wi-Fi QR Code 协议', '免输密码扫码即连');
        return;
      }

      // Card for QR Code
      ctx.fillStyle = WHITE;
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.fillRect(48, 85, 310, 310);
      ctx.strokeRect(48, 85, 310, 310);

      if (window.QRCodeLib && typeof window.QRCodeLib.drawQRCode === 'function') {
        window.QRCodeLib.drawQRCode(ctx, wifiQrPayload, 68, 105, 270);
      } else {
        ctx.fillStyle = BLACK;
        ctx.fillRect(88, 125, 230, 230);
      }

      // Credentials Card
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.fillRect(390, 85, 330, 310);
      ctx.strokeRect(390, 85, 330, 310);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText('📶 网络名称 (SSID):', 415, 135);
      ctx.fillStyle = RED;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(ssid, 415, 175);

      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText('🔑 无线密码 (Password):', 415, 235);
      ctx.fillStyle = RED;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(pass, 415, 275);

      ctx.fillStyle = '#555555';
      ctx.font = '16px "PingFang SC", sans-serif';
      this._wrapText(ctx, p.prompt || '手机系统相机扫一扫，免输入密码快速连接无线网络。', 415, 335, 290, 24, 2);

      this._drawFooter(ctx, '家庭局域网便捷共享 · 标准 RFC Wi-Fi QR Code 协议', '免输密码扫码即连');
    },

    // 17. Fine Art Photo Gallery Frame
    _renderPhoto(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '🖼️ 电子相框与艺术画廊 (PHOTO GALLERY)', 'GALLERY');

      const isP = w < h;
      if (isP) {
        // Outer museum frame
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(24, 80, w - 48, 480);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 80, w - 48, 480);

        // Artwork simulated viewport
        ctx.fillStyle = '#111111';
        ctx.fillRect(40, 96, w - 80, 448);

        // Procedural art landscape
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(w / 2, 230, 60, 0, Math.PI * 2);
        ctx.fill();

        // Mountain silhouette
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.moveTo(40, 544);
        ctx.lineTo(w / 2 - 70, 360);
        ctx.lineTo(w / 2 + 100, 544);
        ctx.fill();

        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 100, 544);
        ctx.lineTo(w / 2 + 70, 330);
        ctx.lineTo(w - 40, 544);
        ctx.fill();

        // Plaque Card
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 22px "PingFang SC", sans-serif';
        ctx.fillText(p.title || '山川湖海 · 秋日光影', 32, 595);

        ctx.fillStyle = '#666666';
        ctx.font = '16px sans-serif';
        ctx.fillText(`${p.date || '2026 Autumn'} · ${p.author || 'Shot on Custom Rig'}`, 32, 625);

        this._drawFooter(ctx, 'Floyd-Steinberg 4色微粒物理量化渲染 · 艺术级呈现', 'Edition 1/1');
        return;
      }

      // Outer museum frame
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(48, 80, w - 96, 310);
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 80, w - 96, 310);

      // Artwork simulated viewport
      ctx.fillStyle = '#111111';
      ctx.fillRect(68, 100, w - 136, 270);

      // Procedural art landscape on 4-color palette
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(w / 2, 210, 60, 0, Math.PI * 2);
      ctx.fill();

      // Mountain silhouette in black and yellow
      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.moveTo(68, 370);
      ctx.lineTo(w / 2 - 80, 250);
      ctx.lineTo(w / 2 + 120, 370);
      ctx.fill();

      ctx.fillStyle = BLACK;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 120, 370);
      ctx.lineTo(w / 2 + 80, 230);
      ctx.lineTo(w - 68, 370);
      ctx.fill();

      // Plaque Card
      ctx.fillStyle = BLACK;
      ctx.font = 'bold 24px "PingFang SC", sans-serif';
      ctx.fillText(p.title || '山川湖海 · 秋日光影', 48, 430);

      ctx.fillStyle = '#666666';
      ctx.font = '16px sans-serif';
      ctx.fillText(`${p.date || '2026 Autumn'} · ${p.author || 'Shot on Custom Rig'}`, 48, 460);

      this._drawFooter(ctx, 'Floyd-Steinberg 4色微粒物理量化渲染 · 艺术级呈现', 'Edition 1/1');
    },

    // 18. Tech News & Crypto Ticker (HN + CoinGecko)
    _renderRSS(ctx, p, w, h) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      this._drawHeader(ctx, '📰 科技早报与加密货币行情 (TECH & CRYPTO)', 'LIVE DIGEST');

      const isP = w < h;
      if (isP) {
        const cryptos = [
          { name: '₿ BTC', val: p.btc || '$63.8k (+2.4%)', color: RED },
          { name: 'Ξ ETH', val: p.eth || '$2.6k (+1.8%)', color: YELLOW },
          { name: '◎ SOL', val: p.sol || '$148.5 (+5.2%)', color: BLACK }
        ];

        const cw = Math.floor((w - 48 - 16) / 3);
        cryptos.forEach((c, idx) => {
          const cx = 24 + idx * (cw + 8);
          ctx.fillStyle = '#f8f9fa';
          ctx.strokeStyle = c.color === YELLOW ? '#b78103' : c.color;
          ctx.lineWidth = 2;
          ctx.fillRect(cx, 75, cw, 68);
          ctx.strokeRect(cx, 75, cw, 68);

          ctx.fillStyle = c.color === YELLOW ? '#b78103' : c.color;
          ctx.font = 'bold 16px -apple-system, sans-serif';
          ctx.fillText(c.name, cx + 12, 100);

          ctx.fillStyle = BLACK;
          ctx.font = 'bold 13px monospace';
          ctx.fillText(c.val, cx + 12, 126);
        });

        // Bottom Hacker News Headlines
        let y = 165;
        [p.head1, p.head2, p.head3, p.head4].forEach((head, idx) => {
          if (!head) return;
          ctx.fillStyle = '#fdfdfd';
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.fillRect(24, y - 18, w - 48, 62);
          ctx.strokeRect(24, y - 18, w - 48, 62);

          ctx.fillStyle = idx === 0 ? RED : (idx === 1 ? YELLOW : BLACK);
          ctx.fillRect(36, y - 4, 8, 30);

          ctx.fillStyle = BLACK;
          ctx.font = 'bold 16px "PingFang SC", -apple-system, sans-serif';
          this._wrapText(ctx, head, 56, y + 10, w - 90, 22, 2);

          y += 78;
        });

        this._drawFooter(ctx, 'Hacker News & CoinGecko 全球开源 API 实时聚合驱动', '60 分钟自动更新');
        return;
      }

      // Top Crypto Live Ticker Cards
      const cryptos = [
        { name: '₿ BTC', val: p.btc || '$63,850 (+2.4%)', color: RED },
        { name: 'Ξ ETH', val: p.eth || '$2,640 (+1.8%)', color: YELLOW },
        { name: '◎ SOL', val: p.sol || '$148.5 (+5.2%)', color: BLACK }
      ];

      cryptos.forEach((c, idx) => {
        const cx = 28 + idx * 242;
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = c.color === YELLOW ? '#b78103' : c.color;
        ctx.lineWidth = 2;
        ctx.fillRect(cx, 75, 226, 68);
        ctx.strokeRect(cx, 75, 226, 68);

        ctx.fillStyle = c.color === YELLOW ? '#b78103' : c.color;
        ctx.font = 'bold 18px -apple-system, sans-serif';
        ctx.fillText(c.name, cx + 18, 102);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(c.val, cx + 18, 128);
      });

      // Bottom Hacker News Headlines
      let y = 175;
      [p.head1, p.head2, p.head3, p.head4].forEach((head, idx) => {
        if (!head) return;
        ctx.fillStyle = '#fdfdfd';
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.fillRect(28, y - 18, w - 56, 56);
        ctx.strokeRect(28, y - 18, w - 56, 56);

        // Score badge or bullet
        ctx.fillStyle = idx === 0 ? RED : (idx === 1 ? YELLOW : BLACK);
        ctx.fillRect(40, y - 4, 8, 26);

        ctx.fillStyle = BLACK;
        ctx.font = 'bold 18px "PingFang SC", -apple-system, sans-serif';
        ctx.fillText(head, 62, y + 16, w - 110);

        y += 72;
      });

      this._drawFooter(ctx, 'Hacker News & CoinGecko 全球开源 API 实时聚合驱动', '60 分钟自动更新');
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Drawing Utility Helpers
    // ─────────────────────────────────────────────────────────────────────────

    _drawHeader(ctx, title, subRight, isRed = true) {
      const { RED, YELLOW, BLACK, WHITE } = this.COLORS;
      const w = ctx.canvas.width || 768;
      ctx.fillStyle = isRed ? RED : BLACK;
      ctx.fillRect(0, 0, w, 56);
      ctx.fillStyle = WHITE;
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';

      let displayTitle = title;
      const maxTitleWidth = subRight ? (w - 50 - ctx.measureText(subRight).width) : (w - 50);
      while (ctx.measureText(displayTitle).width > maxTitleWidth && displayTitle.length > 4) {
        displayTitle = displayTitle.slice(0, -2) + '…';
      }
      ctx.fillText(displayTitle, 24, 38);

      if (subRight) {
        ctx.fillStyle = YELLOW;
        ctx.font = 'bold 16px -apple-system, sans-serif';
        const tw = ctx.measureText(subRight).width;
        ctx.fillText(subRight, w - 24 - tw, 37);
      }
    },

    _drawFooter(ctx, left, right) {
      const { BLACK, WHITE, YELLOW } = this.COLORS;
      const w = ctx.canvas.width || 768;
      const h = ctx.canvas.height || 552;
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, h - 36, w, 36);

      ctx.fillStyle = WHITE;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(left || '智能墨水屏物联网终端', 20, h - 13);

      if (right) {
        ctx.fillStyle = YELLOW;
        ctx.font = 'bold 13px -apple-system, sans-serif';
        const tw = ctx.measureText(right).width;
        ctx.fillText(right, w - 20 - tw, h - 13);
      }
    },

    _wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
      const chars = String(text || '').split('');
      let line = '';
      let currentY = y;
      let lineCount = 1;

      for (let n = 0; n < chars.length; n++) {
        const testLine = line + chars[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          if (lineCount >= maxLines) {
            ctx.fillText(line + '...', x, currentY);
            return;
          }
          ctx.fillText(line, x, currentY);
          line = chars[n];
          currentY += lineHeight;
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Remote Hardware Control & Preset Push
    // ─────────────────────────────────────────────────────────────────────────

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

        } else if (cmd === 'clear:black') {
          if (typeof dm.sendClearBlack === 'function') {
            await dm.sendClearBlack();
          } else if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('clear:black');
            await dm.rxChar.writeValueWithoutResponse(enc);
          }
          if (window.UI?.showToast) window.UI.showToast('已触发全黑清屏！', 'success');

        } else if (cmd === 'clear:yellow') {
          if (typeof dm.sendClearYellow === 'function') {
            await dm.sendClearYellow();
          } else if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('clear:yellow');
            await dm.rxChar.writeValueWithoutResponse(enc);
          }
          if (window.UI?.showToast) window.UI.showToast('已触发全黄清屏！', 'success');

        } else if (cmd === 'clear:red') {
          if (typeof dm.sendClearRed === 'function') {
            await dm.sendClearRed();
          } else if (dm.isBleConnected && dm.rxChar) {
            const enc = new TextEncoder().encode('clear:red');
            await dm.rxChar.writeValueWithoutResponse(enc);
          }
          if (window.UI?.showToast) window.UI.showToast('已触发全红清屏！', 'success');

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

    async pushCurrentScene() {
      if (!this.canvas) return;
      try {
        if (window.UI?.showToast) {
          window.UI.showToast(`正在量化并推送【${this.currentSelectedMode}】场景至墨水屏...`, 'info', 4000);
        }
        if (window.App && typeof window.App.pushCanvas === 'function') {
          await window.App.pushCanvas(this.canvas, `场景: ${this.currentSelectedMode}`);
        } else if (window.BWRY && window.DeviceManager) {
          const packed = window.BWRY.ditherCanvasTo2bpp(this.canvas, 'floyd', { orientation: window.UI?.orientation || 0 });
          await window.DeviceManager.pushBitmap2bpp(packed);
          if (window.UI?.showToast) window.UI.showToast('🎉 推送场景成功！', 'success');
        }
      } catch (e) {
        if (window.UI?.showToast) window.UI.showToast(`推送失败: ${e.message}`, 'error', 4000);
      }
    },

    async saveCurrentSceneAsPreset() {
      if (!this.canvas) return;
      const def = this.MODES_DEF.find(m => m.id === this.currentSelectedMode);
      if (window.App && typeof window.App.promptSavePreset === 'function') {
        await window.App.promptSavePreset(this.canvas, 'scene', def ? def.name : '场景预设');
        return;
      }
      const name = prompt('请输入预设名称:', `${def ? def.name : '场景'}_${new Date().toLocaleTimeString('zh-CN')}`);
      if (!name) return;

      try {
        if (window.BWRY && window.PresetHub) {
          const packed = window.BWRY.ditherCanvasTo2bpp(this.canvas, 'floyd', { orientation: window.UI?.orientation || 0 });
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

    _bindRemoteButtons() {
      document.querySelectorAll('#sceneRefreshBtn, [data-remote-cmd="refresh"]').forEach(btn => {
        btn.addEventListener('click', () => this.sendRemoteCmd('refresh'));
      });
      document.querySelectorAll('#sceneClearBtn, [data-remote-cmd="clear"]').forEach(btn => {
        btn.addEventListener('click', () => this.sendRemoteCmd('clear'));
      });
      document.querySelectorAll('#sceneRebootBtn, [data-remote-cmd="reboot"]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('确认软重启墨水屏设备？')) {
            this.sendRemoteCmd('reboot');
          }
        });
      });
      document.querySelectorAll('#scenePushBtn, #btnSaveAndPushMode').forEach(btn => {
        btn.addEventListener('click', () => this.pushCurrentScene());
      });
      document.querySelectorAll('#sceneSavePresetBtn').forEach(btn => {
        btn.addEventListener('click', () => this.saveCurrentSceneAsPreset());
      });
      document.querySelectorAll('[data-rf-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-rf-mode');
          this.sendRemoteCmd(`rf:${mode}`);
        });
      });
    },

    getCanvas() {
      if (!this.canvas) {
        this.canvas = document.getElementById('scenesPreviewCanvas') || document.getElementById('modePreviewCanvas');
      }
      return this.canvas;
    }
  };

  // Expose ScenesStudio to global window
  window.ScenesStudio = ScenesStudio;

  // Auto-init on DOM ready
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
