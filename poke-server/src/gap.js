// 信息差打分：为什么这条值得现在看
const store = require('./store');
const { deadlineTier, EVENT_TYPES } = require('./lib/deadline');

const MS_DAY = 86400000;

/** 用户关注方向 → eventType 加权 */
const INTEREST_MAP = {
  竞赛: ['竞赛'],
  创业: ['峰会', '机会', '讲座'],
  展览: ['展览', '活动'],
  讲座: ['讲座', '峰会'],
  专业相关: ['讲座', '通知', '机会'],
  机会嗅探: ['机会', '竞赛', '讲座', '峰会']
};

function userEngagedTypes(uid) {
  if (!uid) return new Set();
  const types = new Set();
  for (const id of store.myItemIds(uid)) {
    const it = store.getItem(id);
    if (it && it.eventType) types.add(it.eventType);
  }
  return types;
}

function computeGap(it, uid, opts) {
  const reasons = [];
  let score = 0;
  const now = Date.now();
  const interests = (opts && opts.interests) || [];

  if (now - (it.ts || 0) < MS_DAY) {
    score += 25;
    reasons.push({ key: 'fresh', label: '⚡ 24h 新发', kind: 'time' });
  }

  const days = it.daysToDeadline;
  if (days !== null && days !== undefined && days >= 0 && days <= 7) {
    score += 20;
    reasons.push({ key: 'ddl', label: days === 0 ? '⏰ 今天截止' : '⏰ ' + days + '天内截止', kind: 'time' });
  }

  const c = store.counts(it.id);
  const heat = c.goN + c.bdN;
  if (heat >= 1) {
    score += Math.min(15, 5 + heat * 3);
    reasons.push({ key: 'peer', label: '🔥 ' + heat + ' 人想去/找搭子', kind: 'social' });
  }

  const engaged = userEngagedTypes(uid);
  if (it.eventType && !engaged.has(it.eventType) && ['讲座', '竞赛', '展览', '峰会'].includes(it.eventType)) {
    score += 20;
    reasons.push({ key: 'novel', label: '💡 你很少看「' + it.eventType + '」类', kind: 'bubble' });
  }

  if (it.insiderNote && it.insiderNote.trim()) {
    score += 25;
    reasons.push({ key: 'insider', label: '💎 内幕', kind: 'insider' });
  }

  // 跨茧房：全局最少见的 cat
  const all = store.items().filter(x => x.cat !== '噪音');
  const count = {};
  all.forEach(x => { count[x.cat] = (count[x.cat] || 0) + 1; });
  if (all.length && it.cat) {
    const rarest = Object.keys(count).sort((a, b) => count[a] - count[b])[0];
    if (it.cat === rarest && count[rarest] <= Math.max(2, Math.floor(all.length * 0.15))) {
      score += 15;
      reasons.push({ key: 'poke', label: '🌱 信息流里少见的「' + rarest + '」', kind: 'bubble' });
    }
  }

  // Phase 3：关注方向个性化
  if (interests.length && it.eventType) {
    for (const interest of interests) {
      const types = INTEREST_MAP[interest] || [];
      if (types.includes(it.eventType)) {
        score += 10;
        reasons.push({ key: 'interest', label: '✨ 匹配你的关注：' + interest, kind: 'interest' });
        break;
      }
    }
  }

  return {
    gapScore: Math.min(100, score),
    gapReasons: reasons.slice(0, 4),
    deadlineTier: deadlineTier(days)
  };
}

function withGap(it, uid, opts) {
  const g = computeGap(it, uid, opts);
  return Object.assign({}, it, {
    gapScore: g.gapScore,
    gapReasons: g.gapReasons,
    deadlineTier: g.deadlineTier
  });
}

module.exports = { computeGap, withGap, EVENT_TYPES, INTEREST_MAP };
