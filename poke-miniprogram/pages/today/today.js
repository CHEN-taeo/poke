const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: { dateLabel: '', normal: [], poke: [], online: false },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    const [feed, poke] = await Promise.all([api.feed(S.uid), api.poke(S.uid)]);
    const online = Array.isArray(feed);

    let normal, pokeArr;
    if (online) {
      store.cacheItems(S, feed);
      if (Array.isArray(poke)) store.cacheItems(S, poke);
      store.save(S);
      normal = feed.map(store.serverCardVM);
      pokeArr = (Array.isArray(poke) ? poke : []).map(it => store.serverCardVM(Object.assign({}, it, { poke: true })));
    } else {
      const normalRaw = (S.days[store.todayStr()] || []);
      const p = S.pokeOfDay[store.todayStr()];
      normal = normalRaw.map(it => store.cardVM(S, it));
      pokeArr = p ? [store.cardVM(S, Object.assign({}, p, { poke: true }))] : [];
    }

    this.setData({ dateLabel: store.fmtDate(), online, normal, poke: pokeArr });
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); },
  goOperator() { wx.navigateTo({ url: '/pages/operator/operator' }); },
  goForward() { wx.navigateTo({ url: '/pages/forward/forward' }); }
});
