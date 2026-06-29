const store = require('../../utils/store.js');
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
    card: null,
    itemId: ''
  },

  onLoad(options) {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
    const id = options.id || '';
    let card = null;
    try {
      const raw = wx.getStorageSync('poke.addSuccess');
      if (raw && raw.id) {
        card = store.serverCardVM(raw);
        this.setData({ card, itemId: raw.id });
        wx.removeStorageSync('poke.addSuccess');
        return;
      }
    } catch (e) {}
    if (id) {
      const S = store.load();
      const it = store.allItemsById(S, id);
      if (it) {
        card = store.serverCardVM(it);
        this.setData({ card, itemId: id });
      }
    }
  },

  goDetail() {
    const id = this.data.itemId;
    if (!id) return this.goHome();
    act.vibrate('light');
    wx.navigateTo({ url: '/pages/detail/detail?id=' + encodeURIComponent(id) });
  },

  goHome() {
    wx.switchTab({ url: '/pages/today/today' });
  },

  goAdd() {
    wx.redirectTo({ url: '/pages/add/add' });
  }
});
