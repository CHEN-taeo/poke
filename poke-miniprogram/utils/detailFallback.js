/** 客户端详情 fallback — 镜像 poke-server/src/lib/detail.js */

function arr(v, max) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || '').trim()).filter(Boolean).slice(0, max || 6);
}

function buildRuleDetail(out, text) {
  const t = (text || out.summary || '').trim();
  const highlights = [];
  if (out.time) highlights.push(out.time);
  if (out.place) highlights.push(out.place);
  if (out.deadline) highlights.push(out.deadline);
  if (out.price) highlights.push(out.price);
  (out.tags || []).slice(0, 4).forEach((tag) => {
    if (highlights.indexOf(tag) < 0) highlights.push(tag);
  });

  const whoFor = [];
  if (out.cat === '机会') whoFor.push('关注校园机会的同学');
  if (/竞赛|大赛/.test(t)) whoFor.push('想参加竞赛的同学');
  if (/讲座|宣讲/.test(t)) whoFor.push('对相关主题感兴趣的同学');
  if (/实习|招聘|内推/.test(t)) whoFor.push('在找实习或工作的同学');
  if (out.lane === 'ai' || out.cat === 'AI脉动') whoFor.push('日常用 AI 工具的同学');
  if (!whoFor.length) whoFor.push('对这条信息感兴趣的你');

  const actions = [];
  if (out.deadline) actions.push('点「提醒我」写入日历，截止前收到提醒');
  if (out.place) actions.push('地点：' + out.place + '（已收录，无需跳转）');
  if (/(报名|注册|申请|扫码)/.test(t)) actions.push('按正文要求完成报名；可用「复制全部信息」发给同学');
  if (!actions.length && t.length > 20) actions.push('阅读下方完整正文，确认是否需要行动');
  if (!actions.length) actions.push('先收藏，稍后回来细看');

  const caveats = [];
  if (/(名额有限|先到先得|报满)/.test(t)) caveats.push('名额可能有限，建议尽早行动');
  if (/(以.*为准|另行通知)/.test(t)) caveats.push('细节可能后续更新，以官方通知为准');

  const lede = out.summary || (t.length > 320 ? t.slice(0, 320) + '…' : t) || out.title || '暂无摘要';
  const fullBody = String(out.fullBody || t || '').slice(0, 12000);

  return {
    lede: lede,
    whoFor: whoFor.slice(0, 4),
    actions: actions.slice(0, 6),
    highlights: highlights.slice(0, 8),
    caveats: caveats.slice(0, 3),
    fullBody: fullBody
  };
}

function ensureDetail(out) {
  const text = out.fullBody || out.rawText || out.summary || '';
  if (out.detail && out.detail.lede) {
    if (!out.detail.fullBody && out.fullBody) out.detail.fullBody = out.fullBody;
    if (!out.detail.fullBody && text) out.detail.fullBody = text.slice(0, 12000);
    return out.detail;
  }
  return buildRuleDetail(out, text);
}

module.exports = { buildRuleDetail, ensureDetail };
