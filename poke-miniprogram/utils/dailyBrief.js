const score = require('./score.js');
const brand = require('./brand.js');
const briefReason = require('./briefReason.js');

const SLOTS = [
  { key: 'must', label: '今日必看', hint: '截止近 · 值得行动' },
  { key: 'later', label: '稍后读', hint: '不急 · 先收藏' },
  { key: 'poke', label: '圈外一条', hint: brand.MODULE_POKE + ' · 打破茧房' }
];

function pickMust(cards, interests, used) {
  const pool = cards.filter((c) => !c.poke && !used[c.id]);
  pool.sort((a, b) => score.totalScore(b, interests) - score.totalScore(a, interests));
  return pool[0] || null;
}

function pickLater(cards, interests, used) {
  const pool = cards.filter((c) => {
    if (used[c.id]) return false;
    if (c.poke) return false;
    return c.lane === 'ai' || c.cat === 'AI脉动' || (c.tags || []).indexOf('待读') >= 0 || (c.tags || []).indexOf('灵感') >= 0;
  });
  if (!pool.length) {
    const rest = cards.filter((c) => !used[c.id] && !c.poke);
    rest.sort((a, b) => score.freshnessScore(b) - score.freshnessScore(a));
    return rest[0] || null;
  }
  pool.sort((a, b) => score.freshnessScore(b) - score.freshnessScore(a));
  return pool[0];
}

function pickPoke(cards, used) {
  const pool = cards.filter((c) => c.poke && !used[c.id]);
  if (pool.length) return pool[0];
  const scarce = cards.filter((c) => !used[c.id] && score.scarcityScore(c) >= 2);
  scarce.sort((a, b) => score.scarcityScore(b) - score.scarcityScore(a));
  return scarce[0] || null;
}

function build(cards, interests) {
  const used = {};
  const must = pickMust(cards, interests, used);
  if (must) used[must.id] = true;
  const later = pickLater(cards, interests, used);
  if (later) used[later.id] = true;
  const poke = pickPoke(cards, used);
  if (poke) used[poke.id] = true;

  const items = [];
  if (must) items.push({
    slot: 'must', slotLabel: SLOTS[0].label, slotHint: SLOTS[0].hint,
    reason: briefReason.reasonForMust(must, interests), card: must
  });
  if (later) items.push({
    slot: 'later', slotLabel: SLOTS[1].label, slotHint: SLOTS[1].hint,
    reason: briefReason.reasonForLater(later), card: later
  });
  if (poke) items.push({
    slot: 'poke', slotLabel: SLOTS[2].label, slotHint: SLOTS[2].hint,
    reason: briefReason.reasonForPoke(poke), card: poke
  });
  return items;
}

module.exports = { build, SLOTS };
