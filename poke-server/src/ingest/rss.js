// 极简 RSS / Atom 解析（无第三方依赖，用 Node 自带 fetch）
async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) poke-bot/1.0' },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.text();
}

function strip(s) {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function tag(block, name) {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? strip(m[1]) : '';
}

function parse(xml) {
  const items = [];
  const rss = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const b of rss) {
    items.push({ title: tag(b, 'title'), desc: tag(b, 'description') || tag(b, 'content:encoded'), link: tag(b, 'link') });
  }
  if (!items.length) {
    const atom = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    for (const b of atom) {
      let link = '';
      const lm = b.match(/<link[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
      items.push({ title: tag(b, 'title'), desc: tag(b, 'summary') || tag(b, 'content'), link });
    }
  }
  return items;
}

async function fetchFeed(url) { return parse(await fetchText(url)); }

module.exports = { fetchFeed, parse };
