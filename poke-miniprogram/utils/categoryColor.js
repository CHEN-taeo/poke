const { CATEGORY_COLORS } = require('./design-tokens.js');

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 17) % 10000;
  return h;
}

function categoryKey(it) {
  if (it && it.poke) return 'poke';
  if (it && (it.lane === 'ai' || it.cat === 'AI脉动')) return 'ai';
  const et = (it && (it.eventType || it.aiTopic || it.cat)) || 'default';
  if (/讲座|宣讲/.test(et)) return 'lecture';
  if (/竞赛|大赛|机会/.test(et)) return 'competition';
  if (/展览|活动/.test(et)) return 'exhibition';
  if (/通知|公告/.test(et)) return 'notice';
  return 'default';
}

function colorForItem(it) {
  const key = categoryKey(it);
  const c = CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
  return Object.assign({ key: key }, c);
}

function colorForTag(name) {
  const keys = Object.keys(CATEGORY_COLORS);
  const idx = hashStr(name || 'x') % keys.length;
  const key = keys[idx];
  return Object.assign({ key: key }, CATEGORY_COLORS[key]);
}

module.exports = { categoryKey, colorForItem, colorForTag };
