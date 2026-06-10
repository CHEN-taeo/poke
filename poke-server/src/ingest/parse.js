// 把从微信复制/导出的文本，拆成多条真实消息。
// mode:
//   lines   — 文件传输助手：一行一条（你截图里那种）
//   export  — PC 微信聊天记录导出 txt
//   auto    — 自动猜

const EXPORT_RE = /^(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日\s]+\d{1,2}:\d{2}(?::\d{2})?)\s+(.+?)$/;
const INLINE_RE = /^(.+?)\s+(\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})\s*$/;

function cleanLine(s) { return (s || '').replace(/\u200b/g, '').trim(); }

function parseLines(text, room, sender) {
  return cleanLine(text).split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .map(line => ({
      text: line,
      room: room || '文件传输助手',
      sender: sender || '我',
      source: 'forward'
    }));
}

function parseExport(text, room) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let cur = null;
  const defaultRoom = room || '微信导出';

  for (const raw of lines) {
    const line = cleanLine(raw);
    if (!line) continue;
    const m = line.match(EXPORT_RE);
    if (m) {
      if (cur && cur.text) out.push(cur);
      cur = { text: '', room: defaultRoom, sender: m[2], source: 'export', tsLabel: m[1] };
      continue;
    }
    if (!cur) {
      out.push({ text: line, room: defaultRoom, sender: '', source: 'export' });
    } else {
      cur.text = cur.text ? cur.text + '\n' + line : line;
    }
  }
  if (cur && cur.text) out.push(cur);
  return out.filter(x => x.text.trim());
}

function parseAuto(text, room, sender) {
  const t = cleanLine(text);
  if (!t) return [];
  if (EXPORT_RE.test(t.split(/\r?\n/)[0] || '')) return parseExport(text, room);
  if (t.includes('\n') && t.split(/\r?\n/).length > 1) return parseLines(text, room, sender);
  return [{ text: t, room: room || '文件传输助手', sender: sender || '我', source: 'forward' }];
}

function parse(text, opts) {
  const room = opts.room || '';
  const sender = opts.sender || '';
  const mode = opts.mode || 'auto';
  if (mode === 'lines') return parseLines(text, room, sender);
  if (mode === 'export') return parseExport(text, room);
  return parseAuto(text, room, sender);
}

module.exports = { parse, parseLines, parseExport };
