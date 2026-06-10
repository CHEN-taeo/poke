// 把一条原始群消息 → 结构化条目。
// 优先用 LLM；没配 key 则用规则引擎（离线可跑、可解释）。
const llm = require('./llm');

const CATS = ['活动', '通知', '搭子', '二手', '机会', '资源', '噪音'];

const RULES = [
  { cat: '搭子', re: /(搭子|组队|结伴|一起去|约个|约人|拼一下|拼车|缺\s*\d*\s*人|还差\s*\d*\s*人|有人.*(去|玩|吃|打|跑|骑)吗|aa)/i },
  { cat: '二手', re: /(二手|闲置|出一个|出售|转让|低价出|便宜卖|带不走|\d+\s*(块|元).*(自提|私聊|有意)|跳蚤)/i },
  { cat: '机会', re: /(讲座|宣讲|竞赛|大赛|比赛|实习|内推|招聘|招募|奖学金|保研|论文|课题|实验室招|报名截止|报名)/i },
  { cat: '通知', re: /(通知|公告|截止|请.*前(提交|完成|缴|报)|务必|缴费|放假|调课|考试安排|请于|提交至|名单|审核)/i },
  { cat: '活动', re: /(活动|晚会|社团|纳新|招新|工作坊|沙龙|展览|演出|赛事|开放日|分享会|路演)/i }
];

const NOISE = /^(哈+|呵+|嗯+|哦+|好的?|收到|谢谢|在吗|早|晚安|\d+|[。.…！!~]+|.{0,3})$/;

function ruleClassify(text) {
  const t = (text || '').trim();
  if (!t || NOISE.test(t)) return { cat: '噪音', confidence: 0.9 };
  for (const r of RULES) if (r.re.test(t)) return { cat: r.cat, confidence: 0.65 };
  if (t.length < 8) return { cat: '噪音', confidence: 0.6 };
  return { cat: '资源', confidence: 0.4 };
}

function pick(re, text) { const m = (text || '').match(re); return m ? (m[1] || m[0]) : ''; }

function ruleExtract(text, cat) {
  const t = (text || '').trim();
  const time = pick(/((今|明|后)晚\s*\d{0,2}\s*[点:：]?\d{0,2}|(今|明|后)天[早中晚上午下]*\s*\d{0,2}\s*[点:：]?\d{0,2}|本?周[一二三四五六日天][早中晚上午下]*\s*\d{0,2}\s*[点:：]?\d{0,2}|周末|\d{1,2}\s*月\s*\d{1,2}\s*[日号]|\d{1,2}\s*[:：]\s*\d{2}|(上午|中午|下午|晚上)\s*\d{0,2}\s*[点:：半]?\d{0,2}|\d{1,2}\s*点半?)/i, t);
  const deadline = /(截止|deadline|ddl|报名截止|前提交|前完成|前报名|倒计时)/i.test(t)
    ? (pick(/(截止[^，。,\s]*|\d{1,2}\s*月\s*\d{1,2}\s*[日号]前?|本?周[一二三四五六日天]\s*\d{0,2}[:：]?\d{0,2}前?|倒计时[^，。,\s]*)/i, t) || '有截止') : '';
  const priceN = pick(/(\d+)\s*(块|元)/, t);
  const place = pick(/((一|二|三|四|五|六|七|八|九|十)\s*(教|号楼)[^，。,\s]{0,6}|(食堂|宿舍|图书馆|操场|体育馆)[^，。,\s]{0,4}|(?<![0-9a-zA-Z])[\u4e00-\u9fa5]{2,6}(报告厅|活动室|实验室|创新中心|会议室|活动中心))/i, t);
  let title = t.replace(/^[【\[][^\]】]+[\]】]\s*/, '').split(/[，。!！?？\n]/)[0].trim();
  if (title.length > 22) title = title.slice(0, 22) + '…';
  const tags = [];
  if (cat === '机会') { if (/实习|内推|招聘/.test(t)) tags.push('实习'); if (/竞赛|大赛|比赛/.test(t)) tags.push('竞赛'); if (/讲座|宣讲|分享/.test(t)) tags.push('讲座'); if (/奖学金/.test(t)) tags.push('奖学金'); }
  if (deadline) tags.push('别错过');
  if (cat === '搭子') tags.push('找搭子');
  return {
    title: title || (cat + '消息'),
    summary: t.length > 80 ? t.slice(0, 80) + '…' : t,
    time, deadline, place, price: priceN ? priceN + '元' : '',
    tags
  };
}

const SYS = `你是校园信息助手，服务大学生。把一条微信群原始消息抽成结构化 JSON。
分类 cat 只能是其一：活动/通知/搭子/二手/机会/资源/噪音。
- 噪音=闲聊、问候、无信息量（如"在吗""哈哈""中午吃啥"）。
- 机会=讲座/竞赛/实习/招聘/内推/奖学金/科研/保研等对个人成长有用的机会。
- 搭子=约人/组队/结伴/找队友。
- 二手=出售/转让/闲置/求购。
title 要概括"这是什么"（如"数字孪生智能制造讲座"），不要照抄原文开头。
summary 用一句人话说清"是什么+和我有什么关系"。
time/deadline/place/price 能抽就抽，抽不到给空字符串。
输出严格 JSON：{cat, confidence(0-1), title(<=22字), summary(<=60字), time, deadline, place, price, tags(数组,<=4)}。`;

async function process(text, meta = {}) {
  const t = (text || '').trim();
  if (!t) return null;
  let out = null;
  if (llm.enabled()) {
    const j = await llm.chatJSON(SYS, '原始消息：' + t);
    if (j && j.cat && CATS.includes(j.cat)) {
      out = {
        cat: j.cat, confidence: j.confidence ?? 0.8,
        title: (j.title || '').slice(0, 30), summary: j.summary || t,
        time: j.time || '', deadline: j.deadline || '', place: j.place || '',
        price: j.price || '', tags: Array.isArray(j.tags) ? j.tags.slice(0, 4) : [],
        engine: 'llm'
      };
    }
  }
  if (!out) {
    const c = ruleClassify(t);
    const e = ruleExtract(t, c.cat);
    out = Object.assign({ cat: c.cat, confidence: c.confidence, engine: 'rule' }, e);
  }
  out.rawText = t;
  out.source = meta.source || 'group';
  out.room = meta.room || '';
  out.sender = meta.sender || '';
  out.url = meta.url || '';
  return out;
}

module.exports = { process, CATS, ruleClassify };
