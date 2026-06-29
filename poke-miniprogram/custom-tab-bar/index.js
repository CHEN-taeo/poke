Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/today/today', text: '首页', icon: '首', type: 'tab' },
      { pagePath: '/pages/tags/tags', text: '标签', icon: '签', type: 'tab' },
      { pagePath: '/pages/add/add', text: '', icon: '＋', type: 'add' },
      { pagePath: '/pages/search/search', text: '搜索', icon: '搜', type: 'tab' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '我', type: 'tab' }
    ]
  },
  methods: {
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index);
      const item = this.data.list[idx];
      if (item.type === 'add') {
        wx.navigateTo({ url: item.pagePath });
        return;
      }
      wx.switchTab({ url: item.pagePath });
      this.setData({ selected: idx });
    }
  }
});
