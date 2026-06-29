const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const firefly = require('../../utils/firefly.js');
const masonry = require('../../utils/masonry.js');
const explore = require('../../utils/explore.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');
const cardNav = require('../../utils/cardNav.js');

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    tagName: '',
    meta: { total: 0, savedCount: 0, recent: [] },
    leftCol: [],
    rightCol: []
  },

  onLoad(options) {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
    const tagName = decodeURIComponent(options.tag || '');
    this.setData({ tagName });
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    const S = store.load();
    const iq = store.interestQuery(S);
    const feed = await api.feed(S.uid, iq);
    let all = [];
    if (Array.isArray(feed)) {
      store.cacheItems(S, feed);
      store.save(S);
      all = feed.map(store.serverCardVM);
    } else {
      all = store.allCachedItems(S).map((it) => store.serverCardVM(it));
    }
    const tagName = this.data.tagName;
    const matched = all.filter((it) => {
      const tags = (it.tags || []).concat([it.cat, it.eventType, it.aiTopic].filter(Boolean));
      if (tagName === '破壳') return !!it.poke;
      return tags.indexOf(tagName) >= 0;
    });
    const meta = explore.tagAlbumMeta(S, tagName, all);
    const withEnter = firefly.withFireflyEnter(matched);
    const cols = masonry.toMasonry(withEnter);
    this.setData({ meta, leftCol: cols.left, rightCol: cols.right });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/tags/tags' }) });
  },

  onCardTap(e) { cardNav.onCardTap(e); }
});
