const store = require('./store.js');

function vibrate(kind) {
  try {
    wx.vibrateShort({ type: kind === 'medium' ? 'medium' : 'light' });
  } catch (e) {}
}

async function handle(page, e) {
  const ds = e.currentTarget.dataset;
  const act = ds.act;
  const url = ds.url;
  const id = ds.id;

  if (act === 'copylink' && url) {
    vibrate('light');
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'none' })
    });
    return;
  }

  if (act === 'save' && id) {
    const S = store.load();
    const on = store.toggleSaved(S, id);
    store.save(S);
    vibrate(on ? 'medium' : 'light');
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' });
    if (page && page.setData && page.data.item) {
      page.setData({ 'item.saved': on });
    }
    if (on && page && typeof page.triggerFireflyFly === 'function') {
      page.triggerFireflyFly();
    }
    return on;
  }
}

function isSaved(id) {
  const S = store.load();
  return store.isSaved(S, id);
}

module.exports = { handle, vibrate, isSaved };
