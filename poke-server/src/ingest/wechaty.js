// 真·个人微信采集（自用原型，封号风险自担，仅限本地、白名单群、群友知情）。
// 依赖按需安装：npm i wechaty wechaty-puppet-xp
// wechaty-puppet-xp 钩 Windows 桌面版微信，需匹配特定微信版本（见 README）。
const { ingestOne } = require('./core');

function whitelist() {
  return (process.env.ROOM_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean);
}

async function start(onItem) {
  let WechatyBuilder;
  try {
    ({ WechatyBuilder } = require('wechaty'));
  } catch (e) {
    console.error('\n[wechaty] 未安装。请先运行：npm i wechaty wechaty-puppet-xp');
    console.error('[wechaty] 然后把 .env 里 INGEST_MODE 设为 wechaty 再启动。\n');
    return;
  }

  const puppet = process.env.WECHATY_PUPPET || 'wechaty-puppet-xp';
  const ingestUrls = process.env.INGEST_URLS !== '0';
  const allow = whitelist();
  const bot = WechatyBuilder.build({ name: 'poke', puppet });

  // 消息类型解析：wechaty 1.x 推荐 wechaty-puppet 的 types，bot.Message.Type 已弃用。
  // 做个兜底，两边都拿不到就退回数字常量（Text=7, Url=14 在 puppet 里的取值）。
  let MsgType;
  try { MsgType = require('wechaty-puppet').types.Message; } catch (e) { /* 下面再兜底 */ }
  if (!MsgType) { try { MsgType = bot.Message.Type; } catch (e) { /* ignore */ } }
  if (!MsgType) MsgType = { Text: 7, Url: 14 };

  bot.on('scan', (qrcode, status) => {
    console.log('[wechaty] 扫码登录(status=' + status + ')：https://wechaty.js.org/qrcode/' + encodeURIComponent(qrcode));
  });
  bot.on('login', user => console.log('[wechaty] 已登录：' + user.name() + '；白名单群：' + (allow.length ? allow.join('、') : '全部（建议设白名单）')));
  bot.on('error', e => console.error('[wechaty] error', e && e.message));

  bot.on('message', async msg => {
    try {
      if (msg.self()) return;
      const room = msg.room();
      const roomName = room ? await room.topic() : '';
      if (room && allow.length && !allow.includes(roomName)) return; // 不在白名单的群跳过
      const sender = msg.talker() ? msg.talker().name() : '';

      let text = '', url = '', source = room ? 'group' : 'private';
      const type = msg.type();
      if (type === MsgType.Text) {
        text = msg.text();
      } else if (ingestUrls && type === MsgType.Url) {
        const link = await msg.toUrlLink();
        text = (link.title() || '') + ' ' + (link.description() || '');
        url = link.url();
        source = 'mp'; // 链接/公众号文章
      } else {
        return; // 图片/语音等先忽略
      }
      if (!text.trim()) return;

      const r = await ingestOne({ source, room: roomName, sender, text, url });
      if (r.item) {
        console.log('[ingest] ' + r.item.cat + ' ← [' + roomName + '] ' + (text.slice(0, 24)));
        if (onItem) onItem(r.item);
      }
    } catch (e) {
      console.error('[wechaty] handle msg error', e && e.message);
    }
  });

  await bot.start();
  console.log('[wechaty] 已启动，等待登录…（仅本地自用，注意合规与封号风险）');
}

module.exports = { start };
