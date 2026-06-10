# AGENTS.md — 破壳 Poke

Standalone campus info product. **Not** Idea Forge (that repo is [idea-forge](https://github.com/CHEN-taeo/idea-forge)).

## Layout

| Path | Role |
|------|------|
| `poke-server/` | Express API, ingest, AI pipeline, `:5701` |
| `poke-miniprogram/` | WeChat mini program |
| `poke-mvp/` | HTML prototype |

## Commands

```bash
cd poke-server && npm install && npm start
npm run setup:dhu
npm run poll
```

## Conventions

- CommonJS in `poke-server/`; mini program uses `module.exports` + `wx.*`
- Chinese UI copy
- AI must work without API key (rule/template fallback in `pipeline.js`)
- Never commit `.env`, `data/db.json`, or `.runtime/`
