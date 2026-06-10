require('dotenv').config();
const path = require('path');
const express = require('express');
const store = require('./store');
const modules = require('./modules');
const pipeline = require('./ai/pipeline');
const llm = require('./ai/llm');
const mock = require('./ingest/mock');
const { ingestOne, ingestMany } = require('./ingest/core');
const { parse } = require('./ingest/parse');
const sources = require('./ingest/sources');
const scheduler = require('./ingest/scheduler');

const app = express();
app.use(express.json({ limit: '1mb' }));
// 开发期允许跨域，方便小程序/网页本地联调
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// 健康/配置
app.get('/api/health', async (req, res) => {
  const body = {
    ok: true,
    ingestMode: process.env.INGEST_MODE || 'real',
    llm: llm.enabled() ? 'on' : 'off(规则引擎)',
    autoIngest: process.env.AUTO_INGEST === '1',
    wechatCli: process.env.WECHAT_CLI === '1',
    real: true
  };
  if (process.env.WECHAT_CLI === '1') {
    try {
      const wc = require('./ingest/wechat-cli');
      body.wechatCliStatus = await wc.status();
    } catch (e) { body.wechatCliStatus = { error: e.message }; }
  }
  res.json(body);
});

// 投喂一条真实消息
app.post('/api/ingest', async (req, res) => {
  const { text, room, sender, source, url } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'text 必填' });
  const r = await ingestOne({ text, room, sender, source: source || 'forward', url });
  res.json(r);
});

// 粘贴一批真实消息（文件传输助手 / 群聊导出）
app.post('/api/ingest/paste', async (req, res) => {
  const { text, room, sender, mode } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'text 必填' });
  const messages = parse(text, { room, sender, mode: mode || 'auto' });
  if (!messages.length) return res.status(400).json({ error: '未能解析出任何消息' });
  const out = await ingestMany(messages);
  res.json(Object.assign({ parsed: messages.length }, out));
});

// 批量 JSON
app.post('/api/ingest/batch', async (req, res) => {
  const list = Array.isArray(req.body) ? req.body : (req.body.messages || []);
  const out = await ingestMany(list);
  res.json(out);
});

// 一键灌入样本
app.post('/api/seed', async (req, res) => res.json({ items: await mock.seedAll() }));
app.get('/api/samples', (req, res) => res.json(mock.list()));
app.post('/api/reset', (req, res) => { store.reset(); res.json({ ok: true }); });

// ===== 自动采集源 =====
app.get('/api/sources', (req, res) => res.json(sources.list()));
app.post('/api/sources', async (req, res) => {
  const { url, room, type } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: '需要合法的 http(s) 链接' });
  const src = sources.add({ url: url.trim(), room: (room || '').trim(), type: type || 'rss' });
  const poll = await scheduler.pollOne(src); // 加完立即抓一次，立刻见效
  res.json({ source: sources.list().find(s => s.id === src.id), poll });
});
app.post('/api/sources/remove', (req, res) => { sources.remove((req.body || {}).id); res.json({ ok: true }); });
app.post('/api/poll', async (req, res) => res.json(await scheduler.pollAll())); // 手动触发一次全量抓取

// wechat-cli 群聊本地库
app.get('/api/wechat-cli/status', async (req, res) => {
  if (process.env.WECHAT_CLI !== '1') return res.json({ enabled: false });
  res.json(await require('./ingest/wechat-cli').status());
});
app.post('/api/wechat-cli/poll', async (req, res) => {
  if (process.env.WECHAT_CLI !== '1') return res.status(400).json({ error: 'WECHAT_CLI 未开启' });
  res.json(await require('./ingest/wechat-cli').pollAll());
});

// 模块视图（带 ?uid= 时返回个人参与态 + 真实计数）
app.get('/api/feed', (req, res) => res.json(modules.feed(req.query.uid)));
app.get('/api/buddy', (req, res) => res.json(modules.buddy(req.query.uid)));
app.get('/api/radar', (req, res) => res.json(modules.radar(req.query.uid)));
app.get('/api/poke', (req, res) => res.json(modules.poke(req.query.uid)));
app.get('/api/me', (req, res) => res.json(modules.mine(req.query.uid)));
app.get('/api/raw', (req, res) => res.json(store.raw().slice(0, 100)));
app.get('/api/items', (req, res) => res.json(store.items()));
app.get('/api/stats', (req, res) => res.json(modules.stats()));

// 参与：多人"想去/找搭子/去过"计数同步
app.post('/api/engage', (req, res) => {
  const { uid, name, itemId, action, value } = req.body || {};
  if (!uid || !itemId || !['go', 'buddy', 'attended'].includes(action)) {
    return res.status(400).json({ error: '需要 uid, itemId, action(go|buddy|attended)' });
  }
  const counts = store.setEngage(itemId, uid, name, action, value !== false);
  res.json({ ok: true, itemId, counts, mine: store.mineState(itemId, uid) });
});

const PORT = process.env.PORT || 5700;
app.listen(PORT, () => {
  console.log('破壳 服务已启动  http://localhost:' + PORT);
  console.log('  采集模式:', process.env.INGEST_MODE || 'mock', '  AI:', llm.enabled() ? 'LLM' : '规则引擎(离线)');
  bootIngest();
});

async function bootIngest() {
  const mode = process.env.INGEST_MODE || 'real';
  if (mode === 'wechaty') {
    const wechaty = require('./ingest/wechaty');
    await wechaty.start();
  } else {
    mock.start();
  }
  // 微信 4.x 群聊：wechat-cli 读本地库（与 INGEST_MODE 正交，可与官网自动采集并存）
  if (process.env.WECHAT_CLI === '1') {
    require('./ingest/wechat-cli').start();
  }
  // 自动采集（RSS/官网 web 轮询），与采集模式正交
  if (process.env.AUTO_INGEST === '1') {
    scheduler.start(process.env.AUTO_INTERVAL_MIN);
  } else {
    console.log('[auto] 自动采集未开启（.env 设 AUTO_INGEST=1 开启）');
  }
}
