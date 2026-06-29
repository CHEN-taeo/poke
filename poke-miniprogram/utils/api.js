const { API_BASE } = require('./config');

function req(path, method, data) {
  return new Promise((resolve) => {
    if (!API_BASE) return resolve(null);
    wx.request({
      url: API_BASE + path,
      method: method || 'GET',
      data: data || {},
      timeout: 8000,
      success: (r) => resolve(r.statusCode >= 200 && r.statusCode < 300 ? r.data : null),
      fail: () => resolve(null)
    });
  });
}

function q(uid, extra) {
  let s = '?uid=' + encodeURIComponent(uid || '');
  if (extra) {
    Object.keys(extra).forEach((k) => {
      if (extra[k] !== undefined && extra[k] !== '') {
        s += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(extra[k]);
      }
    });
  }
  return s;
}

module.exports = {
  enabled: () => !!API_BASE,
  feed: (uid, extra) => req('/api/feed' + q(uid, extra)),
  radar: (uid, extra) => req('/api/radar' + q(uid, extra)),
  buddy: (uid, extra) => req('/api/buddy' + q(uid, extra)),
  poke: (uid, extra) => req('/api/poke' + q(uid, extra)),
  gap: (uid, extra) => req('/api/gap' + q(uid, extra)),
  calendar: (uid, extra) => req('/api/calendar' + q(uid, extra)),
  me: (uid, extra) => req('/api/me' + q(uid, extra)),
  aiPulse: (uid, extra) => req('/api/ai-pulse' + q(uid, extra)),
  aiDigest: (week) => req('/api/ai-pulse/digest' + (week ? '?week=' + encodeURIComponent(week) : '')),
  aiDigestGenerate: () => req('/api/ai-pulse/digest/generate', 'POST', {}),
  poll: () => req('/api/poll', 'POST', {}),
  sources: () => req('/api/sources'),
  mpSuggestions: () => req('/api/mp-suggestions'),
  addSource: (url, room) => req('/api/sources', 'POST', { url, room, type: 'rss' }),
  items: () => req('/api/items'),
  item: (id, uid) => req('/api/items/' + encodeURIComponent(id) + q(uid || '')),
  eventTypes: () => req('/api/event-types'),
  health: () => req('/api/health'),
  ingest: (text, room, extra) => req('/api/ingest', 'POST', Object.assign({ text, room: room || '文件传输助手', sender: '我', source: 'forward' }, extra || {})),
  paste: (text, room, extra) => req('/api/ingest/paste', 'POST', Object.assign({ text, room: room || '文件传输助手', mode: 'lines' }, extra || {})),
  engage: (uid, name, itemId, action, value) => req('/api/engage', 'POST', { uid, name, itemId, action, value }),
  ask: (itemId, question, interests, uid) => req('/api/ask', 'POST', { itemId, question, interests, uid }),
  insider: (uid, itemId, insiderNote, eventType) => req('/api/items/' + encodeURIComponent(itemId) + '/insider', 'POST', { uid, insiderNote, eventType })
};
