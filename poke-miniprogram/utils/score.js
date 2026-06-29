/** 隐性内容质量评分 — 用于排序与今日简报 */

function actionScore(it) {
  let s = 0;
  if (it.deadline) s += 3;
  if (it.time) s += 1;
  if (it.place) s += 1;
  if (it.url) s += 2;
  if (typeof it.daysToDeadline === 'number' && it.daysToDeadline >= 0 && it.daysToDeadline <= 7) s += 2;
  return s;
}

function matchScore(it, interests) {
  if (!interests || !interests.length) return 0;
  const hay = [it.cat, it.eventType, it.aiTopic].concat(it.tags || []).join(' ');
  let s = 0;
  interests.forEach((i) => {
    if (hay.indexOf(i) >= 0) s += 2;
  });
  return s;
}

function freshnessScore(it) {
  if (it.ts) {
    const age = Date.now() - it.ts;
    if (age < 86400000) return 3;
    if (age < 604800000) return 2;
    return 1;
  }
  return 1;
}

function scarcityScore(it) {
  let s = 0;
  if (it.poke) s += 3;
  if (it.gapScore > 50 || it.pulseScore > 50) s += 2;
  if (it.insiderNote) s += 1;
  return s;
}

function totalScore(it, interests) {
  return actionScore(it) * 2 + matchScore(it, interests) * 2 + freshnessScore(it) + scarcityScore(it);
}

module.exports = { actionScore, matchScore, freshnessScore, scarcityScore, totalScore };
