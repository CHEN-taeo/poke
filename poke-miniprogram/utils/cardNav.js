const act = require('./act.js');
const store = require('./store.js');

function normId(id) {
  return String(id || '').trim();
}

function pickCardFromPage(page, id) {
  const d = page && page.data;
  if (!d) return null;
  const nid = normId(id);
  for (const b of (d.brief || [])) {
    if (b.card && normId(b.card.id) === nid) return b.card;
  }
  const lists = [d.leftCol, d.rightCol, d.results, d.items, d.cards];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (c && normId(c.id) === nid) return c;
    }
  }
  return null;
}

function warmCache(id, page) {
  const nid = normId(id);
  if (!nid) return;
  const S = store.load();
  if (store.allItemsById(S, nid)) return;
  const vm = pickCardFromPage(page, nid);
  if (!vm) return;
  const raw = {
    id: nid,
    cat: vm.cat,
    title: vm.title,
    summary: vm.summary,
    time: vm.time,
    place: vm.place,
    deadline: vm.deadline,
    price: vm.price,
    tags: vm.tags || [],
    poke: !!vm.poke,
    pokeReason: vm.pokeReason || '',
    url: vm.url || '',
    room: vm.room || '',
    rawText: vm.rawText || vm.summary || '',
    fullBody: vm.fullBody || vm.rawText || vm.summary || '',
    coverType: vm.coverType,
    engine: vm.engine || '',
    gapReasons: vm.gapReasons || [],
    gapScore: vm.gapScore || 0,
    eventType: vm.eventType || '',
    aiTopic: vm.aiTopic || '',
    lane: vm.lane || '',
    platform: vm.platform || '',
    source: vm.source || ''
  };
  store.cacheItems(S, [raw]);
  store.save(S);
}

function open(id) {
  const nid = normId(id);
  if (!nid) {
    wx.showToast({ title: '无法打开这条卡片', icon: 'none' });
    return;
  }
  act.vibrate('light');
  wx.navigateTo({
    url: '/pages/detail/detail?id=' + encodeURIComponent(nid),
    fail: function(err) {
      const msg = (err && err.errMsg) || '跳转失败';
      wx.showToast({ title: msg.indexOf('limit') >= 0 ? '页面层数已满，请返回再试' : '打不开详情', icon: 'none' });
    }
  });
}

function onCardTap(e) {
  const ds = e && e.currentTarget && e.currentTarget.dataset;
  const id = normId(ds && ds.id);
  if (!id) return;
  const page = getCurrentPages().slice(-1)[0];
  warmCache(id, page);
  open(id);
}

module.exports = { open, onCardTap, warmCache };
