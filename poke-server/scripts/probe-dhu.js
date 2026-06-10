const urls = [
  ['教务处', 'https://jw.dhu.edu.cn/tzgg/list1.htm'],
  ['学生资助', 'https://web.dhu.edu.cn/dhuzizhu/tzgg/list1.htm'],
  ['学校主页', 'https://www.dhu.edu.cn/tzgg/list1.htm'],
];
const { parseSudyList } = require('../src/ingest/web');
fetch('https://jw.dhu.edu.cn/tzgg/list1.htm', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => r.text())
  .then(t => console.log('jw', parseSudyList(t, 'https://jw.dhu.edu.cn/tzgg/list1.htm').slice(0, 3)));

(async () => {
  for (const [name, url] of urls.slice(1)) {
    try {
      const t = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
      const items = parseSudyList(t, url);
      console.log(name, items.length, items[0]?.title);
    } catch (e) { console.log(name, e.message); }
  }
})();
