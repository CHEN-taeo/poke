const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

let cache = null;
function db() {
  if (cache) return cache;
  ensure();
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    cache = { raw: [], items: [], seq: 0 };
  }
  if (!cache.raw) cache.raw = [];
  if (!cache.items) cache.items = [];
  if (!cache.engage) cache.engage = {}; // { itemId: { go:{uid:true}, buddy:{uid:name}, attended:{uid:true} } }
  if (typeof cache.seq !== 'number') cache.seq = 0;
  return cache;
}

let writeTimer = null;
function persist() {
  ensure();
  // 防抖写盘，降低高频投喂时的 IO
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
  }, 120);
}

function id(prefix) {
  const d = db();
  d.seq += 1;
  return prefix + '_' + Date.now().toString(36) + d.seq.toString(36);
}

function normalize(t) {
  return (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function addRaw(msg) {
  const d = db();
  const rec = {
    id: id('raw'),
    source: msg.source || 'group',
    room: msg.room || '',
    sender: msg.sender || '',
    text: msg.text || '',
    url: msg.url || '',
    ts: msg.ts || Date.now()
  };
  d.raw.unshift(rec);
  persist();
  return rec;
}

function recentDuplicate(text) {
  const d = db();
  const n = normalize(text);
  if (!n) return true;
  return d.items.some(it => normalize(it.rawText) === n);
}

function addItem(it) {
  const d = db();
  const rec = Object.assign({ id: id('it'), ts: Date.now() }, it);
  d.items.unshift(rec);
  persist();
  return rec;
}

function items() { return db().items.slice(); }
function raw() { return db().raw.slice(); }

function reset() {
  cache = { raw: [], items: [], engage: {}, seq: 0 };
  persist();
}

/* ---------- engagement（多人“想去/找搭子/去过”，按 uid 计数） ---------- */
function engageBucket(itemId) {
  const d = db();
  if (!d.engage[itemId]) d.engage[itemId] = { go: {}, buddy: {}, attended: {} };
  return d.engage[itemId];
}
function setEngage(itemId, uid, name, action, value) {
  if (!itemId || !uid || !['go', 'buddy', 'attended'].includes(action)) return null;
  const b = engageBucket(itemId);
  if (action === 'buddy') {
    if (value) b.buddy[uid] = name || '同学'; else delete b.buddy[uid];
  } else {
    if (value) b[action][uid] = true; else delete b[action][uid];
  }
  persist();
  return counts(itemId);
}
function counts(itemId) {
  const d = db();
  const b = d.engage[itemId] || { go: {}, buddy: {}, attended: {} };
  return {
    goN: Object.keys(b.go || {}).length,
    bdN: Object.keys(b.buddy || {}).length,
    atN: Object.keys(b.attended || {}).length,
    buddyNames: Object.values(b.buddy || {})
  };
}
function mineState(itemId, uid) {
  const d = db();
  const b = d.engage[itemId] || { go: {}, buddy: {}, attended: {} };
  return { go: !!b.go[uid], buddy: !!b.buddy[uid], attended: !!b.attended[uid] };
}
function enrich(it, uid) {
  const c = counts(it.id);
  return Object.assign({}, it, {
    goN: c.goN, bdN: c.bdN, atN: c.atN, buddyNames: c.buddyNames,
    mine: uid ? mineState(it.id, uid) : { go: false, buddy: false, attended: false }
  });
}
function myItemIds(uid) {
  const d = db();
  return Object.keys(d.engage).filter(id => {
    const b = d.engage[id];
    return (b.go && b.go[uid]) || (b.buddy && b.buddy[uid]) || (b.attended && b.attended[uid]);
  });
}

module.exports = {
  db, persist, addRaw, addItem, items, raw, reset, recentDuplicate, normalize,
  setEngage, counts, mineState, enrich, myItemIds
};
