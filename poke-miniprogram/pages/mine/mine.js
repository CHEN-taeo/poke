const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const tags = require('../../utils/tags.js');
const constellation = require('../../utils/constellation.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');

const INTEREST_OPTS = ['竞赛', '创业', '展览', '讲座', '专业相关', '机会嗅探'];

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    brandSlogan: brand.SLOGAN,
    online: false,
    interestOpts: INTEREST_OPTS,
    interests: [],
    stars: [],
    clusters: [],
    savedCount: 0,
    totalCount: 0,
    tagCount: 0,
    diet: [],
    bias: [],
    reminders: [],
    shelf: []
  },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
    theme.applyPageTheme(this);
    this.setData({ themeDark: theme.isDark() });
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    const S = store.load();
    const iq = store.interestQuery(S);
    const items = store.allCachedItems(S).map((it) => store.serverCardVM(it));
    const savedRaw = store.savedItems(S);
    const graphItems = savedRaw.length
      ? savedRaw.map((it) => store.serverCardVM(it))
      : items;
    const tagList = tags.collectFromStore(S);
    const stars = constellation.buildStars(graphItems);
    const clusters = constellation.buildClusters(graphItems);
    const diet = store.infoDiet(S, graphItems);
    const bias = store.recentBias(S);
    const reminders = store.listReminders(S);
    const shelf = store.listSavedShelf(S, 6);
    this.setData({
      interests: S.interests || [],
      stars: stars,
      clusters: clusters,
      savedCount: store.savedCount(S),
      totalCount: items.length,
      tagCount: tagList.length,
      diet: diet,
      bias: bias,
      reminders: reminders,
      shelf: shelf
    });
    const health = await api.health();
    this.setData({ online: !!(health && health.ok) });
  },

  toggleInterest(e) {
    const key = e.currentTarget.dataset.key;
    const S = store.load();
    const set = new Set(S.interests || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    S.interests = Array.from(set);
    store.save(S);
    this.setData({ interests: S.interests });
    act.vibrate('light');
  },

  onThemeToggle(e) {
    const dark = !!e.detail.value;
    theme.setMode(dark ? 'dark' : 'light');
    this.setData({ themeDark: dark });
    theme.applyPageTheme(this);
  },

  onStarTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onClusterTap(e) {
    const tag = e.currentTarget.dataset.tag;
    if (!tag) return;
    act.vibrate('light');
    wx.navigateTo({ url: '/pages/tag-album/tag-album?tag=' + encodeURIComponent(tag) });
  },

  onReminderTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onShelfTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onConstellation() {
    wx.switchTab({ url: '/pages/tags/tags' });
  },

  goAdd() { act.vibrate('light'); wx.navigateTo({ url: '/pages/add/add' }); },
  goAccounts() { act.vibrate('light'); wx.navigateTo({ url: '/pages/accounts/accounts' }); },
  goOperator() { wx.navigateTo({ url: '/pages/operator/operator' }); }
});
