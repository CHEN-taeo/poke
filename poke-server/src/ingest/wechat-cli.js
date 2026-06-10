// 微信群聊 · wechat-cli v1.6+ 本地库轮询（微信 4.x / Weixin.exe）
const fs = require('fs');
const path = require('path');
const { execFile, exec } = require('child_process');
const { ingestOne } = require('./core');

const STATE_FILE = path.join(__dirname, '..', '..', 'data', 'wechat-cli-state.json');

function resolveCliBin() {
  if (process.env.WECHAT_CLI_BIN) return process.env.WECHAT_CLI_BIN;
  const home = process.env.USERPROFILE || '';
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'wechat-cli.cmd'),
    path.join(process.env.LOCALAPPDATA || '', 'wechat-cli', 'wechat-cli.exe'),
    path.join(home, '.local', 'bin', 'wechat-cli.exe'),
    'wechat-cli'
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === 'wechat-cli') return c;
    if (fs.existsSync(c)) return c;
  }
  return 'wechat-cli';
}

const CLI = resolveCliBin();

function cliEnv() {
  const env = Object.assign({}, process.env);
  if (process.env.WECHAT_CLI_DB_ROOT) env.WECHAT_CLI_DB_ROOT = process.env.WECHAT_CLI_DB_ROOT;
  if (process.env.WECHAT_CLI_WECHAT_PID) env.WECHAT_CLI_WECHAT_PID = process.env.WECHAT_CLI_WECHAT_PID;
  return env;
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const opts = {
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
      encoding: 'utf8',
      env: cliEnv()
    };
    const useShell = process.platform === 'win32' && (CLI.endsWith('.cmd') || CLI.endsWith('.bat'));
    if (useShell) {
      const q = (s) => (/\s|"/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
      const cmd = q(CLI) + ' ' + args.map(q).join(' ');
      exec(cmd, opts, (err, stdout, stderr) => {
        if (err && !stdout) return reject(new Error(parseCliErr(stderr || err.message)));
        resolve(stdout || '');
      });
    } else {
      execFile(CLI, args, opts, (err, stdout, stderr) => {
        if (err && !stdout) return reject(new Error(parseCliErr(stderr || err.message)));
        resolve(stdout || '');
      });
    }
  });
}

function parseCliErr(raw) {
  const s = (raw || '').trim();
  try {
    const j = JSON.parse(s);
    if (j.error && j.error.message) return j.error.message;
  } catch (e) { /* not json */ }
  return s || 'wechat-cli 执行失败';
}

function parseEnvelope(stdout) {
  const t = (stdout || '').trim();
  if (!t) return { ok: false, error: 'empty output' };
  try {
    const j = JSON.parse(t);
    if (j.ok === false) return { ok: false, error: j.error && j.error.message || 'wechat-cli error' };
    return { ok: true, data: j.data || j };
  } catch (e) {
    // jsonl 多行
    const lines = t.split(/\r?\n/).filter(Boolean);
    const msgs = [];
    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        const m = ev.message || (ev.event && ev.event.message) || ev;
        if (m && (m.local_id != null || m.content || m.text)) msgs.push(m);
      } catch (e2) { /* skip */ }
    }
    if (msgs.length) return { ok: true, data: { messages: msgs } };
    return { ok: false, error: '无法解析 wechat-cli 输出' };
  }
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (e) {
    return { rooms: {} };
  }
}
function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function targetRooms() {
  if (process.env.WECHAT_CLI_HUB === '1') return ['文件传输助手'];
  return (process.env.ROOM_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean);
}

function msgText(msg) {
  if (!msg) return '';
  const t = msg.content ?? msg.text ?? msg.plain_text ?? msg.display_text ?? msg.msg ?? '';
  if (typeof t === 'string') return t.trim();
  if (t && typeof t === 'object') {
    if (t.text) return String(t.text).trim();
    if (t.title) return String(t.title).trim();
  }
  return '';
}

function msgSender(msg) {
  return (msg.sender_name || msg.sender_display || msg.sender || msg.talker_name || msg.nickname || '').trim();
}

function msgLocalId(msg) {
  const id = msg.local_id ?? msg.localId ?? msg.id;
  return typeof id === 'number' ? id : parseInt(id, 10) || 0;
}

async function fetchNewMessages(room, since) {
  // v1.6: timeline 返回标准 envelope；tail --jsonl 也可但 readiness 需先 cache refresh
  let stdout;
  try {
    stdout = await runCli(['tail', room, '--since-local-id', String(since), '--jsonl']);
    const parsed = parseEnvelope(stdout);
    if (parsed.ok && parsed.data && parsed.data.messages) return parsed.data.messages;
    // jsonl 行已在 parseEnvelope 里拆成 messages
    if (parsed.ok && parsed.data && Array.isArray(parsed.data.messages)) return parsed.data.messages;
  } catch (e) { /* fallback timeline */ }

  stdout = await runCli(['timeline', room, '--limit', '30', '--display-order', 'desc']);
  const parsed = parseEnvelope(stdout);
  if (!parsed.ok) throw new Error(parsed.error);
  const all = (parsed.data && parsed.data.messages) || [];
  return all.filter(m => msgLocalId(m) > since);
}

async function pollRoom(room, state) {
  const since = state.rooms[room] || 0;
  const messages = await fetchNewMessages(room, since);
  let maxId = since;
  let added = 0;
  for (const msg of messages) {
    const localId = msgLocalId(msg);
    if (localId > maxId) maxId = localId;
    if (localId <= since) continue;
    const text = msgText(msg);
    if (!text || text.length < 2) continue;
    const sender = msgSender(msg);
    const r = await ingestOne({ text, room, sender, source: room === '文件传输助手' ? 'forward' : 'group' });
    if (r.item) {
      added++;
      console.log('[wechat-cli] +' + r.item.cat + ' ← [' + room + '] ' + text.slice(0, 28));
    }
  }
  if (maxId > since) state.rooms[room] = maxId;
  return added;
}

async function pollAll() {
  const rooms = targetRooms();
  if (!rooms.length) return { added: 0, error: 'no_rooms' };
  const state = loadState();
  let total = 0;
  let lastErr = '';
  for (const room of rooms) {
    try {
      total += await pollRoom(room, state);
    } catch (e) {
      lastErr = e.message || String(e);
      console.warn('[wechat-cli] 轮询失败 [' + room + ']:', lastErr);
      if (/not found|ENOENT|不是内部|not recognized|unknown command/i.test(lastErr)) {
        return { added: total, error: 'cli_missing', detail: lastErr };
      }
      if (/db_root|db_storage|key|decrypt|blocked|未找到微信|readiness/i.test(lastErr)) {
        return { added: total, error: 'need_setup', detail: lastErr };
      }
    }
  }
  saveState(state);
  return { added: total, error: lastErr || undefined };
}

async function checkCli() {
  try {
    const out = await runCli(['status']);
    const p = parseEnvelope(out);
    return !!(p.ok || (out && out.includes('wechat-cli')));
  } catch (e) {
    return false;
  }
}

async function readiness() {
  try {
    const out = await runCli(['status', '--pretty']);
    const p = parseEnvelope(out);
    if (!p.ok) return { ready: false, raw: out, error: p.error };
    const st = (p.data && p.data.status) || p.data || {};
    return {
      ready: st.readiness === 'ready' || st.live_read_ok === true,
      readiness: st.readiness,
      blocked_by: st.blocked_by,
      next_action: st.next_action,
      suggested_commands: st.suggested_commands
    };
  } catch (e) {
    return { ready: false, error: e.message };
  }
}

async function status() {
  const rooms = targetRooms();
  const installed = await checkCli();
  let sessions = null;
  let sessionError = '';
  let ready = null;
  if (installed) {
    ready = await readiness();
    try {
      const out = await runCli(['sessions', '--limit', '8']);
      sessions = parseEnvelope(out);
    } catch (e) { sessionError = e.message; }
  }
  return {
    enabled: process.env.WECHAT_CLI === '1',
    cli: CLI,
    installed,
    hub: process.env.WECHAT_CLI_HUB === '1',
    rooms,
    dbRoot: process.env.WECHAT_CLI_DB_ROOT || '',
    pollSec: Number(process.env.WECHAT_CLI_POLL_SEC) || 30,
    state: loadState(),
    readiness: ready,
    sessions,
    sessionError,
    setupHint: !ready || !ready.ready
      ? '微信保持登录 → 打开任意聊天 → 运行: wechat-cli cache refresh --force （v1.6 无 init 命令）'
      : ''
  };
}

function start() {
  const sec = Number(process.env.WECHAT_CLI_POLL_SEC) || 30;
  const rooms = targetRooms();

  checkCli().then(async ok => {
    if (!ok) {
      console.error('\n[wechat-cli] 未找到 CLI。已安装路径示例：');
      console.error('  WECHAT_CLI_BIN=C:\\Users\\chent\\AppData\\Local\\Microsoft\\WindowsApps\\wechat-cli.cmd\n');
      return;
    }
    if (!rooms.length) {
      console.log('[wechat-cli] 设 WECHAT_CLI_HUB=1 或 ROOM_WHITELIST=群名');
      return;
    }
    const rd = await readiness();
    console.log('[wechat-cli] CLI:', CLI);
    console.log('[wechat-cli] 监听：' + rooms.join('、') + '，每 ' + sec + ' 秒');
    if (!rd.ready) {
      console.warn('[wechat-cli] 尚未就绪 (' + (rd.blocked_by || rd.readiness || 'unknown') + ')');
      console.warn('[wechat-cli] 1) 微信登录并打开任意聊天');
      console.warn('[wechat-cli] 2) wechat-cli cache refresh --force');
      console.warn('[wechat-cli] 3) 若仍失败，运行 scripts/find-wechat-db.ps1 设置 WECHAT_CLI_DB_ROOT');
      console.warn('[wechat-cli] 文档: docs/wechat-cli-setup.md\n');
    }
    pollAll();
    setInterval(pollAll, sec * 1000);
  });
}

module.exports = { start, pollAll, checkCli, status, readiness };
