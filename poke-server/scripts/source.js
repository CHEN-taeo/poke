// 自动采集源 CLI：增删查。让「加一个公众号/RSS 源」变成一条命令。
// 用法：
//   node scripts/source.js list
//   node scripts/source.js add <url> [显示名] [间隔分钟可选写在.env]
//   node scripts/source.js rm <id>
//   node scripts/source.js poll            # 立刻拉一次全部（验证）
const path = require('path');
const sources = require(path.join(__dirname, '..', 'src', 'ingest', 'sources'));

async function main() {
  const [cmd, a, b] = process.argv.slice(2);

  if (cmd === 'list' || !cmd) {
    const l = sources.list();
    if (!l.length) return console.log('（暂无源）用： node scripts/source.js add <url> <名称>');
    for (const s of l) {
      const when = s.lastPoll ? new Date(s.lastPoll).toLocaleString() : '从未';
      const err = s.lastError ? ('  ⚠ ' + s.lastError) : '';
      console.log(`${s.enabled === false ? '✗' : '✓'} ${s.id}  [${s.room || '未命名'}]  上次:${when} 新增:${s.lastCount || 0}${err}\n    ${s.url}`);
    }
    return;
  }

  if (cmd === 'add') {
    if (!a) return console.error('缺少 URL。用： node scripts/source.js add <url> <名称> [web|rss]');
    const typ = (process.argv[4] || 'rss').toLowerCase();
    const type = typ === 'web' ? 'web' : 'rss';
    const item = sources.add({ type, url: a, room: b || '自动源' });
    console.log('已添加：' + item.id + '  ' + (item.room) + '\n  ' + item.url);
    console.log('下次轮询会自动入库；想马上验证： node scripts/source.js poll');
    return;
  }

  if (cmd === 'rm') {
    if (!a) return console.error('缺少 id。先 list 查看 id。');
    sources.remove(a);
    console.log('已删除：' + a);
    return;
  }

  if (cmd === 'poll') {
    const scheduler = require(path.join(__dirname, '..', 'src', 'ingest', 'scheduler'));
    const r = await scheduler.pollAll();
    console.log(`轮询完成：源 ${r.sources} 个，本次新增 ${r.added} 条`);
    return;
  }

  console.error('未知命令。可用： list | add <url> [名称] | rm <id> | poll');
  process.exit(1);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
