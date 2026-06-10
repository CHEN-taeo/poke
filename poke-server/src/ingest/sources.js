// 自动采集源管理（存 data/sources.json）
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'data', 'sources.json');

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return null; }
}
function write(list) { fs.writeFileSync(FILE, JSON.stringify(list, null, 2)); }

// 首次无文件时给东华大学官网源（真实校园通知）
function seedIfEmpty() {
  if (read() === null) {
    write([
      { id: 'src_dhu_jw', type: 'web', url: 'https://jw.dhu.edu.cn/tzgg/list1.htm', room: '东华教务处', enabled: true, lastPoll: 0, lastCount: 0, lastError: '' },
      { id: 'src_dhu_xs', type: 'web', url: 'https://web.dhu.edu.cn/dhuzizhu/tzgg/list1.htm', room: '东华学生资助', enabled: true, lastPoll: 0, lastCount: 0, lastError: '' },
      { id: 'src_dhu_main', type: 'web', url: 'https://www.dhu.edu.cn/tzgg/list1.htm', room: '东华大学官网', enabled: true, lastPoll: 0, lastCount: 0, lastError: '' }
    ]);
  }
}

function list() { seedIfEmpty(); return read() || []; }
function add(src) {
  const l = list();
  const item = Object.assign(
    { id: 'src_' + Date.now().toString(36), type: 'rss', room: '', enabled: true, lastPoll: 0, lastCount: 0, lastError: '' },
    src
  );
  l.push(item); write(l); return item;
}
function remove(id) { write(list().filter(s => s.id !== id)); }
function update(id, patch) {
  const l = list();
  const i = l.findIndex(s => s.id === id);
  if (i >= 0) { l[i] = Object.assign(l[i], patch); write(l); return l[i]; }
  return null;
}

module.exports = { list, add, remove, update };
