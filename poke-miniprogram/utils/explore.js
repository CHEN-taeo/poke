const KEY_RECENT = 'poke.recentSearch';
const KEY_NLP = {
  '这周截止': { filter: 'deadlineWeek' },
  '比赛': { tag: '竞赛' },
  '竞赛': { tag: '竞赛' },
  '机械': { tag: '专业相关' },
  '机会': { cat: '机会' },
  'ai': { cat: 'AI' },
  'AI': { cat: 'AI' }
};

function getRecentSearches() {
  try {
    const list = wx.getStorageSync(KEY_RECENT);
    return Array.isArray(list) ? list.slice(0, 8) : [];
  } catch (e) { return []; }
}

function pushRecentSearch(q) {
  const s = (q || '').trim();
  if (!s) return;
  let list = getRecentSearches().filter((x) => x !== s);
  list.unshift(s);
  list = list.slice(0, 8);
  try { wx.setStorageSync(KEY_RECENT, list); } catch (e) {}
}

function parseNaturalQuery(q) {
  const lower = (q || '').toLowerCase();
  if (/这周.*截止|截止.*这周/.test(q)) return { type: 'deadlineWeek', raw: q };
  if (/适合.*专业|专业.*相关/.test(q)) return { type: 'tag', value: '专业相关', raw: q };
  if (/比赛|竞赛|黑客松/.test(q)) return { type: 'tag', value: '竞赛', raw: q };
  if (/ai|工具|开源/.test(lower)) return { type: 'cat', value: 'AI', raw: q };
  return { type: 'text', raw: q };
}

function filterByNatural(items, parsed) {
  if (!parsed || parsed.type === 'text') return items;
  if (parsed.type === 'deadlineWeek') {
    return items.filter((it) => {
      if (typeof it.daysToDeadline === 'number') return it.daysToDeadline >= 0 && it.daysToDeadline <= 7;
      return !!(it.deadline && /周|天|今|明/.test(it.deadline));
    });
  }
  if (parsed.type === 'tag') {
    const v = parsed.value;
    return items.filter((it) => (it.tags || []).indexOf(v) >= 0 || it.cat === v);
  }
  if (parsed.type === 'cat') {
    return items.filter((it) => it.cat === parsed.value || it.lane === 'ai' || it.cat === 'AI脉动');
  }
  return items;
}

function topTagsFromStore(S, tagsUtil) {
  const list = tagsUtil.collectFromStore(S);
  return list.slice(0, 8);
}

function tagAlbumMeta(S, tagName, items) {
  const matched = items.filter((it) => {
    const tags = (it.tags || []).concat([it.cat, it.eventType, it.aiTopic].filter(Boolean));
    if (tagName === '破壳') return !!it.poke;
    return tags.indexOf(tagName) >= 0;
  });
  const saved = (S.saved || {});
  let savedN = 0;
  const weekAgo = Date.now() - 604800000;
  let recentWeek = 0;
  matched.forEach((it) => {
    if (saved[it.id]) savedN++;
    if (it.ts && it.ts >= weekAgo) recentWeek++;
  });
  return {
    name: tagName,
    total: matched.length,
    savedCount: savedN,
    recentWeek: recentWeek,
    trend: recentWeek >= 2 ? '本周新增 ' + recentWeek + ' 条' : (matched.length ? '共收录 ' + matched.length + ' 条' : ''),
    recent: matched.slice(0, 5)
  };
}

module.exports = {
  getRecentSearches,
  pushRecentSearch,
  parseNaturalQuery,
  filterByNatural,
  topTagsFromStore,
  tagAlbumMeta
};
