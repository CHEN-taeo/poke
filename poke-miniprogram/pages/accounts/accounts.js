const api = require('../../utils/api.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    loading: true,
    online: false,
    weweBase: '',
    suggested: [],
    configured: [],
    rssUrl: '',
    rssName: ''
  },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
  },

  onShow() {
    theme.applyPageTheme(this);
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    this.setData({ loading: true });
    const health = await api.health();
    const online = !!(health && health.ok);
    let suggested = [];
    let configured = [];
    let weweBase = 'http://127.0.0.1:4000';
    if (online) {
      const mp = await api.mpSuggestions();
      if (mp) {
        suggested = mp.suggested || [];
        configured = mp.configured || [];
        weweBase = mp.weweRssBase || weweBase;
      }
    }
    this.setData({ loading: false, online, suggested, configured, weweBase });
  },

  onRssUrl(e) { this.setData({ rssUrl: e.detail.value }); },
  onRssName(e) { this.setData({ rssName: e.detail.value }); },

  async onSync() {
    if (!api.enabled()) {
      wx.showToast({ title: '请先连接服务', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '同步中…' });
    const r = await api.poll();
    wx.hideLoading();
    act.vibrate('medium');
    const n = (r && r.added) || (r && r.campus && r.campus.added) || 0;
    wx.showToast({ title: n ? '新增 ' + n + ' 条' : '暂无新内容', icon: 'none' });
    this.refresh();
  },

  async onAddSource() {
    const url = (this.data.rssUrl || '').trim();
    const room = (this.data.rssName || '').trim();
    if (!url || !room) {
      wx.showToast({ title: '填 RSS 链接和名称', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '添加中…' });
    const r = await api.addSource(url, room + '（公众号）');
    wx.hideLoading();
    if (!r || r.error) {
      wx.showToast({ title: r && r.error || '添加失败', icon: 'none' });
      return;
    }
    this.setData({ rssUrl: '', rssName: '' });
    wx.showToast({ title: '已添加', icon: 'success' });
    this.refresh();
    this.onSync();
  },

  copySearch(e) {
    const name = e.currentTarget.dataset.name;
    wx.setClipboardData({
      data: name,
      success: () => wx.showToast({ title: '已复制，去微信搜公众号', icon: 'none' })
    });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/mine/mine' }) });
  }
});
