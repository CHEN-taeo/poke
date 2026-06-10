// 演示样本回放（仅在你主动点「灌样本」时用，不是默认数据源）
const fs = require('fs');
const path = require('path');
const { ingestOne, ingestMany } = require('./core');
const store = require('../store');

function samples() {
  const f = path.join(__dirname, '..', '..', 'data', 'sample-messages.json');
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
function list() { return samples(); }

async function seedAll() {
  const list = samples();
  const out = await ingestMany(list.map(m => Object.assign({ source: 'demo' }, m)));
  seedDemoEngagement(out.items);
  return out.items;
}

function seedDemoEngagement(items) {
  const fakeUsers = [
    ['u_demo1', '林·材料'], ['u_demo2', '韬·机械'], ['u_demo3', '小鹿·设计'],
    ['u_demo4', '阿哲·机械'], ['u_demo5', '可可·纺织'], ['u_demo6', '大壮·电气']
  ];
  items.forEach((it, idx) => {
    const goCount = (idx * 3 + 2) % 6;
    for (let i = 0; i < goCount; i++) store.setEngage(it.id, fakeUsers[i][0], fakeUsers[i][1], 'go', true);
    if (it.cat === '搭子' || idx % 4 === 0) {
      const bd = (idx % 3) + 1;
      for (let i = 0; i < bd; i++) store.setEngage(it.id, fakeUsers[i][0], fakeUsers[i][1], 'buddy', true);
    }
  });
}

function start() {
  console.log('[ingest] 真实模式：把微信里复制的消息 POST 到 /api/ingest/paste');
  console.log('[ingest] 演示样本：POST /api/seed（不会自动灌入）');
}

module.exports = { start, ingestOne, ingestMany, seedAll, list };
