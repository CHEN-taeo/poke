const categoryColor = require('./categoryColor.js');

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 13) % 10000;
  return h;
}

function buildStars(items) {
  const list = items || [];
  const tagGroups = {};
  list.forEach((it) => {
    const tag = (it.tags && it.tags[0]) || it.cat || it.aiTopic || '其它';
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(it);
  });
  const names = Object.keys(tagGroups);
  const stars = [];
  names.forEach((tag, gi) => {
    const angle = (gi / Math.max(names.length, 1)) * Math.PI * 2;
    const cx = 48 + Math.cos(angle) * 30;
    const cy = 48 + Math.sin(angle) * 26;
    tagGroups[tag].forEach((it, ii) => {
      const jitterX = (hashStr(it.id + 'x') % 14) - 7;
      const jitterY = (hashStr(it.id + 'y') % 14) - 7;
      const c = categoryColor.colorForItem(it);
      stars.push({
        id: it.id,
        tag: tag,
        left: Math.min(92, Math.max(8, cx + jitterX + ii * 1.2)),
        top: Math.min(88, Math.max(12, cy + jitterY)),
        size: 8 + (hashStr(it.id) % 4) * 2,
        accent: !!it.poke,
        color: c.fg
      });
    });
  });
  return stars.slice(0, 48);
}

function buildClusters(items) {
  const list = items || [];
  const tagGroups = {};
  list.forEach((it) => {
    const tag = (it.tags && it.tags[0]) || it.cat || it.aiTopic || '其它';
    if (!tagGroups[tag]) tagGroups[tag] = [];
    tagGroups[tag].push(it);
  });
  const names = Object.keys(tagGroups);
  return names.map((tag, gi) => {
    const angle = (gi / Math.max(names.length, 1)) * Math.PI * 2;
    const cx = 48 + Math.cos(angle) * 30;
    const cy = 48 + Math.sin(angle) * 26;
    const c = categoryColor.colorForItem(tagGroups[tag][0]);
    return {
      tag: tag,
      count: tagGroups[tag].length,
      left: Math.min(88, Math.max(12, cx)),
      top: Math.min(84, Math.max(16, cy)),
      color: c.fg
    };
  });
}

module.exports = { buildStars, buildClusters };
