const { API_BASE } = require('./config');

function req(path, method, data) {
  return new Promise((resolve) => {
    if (!API_BASE) return resolve(null);
    wx.request({
      url: API_BASE + path,
      method: method || 'GET',
      data: data || {},
      timeout: 5000,
      success: (r) => resolve(r.statusCode >= 200 && r.statusCode < 300 ? r.data : null),
      fail: () => resolve(null)
    });
  });
}

const q = (uid) => '?uid=' + encodeURIComponent(uid || '');

module.exports = {
  enabled: () => !!API_BASE,
  feed: (uid) => req('/api/feed' + q(uid)),
  radar: (uid) => req('/api/radar' + q(uid)),
  buddy: (uid) => req('/api/buddy' + q(uid)),
  poke: (uid) => req('/api/poke' + q(uid)),
  me: (uid) => req('/api/me' + q(uid)),
  health: () => req('/api/health'),
  ingest: (text, room) => req('/api/ingest', 'POST', { text, room: room || '文件传输助手', sender: '我', source: 'forward' }),
  paste: (text, room) => req('/api/ingest/paste', 'POST', { text, room: room || '文件传输助手', mode: 'lines' }),
  // 多人计数：action = go|buddy|attended
  engage: (uid, name, itemId, action, value) => req('/api/engage', 'POST', { uid, name, itemId, action, value })
};
