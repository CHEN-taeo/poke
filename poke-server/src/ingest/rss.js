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

function tagRaw(block, name) {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)<\\/' + name + '>', 'i'));
  return m ? m[1] : '';
}

function firstImageFromHtml(html) {
  if (!html) return '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1].trim() : '';
}

function enclosureUrl(block) {
  const m = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (m && /\.(jpe?g|png|gif|webp)/i.test(m[1])) return m[1].trim();
  const media = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (media) return media[1].trim();
  return '';
}

function parseItem(block) {
  const descRaw = tagRaw(block, 'description') || tagRaw(block, 'content:encoded') || tagRaw(block, 'content');
  const imageUrl = enclosureUrl(block) || firstImageFromHtml(descRaw);
  return {
    title: tag(block, 'title'),
    desc: tag(block, 'description') || tag(block, 'content:encoded'),
    link: tag(block, 'link'),
    imageUrl
  };
}

function parse(xml) {
  const items = [];
  const rss = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const b of rss) items.push(parseItem(b));
  if (!items.length) {
    const atom = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    for (const b of atom) {
      let link = '';
      const lm = b.match(/<link[^>]*href="([^"]+)"/i);
      if (lm) link = lm[1];
      const summaryRaw = tagRaw(b, 'summary') || tagRaw(b, 'content');
      items.push({
        title: tag(b, 'title'),
        desc: tag(b, 'summary') || tag(b, 'content'),
        link,
        imageUrl: enclosureUrl(b) || firstImageFromHtml(summaryRaw)
      });
    }
  }
  return items;
}

async function fetchFeed(url) { return parse(await fetchText(url)); }

module.exports = { fetchFeed, parse, firstImageFromHtml };
