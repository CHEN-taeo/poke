const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const motion = require('../../utils/motion.js');
const firefly = require('../../utils/firefly.js');
const masonry = require('../../utils/masonry.js');
const tags = require('../../utils/tags.js');
const dailyBrief = require('../../utils/dailyBrief.js');
const welcome = require('../../utils/welcome.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');
const cardNav = require('../../utils/cardNav.js');
const { FILTER_PILLS } = require('../../utils/design-tokens.js');

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    brandSlogan: brand.SLOGAN,
    welcomeQuote: '',
    heroMeta: '',
    filters: FILTER_PILLS,
    activeFilter: '全部',
    brief: [],
    leftCol: [],
    rightCol: [],
    hasItems: false,
    online: false,
    refreshing: false
  },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
    this.setData({ welcomeQuote: welcome.dailyQuote() });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    theme.applyPageTheme(this);
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    this.setData({ refreshing: true });
    const S = store.load();
    const iq = store.interestQuery(S);
    const results = await Promise.all([
      api.feed(S.uid, Object.assign({ limit: 80 }, iq)),
      api.poke(S.uid, iq),
      api.health()
    ]);
    const feed = results[0];
    const poke = results[1];
    const health = results[2];
    const online = Array.isArray(feed);
    const llmOn = health && health.llm === 'on';
    let statusText = '离线示例';
    if (online) statusText = llmOn ? 'DeepSeek · 实时整理' : '规则引擎 · 已连接';

    let all = [];
    if (online) {
      store.cacheItems(S, feed);
      if (Array.isArray(poke)) store.cacheItems(S, poke);
      store.save(S);
      const pokeArr = Array.isArray(poke) ? poke : [];
      all = feed.map(store.serverCardVM).concat(
        pokeArr.map((it) => store.serverCardVM(Object.assign({}, it, { poke: true })))
      );
    } else {
      const normalRaw = (S.days[store.todayStr()] || []);
      const p = S.pokeOfDay[store.todayStr()];
      all = normalRaw.map((it) => store.cardVM(S, it));
      if (p) all.push(store.cardVM(S, Object.assign({}, p, { poke: true })));
    }

    const filtered = tags.filterByTag(all, this.data.activeFilter);
    const briefRaw = dailyBrief.build(filtered, S.interests || []);
    const brief = briefRaw.map((b, i) => Object.assign({}, b, { enterClass: firefly.briefEnterClass(i) }));
    const briefIds = {};
    brief.forEach((b) => { briefIds[b.card.id] = true; });
    const wallItems = filtered.filter((c) => !briefIds[c.id]);
    const withEnter = firefly.withFireflyEnter(wallItems);
    const cols = masonry.toMasonry(withEnter);

    this.setData({
      refreshing: false,
      online,
      heroMeta: store.fmtDate() + ' · ' + statusText,
      hasItems: filtered.length > 0,
      brief: brief,
      leftCol: cols.left,
      rightCol: cols.right
    });
  },

  onFilter(e) {
    act.vibrate('light');
    const activeFilter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter });
    this.refresh();
  },

  onAct(e) { return act.handle(this, e); },
  onCardTap(e) { cardNav.onCardTap(e); },
  goAdd() { act.vibrate('light'); wx.navigateTo({ url: '/pages/add/add' }); },
  goRadar() { wx.navigateTo({ url: '/pages/radar/radar' }); }
});
