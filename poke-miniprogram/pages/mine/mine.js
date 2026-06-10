const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: { items: [], online: false },

  onShow() { this.refresh(); },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  async refresh() {
    const S = store.load();
    const data = await api.me(S.uid);
    const online = Array.isArray(data);
    if (online) {
      store.cacheItems(S, data); store.save(S);
      this.setData({ online, items: data.map(store.serverCardVM) });
    } else {
      const ids = Object.keys(S.eng).filter(id => S.eng[id].go || S.eng[id].buddy);
      const items = ids.map(id => store.allItemsById(S, id)).filter(Boolean).map(it => store.cardVM(S, it));
      this.setData({ online, items });
    }
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); }
});
