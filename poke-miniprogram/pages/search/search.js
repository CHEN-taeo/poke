const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const firefly = require('../../utils/firefly.js');
const masonry = require('../../utils/masonry.js');
const tagsUtil = require('../../utils/tags.js');
const explore = require('../../utils/explore.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const highlight = require('../../utils/highlight.js');
const act = require('../../utils/act.js');
const cardNav = require('../../utils/cardNav.js');

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    query: '',
    focused: false,
    loading: false,
    results: [],
    leftCol: [],
    rightCol: [],
    recentSearches: [],
    topTags: [],
    biasTags: []
  },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
    this.loadExploreHints();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    theme.applyPageTheme(this);
    this.loadExploreHints();
    try {
      const tag = wx.getStorageSync('poke.searchTag');
      if (tag) {
        wx.removeStorageSync('poke.searchTag');
        this.setData({ query: tag });
        this.runSearch(tag);
      }
    } catch (e) {}
  },

  loadExploreHints() {
    const S = store.load();
    const topTags = explore.topTagsFromStore(S, tagsUtil);
    const biasTags = store.recentBias(S);
    this.setData({
      recentSearches: explore.getRecentSearches(),
      topTags: topTags,
      biasTags: biasTags
    });
  },

  onQuery(e) {
    const query = e.detail.value;
    this.setData({ query });
    this.runSearch(query);
  },

  onFocus() { this.setData({ focused: true }); },
  onBlur() { this.setData({ focused: false }); },

  onHintTap(e) {
    const q = e.currentTarget.dataset.q;
    this.setData({ query: q });
    this.runSearch(q);
  },

  onTagHint(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.navigateTo({ url: '/pages/tag-album/tag-album?tag=' + encodeURIComponent(tag) });
  },

  async runSearch(query) {
    const q = (query || '').trim();
    if (!q) {
      this.setData({ results: [], leftCol: [], rightCol: [], loading: false });
      this.loadExploreHints();
      return;
    }
    explore.pushRecentSearch(q);
    this.setData({ loading: true });
    const S = store.load();
    const iq = store.interestQuery(S);
    let all = [];
    const feed = await api.feed(S.uid, iq);
    if (Array.isArray(feed)) {
      store.cacheItems(S, feed);
      store.save(S);
      all = feed.map(store.serverCardVM);
    } else {
      all = store.allCachedItems(S).map((it) => store.serverCardVM(it));
    }
    const parsed = explore.parseNaturalQuery(q);
    const lower = q.toLowerCase();
    let matched = all;
    if (parsed.type !== 'text') {
      matched = explore.filterByNatural(all, parsed);
    } else {
      matched = all.filter((it) => {
        const hay = [it.title, it.summary, it.cat, it.aiTopic, (it.tags || []).join(' ')].join(' ').toLowerCase();
        return hay.indexOf(lower) >= 0 || tagsUtil.filterByTag([it], q).length > 0;
      });
    }
    matched = matched.map((it) => Object.assign({}, it, { titleNodes: highlight.titleNodes(it.title, q) }));
    const withEnter = firefly.withFireflyEnter(matched);
    const cols = masonry.toMasonry(withEnter);
    this.setData({
      loading: false,
      results: matched,
      leftCol: cols.left,
      rightCol: cols.right,
      recentSearches: explore.getRecentSearches()
    });
  },

  onCardTap(e) { cardNav.onCardTap(e); }
});
