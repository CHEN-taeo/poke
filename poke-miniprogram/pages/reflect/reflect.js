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
    let source;
    if (online) {
      store.cacheItems(S, data); store.save(S);
      source = data.filter(it => it.mine && it.mine.attended);
    } else {
      const ids = Object.keys(S.eng).filter(id => S.eng[id].attended);
      source = ids.map(id => store.allItemsById(S, id)).filter(Boolean);
    }
    const items = source.map(it => {
      const r = S.reflect[it.id] || { text: '' };
      return { id: it.id, cat: it.cat, title: it.title, q: store.cogQ(it.id), text: r.text || '', saved: !!(r.text) };
    });
    this.setData({ online, items });
  },

  onInput(e) {
    const id = e.currentTarget.dataset.id;
    const val = e.detail.value;
    const S = store.load();
    S.reflect[id] = { text: val, ts: Date.now() };
    store.save(S);
    const items = this.data.items.map(it => it.id === id ? Object.assign({}, it, { text: val, saved: !!val }) : it);
    this.setData({ items });
  }
});
