const store = require('../../utils/store.js');
const shareCard = require('../../utils/shareCard.js');

Page({
  data: { card: null },
  onLoad(query) {
    const S = store.load();
    const it = (S.cache && S.cache[query.id]) || store.allItemsById(S, query.id);
    if (!it) {
      wx.showToast({ title: '找不到条目', icon: 'none' });
      return setTimeout(() => wx.navigateBack(), 800);
    }
    const card = (it.goN !== undefined || it.mine) ? store.serverCardVM(it) : store.cardVM(S, it);
    this.setData({ card });
  },
  onReady() {
    if (!this.data.card) return;
    const ctx = wx.createCanvasContext('shareCanvas', this);
    shareCard.drawShare(this.data.card, ctx, 375, 667);
    ctx.draw(false, () => {
      setTimeout(() => {
        shareCard.exportCanvas('shareCanvas', this).then(shareCard.saveAndShare).catch(() => {
          wx.showToast({ title: '生成失败', icon: 'none' });
        });
      }, 400);
    });
  }
});
