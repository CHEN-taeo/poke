# 破壳 Poke

Campus information filter → actionable cards. **Separate product** from [Idea Forge / 构想熔炉](https://github.com/CHEN-taeo/idea-forge).

Turn noisy WeChat groups, official accounts, and school notices into structured cards (讲座 / 搭子 / 机会 / 二手).

## What's in this repo

| Path | What |
|------|------|
| `poke-server/` | Node backend — ingest, DeepSeek pipeline, auto-scrape, API `:5701` |
| `poke-miniprogram/` | WeChat mini program (今天 / 机会 / 搭子 / 复盘 / 我的) |
| `poke-mvp/` | Single-file HTML prototype (offline demo) |

## Quick start

```bash
cd poke-server
cp .env.example .env    # add LLM_API_KEY (DeepSeek)
npm install
npm start               # http://localhost:5701
```

Open `poke-miniprogram/` in **微信开发者工具** → enable **不校验合法域名** → set `utils/config.js` → `API_BASE = 'http://localhost:5701'`.

```bash
npm run setup:dhu       # seed DHU campus data + scrape official notices
npm run source:list     # auto-ingest sources
```

Docs: `poke-server/AUTONOMOUS.md`, `poke-server/docs/wechat-cli-setup.md`

## Stack

- **Backend:** Express 4, JSON store, DeepSeek (OpenAI-compatible), optional wechat-cli / RSS / web scrape
- **Mini program:** WXML/WXSS/JS, offline-first fallback

## License

Private / MIT — your choice (add LICENSE if needed).
