const KEY = 'poke.v1';
const detailFallback = require('./detailFallback.js');
const categoryColor = require('./categoryColor.js');
const brand = require('./brand.js');

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
    { id: 'a1', cat: '活动', poke: false, coverType: 'lecture',
      title: '机械工程学院 · 智能制造前沿讲座',
      summary: '上海交大教授分享数字孪生在产线上的落地案例，含现场 Q&A 与参观环节。适合机械、自动化相关专业，可写进简历的谈资。',
      rawText: '【讲座通知】机械工程学院邀请上海交大李教授来院分享「智能制造与数字孪生」前沿进展。\n\n时间：今天 18:30\n地点：三号楼 报告厅\n对象：全院本科生、研究生\n\n内容概要：\n1. 数字孪生在汽车产线的实际部署经验\n2. 工业互联网数据采集与仿真闭环\n3. 学生如何进入智能制造方向实习\n\n报名方式：现场签到，无需提前报名。建议提前 15 分钟到场占座，座位有限。',
      fullBody: '【讲座通知】机械工程学院邀请上海交大李教授来院分享「智能制造与数字孪生」前沿进展。\n\n时间：今天 18:30\n地点：三号楼 报告厅\n对象：全院本科生、研究生\n\n内容概要：\n1. 数字孪生在汽车产线的实际部署经验\n2. 工业互联网数据采集与仿真闭环\n3. 学生如何进入智能制造方向实习\n\n报名方式：现场签到，无需提前报名。建议提前 15 分钟到场占座，座位有限。',
      time: '今天 18:30', place: '三号楼 报告厅', tags: ['专业相关', '可写简历'],
      url: 'https://example.com/lecture' },
    { id: 'a2', cat: '机会', poke: false, coverType: 'competition',
      title: '某科技公司开放日报名',
      summary: '面向理工科学生的企业开放日：参观产线、技术分享、现场简历投递。含机械、软件、材料多个岗位方向。',
      rawText: '某科技公司 2026 校园开放日报名开启。\n\n时间：周六 14:00–17:00\n地点：线上报名后邮件通知集合点\n面向：大三及以上理工科\n\n流程：14:00 签到 → 14:30 产线参观 → 15:30 技术分享 → 16:30 一对一简历沟通\n\n请携带纸质简历 2 份，着正装或商务休闲。报名截止本周五 18:00。',
      fullBody: '某科技公司 2026 校园开放日报名开启。\n\n时间：周六 14:00–17:00\n地点：线上报名后邮件通知集合点\n面向：大三及以上理工科\n\n流程：14:00 签到 → 14:30 产线参观 → 15:30 技术分享 → 16:30 一对一简历沟通\n\n请携带纸质简历 2 份，着正装或商务休闲。报名截止本周五 18:00。',
      time: '周六 14:00', place: '线上报名', tags: ['实习', '机会'],
      url: 'https://example.com/openday' },
    { id: 'a3', cat: '通知', poke: false, coverType: 'notice',
      title: '国家奖学金申请 · 截止倒计时 3 天',
      summary: '从群通知里提炼的硬信息：你符合 GPA 门槛，材料还差一份个人陈述。教务办周四 17:00 截止，别错过。',
      rawText: '国家奖学金申请提醒：\n\n申请截止：本周四 17:00\n提交地点：学院教务办（二楼 208）或教务系统上传扫描件\n\n材料清单：\n① 申请表（教务系统下载）\n② 成绩单\n③ 个人陈述（800–1000 字，突出科研/竞赛/社会实践）\n④ 获奖证明复印件\n\n你当前 GPA 符合门槛，个人陈述尚未提交。如有疑问联系辅导员王老师。',
      fullBody: '国家奖学金申请提醒：\n\n申请截止：本周四 17:00\n提交地点：学院教务办（二楼 208）或教务系统上传扫描件\n\n材料清单：\n① 申请表（教务系统下载）\n② 成绩单\n③ 个人陈述（800–1000 字，突出科研/竞赛/社会实践）\n④ 获奖证明复印件\n\n你当前 GPA 符合门槛，个人陈述尚未提交。如有疑问联系辅导员王老师。',
      time: '截止 周四 17:00', place: '学院教务办 / 线上提交', tags: ['钱', '别错过'] }
  ];
  const pokeOfDay = {};
  pokeOfDay[t] = { id: 'p1', cat: brand.MODULE_POKE, poke: true, coverType: 'exhibition',
    title: '隔壁服装学院的「面料创新工坊」开放旁听',
    summary: '机械 × 材料 × 设计的交叉地带：面料结构、可穿戴传感、快速打样。跨出专业茧房，常常是灵感的来源。',
    rawText: '服装学院面料创新工坊本周开放旁听（破壳推荐）。\n\n时间：明天 14:00\n地点：纺织学院 创新中心 B 区\n\n你将看到：智能纺织样品、3D 针织演示、可穿戴传感器打样流程。无需专业背景，欢迎跨学科同学。\n\n名额 20 人，先到先得。现场可登记后续工坊体验。',
    fullBody: '服装学院面料创新工坊本周开放旁听（破壳推荐）。\n\n时间：明天 14:00\n地点：纺织学院 创新中心 B 区\n\n你将看到：智能纺织样品、3D 针织演示、可穿戴传感器打样流程。无需专业背景，欢迎跨学科同学。\n\n名额 20 人，先到先得。现场可登记后续工坊体验。',
    time: '明天 14:00', place: '纺织学院 创新中心', tags: ['跨学科', '打破茧房'] };
  return {
    meName: '我',
    days: days,
    pokeOfDay: pokeOfDay,
    eng: {},
    saved: {},
    notes: {},
    reminders: {},
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
  else if (r.days[t][0] && !r.days[t][0].fullBody) r.days[t] = clone(seed().days[t]);
  if (!r.pokeOfDay) r.pokeOfDay = {};
  if (!r.pokeOfDay[t]) r.pokeOfDay[t] = clone(seed().pokeOfDay[t]);
  else if (r.pokeOfDay[t] && !r.pokeOfDay[t].fullBody) r.pokeOfDay[t] = clone(seed().pokeOfDay[t]);
  r.eng = r.eng || {};
  r.others = r.others || {};
  r.othersBuddy = r.othersBuddy || {};
  r.buddyNames = r.buddyNames || {};
  r.reflect = r.reflect || {};
  r.log = r.log || { goClicks: 0, buddyClicks: 0 };
  r.meName = r.meName || '我';
  r.uid = r.uid || genUid();
  r.cache = r.cache || {};
  r.saved = r.saved || {};
  r.notes = r.notes || {};
  r.reminders = r.reminders || {};
  r.interests = r.interests || [];
  r.aiInterests = r.aiInterests || [];
  return r;
}

function interestQuery(S) {
  return (S.interests && S.interests.length) ? { interests: S.interests.join(',') } : {};
}

function aiInterestQuery(S) {
  return (S.aiInterests && S.aiInterests.length) ? { aiInterests: S.aiInterests.join(',') } : {};
}

function aiPulseSamples() {
  return [
    { id: 'ai_s1', cat: 'AI脉动', lane: 'ai', aiTopic: '妙招', platform: 'rss',
      title: 'Cursor Rules：用 .mdc 固化你的代码风格',
      summary: '社区热议：把团队规范写进 rules，每次对话自动遵守，减少反复纠正。',
      tags: ['妙招', 'Cursor'], pulseScore: 72,
      pulseReasons: [{ label: '⚡ 24h 新发' }, { label: '✨ 匹配关注：Cursor/IDE' }],
      url: 'https://cursor.com', time: '', place: '', deadline: '' },
    { id: 'ai_s2', cat: 'AI脉动', lane: 'ai', aiTopic: '开源', platform: 'github',
      title: 'MCP 服务器合集：一键接工具到 Claude',
      summary: 'GitHub 本周 Star 上涨：把文件系统、数据库、浏览器接到 Agent 的标准协议实践。',
      tags: ['开源', 'MCP', 'Agent'], pulseScore: 68, stars: 1200,
      pulseReasons: [{ label: '⭐ 热门开源' }, { label: '🌐 GITHUB' }],
      url: 'https://github.com', time: '', place: '', deadline: '' },
    { id: 'ai_s3', cat: 'AI脉动', lane: 'ai', aiTopic: '大家在用', platform: 'hn',
      title: 'Show HN：用 AI Agent 自动写周报',
      summary: 'HN 热议：从 Git commit + 日历生成周报草稿，人在回路只改 20%。',
      tags: ['大家在用', '工作流'], pulseScore: 55,
      pulseReasons: [{ label: '📅 本周新发' }],
      url: 'https://news.ycombinator.com', time: '', place: '', deadline: '' }
  ];
}

function aiDigestSample() {
  return {
    title: '本周 AI 脉动（离线示例）',
    summary: '• Cursor Rules 固化代码风格（妙招）\n• MCP 服务器合集热度上升（开源）\n• AI Agent 自动写周报引热议（大家在用）',
    highlights: []
  };
}

const COVER_MAP = {
  lecture: '/assets/cover-lecture.svg',
  competition: '/assets/cover-competition.svg',
  exhibition: '/assets/cover-exhibition.svg',
  notice: '/assets/cover-notice.svg',
  ai: '/assets/cover-ai.svg',
  default: '/assets/cover-default.svg'
};

function coverSrc(it) {
  if (it && it.imageUrl) return it.imageUrl;
  const type = (it && it.coverType) || 'default';
  return COVER_MAP[type] || COVER_MAP.default;
}

function coverIsRemote(src) {
  return src && /^https?:\/\//i.test(src);
}

function inferCoverType(it) {
  const key = categoryColor.categoryKey(it);
  if (key === 'poke') return 'exhibition';
  if (key === 'ai') return 'ai';
  if (key === 'lecture') return 'lecture';
  if (key === 'competition') return 'competition';
  if (key === 'exhibition') return 'exhibition';
  if (key === 'notice') return 'notice';
  return 'default';
}

function withColorVM(vm, it) {
  const c = categoryColor.colorForItem(it);
  vm.catColor = c.fg;
  vm.catBg = c.bg;
  vm.chipStyle = 'color:' + c.fg + ';background:' + c.bg;
  return vm;
}

// 把「后端富化过的 item」映射成卡片视图
function cardSummary(it) {
  if (it.summary && it.summary.length >= 40) return it.summary;
  const body = (it.fullBody || it.rawText || '').trim();
  if (body.length > 40) return body.length > 200 ? body.slice(0, 200) + '…' : body;
  return it.summary || body || it.title || '';
}

function serverCardVM(it) {
  const gapReasons = (it.gapReasons || it.pulseReasons || []).map(r => (typeof r === 'string' ? r : r.label)).filter(Boolean);
  const coverType = it.coverType || inferCoverType(it);
  const thumb = coverSrc(Object.assign({}, it, { coverType: coverType }));
  const vm = {
    id: it.id, cat: it.cat, eventType: it.eventType || it.aiTopic || '', poke: !!it.poke,
    title: it.title, summary: cardSummary(it),
    rawText: it.rawText || '', fullBody: it.fullBody || '',
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    insiderNote: it.insiderNote || '', gapScore: it.gapScore || it.pulseScore || 0,
    gapReasons: gapReasons.slice(0, 2), deadlineTier: it.deadlineTier || '',
    platform: it.platform || '', url: it.url || '', aiTopic: it.aiTopic || '',
    room: it.room || '', lane: it.lane || '',
    coverType: coverType,
    imageUrl: it.imageUrl || '',
    thumbSrc: thumb,
    thumbRemote: coverIsRemote(thumb),
    daysToDeadline: it.daysToDeadline,
    pokeChip: it.poke ? brand.MODULE_POKE : ''
  };
  return withColorVM(vm, it);
}

function fmtTs(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function detailVM(it, S) {
  if (!it) return null;
  const gapReasons = (it.gapReasons || it.pulseReasons || []).map(r => (typeof r === 'string' ? r : r.label)).filter(Boolean);
  const base = serverCardVM(it);
  const detail = detailFallback.ensureDetail(it);
  const highlights = (detail.highlights && detail.highlights.length)
    ? detail.highlights
    : [it.time, it.place, it.deadline, it.price].filter(Boolean);
  const saved = S && S.saved && S.saved[it.id];
  const fullBody = (detail.fullBody || it.fullBody || it.rawText || '').trim();
  const keyFacts = [
    it.time ? { k: '时间', v: it.time } : null,
    it.place ? { k: '地点', v: it.place } : null,
    it.deadline ? { k: '截止', v: it.deadline } : null,
    it.price ? { k: '费用', v: it.price } : null,
    it.room ? { k: '来源', v: it.room } : null,
    (it.tags && it.tags.length) ? { k: '标签', v: it.tags.join(' · ') } : null
  ].filter(Boolean);
  const whoFor = (detail.whoFor && detail.whoFor.length) ? detail.whoFor : ['对这条信息感兴趣的你'];
  const actions = (detail.actions && detail.actions.length) ? detail.actions : ['阅读下方完整正文，再决定是否行动'];
  return Object.assign({}, base, {
    rawText: it.rawText || it.summary || '',
    fullBody: fullBody,
    displayBody: fullBody || it.rawText || detail.lede || it.summary || '',
    keyFacts: keyFacts,
    tagList: (it.tags || []).slice(0, 8),
    sourceMp: it.source === 'mp' || it.platform === '公众号' || (it.sender === '公众号'),
    gapReasonsFull: gapReasons,
    stars: it.stars || 0,
    engine: it.engine || '',
    createdAt: it.ts ? fmtTs(it.ts) : '',
    confidence: typeof it.confidence === 'number' ? Math.round(it.confidence * 100) : 0,
    detailLede: detail.lede || it.summary || it.title || '',
    whoFor: whoFor,
    actions: actions,
    highlights: highlights,
    caveats: detail.caveats || [],
    coverSrc: coverSrc(Object.assign({}, it, { coverType: base.coverType })),
    coverRemote: coverIsRemote(coverSrc(it)),
    daysToDeadline: it.daysToDeadline,
    deadlineUrgent: typeof it.daysToDeadline === 'number' && it.daysToDeadline >= 0 && it.daysToDeadline <= 3,
    saved: !!saved,
    pokeChip: it.poke ? brand.pokeChipLabel() : '',
    userNote: getNote(S, it.id),
    hasReminder: hasReminder(S, it.id)
  });
}

// 缓存后端 items，让其它页面能按 id 还原
function cacheItems(S, items) {
  S.cache = S.cache || {};
  (items || []).forEach(it => { if (it && it.id) S.cache[String(it.id)] = it; });
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
  const nid = String(id || '');
  if (!nid) return null;
  if (S.cache && S.cache[nid]) return S.cache[nid];
  for (const d in S.days) {
    const f = (S.days[d] || []).find(x => String(x.id) === nid);
    if (f) return f;
  }
  for (const d in S.pokeOfDay) {
    if (S.pokeOfDay[d] && String(S.pokeOfDay[d].id) === nid) return S.pokeOfDay[d];
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
  const coverType = it.coverType || inferCoverType(it);
  const thumb = coverSrc(Object.assign({}, it, { coverType: coverType }));
  const vm = {
    id: it.id, cat: it.cat, poke: !!it.poke, title: it.title, summary: cardSummary(it),
    rawText: it.rawText || '', fullBody: it.fullBody || '',
    time: it.time, place: it.place, deadline: it.deadline || '', price: it.price || '',
    tags: it.tags || [], pokeReason: it.pokeReason || '',
    gapReasons: [], insiderNote: '',
    url: it.url || '', room: it.room || '',
    coverType: coverType,
    thumbSrc: thumb,
    thumbRemote: coverIsRemote(thumb),
    pokeChip: it.poke ? brand.MODULE_POKE : ''
  };
  return withColorVM(vm, it);
}

function isSaved(S, id) {
  return !!(S.saved && S.saved[id]);
}

function toggleSaved(S, id) {
  S.saved = S.saved || {};
  if (S.saved[id]) delete S.saved[id];
  else S.saved[id] = { ts: Date.now() };
  return !!S.saved[id];
}

function savedItems(S) {
  const ids = Object.keys(S.saved || {});
  return ids.map((id) => allItemsById(S, id)).filter(Boolean);
}

function savedCount(S) {
  return Object.keys(S.saved || {}).length;
}

function getNote(S, id) {
  return (S.notes && S.notes[id] && S.notes[id].text) || '';
}

function setNote(S, id, text) {
  S.notes = S.notes || {};
  if (!text || !String(text).trim()) {
    delete S.notes[id];
  } else {
    S.notes[id] = { text: String(text).trim(), ts: Date.now() };
  }
}

function hasReminder(S, id) {
  return !!(S.reminders && S.reminders[id]);
}

function toggleReminder(S, id, item) {
  S.reminders = S.reminders || {};
  if (S.reminders[id]) {
    delete S.reminders[id];
    return false;
  }
  const when = require('./reminder.js').parseWhen(item || {});
  const label = (item && (item.deadline || item.time || item.title)) || '流萤提醒';
  S.reminders[id] = {
    label: label,
    whenTs: when ? when.getTime() : Date.now() + 86400000,
    ts: Date.now()
  };
  return true;
}

function listReminders(S) {
  const ids = Object.keys(S.reminders || {});
  return ids.map((id) => {
    const r = S.reminders[id];
    const it = allItemsById(S, id);
    const vm = it ? serverCardVM(it) : null;
    return {
      id: id,
      label: r.label,
      whenTs: r.whenTs || r.ts || Date.now(),
      whenText: r.whenTs ? fmtTs(r.whenTs) : (r.label || ''),
      title: vm ? vm.title : (r.label || id),
      cat: vm ? vm.cat : ''
    };
  }).sort((a, b) => (a.whenTs || 0) - (b.whenTs || 0));
}

function listSavedShelf(S, limit) {
  const saved = S.saved || {};
  const ids = Object.keys(saved).sort((a, b) => (saved[b].ts || 0) - (saved[a].ts || 0));
  const n = limit || 8;
  return ids.slice(0, n).map((id) => {
    const it = allItemsById(S, id);
    const note = getNote(S, id);
    const vm = it ? serverCardVM(it) : { id: id, title: '已失效的收藏', summary: '', cat: '其它' };
    return {
      id: id,
      title: vm.title,
      summary: vm.summary,
      cat: vm.cat,
      note: note,
      savedTs: saved[id].ts
    };
  });
}

function genLocalId() {
  return 'local_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function ingestLocalCapture(S, opts) {
  const text = (opts && opts.text || '').trim();
  if (!text) return null;
  const tags = (opts && opts.tags) || [];
  const inputType = (opts && opts.inputType) || 'text';
  const id = genLocalId();
  const firstLine = text.split('\n')[0].slice(0, 48);
  const isLink = /^https?:\/\//i.test(text);
  const isSpark = inputType === 'spark';
  const cat = isSpark ? '灵感' : (isLink ? '链接' : '活动');
  const item = {
    id: id,
    cat: cat,
    poke: tags.indexOf('破壳') >= 0,
    coverType: isSpark ? 'ai' : (isLink ? 'ai' : 'notice'),
    title: firstLine || '随手收录',
    summary: text.length > firstLine.length ? text.slice(firstLine.length).trim().slice(0, 280) : text.slice(0, 280),
    rawText: text,
    tags: tags.length ? tags.slice() : (isSpark ? ['灵感', '待读'] : ['待读']),
    time: '', place: '', deadline: '',
    url: isLink ? (text.match(/https?:\/\/\S+/i) || [])[0] || '' : '',
    ts: Date.now(),
    source: 'local'
  };
  const t = todayStr();
  if (!S.days[t]) S.days[t] = [];
  S.days[t].unshift(item);
  cacheItems(S, [item]);
  return item;
}

function infoDiet(S, items) {
  const counts = { activity: 0, chance: 0, ai: 0, poke: 0, other: 0 };
  (items || []).forEach((it) => {
    if (it.poke) counts.poke++;
    else if (it.lane === 'ai' || it.cat === 'AI脉动') counts.ai++;
    else if (it.cat === '机会') counts.chance++;
    else if (it.cat === '活动') counts.activity++;
    else counts.other++;
  });
  const total = Math.max(1, items.length);
  return [
    { key: 'activity', label: '活动', pct: Math.round(counts.activity / total * 100), n: counts.activity },
    { key: 'chance', label: '机会', pct: Math.round(counts.chance / total * 100), n: counts.chance },
    { key: 'ai', label: 'AI', pct: Math.round(counts.ai / total * 100), n: counts.ai },
    { key: 'poke', label: '圈外', pct: Math.round(counts.poke / total * 100), n: counts.poke }
  ].filter((x) => x.n > 0);
}

function recentBias(S) {
  const saved = S.saved || {};
  const ids = Object.keys(saved).sort((a, b) => (saved[b].ts || 0) - (saved[a].ts || 0)).slice(0, 8);
  const map = {};
  ids.forEach((id) => {
    const it = allItemsById(S, id);
    if (!it) return;
    const k = it.cat || it.aiTopic || '其它';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.keys(map).map((k) => ({ label: k, count: map[k] })).sort((a, b) => b.count - a.count).slice(0, 3);
}

function fmtDate() {
  const d = new Date();
  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + wk;
}

function allCachedItems(S) {
  const seen = {};
  const out = [];
  function push(it) {
    if (!it || !it.id || seen[it.id]) return;
    seen[it.id] = true;
    out.push(it);
  }
  Object.values(S.cache || {}).forEach(push);
  const t = todayStr();
  (S.days[t] || []).forEach(push);
  if (S.pokeOfDay && S.pokeOfDay[t]) push(S.pokeOfDay[t]);
  return out;
}

module.exports = {
  todayStr, clone, load, save, reset, eng, todayItems, allItemsById, allCachedItems,
  cogQ, cardVM, serverCardVM, detailVM, coverSrc, fmtDate, cacheItems, interestQuery, aiInterestQuery,
  aiPulseSamples, aiDigestSample, isSaved, toggleSaved, savedItems, savedCount, inferCoverType,
  getNote, setNote, hasReminder, toggleReminder, listReminders, listSavedShelf, ingestLocalCapture, infoDiet, recentBias
};
