// 统一入库：原始消息 → AI 管线 → 结构化条目
const campusPipeline = require('../ai/pipeline');
const aiPipeline = require('../ai/aiPipeline');
const store = require('../store');

async function ingestOne(msg) {
  store.addRaw(msg);
  if (store.recentDuplicate(msg.text, msg.url)) return { skipped: true, reason: 'duplicate' };
  const lane = msg.lane || (msg.source === 'ai' ? 'ai' : 'campus');
  const pipeline = lane === 'ai' ? aiPipeline : campusPipeline;
  const it = await pipeline.process(msg.text, {
    source: msg.source || 'group',
    room: msg.room || '',
    sender: msg.sender || '',
    url: msg.url || '',
    platform: msg.platform || '',
    lane,
    stars: msg.stars,
    imageUrl: msg.imageUrl || '',
    fullBody: msg.fullBody || ''
  });
  if (!it) return { skipped: true, reason: 'empty' };
  if (it.cat === '噪音') return { skipped: true, reason: 'noise', item: it };
  if (lane === 'campus' && !it.lane) it.lane = 'campus';
  return { item: store.addItem(it) };
}

async function ingestMany(messages) {
  const out = { added: 0, skipped: 0, noise: 0, items: [] };
  for (const m of messages) {
    const r = await ingestOne(m);
    if (r.item && r.item.id) { out.added++; out.items.push(r.item); }
    else if (r.reason === 'noise') out.noise++;
    else out.skipped++;
  }
  return out;
}

module.exports = { ingestOne, ingestMany };
