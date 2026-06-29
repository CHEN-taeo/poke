// 模块视图：对已结构化 items 做「过滤 + 排序 + engagement + 信息差」富化。
const store = require('./store');
const { EVENT_TYPES } = require('./gap');
const { AI_TOPICS } = require('./pulse');

const notNoise = it => it.cat !== '噪音';
const byTs = (a, b) => b.ts - a.ts;

function parseInterests(q) {
  if (!q) return [];
  if (Array.isArray(q)) return q;
  return String(q).split(/[,，]/).map(s => s.trim()).filter(Boolean);
}

function pulseOptsFromQuery(query) {
  return {
    interests: parseInterests(query.interests),
    aiInterests: parseInterests(query.aiInterests)
  };
}

function gapOptsFromQuery(query) {
  return pulseOptsFromQuery(query);
}

function enrichAll(arr, uid, opts) {
  return arr.map(it => store.enrich(it, uid, opts));
}

function feed(uid, query) {
  const opts = gapOptsFromQuery(query || {});
  const limit = Math.min(Math.max(Number(query && query.limit) || 80, 1), 200);
  const arr = store.items().filter(it => {
    if (!notNoise(it)) return false;
    if (it.source === 'mp' || it.platform === '公众号') return true;
    return ['活动', '通知', '机会', '资源'].includes(it.cat);
  }).sort(byTs);
  const enriched = enrichAll(arr, uid, opts);
  enriched.sort((a, b) => (b.gapScore || 0) - (a.gapScore || 0) || byTs(a, b));
  return enriched.slice(0, limit);
}

function buddy(uid, query) {
  return enrichAll(store.items().filter(it => it.cat === '搭子').sort(byTs), uid, gapOptsFromQuery(query));
}

function radar(uid, query) {
  const q = query || {};
  const opts = gapOptsFromQuery(q);
  let arr = store.items().filter(it => it.cat === '机会' || it.deadline || ['讲座', '竞赛', '展览', '峰会', '活动'].includes(it.eventType));
  if (q.eventType && q.eventType !== '全部') {
    arr = arr.filter(it => it.eventType === q.eventType);
  }
  const enriched = enrichAll(arr, uid, opts);
  enriched.sort((a, b) => (b.gapScore || 0) - (a.gapScore || 0) || (b.deadline ? 1 : 0) - (a.deadline ? 1 : 0) || byTs(a, b));
  return enriched;
}

function gap(uid, query) {
  const opts = gapOptsFromQuery(query || {});
  const arr = store.items().filter(notNoise);
  const enriched = enrichAll(arr, uid, opts);
  enriched.sort((a, b) => (b.gapScore || 0) - (a.gapScore || 0) || byTs(a, b));
  return enriched.slice(0, 10);
}

function poke(uid, query) {
  const opts = gapOptsFromQuery(query || {});
  const all = store.items().filter(notNoise);
  if (!all.length) return [];
  const count = {};
  all.forEach(it => { count[it.cat] = (count[it.cat] || 0) + 1; });
  const rarest = Object.keys(count).sort((a, b) => count[a] - count[b])[0];
  const item = all.filter(it => it.cat === rarest).sort(byTs)[0];
  return item ? [store.enrich(Object.assign({}, item, {
    poke: true,
    pokeReason: '这是你信息流里最少见的「' + rarest + '」类，跨出茧房看看'
  }), uid, opts)] : [];
}

function mine(uid, query) {
  if (!uid) return [];
  const ids = new Set(store.myItemIds(uid));
  return enrichAll(store.items().filter(it => ids.has(it.id)).sort(byTs), uid, gapOptsFromQuery(query));
}

/** ISO week key YYYY-Www */
function isoWeekKey(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getFullYear() + '-W' + String(week).padStart(2, '0');
}

function parseWeekParam(weekStr) {
  if (!weekStr || !/^(\d{4})-W(\d{2})$/.test(weekStr)) return isoWeekKey(new Date());
  return weekStr;
}

function calendar(uid, query) {
  const week = parseWeekParam((query || {}).week);
  const [y, w] = week.split('-W').map(Number);
  const jan4 = new Date(y, 0, 4);
  const day = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - day + 1 + (w - 1) * 7);
  const days = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days[key] = [];
  }
  const opts = gapOptsFromQuery(query || {});
  const start = monday.getTime();
  const end = start + 7 * 86400000;
  store.items().filter(it => ['活动', '机会', '通知'].includes(it.cat)).forEach(it => {
    const ts = it.ts || 0;
    if (ts >= start && ts < end) {
      const d = new Date(ts);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (days[key]) days[key].push(store.enrich(it, uid, opts));
    }
  });
  return { week, days, eventTypes: EVENT_TYPES };
}

function stats() {
  const items = store.items();
  const noNoise = items.filter(notNoise).length;
  const byCat = {};
  const byEventType = {};
  const byAiTopic = {};
  items.forEach(it => {
    byCat[it.cat] = (byCat[it.cat] || 0) + 1;
    if (it.eventType) byEventType[it.eventType] = (byEventType[it.eventType] || 0) + 1;
    if (it.aiTopic) byAiTopic[it.aiTopic] = (byAiTopic[it.aiTopic] || 0) + 1;
  });
  return {
    raw: store.raw().length,
    items: items.length,
    signal: noNoise,
    noise: items.length - noNoise,
    signalRate: items.length ? Math.round(noNoise / items.length * 100) : 0,
    byCat,
    byEventType,
    byAiTopic
  };
}

function aiPulse(uid, query) {
  const q = query || {};
  const opts = pulseOptsFromQuery(q);
  let arr = store.items().filter(it => it.lane === 'ai' || it.cat === 'AI脉动');
  if (q.aiTopic && q.aiTopic !== '全部') {
    arr = arr.filter(it => it.aiTopic === q.aiTopic);
  }
  if (q.platform && q.platform !== '全部') {
    arr = arr.filter(it => it.platform === q.platform);
  }
  const enriched = enrichAll(arr, uid, opts);
  enriched.sort((a, b) => (b.pulseScore || b.gapScore || 0) - (a.pulseScore || a.gapScore || 0) || byTs(a, b));
  return enriched;
}

module.exports = { feed, buddy, radar, poke, mine, gap, calendar, stats, aiPulse, EVENT_TYPES, AI_TOPICS };
