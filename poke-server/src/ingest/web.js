// 高校官网通知页抓取（树维 CMS news_list 结构，东华等通用）
const { fetchFeed: fetchRss, parse: parseRss } = require('./rss');
const { fetchHnStories } = require('./hn');
const { fetchGithubRepos } = require('./github');
const aiSources = require('./ai-sources');

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) poke-bot/1.0' },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.text();
}

function abs(base, href) {
  if (!href) return '';
  if (/^https?:\/\//i.test(href)) return href;
  const b = new URL(base);
  if (href.startsWith('/')) return b.origin + href;
  const dir = base.replace(/[^/]+$/, '');
  return dir + href;
}

function stripHtml(s) {
  return (s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

/** 解析树维 CMS 列表页 */
function parseSudyList(html, baseUrl) {
  const items = [];
  const re = /<a\s+href=['"]([^'"]+\/page\.htm)['"][^>]*title=['"]([^'"]+)['"]/gi;
  let m;
  while ((m = re.exec(html))) {
    const title = stripHtml(m[2]);
    if (!title || title.length < 4) continue;
    items.push({ title, desc: '', link: abs(baseUrl, m[1]) });
  }
  // 无 title 属性时退化为链接文字
  if (!items.length) {
    const re2 = /news_title[^>]*>[\s\S]*?<a\s+href=['"]([^'"]+\/page\.htm)['"][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = re2.exec(html))) {
      const title = stripHtml(m[2]);
      if (title.length >= 4) items.push({ title, desc: '', link: abs(baseUrl, m[1]) });
    }
  }
  // 去重（同链接）
  const seen = new Set();
  return items.filter(it => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });
}

async function fetchWebList(url) {
  const html = await fetchText(url);
  return parseSudyList(html, url);
}

/** 统一入口：rss / web / hn / github */
async function fetchSource(src) {
  const type = src.type || 'rss';
  if (type === 'web') return fetchWebList(src.url);
  if (type === 'hn') return fetchHnStories(src.query || 'AI', src.limit || 12);
  if (type === 'github') return fetchGithubRepos(src.query || 'AI agent', src.limit || 8);
  const url = src.url && !/^https?:\/\//i.test(src.url) ? aiSources.resolveUrl(src) : src.url;
  return fetchRss(url);
}

module.exports = { fetchWebList, fetchSource, parseSudyList, abs, fetchText };
