const api = require('../../utils/api.js');
const store = require('../../utils/store.js');
const theme = require('../../utils/theme.js');
const safearea = require('../../utils/safearea.js');
const brand = require('../../utils/brand.js');
const act = require('../../utils/act.js');

const SUGGEST_TAGS = ['灵感', '链接', '活动', '机会', '待读', '破壳'];

Page({
  data: {
    themeDark: false,
    navPadTop: 24,
    navPadRight: 24,
    brandName: brand.NAME,
    inputType: 'text',
    text: '',
    imagePath: '',
    focused: false,
    loading: false,
    suggestTags: SUGGEST_TAGS,
    selectedTags: [],
    placeholder: '在此落墨…粘贴群消息、链接或随手记下的想法'
  },

  onLoad() {
    safearea.applyToPage(this);
    theme.applyPageTheme(this);
  },

  pasteClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const t = (res.data || '').trim();
        if (!t) {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }
        let inputType = 'text';
        if (/^https?:\/\//i.test(t)) inputType = 'link';
        else if (t.length < 80 && !/\n/.test(t)) inputType = 'spark';
        this.setData({ text: t, inputType });
        act.vibrate('light');
      }
    });
  },

  onType(e) {
    const inputType = e.currentTarget.dataset.type;
    let placeholder = '在此落墨…粘贴群消息、链接或随手记下的想法';
    if (inputType === 'link') placeholder = '粘贴链接，可附上一句你的想法';
    if (inputType === 'spark') placeholder = '一句话灵感、摘录或待读 — 不必是校园机会';
    if (inputType === 'image') placeholder = '选图后可补充说明，后续可接 OCR';
    this.setData({ inputType, placeholder, text: '', imagePath: '' });
  },

  onText(e) { this.setData({ text: e.detail.value }); },
  onFocus() { this.setData({ focused: true }); },
  onBlur() { this.setData({ focused: false }); },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const set = new Set(this.data.selectedTags);
    if (set.has(tag)) set.delete(tag); else set.add(tag);
    this.setData({ selectedTags: Array.from(set) });
  },

  pickImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        this.setData({ imagePath: path });
      }
    });
  },

  onCancel() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/today/today' }) });
  },

  async submit() {
    let text = this.data.text.trim();
    if (this.data.inputType === 'link' && text && !/^https?:\/\//i.test(text)) {
      text = 'https://' + text;
    }
    if (this.data.inputType === 'image' && this.data.imagePath) {
      text = (text ? text + '\n' : '') + '[截图待识别] ' + this.data.imagePath;
    }
    if (this.data.inputType === 'spark' && text) {
      text = '【灵感】' + text;
    }
    const tagPrefix = this.data.selectedTags.length
      ? '【标签:' + this.data.selectedTags.join(',') + '】\n'
      : '';
    text = tagPrefix + text;
    if (!text.trim()) {
      wx.showToast({ title: '先写点什么', icon: 'none' });
      return;
    }

    const finishLocal = (item) => {
      act.vibrate('medium');
      try { wx.setStorageSync('poke.addSuccess', item); } catch (e) {}
      wx.redirectTo({ url: '/pages/add-success/add-success?id=' + encodeURIComponent(item.id) });
    };

    if (!api.enabled()) {
      const S = store.load();
      const item = store.ingestLocalCapture(S, {
        text: text,
        tags: this.data.selectedTags,
        inputType: this.data.inputType
      });
      if (!item) {
        wx.showToast({ title: '收录失败', icon: 'none' });
        return;
      }
      store.save(S);
      finishLocal(item);
      return;
    }

    this.setData({ loading: true });
    const lane = this.data.inputType === 'spark' || this.data.selectedTags.indexOf('灵感') >= 0 ? 'ai' : undefined;
    const r = await api.paste(text, '手动收录', lane ? { lane: lane } : {});
    this.setData({ loading: false });
    if (!r) {
      const S = store.load();
      const item = store.ingestLocalCapture(S, {
        text: text,
        tags: this.data.selectedTags,
        inputType: this.data.inputType
      });
      if (item) {
        store.save(S);
        finishLocal(item);
        return;
      }
      wx.showToast({ title: '嗯，好像出了点问题，我们再试一次', icon: 'none' });
      return;
    }
    const items = (r && r.items) || [];
    const first = items[0];
    if (first && first.id) {
      const S = store.load();
      store.cacheItems(S, items);
      store.save(S);
      finishLocal(first);
      return;
    }
    wx.showToast({ title: '已收录', icon: 'success' });
    setTimeout(() => {
      this.setData({ text: '', imagePath: '' });
      wx.switchTab({ url: '/pages/today/today' });
    }, 600);
  }
});
