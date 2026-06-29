// 把 AI 领域原始文本 → 结构化「AI脉动」条目
const llm = require('./llm');
const { applyDetailFields, parseLLMDetail } = require('../lib/detail');
const AI_TOPICS = ['妙招', '工作流', '模型', '开源', '大家在用', '播客'];
const PLATFORMS = ['github', 'youtube', 'bilibili', 'podcast', 'rss', 'hn', 'manual'];

const AI_KEYWORDS = /(skill|skills|MCP|agent|agents|Cursor|Claude|GPT|LLM|workflow|prompt|开源|benchmark|fine-?tun|RAG|embedding|copilot|代码助手|妙招|工作流|模型|播客|Star|GitHub)/i;

const TOPIC_RULES = [
  { aiTopic: '妙招', re: /(skill|妙招|prompt|技巧|trick|tip|cursor rule|slash command)/i },
  { aiTopic: '工作流', re: /(workflow|工作流|pipeline|automation|agent|MCP)/i },
  { aiTopic: '模型', re: /(GPT|Claude|Gemini|LLM|模型|benchmark|fine-?tun|release)/i },
  { aiTopic: '开源', re: /(开源|open.?source|github|star|repo|repository)/i },
  { aiTopic: '播客', re: /(podcast|播客|episode|latent space)/i }
];

const NOISE = /^(show hn|ask hn|tell hn)$/i;

function inferPlatform(meta) {
  const p = meta.platform || '';
  if (PLATFORMS.includes(p)) return p;
  const url = (meta.url || '').toLowerCase();
  if (url.includes('github.com')) return 'github';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('bilibili.com')) return 'bilibili';
  if (url.includes('news.ycombinator.com') || url.includes('hnrss')) return 'hn';
  return meta.source === 'rss' ? 'rss' : 'manual';
}

function ruleClassify(text, meta) {
  const t = (text || '').trim();
  if (!t || t.length < 6) return { cat: '噪音', confidence: 0.9 };
  if (NOISE.test(t)) return { cat: '噪音', confidence: 0.7 };
  if (!AI_KEYWORDS.test(t) && meta.lane !== 'ai') {
    if (!/(AI|人工智能|大模型)/i.test(t)) {
      return { cat: '噪音', confidence: 0.55 };
    }
  }
  let aiTopic = '大家在用';
  for (const r of TOPIC_RULES) {
    if (r.re.test(t)) { aiTopic = r.aiTopic; break; }
  }
  return { cat: 'AI脉动', aiTopic, confidence: 0.6 };
}

function ruleExtract(text, aiTopic) {
  const t = (text || '').trim();
  let title = t.replace(/^[【\[][^\]】]+[\]】]\s*/, '').split(/[，。!！?？\n]/)[0].trim();
  if (title.length > 28) title = title.slice(0, 28) + '…';
  const tags = [aiTopic];
  if (/agent/i.test(t)) tags.push('Agent');
  if (/cursor/i.test(t)) tags.push('Cursor');
  if (/MCP/i.test(t)) tags.push('MCP');
  return {
    title: title || 'AI 动态',
    summary: t.length > 90 ? t.slice(0, 90) + '…' : t,
    time: '', deadline: '', place: '', price: '',
    tags: [...new Set(tags)].slice(0, 4)
  };
}

const SYS = `你是 AI 领域信息助手。把一条来自网络的 AI 相关资讯抽成结构化 JSON。
只关注：AI 使用技巧、Agent/工作流、新模型、开源项目、社区热议用法、播客——不是泛科技新闻。
分类 cat 只能是：AI脉动 或 噪音（无关/无信息量则噪音）。
aiTopic 只能是：妙招/工作流/模型/开源/大家在用/播客。
title 概括「这是什么成就/用法」（<=24字），summary 一句说清「和我用 AI 有什么关系」（<=60字）。
coverType 固定为 ai。
detail 对象：lede(<=120字)、whoFor(数组<=4)、actions(数组<=5)、highlights(数组<=6)、caveats(数组<=3)。
输出严格 JSON：{cat, aiTopic, confidence(0-1), title, summary, tags(数组,<=4), coverType, detail}`;

async function process(text, meta = {}) {
  const t = (text || '').trim();
  if (!t) return null;
  let out = null;

  if (llm.enabled()) {
    const j = await llm.chatJSON(SYS, '原始：' + t + (meta.url ? '\n链接：' + meta.url : ''));
    if (j && j.cat === 'AI脉动' && AI_TOPICS.includes(j.aiTopic)) {
      out = {
        cat: 'AI脉动',
        lane: 'ai',
        aiTopic: j.aiTopic,
        confidence: j.confidence ?? 0.8,
        title: (j.title || '').slice(0, 30),
        summary: j.summary || t,
        time: '', deadline: '', place: '', price: '',
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 4) : [j.aiTopic],
        coverType: 'ai',
        detail: parseLLMDetail(j),
        engine: 'llm'
      };
    } else if (j && j.cat === '噪音') {
      return { cat: '噪音', confidence: j.confidence ?? 0.8, rawText: t, engine: 'llm' };
    }
  }

  if (!out) {
    const c = ruleClassify(t, meta);
    if (c.cat === '噪音') {
      return Object.assign({ cat: '噪音', rawText: t, engine: 'rule' }, c);
    }
    const e = ruleExtract(t, c.aiTopic);
    out = Object.assign({
      cat: 'AI脉动', lane: 'ai', aiTopic: c.aiTopic,
      confidence: c.confidence, engine: 'rule'
    }, e);
  }

  out.platform = inferPlatform(meta);
  applyDetailFields(out, t, meta);
  out.rawText = t;
  out.source = meta.source || 'auto';
  out.room = meta.room || '';
  out.sender = meta.sender || '';
  out.url = meta.url || '';
  if (meta.stars) out.stars = meta.stars;
  return out;
}

module.exports = { process, AI_TOPICS, ruleClassify };
