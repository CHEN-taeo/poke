// 模块视图：对已结构化 items 做「过滤 + 排序 + engagement 富化」。
const store = require('./store');

const notNoise = it => it.cat !== '噪音';
const byTs = (a, b) => b.ts - a.ts;
const enrichAll = (arr, uid) => arr.map(it => store.enrich(it, uid));

function feed(uid) {
  return enrichAll(store.items().filter(it => ['活动', '通知', '机会'].includes(it.cat)).sort(byTs), uid);
}
function buddy(uid) {
  return enrichAll(store.items().filter(it => it.cat === '搭子').sort(byTs), uid);
}
function radar(uid) {
  return enrichAll(store.items()
    .filter(it => it.cat === '机会' || it.deadline)
    .sort((a, b) => (b.deadline ? 1 : 0) - (a.deadline ? 1 : 0) || byTs(a, b)), uid);
}
function poke(uid) {
  const all = store.items().filter(notNoise);
  if (!all.length) return [];
  const count = {};
  all.forEach(it => { count[it.cat] = (count[it.cat] || 0) + 1; });
  const rarest = Object.keys(count).sort((a, b) => count[a] - count[b])[0];
  const item = all.filter(it => it.cat === rarest).sort(byTs)[0];
  return item ? [store.enrich(Object.assign({}, item, { poke: true, pokeReason: '这是你信息流里最少见的「' + rarest + '」类，跨出茧房看看' }), uid)] : [];
}

// 我参与过的（想去/找搭子/去过）
function mine(uid) {
  if (!uid) return [];
  const ids = new Set(store.myItemIds(uid));
  return enrichAll(store.items().filter(it => ids.has(it.id)).sort(byTs), uid);
}

function stats() {
  const items = store.items();
  const noNoise = items.filter(notNoise).length;
  const byCat = {};
  items.forEach(it => { byCat[it.cat] = (byCat[it.cat] || 0) + 1; });
  return {
    raw: store.raw().length,
    items: items.length,
    signal: noNoise,
    noise: items.length - noNoise,
    signalRate: items.length ? Math.round(noNoise / items.length * 100) : 0,
    byCat
  };
}

module.exports = { feed, buddy, radar, poke, mine, stats };
