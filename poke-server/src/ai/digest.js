// AI 脉动周报：汇总过去 7 天 AI 条目
const store = require('../store');
const llm = require('./llm');

const MS_WEEK = 7 * 86400000;

function isoWeekKey(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getFullYear() + '-W' + String(week).padStart(2, '0');
}

function weekItems(weekKey) {
  const now = Date.now();
  const cutoff = now - MS_WEEK;
  const seen = new Set();
  return store.items()
    .filter(it => (it.lane === 'ai' || it.cat === 'AI脉动') && (it.ts || 0) >= cutoff)
    .filter(it => {
      const key = (it.url || it.rawText || it.id).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.pulseScore || 0) - (a.pulseScore || 0) || b.ts - a.ts)
    .slice(0, 20);
}

function ruleDigest(items, week) {
  const bullets = items.slice(0, 5).map(it => '• ' + it.title + (it.aiTopic ? '（' + it.aiTopic + '）' : ''));
  return {
    week,
    type: 'ai_digest',
    title: week.replace('-W', ' 第 ') + ' 周 AI 脉动',
    summary: bullets.join('\n') || '本周暂无 AI 脉动条目，试试手动投喂或等待采集。',
    highlights: items.slice(0, 8).map(it => ({ id: it.id, title: it.title, aiTopic: it.aiTopic, url: it.url })),
    ts: Date.now(),
    engine: 'rule'
  };
}

const DIGEST_SYS = `你是 AI 趋势编辑。根据过去一周的 AI 资讯标题列表，写一份中文周报摘要。
输出 JSON：{title(<=20字), summary(3-5条要点，用换行分隔，每条以•开头), bullets(字符串数组，每条<=40字)}`;

async function generate(weekKey) {
  const week = weekKey || isoWeekKey(new Date());
  const items = weekItems(week);
  let digest = null;

  if (llm.enabled() && items.length) {
    const list = items.slice(0, 15).map((it, i) => (i + 1) + '. ' + it.title + ' [' + (it.aiTopic || '') + ']').join('\n');
    const j = await llm.chatJSON(DIGEST_SYS, '本周条目：\n' + list);
    if (j && j.summary) {
      digest = {
        week,
        type: 'ai_digest',
        title: j.title || (week + ' AI 脉动'),
        summary: j.summary,
        highlights: items.slice(0, 8).map(it => ({ id: it.id, title: it.title, aiTopic: it.aiTopic, url: it.url })),
        ts: Date.now(),
        engine: 'llm'
      };
    }
  }

  if (!digest) digest = ruleDigest(items, week);
  return store.saveAiDigest(digest);
}

function get(weekKey) {
  const week = weekKey || isoWeekKey(new Date());
  return store.getAiDigest(week) || null;
}

module.exports = { generate, get, isoWeekKey, weekItems };
