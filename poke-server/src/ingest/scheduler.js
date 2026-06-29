// 自动采集调度器：校园源 + AI 源
const sources = require('./sources');
const aiSources = require('./ai-sources');
const { fetchSource } = require('./web');
const { bodyText } = require('./mpArticle');
const { ingestMany } = require('./core');

let campusTimer = null;
let aiTimer = null;

async function mapItemsToMessages(items, src) {
  const messages = [];
  for (const it of items) {
    const body = await bodyText(it);
    const text = [it.title, body].filter(Boolean).join('\n\n').trim();
    if (!text) continue;
    const isMp = (src.wewe || /公众号/.test(src.room || '') || /mp\.weixin\.qq\.com/i.test(it.link || ''));
    messages.push({
      text: text.slice(0, 12000),
      fullBody: body.slice(0, 12000),
      room: src.room || '自动源',
      sender: isMp ? '公众号' : '自动采集',
      source: isMp ? 'mp' : (src.platform || src.type || 'rss'),
      url: it.link || '',
      imageUrl: it.imageUrl || '',
      lane: src.lane || 'campus',
      platform: isMp ? '公众号' : (src.platform || src.type || 'rss'),
      stars: it.stars || (it.meta && it.meta.stars) || 0
    });
  }
  return messages;
}

async function pollOne(src) {
  try {
    const items = await fetchSource(src);
    const messages = await mapItemsToMessages(items, src);
    const out = await ingestMany(messages);
    const patch = { lastPoll: Date.now(), lastCount: out.added, lastError: '' };
    if (src.lane === 'ai') aiSources.update(src.id, patch);
    else sources.update(src.id, patch);
    if (out.added) console.log('[auto] ' + (src.room || src.url || src.id) + ' 新增 ' + out.added + ' 条');
    return out;
  } catch (e) {
    const patch = { lastPoll: Date.now(), lastError: e.message };
    if (src.lane === 'ai') aiSources.update(src.id, patch);
    else sources.update(src.id, patch);
    console.warn('[auto] 拉取失败 ' + (src.url || src.id) + ' : ' + e.message);
    return { added: 0, error: e.message };
  }
}

async function pollCampus() {
  const list = sources.list().filter(s => s.enabled !== false);
  let total = 0;
  for (const s of list) { const r = await pollOne(s); total += (r.added || 0); }
  return { sources: list.length, added: total };
}

async function pollAi() {
  const list = aiSources.list().filter(s => s.enabled !== false);
  let total = 0;
  for (const s of list) { const r = await pollOne(s); total += (r.added || 0); }
  return { sources: list.length, added: total };
}

async function pollAll() {
  const campus = await pollCampus();
  const ai = await pollAi();
  return { campus, ai, added: (campus.added || 0) + (ai.added || 0) };
}

function startCampus(intervalMin) {
  const min = Number(intervalMin) || 15;
  console.log('[auto] 校园采集每 ' + min + ' 分钟');
  pollCampus();
  campusTimer = setInterval(pollCampus, min * 60 * 1000);
}

function startAi(intervalMin) {
  const min = Number(intervalMin) || 60;
  console.log('[auto] AI 采集每 ' + min + ' 分钟');
  pollAi();
  aiTimer = setInterval(pollAi, min * 60 * 1000);
}

function start(intervalMin) {
  startCampus(intervalMin);
}

function startAiIngest(intervalMin) {
  startAi(intervalMin);
}

function stop() {
  if (campusTimer) clearInterval(campusTimer);
  if (aiTimer) clearInterval(aiTimer);
}

/** 每周一 08:00 尝试生成 AI 周报 */
function scheduleWeeklyDigest() {
  const tryRun = async () => {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 8) {
      try {
        const digest = require('../ai/digest');
        await digest.generate();
      } catch (e) { console.warn('[digest] weekly failed:', e.message); }
    }
  };
  setInterval(tryRun, 60 * 60 * 1000);
  tryRun();
}

module.exports = {
  start, stop, pollAll, pollOne, pollCampus, pollAi,
  startAiIngest, scheduleWeeklyDigest
};
