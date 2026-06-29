const llm = require('./llm');
const store = require('../store');
const detailLib = require('../lib/detail');

function ruleAnswer(item, question, interests) {
  const q = question || '';
  const detail = detailLib.ensureDetail(item) || {};
  const who = (detail.whoFor || []).join('；');
  const actions = (detail.actions || []).join('；');
  const summary = item.summary || '';
  if (/适合|参加/.test(q)) {
    if (who) return '更适合：' + who;
    if (interests && interests.length && (item.tags || []).some((t) => interests.indexOf(t) >= 0)) {
      return '标签与你的兴趣「' + interests.filter((i) => (item.tags || []).indexOf(i) >= 0).join('、') + '」吻合。';
    }
    return '信息较通用，建议先看行动项再决定。';
  }
  if (/准备|需要/.test(q)) {
    if (actions) return '建议：' + actions;
    if (item.url) return '请打开原文链接核对材料与截止。';
    return '原文未列清单，建议收藏后截止前再确认。';
  }
  if (/值得|行动/.test(q)) {
    if (item.deadline) return '有截止「' + item.deadline + '」，相关则宜尽快处理。';
    return summary.slice(0, 100) || '可先收藏。';
  }
  return summary.slice(0, 120) || '请查看详情原文。';
}

async function ask(itemId, question, interests) {
  const item = store.items().find((x) => x.id === itemId) || store.raw().find((x) => x.id === itemId);
  if (!item) return { answer: '找不到这条信息。', engine: 'rule' };
  const ints = Array.isArray(interests) ? interests : (interests || '').split(',').filter(Boolean);
  const sys = '你是「流萤」校园信息助手。根据给定信息卡片，用 2-4 句简短中文回答用户问题。不要编造链接或时间。';
  const user = [
    '标题：' + (item.title || ''),
    '摘要：' + (item.summary || ''),
    '截止：' + (item.deadline || '无'),
    '时间：' + (item.time || '无'),
    '地点：' + (item.place || '无'),
    '标签：' + ((item.tags || []).join('、') || '无'),
    '用户兴趣：' + (ints.join('、') || '未设置'),
    '问题：' + question
  ].join('\n');
  const llmAns = await llm.chatPlain(sys, user);
  if (llmAns) return { answer: llmAns, engine: 'llm' };
  return { answer: ruleAnswer(item, question, ints), engine: 'rule' };
}

module.exports = { ask };
