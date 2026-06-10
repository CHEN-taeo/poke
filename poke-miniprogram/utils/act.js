// 统一处理卡片上的「想去 / 找搭子 / 我去过了」
// 在线：写后端（多人计数同步）；离线：写本机 storage。
const store = require('./store.js');
const api = require('./api.js');

function findCard(data, id) {
  const arrs = [data.normal, data.poke, data.items].filter(Array.isArray);
  for (const a of arrs) { const f = a.find(x => x.id === id); if (f) return f; }
  return null;
}

async function handle(page, e) {
  const { id, act } = e.currentTarget.dataset;
  const S = store.load();
  const card = findCard(page.data, id);

  if (page.data.online) {
    let action = act, value;
    if (act === 'go') value = !(card && card.go);
    else if (act === 'buddy') value = !(card && card.buddy);
    else { action = 'attended'; value = !(card && card.attended); }
    await api.engage(S.uid, S.meName, id, action, value);
    if (action === 'attended' && value) wx.showToast({ title: '已标记，去「复盘」看看', icon: 'none' });
    return page.refresh();
  }

  // 离线：本机
  const en = store.eng(S, id);
  if (act === 'go') { en.go = !en.go; if (en.go) S.log.goClicks++; if (!en.go) en.attended = false; }
  else if (act === 'buddy') { en.buddy = !en.buddy; if (en.buddy) S.log.buddyClicks++; }
  else { en.attended = !en.attended; if (en.attended) wx.showToast({ title: '已标记，去「复盘」看看', icon: 'none' }); }
  store.save(S);
  page.refresh();
}

module.exports = { handle, findCard };
