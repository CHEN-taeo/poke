#!/usr/bin/env node
// WeWe-RSS 接入助手：检查服务、列出建议公众号、把 feed URL 写入 sources.json
// 用法：
//   node scripts/wewe-rss.js check
//   node scripts/wewe-rss.js template
//   node scripts/wewe-rss.js add <rss-url> <来源名>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sources = require('../src/ingest/sources');

const BASE = (process.env.WEWE_RSS_BASE || 'http://127.0.0.1:4000').replace(/\/$/, '');
const TEMPLATE = path.join(__dirname, '..', 'data', 'wewe-feeds.template.json');

async function check() {
  console.log('[wewe] 探测', BASE);
  try {
    const r = await fetch(BASE, { signal: AbortSignal.timeout(8000) });
    console.log('[wewe] HTTP', r.status, r.statusText);
    if (r.ok) {
      console.log('[wewe] ✓ 管理台可访问 → 浏览器打开', BASE);
      console.log('     授权码 AUTH_CODE =', process.env.WEWE_RSS_AUTH_CODE || '123567（默认）');
      console.log('     添加公众号后复制 RSS，执行：npm run wewe -- add <url> <名称>');
    } else {
      console.log('[wewe] 服务在跑但返回异常，请打开管理台检查');
    }
  } catch (e) {
    console.log('[wewe] ✗ 无法连接。先执行：npm run wewe:up');
    console.log('     ', e.message || e);
    process.exit(1);
  }
}

function template() {
  const t = JSON.parse(fs.readFileSync(TEMPLATE, 'utf8'));
  console.log('WeWe-RSS 基址：', t.weweRssBase);
  console.log('\n建议在管理台搜索并订阅的公众号（复制文章链接添加）：\n');
  for (const a of t.suggestedAccounts) {
    console.log(`  · ${a.room}  →  微信搜「${a.search}」`);
  }
  console.log('\n订阅成功后，在管理台复制单源 RSS，例如：');
  console.log(' ', t.exampleFeedUrl);
  console.log('\n写入破壳采集源：');
  console.log('  npm run wewe -- add ' + t.exampleFeedUrl + ' 东华团委');
  console.log('或：node scripts/source.js add <rss-url> <名称>');
}

function add(url, room) {
  if (!url || !room) {
    console.error('用法：npm run wewe -- add <rss-url> <来源名>');
    process.exit(1);
  }
  const item = sources.add({
    type: 'rss',
    url,
    room: room + '（公众号）',
    wewe: true,
  });
  console.log('已添加 RSS 源：', item.id);
  console.log('  ', item.room);
  console.log('  ', item.url);
  console.log('\n立即验证：npm run poll');
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'check') return check();
  if (cmd === 'template' || cmd === 'list') return template();
  if (cmd === 'add') return add(a, b);
  console.log(`WeWe-RSS 接入（基址 ${BASE}）

命令：
  check      探测 WeWe-RSS 是否在跑
  template   东华建议订阅的公众号列表
  add <url> <名称>   把 RSS 写入 data/sources.json

Docker：
  npm run wewe:up    启动 WeWe-RSS
  npm run wewe:down  停止

文档：docs/wewe-rss.md
`);
}

main().catch(e => { console.error(e); process.exit(1); });
