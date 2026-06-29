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
  if (!cache.aiDigests) cache.aiDigests = [];
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

function recentDuplicate(text, url) {
  const d = db();
  const n = normalize(text);
  if (!n && !url) return true;
  if (url) {
    const u = (url || '').trim().toLowerCase();
    if (u && d.items.some(it => (it.url || '').trim().toLowerCase() === u)) return true;
  }
  if (n && d.items.some(it => normalize(it.rawText) === n)) return true;
  return false;
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

function getItem(id) {
  return db().items.find(it => it.id === id) || null;
}

function updateItem(id, patch) {
  const d = db();
  const i = d.items.findIndex(it => it.id === id);
  if (i < 0) return null;
  d.items[i] = Object.assign({}, d.items[i], patch);
  persist();
  return d.items[i];
}

function reset() {
  cache = { raw: [], items: [], engage: {}, aiDigests: [], seq: 0 };
  persist();
}

function aiDigests() { return db().aiDigests.slice(); }

function saveAiDigest(digest) {
  const d = db();
  const i = d.aiDigests.findIndex(x => x.week === digest.week);
  if (i >= 0) d.aiDigests[i] = digest;
  else d.aiDigests.unshift(digest);
  persist();
  return digest;
}

function getAiDigest(week) {
  return db().aiDigests.find(x => x.week === week) || null;
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
function enrich(it, uid, enrichOpts) {
  const c = counts(it.id);
  const base = Object.assign({}, it, {
    goN: c.goN, bdN: c.bdN, atN: c.atN, buddyNames: c.buddyNames,
    mine: uid ? mineState(it.id, uid) : { go: false, buddy: false, attended: false }
  });
  if (it.lane === 'ai' || it.cat === 'AI脉动') {
    return require('./pulse').withPulse(base, uid, enrichOpts);
  }
  return require('./gap').withGap(base, uid, enrichOpts);
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
  getItem, updateItem, aiDigests, saveAiDigest, getAiDigest,
  setEngage, counts, mineState, enrich, myItemIds
};
