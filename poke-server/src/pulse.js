// AI 脉动打分：为什么这条 AI 资讯值得现在看
const store = require('./store');

const MS_DAY = 86400000;
const AI_TOPICS = ['妙招', '工作流', '模型', '开源', '大家在用', '播客'];

/** 用户 AI 关注 → aiTopic / platform 加权 */
const AI_INTEREST_MAP = {
  Agent: ['大家在用', '工作流', '妙招'],
  'Cursor/IDE': ['妙招', '工作流', '大家在用'],
  开源项目: ['开源'],
  播客: ['播客'],
  模型: ['模型']
};

function topicCounts() {
  const counts = {};
  store.items().filter(it => it.lane === 'ai').forEach(it => {
    const t = it.aiTopic || '大家在用';
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function computePulse(it, uid, opts) {
  const reasons = [];
  let score = 0;
  const now = Date.now();
  const aiInterests = (opts && opts.aiInterests) || [];

  const age = now - (it.ts || 0);
  if (age < MS_DAY) {
    score += 25;
    reasons.push({ key: 'fresh', label: '⚡ 24h 新发', kind: 'time' });
  } else if (age < 7 * MS_DAY) {
    score += 15;
    reasons.push({ key: 'week', label: '📅 本周新发', kind: 'time' });
  }

  const counts = topicCounts();
  const topic = it.aiTopic || '大家在用';
  const topicN = counts[topic] || 0;
  const totalAi = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalAi > 3 && topicN <= Math.max(2, Math.floor(totalAi * 0.2))) {
    score += 15;
    reasons.push({ key: 'rare', label: '💡 少见的「' + topic + '」类', kind: 'topic' });
  }

  if (aiInterests.length) {
    for (const interest of aiInterests) {
      const topics = AI_INTEREST_MAP[interest] || [];
      if (topics.includes(topic) || (interest === '开源项目' && it.platform === 'github')) {
        score += 10;
        reasons.push({ key: 'interest', label: '✨ 匹配关注：' + interest, kind: 'interest' });
        break;
      }
    }
  }

  if (it.url) {
    score += 5;
    reasons.push({ key: 'link', label: '🔗 有原文', kind: 'meta' });
  }

  if (it.stars && it.stars >= 100) {
    score += 10;
    reasons.push({ key: 'stars', label: '⭐ ' + it.stars + '+ Star', kind: 'social' });
  } else if (it.platform === 'github' && it.stars >= 10) {
    score += 5;
    reasons.push({ key: 'stars', label: '⭐ 热门开源', kind: 'social' });
  }

  if (it.platform && ['hn', 'github'].includes(it.platform)) {
    score += 5;
    reasons.push({ key: 'platform', label: '🌐 ' + it.platform.toUpperCase(), kind: 'platform' });
  }

  return {
    pulseScore: Math.min(100, score),
    pulseReasons: reasons.slice(0, 4)
  };
}

function withPulse(it, uid, opts) {
  const p = computePulse(it, uid, opts);
  return Object.assign({}, it, {
    pulseScore: p.pulseScore,
    pulseReasons: p.pulseReasons,
    gapScore: p.pulseScore,
    gapReasons: p.pulseReasons
  });
}

module.exports = { computePulse, withPulse, AI_TOPICS, AI_INTEREST_MAP };
