/** 详情页一键追问 — 规则回复（无 LLM 时） */

function reply(item, question, interests) {
  const q = question || '';
  const who = (item.whoFor || []).join('；');
  const actions = (item.actions || []).join('；');
  const lede = item.detailLede || item.summary || '';
  const ints = interests || [];

  if (/适合我|适合谁|适合参加/.test(q)) {
    if (who) {
      const hit = ints.filter((i) => who.indexOf(i) >= 0 || (item.tags || []).indexOf(i) >= 0);
      if (hit.length) return '与你设置的「' + hit.join('、') + '」兴趣吻合。整理结果认为更适合：' + who;
      return '从整理结果看，更适合：' + who + '。对照「我的」页兴趣标签再判断。';
    }
    if (ints.length && (item.tags || []).some((t) => ints.indexOf(t) >= 0)) {
      return '标签命中你的兴趣「' + ints.filter((i) => (item.tags || []).indexOf(i) >= 0).join('、') + '」，值得进一步了解。';
    }
    return '这条信息较通用，建议先看「要做什么」再决定是否行动。';
  }
  if (/准备什么|需要什么/.test(q)) {
    const parts = [];
    if (actions) parts.push('建议准备：' + actions);
    if (item.place) parts.push('地点：' + item.place);
    if (item.time) parts.push('时间：' + item.time);
    if (item.url) parts.push('打开链接确认材料清单');
    if (parts.length) return parts.join('；');
    return '原文未给出明确清单，建议先收藏，截止前再核对一次。';
  }
  if (/值得|要不要|现在行动/.test(q)) {
    if (typeof item.daysToDeadline === 'number' && item.daysToDeadline >= 0 && item.daysToDeadline <= 3) {
      return '截止很近（约 ' + item.daysToDeadline + ' 天内），若相关建议现在就行动。';
    }
    if (item.deadline) return '有明确截止时间：' + item.deadline + '。若与你目标相关，建议优先处理。';
    return lede ? lede.slice(0, 100) : '可先收藏，稍后读时再决定。';
  }
  return lede ? lede.slice(0, 120) : '暂无更多解读，请查看上方正文。';
}

const PRESETS = [
  '我适合参加吗？',
  '需要准备什么？',
  '这件事值得现在行动吗？'
];

module.exports = { reply, PRESETS };
