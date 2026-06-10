#!/usr/bin/env node
// 一键初始化东华大学生源：清空旧 demo 数据 → 灌入校园群样本 → 抓取官网通知
require('dotenv').config();
const store = require('../src/store');
const mock = require('../src/ingest/mock');
const scheduler = require('../src/ingest/scheduler');

async function main() {
  console.log('[setup-dhu] 清空旧数据…');
  store.reset();

  console.log('[setup-dhu] 灌入东华校园群聊样本（DeepSeek 结构化）…');
  const seeded = await mock.seedAll();
  console.log('[setup-dhu] 样本入库', seeded.length, '条');

  console.log('[setup-dhu] 抓取东华官网通知（教务处 / 学生资助 / 主页）…');
  const r = await scheduler.pollAll();
  console.log('[setup-dhu] 自动源', r.sources, '个，本次新增', r.added, '条');

  const items = store.items();
  console.log('[setup-dhu] 当前总条目', items.length);
  items.slice(0, 8).forEach(it => console.log(' -', it.cat, '|', (it.title || it.text || '').slice(0, 50)));
  console.log('\n[setup-dhu] 完成。启动服务: npm start → 小程序打开「今天」');
}

main().catch(e => { console.error(e); process.exit(1); });
