// 详情结构化字段：LLM 归一化 + 规则 fallback + 封面类型推断

const COVER_TYPES = ['lecture', 'competition', 'exhibition', 'notice', 'ai', 'default'];

function arr(v, max) {
  if (!Array.isArray(v)) return [];
  return v.map(x => String(x || '').trim()).filter(Boolean).slice(0, max || 6);
}

function normalizeDetail(d) {
  if (!d || typeof d !== 'object') return null;
  const out = {
    lede: String(d.lede || '').slice(0, 400),
    whoFor: arr(d.whoFor, 4),
    actions: arr(d.actions, 6),
    highlights: arr(d.highlights, 8),
    caveats: arr(d.caveats, 3),
    fullBody: String(d.fullBody || '').slice(0, 12000)
  };
  if (!out.lede && !out.whoFor.length && !out.actions.length && !out.highlights.length && !out.fullBody) return null;
  return out;
}

function inferCoverType(out) {
  const et = out.eventType || out.aiTopic || '';
  const cat = out.cat || '';
  const lane = out.lane || '';
  if (lane === 'ai' || cat === 'AI脉动') return 'ai';
  if (/讲座|宣讲|分享/.test(et)) return 'lecture';
  if (/竞赛|大赛|比赛|黑客松/.test(et)) return 'competition';
  if (/展览|展会/.test(et)) return 'exhibition';
  if (/通知|公告/.test(et) || cat === '通知') return 'notice';
  if (/峰会|论坛|活动/.test(et) || cat === '活动') return 'exhibition';
  if (cat === '机会') return 'lecture';
  return 'default';
}

function buildRuleDetail(out, text, meta) {
  const m = meta || {};
  const t = (text || '').trim();
  const highlights = [];
  if (out.time) highlights.push(out.time);
  if (out.place) highlights.push(out.place);
  if (out.deadline) highlights.push(out.deadline);
  if (out.price) highlights.push(out.price);
  (out.tags || []).slice(0, 2).forEach(tag => { if (!highlights.includes(tag)) highlights.push(tag); });

  const whoFor = [];
  if (out.cat === '机会') whoFor.push('关注校园机会的同学');
  if (/竞赛|大赛/.test(t)) whoFor.push('想参加竞赛的同学');
  if (/讲座|宣讲/.test(t)) whoFor.push('对相关主题感兴趣的同学');
  if (/实习|招聘|内推/.test(t)) whoFor.push('在找实习或工作的同学');
  if (out.lane === 'ai' || out.cat === 'AI脉动') whoFor.push('日常用 AI 工具的同学');

  const actions = [];
  if (out.deadline) actions.push('点「提醒我」写入日历，截止前收到提醒');
  if (out.place) actions.push('地点：' + out.place + '（已收录，无需跳转）');
  if (/(报名|注册|申请|扫码)/.test(t)) actions.push('按正文要求完成报名；可用「复制全部信息」发给同学');
  if (!actions.length && t.length > 20) actions.push('阅读下方完整正文，确认是否需要行动');
  if (!actions.length) actions.push('先收藏，稍后回来细看');

  const caveats = [];
  if (/(名额有限|先到先得|报满)/.test(t)) caveats.push('名额可能有限，建议尽早行动');
  if (/(以.*为准|另行通知)/.test(t)) caveats.push('细节可能后续更新，以官方通知为准');

  const lede = out.summary || (t.length > 200 ? t.slice(0, 200) + '…' : t);

  return {
    lede,
    whoFor: whoFor.slice(0, 4),
    actions: actions.slice(0, 6),
    highlights: highlights.slice(0, 8),
    caveats: caveats.slice(0, 3),
    fullBody: String(out.fullBody || m.fullBody || t || '').slice(0, 12000)
  };
}

function applyDetailFields(out, text, meta) {
  if (!out.detail) out.detail = buildRuleDetail(out, text, meta);
  else {
    const norm = normalizeDetail(out.detail);
    out.detail = norm || buildRuleDetail(out, text, meta);
  }
  if (!out.coverType || !COVER_TYPES.includes(out.coverType)) {
    out.coverType = inferCoverType(out);
  }
  if (meta.imageUrl && !out.imageUrl) out.imageUrl = meta.imageUrl;
  return out;
}

function parseLLMDetail(j) {
  return normalizeDetail(j && j.detail);
}

module.exports = {
  COVER_TYPES,
  normalizeDetail,
  buildRuleDetail,
  inferCoverType,
  applyDetailFields,
  parseLLMDetail
};
