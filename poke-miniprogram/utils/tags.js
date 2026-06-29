const { TAG_PALETTE } = require('./design-tokens.js');
const categoryColor = require('./categoryColor.js');

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 17) % 10000;
  return h;
}

function tagVisual(name, count, maxCount) {
  const c = categoryColor.colorForTag(name);
  const ratio = maxCount > 0 ? count / maxCount : 0.5;
  let tier = 'sm';
  if (ratio > 0.75) tier = 'xl';
  else if (ratio > 0.5) tier = 'lg';
  else if (ratio > 0.3) tier = 'md';
  const offsetX = (hashStr(name + 'x') % 9) - 4;
  const offsetY = (hashStr(name + 'y') % 9) - 4;
  return {
    color: c.fg,
    tier: tier,
    offsetX: offsetX,
    offsetY: offsetY
  };
}

function addTags(map, it) {
  if (!it) return;
  function bump(t) {
    if (!t || typeof t !== 'string') return;
    const k = t.trim();
    if (!k) return;
    map[k] = (map[k] || 0) + 1;
  }
  (it.tags || []).forEach(bump);
  bump(it.cat);
  bump(it.aiTopic);
  bump(it.eventType);
  if (it.poke) bump('破壳');
}

function collectFromStore(S) {
  const map = {};
  Object.values(S.cache || {}).forEach((it) => addTags(map, it));
  const t = require('./store.js').todayStr();
  (S.days[t] || []).forEach((it) => addTags(map, it));
  if (S.pokeOfDay && S.pokeOfDay[t]) addTags(map, S.pokeOfDay[t]);
  const entries = Object.keys(map).map((name) => ({ name: name, count: map[name] }));
  entries.sort((a, b) => b.count - a.count);
  const max = entries.length ? entries[0].count : 1;
  return entries.map((e) => {
    const v = tagVisual(e.name, e.count, max);
    return Object.assign({}, e, v, {
      style: 'color:' + v.color + ';transform:translate(' + v.offsetX + 'rpx,' + v.offsetY + 'rpx)'
    });
  });
}

function filterByTag(items, tagName) {
  if (!tagName || tagName === '全部') return items;
  return (items || []).filter((it) => {
    if (tagName === '破壳') return !!it.poke;
    if (tagName === 'AI') return it.lane === 'ai' || it.cat === 'AI脉动' || !!(it.aiTopic);
    const tags = (it.tags || []).concat([it.cat, it.eventType, it.aiTopic].filter(Boolean));
    return tags.indexOf(tagName) >= 0;
  });
}

module.exports = { collectFromStore, tagVisual, filterByTag, TAG_PALETTE };
