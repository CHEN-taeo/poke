// 自动采集调度器：按间隔轮询所有源 → AI 管线入库（去重在 store 内做）
const sources = require('./sources');
const { fetchSource } = require('./web');
const { ingestMany } = require('./core');

let timer = null;

async function pollOne(src) {
  try {
    const items = await fetchSource(src);
    const messages = items.map(it => ({
      text: (it.title + (it.desc ? ' ' + it.desc : '')).slice(0, 300),
      room: src.room || '自动源',
      sender: '自动采集',
      source: 'rss',
      url: it.link
    })).filter(m => m.text.trim());
    const out = await ingestMany(messages);
    sources.update(src.id, { lastPoll: Date.now(), lastCount: out.added, lastError: '' });
    if (out.added) console.log('[auto] ' + (src.room || src.url) + ' 新增 ' + out.added + ' 条');
    return out;
  } catch (e) {
    sources.update(src.id, { lastPoll: Date.now(), lastError: e.message });
    console.warn('[auto] 拉取失败 ' + src.url + ' : ' + e.message);
    return { added: 0, error: e.message };
  }
}

async function pollAll() {
  const list = sources.list().filter(s => s.enabled !== false);
  let total = 0;
  for (const s of list) { const r = await pollOne(s); total += (r.added || 0); }
  return { sources: list.length, added: total };
}

function start(intervalMin) {
  const min = Number(intervalMin) || 15;
  console.log('[auto] 自动采集已开启，每 ' + min + ' 分钟轮询一次');
  pollAll();
  timer = setInterval(pollAll, min * 60 * 1000);
}
function stop() { if (timer) clearInterval(timer); }

module.exports = { start, stop, pollAll, pollOne };
