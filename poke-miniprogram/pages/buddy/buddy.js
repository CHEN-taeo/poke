const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: { items: [], online: false },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.refresh();
  },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    const data = await api.buddy(S.uid, store.interestQuery(S));
    const online = Array.isArray(data);
    if (online) { store.cacheItems(S, data); store.save(S); }
    this.setData({ online, items: online ? data.map(store.serverCardVM) : [] });
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); }
});
