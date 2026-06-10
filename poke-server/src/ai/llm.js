// 极简 LLM 客户端（OpenAI 兼容，默认 DeepSeek）。没配 key 时返回 null，由规则引擎兜底。
const KEY = process.env.LLM_API_KEY || '';
const BASE = (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL || 'deepseek-chat';

const enabled = () => !!KEY;

async function chatJSON(system, user) {
  if (!enabled()) return null;
  try {
    const res = await fetch(BASE + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) { console.warn('[llm] http', res.status); return null; }
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content || '';
    return JSON.parse(txt);
  } catch (e) {
    console.warn('[llm] error, fallback to rules:', e.message);
    return null;
  }
}

module.exports = { enabled, chatJSON };
