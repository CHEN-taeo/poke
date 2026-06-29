const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const motion = require('../../utils/motion.js');
const cardNav = require('../../utils/cardNav.js');
const FILTERS = ['全部', '讲座', '竞赛', '展览', '峰会', '活动', '机会'];

Page({
  data: {
    heroData: {
      title: '机会',
      subtitle: '讲座、竞赛、展览 — 按信息差排序',
      meta: '连接中…',
      metaOnline: false
    },
    items: [], gapItems: [], online: false,
    filters: FILTERS, filterIndex: 0
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.refresh();
  },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  onFilter(e) {
    this.setData({ filterIndex: Number(e.detail.value) }, () => this.refresh());
  },

  async refresh() {
    const S = store.load();
    const iq = store.interestQuery(S);
    const eventType = FILTERS[this.data.filterIndex];
    const extra = Object.assign({}, iq);
    if (eventType !== '全部') extra.eventType = eventType;

    const results = await Promise.all([
      api.radar(S.uid, extra),
      api.gap(S.uid, iq)
    ]);
    const radar = results[0];
    const gap = results[1];
    const online = Array.isArray(radar);
    if (online) {
      store.cacheItems(S, radar);
      store.cacheItems(S, gap);
      store.save(S);
      this.setData({
        online,
        heroData: {
          title: '机会',
          subtitle: '讲座、竞赛、展览 — 按信息差排序',
          meta: online ? '已连接' : '离线',
          metaOnline: online
        },
        items: motion.withEnter(radar.map(store.serverCardVM)),
        gapItems: motion.withEnter((gap || []).slice(0, 3).map(store.serverCardVM))
      });
    } else {
      this.setData({
        online: false,
        heroData: {
          title: '机会',
          subtitle: '讲座、竞赛、展览 — 按信息差排序',
          meta: '离线',
          metaOnline: false
        },
        items: [], gapItems: []
      });
    }
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); },
  onCardTap(e) { cardNav.onCardTap(e); }
});
