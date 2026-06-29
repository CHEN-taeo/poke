function estimateHeight(item) {
  let h = 1;
  const s = (item.summary || '').length;
  if (s > 60) h += 0.4;
  if (s > 120) h += 0.5;
  if (item.tags && item.tags.length > 2) h += 0.25;
  if (item.deadline || item.gapReasons && item.gapReasons.length) h += 0.2;
  if (item.poke) h += 0.15;
  return h;
}

function toMasonry(list) {
  const left = [];
  const right = [];
  let lh = 0;
  let rh = 0;
  (list || []).forEach((item) => {
    const h = estimateHeight(item);
    const card = Object.assign({}, item, { masonryTall: h > 1.4 });
    if (lh <= rh) {
      left.push(card);
      lh += h;
    } else {
      right.push(card);
      rh += h;
    }
  });
  return { left, right };
}

module.exports = { toMasonry, estimateHeight };
