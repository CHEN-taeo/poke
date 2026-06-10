const api = require('../../utils/api.js');

Page({
  data: { text: '', room: '文件传输助手', loading: false },
  onText(e) { this.setData({ text: e.detail.value }); },
  onRoom(e) { this.setData({ room: e.detail.value }); },
  async submit() {
    const text = this.data.text.trim();
    if (!text) { wx.showToast({ title: '先粘贴内容', icon: 'none' }); return; }
    if (!api.enabled()) { wx.showToast({ title: '未连接后端', icon: 'none' }); return; }
    this.setData({ loading: true });
    const r = await api.paste(text, this.data.room.trim());
    this.setData({ loading: false });
    if (!r) { wx.showToast({ title: '请求失败', icon: 'none' }); return; }
    wx.showModal({
      title: '导入完成',
      content: '解析 ' + r.parsed + ' 条，新增 ' + r.added + ' 条有效信号',
      showCancel: false,
      success: () => { this.setData({ text: '' }); wx.navigateBack(); }
    });
  }
});
