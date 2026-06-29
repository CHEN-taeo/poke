# 破壳 · 采集 + AI 管线服务（本地自用原型）

把**微信群消息 / 公众号文章**采集进来，用 AI 拆成结构化条目，分发到四个模块：
**活动通知聚合 / 机会雷达 / 找搭子 / 破壳（反信息茧房）**。

> ⚠️ 合规与风险：`wechaty` 模式钩的是你**个人微信**，违反微信用户协议，**有封号风险**，且会触及群友隐私。
> 本服务仅供**本地、自用、白名单群、群友知情**的原型验证。**不要拿去给真实用户上线。** 上线请走「用户转发」或「企业微信会话存档」等合规路径。

## 🤖 自动采集（你要的「全自动」）

每 `AUTO_INTERVAL_MIN` 分钟（默认 15）**自动轮询 RSS/Atom 源** → AI 整理入库，全程无需手动。

1. `.env` 里 `AUTO_INGEST=1`（已默认开启）。
2. `npm start` → 控制台左侧「🤖 自动采集源」填 RSS 链接 → 「添加并立即抓取」。
3. 内置一个示例源，启动即自动拉取，证明「自动」生效（可删）。

把你的真实来源变成自动源：
- **公众号** → 自建 [wewe-rss](https://github.com/cooderl/wewe-rss) 转 RSS 再填进来。
- **学校官网通知页** → 若带 RSS（`rss.xml`）直接填；没有就用 RSSHub 生成。
- **微信群消息** 没有 RSS，全自动只能走企业微信会话存档（合规）或 wechaty（封号风险）。

接口：`GET /api/sources`、`POST /api/sources {url,room}`、`POST /api/poll`（立即全量抓取）、`POST /api/sources/remove {id}`。

## 🤖 AI 脉动（全网 AI 成就与用法）

与校园源平行：`data/ai-sources.json` + 专用管线 `src/ai/aiPipeline.js`。

- `.env`：`AI_AUTO_INGEST=1`、`AI_AUTO_INTERVAL_MIN=60`（默认 60 分钟轮询）
- 可选：`GITHUB_TOKEN`（提高 GitHub Search 配额）、`RSSHUB_BASE`（B站 UP 主等无 RSS 站点）
- YouTube 频道：`https://www.youtube.com/feeds/videos.xml?channel_id=...`
- 播客：直接用节目 RSS
- 接口：`GET /api/ai-pulse`、`GET /api/ai-pulse/digest`、`POST /api/poll-ai`、`GET /api/ai-sources`
- 投喂：粘贴含 `【AI脉动投喂】` 标记的文本到 `/api/ingest/paste` 自动走 AI 管线

## 立即跑（mock 模式，零配置，不碰微信）

```bash
cd poke-server
npm install
npm start
```

打开 **http://localhost:5700** ：
- 左侧「⚡ 灌入一批群聊样本」或「▶ 流式回放」→ 看原始乱消息进来；
- AI 自动丢掉噪音（“哈哈哈”“在吗”），把有用的拆成右侧卡片；
- 右侧切「聚合 / 机会雷达 / 找搭子 / 破壳」看分发结果；
- 也可在左侧自己投喂一条试 AI 怎么分。

**不配 API key 也能跑**：默认用内置「规则引擎」离线分类抽取。想要更准，在 `.env` 填 `LLM_API_KEY`（DeepSeek，OpenAI 兼容）即可自动切到大模型，代码无需改动。

### 接 DeepSeek（让抽取变准）

1. 去 https://platform.deepseek.com/ 拿一个 API Key。
2. 打开 `poke-server/.env`，把 `LLM_API_KEY=` 填上。
3. `npm run test:llm` 跑一遍对比效果（会打印每条消息的分类/标题/时间/地点抽取）。
4. `npm start` 重启，控制台 AI 状态会显示 `LLM`。

### 多人「想去/找搭子」计数同步（engagement）

参与数据按 `uid`（每个设备/用户一个）存在后端，因此**多人计数能实时同步**：

- `POST /api/engage` `{uid, name, itemId, action, value}`，`action` ∈ `go|buddy|attended`。
- 模块接口加 `?uid=xxx` 会返回 `goN / bdN / buddyNames / mine{go,buddy,attended}`。
- `GET /api/me?uid=xxx` 返回「我参与过的」条目（供小程序「我的 / 复盘」用）。
- `/api/seed` 会顺带造几个"其他同学"的参与数据，让计数演示时不全为 0。

## 接真·个人微信（wechaty 模式，风险自担）

1. 装依赖：`npm i wechaty wechaty-puppet-xp`
2. `wechaty-puppet-xp` 钩 **Windows 桌面版微信**，需匹配它支持的微信版本（见 [puppet-xp 文档](https://github.com/wechaty/puppet-xp)，通常需要特定 3.9.x 版本）。
3. 复制 `.env.example` 为 `.env`，设：
   ```
   INGEST_MODE=wechaty
   ROOM_WHITELIST=机械2201班级群,竞赛通知群   # 强烈建议白名单！
   ```
4. `npm start`，按日志扫码登录。此后白名单群里的文字消息、转发的公众号链接会自动进入管线。

## 接口（给小程序/网页消费）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 当前采集模式 + AI 状态 |
| POST | `/api/ingest` | 投喂一条 `{text,room?,sender?,source?,url?}` |
| POST | `/api/seed` `/api/reset` | 灌样本 / 清空 |
| GET | `/api/feed` | 活动通知聚合 |
| GET | `/api/radar` | 机会雷达（讲座/竞赛/实习/奖学金 + DDL） |
| GET | `/api/buddy` | 找搭子 |
| GET | `/api/poke` | 破壳（最少见类别推一条） |
| GET | `/api/me?uid=` | 我参与过的条目 |
| POST | `/api/engage` | 多人计数 `{uid,name,itemId,action,value}` |
| GET | `/api/stats` `/api/raw` `/api/items` | 统计 / 原始 / 全部条目 |

> 带 `?uid=` 的模块接口会返回每条的真实计数（`goN/bdN/buddyNames`）和「我的参与态」（`mine`）。

小程序联调：把 `poke-miniprogram` 的请求指向 `http://localhost:5700`，开发者工具里勾「不校验合法域名」。真机/上线需 https 域名。

## 架构

```
采集适配器(mock | wechaty)
  → store(JSON) 存原始
  → ai/pipeline 分类+抽取(LLM 或 规则引擎) + 去重
  → store 存结构化 items
  → modules 过滤排序成 4 个模块视图
  → Express API → 控制台/小程序
```

下一步（验证通过后）：换合规采集（转发/企业微信）、上云数据库、加用户体系与搭子撮合、二手（跳蚤市场）模块。
