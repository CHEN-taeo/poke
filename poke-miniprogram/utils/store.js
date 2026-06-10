const KEY = 'poke.v1';

function pad(n) { return (n < 10 ? '0' : '') + n; }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function genUid() { return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function seed() {
  const t = todayStr();
  const days = {};
  days[t] = [
    { id: 'a1', cat: '活动', poke: false, title: '机械工程学院 · 智能制造前沿讲座',
      summary: 'AI 摘要：上海交大教授分享数字孪生在产线上的落地，含 Q&A。和你的专业高度相关，适合写进简历的谈资。',
      time: '今天 18:30', place: '三号楼 报告厅', tags: ['专业相关', '可写简历'] },
    { id: 'a2', cat: '搭子', poke: false, title: '周末青松大学城骑行，缺 2 人',
      summary: 'AI 摘要：从校门口到佘山往返约 30km，已有 3 人，节奏轻松。想出去走走、又不想一个人的话很合适。',
      time: '周六 09:00', place: '青松大学城门口集合', tags: ['运动', '认识新朋友'] },
    { id: 'a3', cat: '通知', poke: false, title: '国家奖学金申请 · 截止倒计时 3 天',
      summary: 'AI 摘要：从一堆群通知里挑出来的硬信息——你符合 GPA 门槛，材料还差一份个人陈述。别错过。',
      time: '截止 周四 17:00', place: '学院教务办 / 线上提交', tags: ['钱', '别错过'] }
  ];
  const pokeOfDay = {};
  pokeOfDay[t] = { id: 'p1', cat: '破壳', poke: true, title: '隔壁服装学院的「面料创新工坊」开放旁听',
    summary: 'AI 给你塞了条圈外的：机械 × 材料 × 设计的交叉地带，正在出新东西。跨出专业茧房，常常是灵感的来源。',
    time: '明天 14:00', place: '纺织学院 创新中心', tags: ['跨学科', '打破茧房'] };
  return {
    meName: '我',
    days: days,
    pokeOfDay: pokeOfDay,
    eng: {},
    others: { a1: 6, a2: 3, a3: 2, p1: 1 },
    othersBuddy: { a2: 3, a1: 1 },
    buddyNames: { a2: ['林·材料', '韬·机械', '小鹿·设计'], a1: ['阿哲·机械'] },
    reflect: {},
    log: { goClicks: 0, buddyClicks: 0 }
  };
}

function migrate(r) {
  const t = todayStr();
  if (!r.days) r.days = {};
  if (!r.days[t]) r.days[t] = clone(seed().days[t]);
  if (!r.pokeOfDay) r.pokeOfDay = {};
  if (!r.pokeOfDay[t]) r.pokeOfDay[t] = clone(seed().pokeOfDay[t]);
  r.eng = r.eng || {};
  r.others = r.others || {};
  r.othersBuddy = r.othersBuddy || {};
  r.buddyNames = r.buddyNames || {};
  r.reflect = r.reflect || {};
  r.log = r.log || { goClicks: 0, buddyClicks: 0 };
  r.meName = r.meName || '我';
  r.uid = r.uid || genUid(); // 本设备唯一 id，用于后端多人计数
  r.cache = r.cache || {}; // 后端拉来的 item 缓存（id -> item），供 我的/复盘 解析
  return r;
}

// 把「后端富化过的 item」(含 goN/bdN/mine/buddyNames) 映射成卡片视图
function serverCardVM(it) {
  const m = it.mine || { go: false, buddy: false, attended: false };
  return {
    id: it.id, cat: it.cat, poke: !!it.poke, title: it.title, summary: it.summary,
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    goN: it.goN || 0, bdN: it.bdN || 0,
    go: m.go, buddy: m.buddy, attended: m.attended,
    names: it.buddyNames || []
  };
}

// 缓存后端 items，让其它页面能按 id 还原
function cacheItems(S, items) {
  S.cache = S.cache || {};
  (items || []).forEach(it => { if (it && it.id) S.cache[it.id] = it; });
}

function load() {
  try {
    const r = wx.getStorageSync(KEY);
    if (r && r.days) return migrate(r);
  } catch (e) {}
  return seed();
}
function save(S) { wx.setStorageSync(KEY, S); }
function reset() { const s = seed(); save(s); return s; }

function eng(S, id) {
  if (!S.eng[id]) S.eng[id] = { go: false, buddy: false, attended: false };
  return S.eng[id];
}

function todayItems(S) {
  const arr = (S.days[todayStr()] || []).slice();
  const p = S.pokeOfDay[todayStr()];
  if (p) arr.push(p);
  return arr;
}
function allItemsById(S, id) {
  if (S.cache && S.cache[id]) return S.cache[id];
  for (const d in S.days) {
    const f = (S.days[d] || []).find(x => x.id === id);
    if (f) return f;
  }
  for (const d in S.pokeOfDay) {
    if (S.pokeOfDay[d] && S.pokeOfDay[d].id === id) return S.pokeOfDay[d];
  }
  return null;
}

const COG_QS = [
  '这件事最让你意外的一点是什么？用一句话说清楚。',
  '它和你已有的知识，能连起来的一个点是？',
  '如果要讲给一个不懂的朋友听，你会怎么概括？',
  '它有没有改变你原来的某个看法？哪一个？',
  '下一步，你会因为它做一个什么小行动？'
];
function cogQ(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % COG_QS.length;
  return COG_QS[h];
}

function cardVM(S, it) {
  const e = eng(S, it.id);
  const goN = (S.others[it.id] || 0) + (e.go ? 1 : 0);
  const bdN = (S.othersBuddy[it.id] || 0) + (e.buddy ? 1 : 0);
  const names = (S.buddyNames[it.id] || []).slice();
  if (e.buddy) names.push(S.meName + '（你）');
  return {
    id: it.id, cat: it.cat, poke: !!it.poke, title: it.title, summary: it.summary,
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    goN: goN, bdN: bdN, go: e.go, buddy: e.buddy, attended: e.attended, names: names
  };
}

function fmtDate() {
  const d = new Date();
  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + wk;
}

module.exports = {
  todayStr, clone, load, save, reset, eng, todayItems, allItemsById,
  cogQ, cardVM, serverCardVM, fmtDate, cacheItems
};
