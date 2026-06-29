// 截止日期解析（与 tabbit-contest/script-deadline-radar 规则对齐）
const MS_DAY = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysUntil(target) {
  const today = startOfDay(new Date());
  const end = startOfDay(target);
  return Math.round((end - today) / MS_DAY);
}

function parseRelative(text, baseDate) {
  const now = baseDate || new Date();
  const wd = ['日', '一', '二', '三', '四', '五', '六'];
  const m = text.match(/(?:本|这|下)?周([一二三四五六日天])/);
  if (m) {
    const target = wd.indexOf(m[1] === '天' ? '日' : m[1]);
    if (target < 0) return null;
    let day = now.getDay();
    let add = target - day;
    if (text.includes('下') && add <= 0) add += 7;
    if (!text.includes('下') && add < 0) add += 7;
    const d = new Date(now);
    d.setDate(d.getDate() + add);
    return d;
  }
  if (/明天/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/后天/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d;
  }
  return null;
}

/** 从文本提取最近未来截止日期 */
function extractDeadlineDate(text) {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ');
  const year = new Date().getFullYear();
  const candidates = [];

  const reFull = /(\d{4})年(\d{1,2})月(\d{1,2})日/g;
  let m;
  while ((m = reFull.exec(t))) {
    candidates.push(new Date(+m[1], +m[2] - 1, +m[3]));
  }

  const reIso = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g;
  while ((m = reIso.exec(t))) {
    candidates.push(new Date(+m[1], +m[2] - 1, +m[3]));
  }

  const reMd = /(?:截至|截止|报名|提交|于)?\s*(\d{1,2})月(\d{1,2})日?/g;
  while ((m = reMd.exec(t))) {
    let y = year;
    const d = new Date(y, +m[1] - 1, +m[2]);
    if (d < startOfDay(new Date()) && !t.includes(String(y))) d.setFullYear(y + 1);
    candidates.push(d);
  }

  const reShort = /\b(\d{2})-(\d{2})\b/g;
  while ((m = reShort.exec(t))) {
    const mo = +m[1], da = +m[2];
    if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      let d = new Date(year, mo - 1, da);
      if (d < startOfDay(new Date())) d.setFullYear(year + 1);
      candidates.push(d);
    }
  }

  const rel = parseRelative(t);
  if (rel) candidates.push(rel);

  const valid = candidates.filter((d) => !isNaN(d.getTime()));
  if (!valid.length) return null;

  const today = startOfDay(new Date());
  const future = valid.filter((d) => startOfDay(d) >= today);
  const pool = future.length ? future : valid;
  pool.sort((a, b) => a - b);
  return pool[0];
}

function deadlineTier(days) {
  if (days === null || days === undefined) return 'unknown';
  if (days < 0) return 'past';
  if (days <= 2) return 'critical';
  if (days <= 7) return 'urgent';
  if (days <= 14) return 'warn';
  return 'safe';
}

function deadlineLabel(days) {
  if (days === null) return '';
  if (days < 0) return '已过期';
  if (days === 0) return '今天截止';
  if (days === 1) return '还剩1天';
  return '还剩' + days + '天';
}

const EVENT_TYPES = ['讲座', '竞赛', '展览', '峰会', '活动', '通知', '机会', '搭子', '二手', '资源', '其他'];

function inferEventType(text, cat, tags) {
  const t = (text || '') + ' ' + (tags || []).join(' ');
  if (/峰会|论坛|大会|高峰论坛|产业峰会/.test(t)) return '峰会';
  if (/展览|展会|博览|艺术展|设计展/.test(t)) return '展览';
  if (/讲座|宣讲|分享会|报告会|沙龙|工作坊/.test(t)) return '讲座';
  if (/竞赛|大赛|比赛|挑战赛|黑客松|hackathon/i.test(t)) return '竞赛';
  if (cat === '搭子') return '搭子';
  if (cat === '二手') return '二手';
  if (cat === '通知') return '通知';
  if (cat === '机会') return '机会';
  if (cat === '活动') return '活动';
  return '其他';
}

module.exports = {
  extractDeadlineDate,
  daysUntil,
  deadlineTier,
  deadlineLabel,
  inferEventType,
  EVENT_TYPES
};
