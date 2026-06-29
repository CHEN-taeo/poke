/** 提醒解析与系统日历写入 */

function pad(n) { return (n < 10 ? '0' : '') + n; }

function parseWhen(item) {
  if (!item) return null;
  const now = new Date();
  const dl = item.deadline || '';
  const tm = item.time || '';

  if (/今天|今晚/.test(dl + tm)) {
    const d = new Date(now);
    d.setHours(18, 0, 0, 0);
    if (d.getTime() < now.getTime()) d.setHours(now.getHours() + 2, 0, 0, 0);
    return d;
  }
  if (/明天/.test(dl + tm)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }
  const dayMatch = dl.match(/周([一二三四五六日天])/);
  if (dayMatch) {
    const map = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 };
    const target = map[dayMatch[1]];
    if (target !== undefined) {
      const d = new Date(now);
      const diff = (target - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(17, 0, 0, 0);
      return d;
    }
  }
  const daysMatch = dl.match(/(\d+)\s*天/);
  if (daysMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(daysMatch[1], 10));
    d.setHours(17, 0, 0, 0);
    return d;
  }
  const hm = (dl + ' ' + tm).match(/(\d{1,2})[:：](\d{2})/);
  if (hm) {
    const d = new Date(now);
    d.setHours(parseInt(hm[1], 10), parseInt(hm[2], 10), 0, 0);
    if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }
  if (typeof item.daysToDeadline === 'number' && item.daysToDeadline >= 0) {
    const d = new Date(now);
    d.setDate(d.getDate() + item.daysToDeadline);
    d.setHours(17, 0, 0, 0);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function fmtWhen(d) {
  if (!d) return '';
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function addToCalendar(item) {
  const when = parseWhen(item);
  if (!when || !wx.addPhoneCalendar) return Promise.resolve(false);
  const start = Math.floor(when.getTime() / 1000);
  const end = start + 3600;
  const title = (item.title || '流萤提醒').slice(0, 60);
  const description = [
    item.detailLede || item.summary || '',
    item.place ? '地点：' + item.place : '',
    item.url ? '链接：' + item.url : ''
  ].filter(Boolean).join('\n').slice(0, 500);

  return new Promise((resolve) => {
    wx.addPhoneCalendar({
      title: title,
      startTime: start,
      endTime: end,
      description: description,
      location: item.place || '',
      alarm: true,
      alarmOffset: 3600,
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

module.exports = { parseWhen, fmtWhen, addToCalendar };
