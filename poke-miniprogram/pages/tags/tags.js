const store = require('../../utils/store.js');
const tags = require('../../utils/tags.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');

Page({
  data: { tags: [], themeDark: false, navPadTop: 24, navPadRight: 24, brandName: brand.NAME },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    theme.applyPageTheme(this);
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh();
    wx.stopPullDownRefresh();
  },

  refresh() {
    const S = store.load();
    this.setData({ tags: tags.collectFromStore(S) });
  },

  onTagTap(e) {
    act.vibrate('light');
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({ url: '/pages/tag-album/tag-album?tag=' + encodeURIComponent(tag) });
  },

  goAdd() { wx.navigateTo({ url: '/pages/add/add' }); }
});
