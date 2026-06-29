// Hacker News via Algolia public API

async function fetchHnStories(query, limit) {
  const q = encodeURIComponent(query || 'AI');
  const n = Math.min(limit || 15, 30);
  const url = 'https://hn.algolia.com/api/v1/search?query=' + q + '&tags=story&hitsPerPage=' + n;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'poke-bot/1.0' },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error('HN API HTTP ' + res.status);
  const data = await res.json();
  return (data.hits || []).map(hit => ({
    title: hit.title || '',
    desc: hit.story_text || hit.comment_text || '',
    link: hit.url || ('https://news.ycombinator.com/item?id=' + hit.objectID),
    stars: hit.points || 0,
    meta: { hnId: hit.objectID, points: hit.points || 0 }
  })).filter(it => it.title && it.title.length >= 4);
}

module.exports = { fetchHnStories };
