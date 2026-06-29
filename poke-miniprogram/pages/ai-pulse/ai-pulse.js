const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const motion = require('../../utils/motion.js');
const cardNav = require('../../utils/cardNav.js');
const FILTERS = ['全部', '妙招', '工作流', '模型', '大家在用', '开源', '播客'];

Page({
  data: {
    heroData: {
      title: 'AI脉动',
      subtitle: 'AI 妙招与工作流，你没刷到但值得知道的',
      meta: '连接中…',
      metaOnline: false
    },
    items: [], online: false,
    filters: FILTERS, filterIndex: 0,
    digest: null, digestOpen: true, polling: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.refresh();
  },
  onPullDownRefresh() { this.refresh().then(() => wx.stopPullDownRefresh()); },

  onFilter(e) {
    this.setData({ filterIndex: Number(e.detail.value) }, () => this.refresh());
  },

  toggleDigest() { this.setData({ digestOpen: !this.data.digestOpen }); },

  async pollAi() {
    if (this.data.polling) return;
    this.setData({ polling: true });
    wx.showLoading({ title: '拉取中' });
    await api.pollAi();
    wx.hideLoading();
    this.setData({ polling: false });
    this.refresh();
    wx.showToast({ title: '已更新', icon: 'none' });
  },

  async refresh() {
    const S = store.load();
    const extra = Object.assign({}, store.interestQuery(S), store.aiInterestQuery(S));
    const aiTopic = FILTERS[this.data.filterIndex];
    if (aiTopic !== '全部') extra.aiTopic = aiTopic;

    const results = await Promise.all([
      api.aiPulse(S.uid, extra),
      api.aiDigest()
    ]);
    const pulse = results[0];
    const digest = results[1];
    const online = Array.isArray(pulse);

    if (online) {
      store.cacheItems(S, pulse);
      store.save(S);
      this.setData({
        online,
        heroData: {
          title: 'AI脉动',
          subtitle: 'AI 妙招与工作流，你没刷到但值得知道的',
          meta: online ? '已连接' : '离线',
          metaOnline: online
        },
        items: motion.withEnter(pulse.map(store.serverCardVM)),
        digest: digest || null
      });
    } else {
      const samples = store.aiPulseSamples();
      this.setData({
        online: false,
        heroData: {
          title: 'AI脉动',
          subtitle: 'AI 妙招与工作流，你没刷到但值得知道的',
          meta: '离线',
          metaOnline: false
        },
        items: motion.withEnter(samples.map(store.serverCardVM)),
        digest: store.aiDigestSample()
      });
    }
  },

  onAct(e) { return require('../../utils/act.js').handle(this, e); },
  onCardTap(e) { cardNav.onCardTap(e); },

  onCopyLink(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '链接已复制', icon: 'none' }) });
  }
});
