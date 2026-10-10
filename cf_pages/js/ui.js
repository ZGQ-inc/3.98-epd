/**
 * 3.98" BWRY E-Paper Open Smart Badge & Ita-Bag
 * UI Controller (UA Detection, Adaptive Layout, Sliding Tabs, Modals, Toasts)
 * Copyright (c) 2026 ZGQ Inc. All Rights Reserved.
 */

const UI = {
  deviceInfo: {
    type: 'desktop', // 'mobile' | 'tablet' | 'desktop'
    isTouch: false,
    os: 'unknown'
  },

  init() {
    this.detectDevice();
    this.initTheme();
    this.initSlidingTabs();
    this.initModals();
  },

  /* ================= 1. UA Detection & Adaptive Form-Factor ================= */
  detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.deviceInfo.isTouch = isTouch;

    const width = window.innerWidth;
    let type = 'desktop';

    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (isTouch && width >= 601 && width <= 1024)) {
      type = 'tablet';
    } else if (/iphone|ipod|android.*mobile|windows phone/i.test(ua) || width <= 600) {
      type = 'mobile';
    } else {
      type = 'desktop';
    }

    this.deviceInfo.type = type;
    document.documentElement.setAttribute('data-device', type);
    document.documentElement.setAttribute('data-touch', isTouch ? 'true' : 'false');

    console.log(`[UI] Device detected: ${type} (touch: ${isTouch}, width: ${width}px)`);

    // Listen for resize / orientation change
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      let newType = 'desktop';
      if (newWidth <= 600) newType = 'mobile';
      else if (newWidth <= 1024) newType = 'tablet';
      if (newType !== this.deviceInfo.type) {
        this.deviceInfo.type = newType;
        document.documentElement.setAttribute('data-device', newType);
        this.updateTabScrollMasks();
      }
    });
  },

  /* ================= 2. Responsive Sliding Tab Controller ================= */
  initSlidingTabs() {
    const wrapper = document.querySelector('.tab-scroll-wrapper');
    const container = document.querySelector('.tab-scroll-container');
    const hint = document.getElementById('tabScrollHint');
    const closeBtn = hint ? hint.querySelector('.hint-close') : null;

    if (!container || !wrapper) return;

    const updateMasks = () => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (scrollLeft > 4) {
        wrapper.classList.add('has-scroll-left');
      } else {
        wrapper.classList.remove('has-scroll-left');
      }

      if (maxScroll - scrollLeft > 4) {
        wrapper.classList.add('has-scroll-right');
      } else {
        wrapper.classList.remove('has-scroll-right');
      }
    };

    container.addEventListener('scroll', () => {
      updateMasks();
      // Auto-hide hint on first user scroll
      if (hint && hint.style.display !== 'none') {
        hint.style.display = 'none';
        localStorage.setItem('epd_tab_hint_seen', '1');
      }
    }, { passive: true });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (hint) hint.style.display = 'none';
        localStorage.setItem('epd_tab_hint_seen', '1');
      });
    }

    if (localStorage.getItem('epd_tab_hint_seen') === '1' && hint) {
      hint.style.display = 'none';
    }

    // Tab buttons click delegation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab, btn);
      });
    });

    // Initial check
    setTimeout(updateMasks, 100);
    this.updateTabScrollMasks = updateMasks;
  },

  switchTab(tabId, clickedBtn) {
    // Update active button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (clickedBtn) {
      clickedBtn.classList.add('active');
      // Smooth scroll active tab into center view
      clickedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      if (btn) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    // Switch tab pane
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    // Trigger tab-specific refresh hooks
    window.dispatchEvent(new CustomEvent('tabchange', { detail: { tabId } }));
  },

  /* ================= 3. Theme Toggle ================= */
  initTheme() {
    const saved = localStorage.getItem('epd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('epd_theme', next);
        this.showToast(`已切换至${next === 'dark' ? '暗黑模式 🌙' : '亮色模式 ☀️'}`);
      });
    }
  },

  /* ================= 4. Modals ================= */
  initModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
      const closeBtn = overlay.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.classList.remove('active');
        });
      }
    });
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  },

  /* ================= 5. Toast Notifications ================= */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : (type === 'error' ? '⚠' : 'ℹ');
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
};

window.UI = UI;

