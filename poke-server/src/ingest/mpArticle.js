// 公众号文章正文提取（RSS content:encoded 优先，否则尝试抓取链接）
const { fetchText } = require('./web');

function stripHtml(html) {
  if (!html) return '';
  return (html || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function fetchLinkBody(url) {
  if (!url || !/^https?:\/\//i.test(url)) return '';
  try {
    const html = await fetchText(url);
    const m = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/class="rich_media_content"[^>]*>([\s\S]*?)<\/div>/i);
    if (m) return stripHtml(m[1]).slice(0, 12000);
    const meta = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (meta) return stripHtml(meta[1]).slice(0, 4000);
  } catch (e) {
    /* 微信反爬时静默失败，靠 RSS 正文 */
  }
  return '';
}

/** 从 RSS 条目拿到尽量完整的纯文本正文 */
async function bodyText(item) {
  const desc = stripHtml(item.desc || item.body || '');
  if (desc.length >= 120) return desc.slice(0, 12000);
  const fromLink = await fetchLinkBody(item.link);
  if (fromLink.length > desc.length) return fromLink;
  return desc;
}

module.exports = { stripHtml, fetchLinkBody, bodyText };
