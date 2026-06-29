const score = require('./score.js');

function reasonForMust(card, interests) {
  const parts = [];
  if (typeof card.daysToDeadline === 'number' && card.daysToDeadline >= 0 && card.daysToDeadline <= 7) {
    parts.push(card.daysToDeadline === 0 ? '今天截止' : card.daysToDeadline + ' 天内截止');
  } else if (card.deadline) {
    parts.push('有明确截止');
  }
  const m = score.matchScore(card, interests);
  if (m >= 2) parts.push('命中你的兴趣');
  if (card.url) parts.push('可直达链接');
  if (!parts.length) parts.push('综合评分最高');
  return parts.join(' · ');
}

function reasonForLater(card) {
  if (card.lane === 'ai' || card.cat === 'AI脉动') return 'AI/工具类 · 适合稍后读';
  if ((card.tags || []).indexOf('灵感') >= 0) return '灵感摘录 · 不急';
  if ((card.tags || []).indexOf('待读') >= 0) return '待读清单';
  return '新鲜但不紧急';
}

function reasonForPoke(card) {
  if (card.poke) return '圈外一条 · 打破信息茧房';
  return '稀缺内容 · 值得一看';
}

module.exports = { reasonForMust, reasonForLater, reasonForPoke };
