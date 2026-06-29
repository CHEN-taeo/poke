const store = require('../../utils/store.js');
const api = require('../../utils/api.js');
const act = require('../../utils/act.js');
const askReply = require('../../utils/askReply.js');
const reminderUtil = require('../../utils/reminder.js');
const safearea = require('../../utils/safearea.js');

Page({
  data: {
    loading: true,
    ready: false,
    item: null,
    missing: false,
    coverLoaded: false,
    shareId: '',
    statusBarHeight: 20,
    askPresets: askReply.PRESETS,
    askAnswer: '',
    userNote: '',
    showFireflyFly: false,
    flyX: 0,
    flyY: 0
  },

  onLoad(options) {
    const insets = safearea.applyToPage(this);
    this.setData({ statusBarHeight: insets.statusBarHeight });
    const id = String(options.id || options['id'] || '').trim();
    this.load(id);
  },

  _applyItem(raw, S, id) {
    let vm = null;
    try {
      vm = store.detailVM(raw, S);
    } catch (err) {
      this.setData({ loading: false, missing: true, item: null });
      return;
    }
    if (!vm) {
      this.setData({ loading: false, missing: true, item: null });
      return;
    }
    this.setData({
      loading: false,
      missing: false,
      item: vm,
      shareId: id,
      userNote: store.getNote(S, id),
      ready: false,
      coverLoaded: false
    });
    wx.nextTick(() => this.setData({ ready: true }));
  },

  async load(id) {
    id = String(id || '').trim();
    if (!id) {
      this.setData({ loading: false, missing: true });
      return;
    }

    const S = store.load();
    const raw = store.allItemsById(S, id);

    if (raw) {
      this._applyItem(raw, S, id);
    } else {
      this.setData({ loading: true, missing: false, ready: false, coverLoaded: false, item: null });
    }

    if (api.enabled()) {
      const remote = await api.item(id, S.uid);
      if (remote && remote.id) {
        store.cacheItems(S, [remote]);
        store.save(S);
        this._applyItem(remote, S, id);
      } else if (!raw) {
        this.setData({ loading: false, missing: true, item: null });
      }
      return;
    }

    if (!raw) {
      this.setData({ loading: false, missing: true, item: null });
    }
  },

  onCoverLoad() {
    this.setData({ coverLoaded: true });
  },

  onCopyLink(e) {
    act.handle(this, e);
  },

  onSave(e) {
    act.handle(this, e);
  },

  onRemind() {
    const item = this.data.item;
    if (!item) return;
    const S = store.load();
    const wasOn = store.hasReminder(S, item.id);
    const on = store.toggleReminder(S, item.id, item);
    store.save(S);
    act.vibrate(on ? 'medium' : 'light');
    if (on && !wasOn) {
      reminderUtil.addToCalendar(item).then((ok) => {
        wx.showToast({
          title: ok ? '已设提醒并写入日历' : '已加入待办提醒',
          icon: 'none'
        });
      });
    } else {
      wx.showToast({ title: on ? '已加入待办提醒' : '已取消提醒', icon: 'none' });
    }
    this.setData({ 'item.hasReminder': on });
  },

  async onAskTap(e) {
    const q = e.currentTarget.dataset.q;
    const item = this.data.item;
    if (!item) return;
    act.vibrate('light');
    this.setData({ askAnswer: '思考中…' });
    const S = store.load();
    let answer = null;
    if (api.enabled()) {
      const remote = await api.ask(item.id, q, S.interests || [], S.uid);
      if (remote && remote.answer) answer = remote.answer;
    }
    if (!answer) answer = askReply.reply(item, q, S.interests || []);
    this.setData({ askAnswer: answer });
  },

  onNoteInput(e) {
    this.setData({ userNote: e.detail.value });
  },

  onNoteBlur() {
    const item = this.data.item;
    if (!item) return;
    const S = store.load();
    store.setNote(S, item.id, this.data.userNote);
    store.save(S);
    if (this.data.userNote.trim()) {
      wx.showToast({ title: '已记下收藏理由', icon: 'none' });
    }
  },

  triggerFireflyFly() {
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : { windowWidth: 375, windowHeight: 667 };
      const x = (win.windowWidth || 375) * 0.5;
      const y = (win.windowHeight || 667) * 0.6;
      this.setData({ showFireflyFly: true, flyX: x, flyY: y });
      setTimeout(() => this.setData({ showFireflyFly: false }), 650);
    } catch (e) {}
  },

  onCopyAll() {
    const item = this.data.item;
    if (!item) return;
    const lines = [
      item.title,
      item.time ? '时间：' + item.time : '',
      item.place ? '地点：' + item.place : '',
      item.deadline ? '截止：' + item.deadline : '',
      '',
      item.displayBody || item.rawText || item.detailLede || ''
    ].filter((x, i, arr) => x || (i > 0 && i < arr.length - 1)).join('\n');
    wx.setClipboardData({
      data: lines.trim(),
      success: () => wx.showToast({ title: '已复制全部信息', icon: 'none' })
    });
  },

  onShare() {
    const id = this.data.shareId;
    if (!id) return;
    wx.navigateTo({ url: '/pages/share/share?id=' + encodeURIComponent(id) });
  },

  onBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/today/today' }) });
  }
});
