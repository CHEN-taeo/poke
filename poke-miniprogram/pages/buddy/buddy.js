const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: { items: [], online: false },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    const data = await api.buddy(S.uid);
    const online = Array.isArray(data);
    if (online) { store.cacheItems(S, data); store.save(S); }
    this.setData({ online, items: online ? data.map(store.serverCardVM) : [] });
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); }
});
