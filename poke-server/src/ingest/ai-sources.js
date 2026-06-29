// AI 采集源管理（data/ai-sources.json）
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'data', 'ai-sources.json');

function read() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { return null; }
}
function write(list) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.warn('[ai-sources] 写盘失败（可能被占用）:', e.message);
  }
}

function seedIfEmpty() {
  if (read() === null) write([]);
}

function list() {
  seedIfEmpty();
  const data = read();
  return Array.isArray(data) ? data : [];
}

function add(src) {
  const l = list();
  const item = Object.assign({
    id: 'ai_' + Date.now().toString(36),
    lane: 'ai',
    type: 'rss',
    room: '',
    platform: 'rss',
    enabled: true,
    lastPoll: 0,
    lastCount: 0,
    lastError: ''
  }, src);
  l.push(item);
  write(l);
  return item;
}

function remove(id) { write(list().filter(s => s.id !== id)); }

function update(id, patch) {
  const l = list();
  const i = l.findIndex(s => s.id === id);
  if (i >= 0) { l[i] = Object.assign(l[i], patch); write(l); return l[i]; }
  return null;
}

/** 解析 RSSHub 相对路径 */
function resolveUrl(src) {
  if (!src.url) return '';
  if (/^https?:\/\//i.test(src.url)) return src.url;
  const base = (process.env.RSSHUB_BASE || '').replace(/\/$/, '');
  if (!base) throw new Error('RSSHUB_BASE 未配置，无法解析相对路径: ' + src.url);
  return base + (src.url.startsWith('/') ? src.url : '/' + src.url);
}

module.exports = { list, add, remove, update, resolveUrl };
