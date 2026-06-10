const store = require('../../utils/store.js');
const CATS = ['活动', '搭子', '通知', '资源'];

Page({
  data: {
    k: { go: 0, buddy: 0, attended: 0, reflected: 0 },
    shown: 0, ctr: 0,
    items: [], pokeId: '', pokeTitle: '',
    cats: CATS, catIndex: 0,
    showEdit: false,
    edit: { id: '', poke: false, isNew: true, title: '', summary: '', time: '', place: '', tagsStr: '' }
  },

  onShow() { this.refresh(); },

  refresh() {
    const S = store.load();
    const t = store.todayStr();
    const items = (S.days[t] || []);
    const poke = S.pokeOfDay[t];
    const distinct = Object.keys(S.eng).filter(id => S.eng[id].go).length;
    const attended = Object.values(S.eng).filter(x => x.attended).length;
    const reflected = Object.keys(S.reflect).filter(id => S.reflect[id].text).length;
    const shown = store.todayItems(S).length;
    const ctr = shown ? Math.round(distinct / shown * 100) : 0;
    this.setData({
      k: { go: S.log.goClicks, buddy: S.log.buddyClicks, attended, reflected },
      shown, ctr,
      items, pokeId: poke ? poke.id : '', pokeTitle: poke ? poke.title : ''
    });
  },

  openEdit(e) {
    const id = e.currentTarget.dataset.id;
    const S = store.load();
    let edit, catIndex = 0;
    if (id === '__new') {
      edit = { id: 'i' + Date.now(), poke: false, isNew: true, title: '', summary: '', time: '', place: '', tagsStr: '' };
    } else if (!id) {
      // new poke card
      edit = { id: 'p' + Date.now(), poke: true, isNew: true, title: '', summary: '', time: '', place: '', tagsStr: '跨学科，打破茧房' };
    } else {
      const it = store.allItemsById(S, id);
      edit = {
        id: it.id, poke: !!it.poke, isNew: false,
        title: it.title || '', summary: it.summary || '', time: it.time || '', place: it.place || '',
        tagsStr: (it.tags || []).join('，')
      };
      const ci = CATS.indexOf(it.cat);
      if (ci >= 0) catIndex = ci;
    }
    this.setData({ showEdit: true, edit, catIndex });
  },

  onCat(e) { this.setData({ catIndex: Number(e.detail.value) }); },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['edit.' + field]: e.detail.value });
  },

  saveItem() {
    const ed = this.data.edit;
    if (!ed.title.trim()) { wx.showToast({ title: '标题不能为空', icon: 'none' }); return; }
    const S = store.load();
    const t = store.todayStr();
    const item = {
      id: ed.id,
      cat: ed.poke ? '破壳' : CATS[this.data.catIndex],
      poke: ed.poke,
      title: ed.title.trim(),
      summary: ed.summary.trim(),
      time: ed.time.trim(),
      place: ed.place.trim(),
      tags: ed.tagsStr.split(/[，,]/).map(s => s.trim()).filter(Boolean)
    };
    if (item.poke) {
      S.pokeOfDay[t] = item;
    } else {
      S.days[t] = S.days[t] || [];
      const arr = S.days[t];
      const i = arr.findIndex(x => x.id === item.id);
      if (i >= 0) arr[i] = item; else arr.push(item);
    }
    store.save(S);
    this.setData({ showEdit: false });
    this.refresh();
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  del(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除这条？', content: '删除后无法恢复',
      success: (r) => {
        if (!r.confirm) return;
        const S = store.load();
        const t = store.todayStr();
        S.days[t] = (S.days[t] || []).filter(x => x.id !== id);
        store.save(S);
        this.refresh();
      }
    });
  },

  resetData() {
    wx.showModal({
      title: '重置为示例数据？', content: '会清空所有录入和参与记录',
      success: (r) => { if (r.confirm) { store.reset(); this.refresh(); wx.showToast({ title: '已重置', icon: 'success' }); } }
    });
  },

  closeEdit() { this.setData({ showEdit: false }); },
  noop() {}
});
