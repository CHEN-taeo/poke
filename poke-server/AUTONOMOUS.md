# 破壳 · 全自动采集运行手册

> 目标：信息**自动**进来 → AI(DeepSeek) 自动结构化 → 小程序自动展示。人不用动手。
> 现实：能「全自动」的是**有 feed 的源**（公众号、官网、B站/知乎/微博）。
> 微信**群聊**没有任何官方接口，无法在你这台机器（Windows + 微信4.x）上安全全自动，见最后一节。

---

## 0. 现在已经在跑的（不用配）

`.env` 里 `AUTO_INGEST=1`，服务一启动就每 15 分钟轮询一次所有源，自动入库。
验证它真的在跑：

```bash
npm run source:list     # 看每个源「上次轮询时间 / 新增条数」
npm run poll            # 立刻手动拉一次（验证用）
```

加 / 删一个源（核心操作，全自动的本质就是「往这里塞 feed 地址」）：

```bash
node scripts/source.js add "https://feed地址.xml" "显示名"
node scripts/source.js rm  src_xxxx
```

---

## 1. 让【公众号】全自动（最高价值，今天就能成）

校园 80% 的有用信息在公众号（社团/学院/校会/讲座）。两条路，选一条：

### 路 A：零基建，用「公众号→RSS」服务（最快）
找一个公众号转 RSS 的服务，拿到每个公众号的 RSS 地址，直接塞进来即可：

```bash
node scripts/source.js add "https://<服务给你的公众号RSS地址>" "XX学院"
```

- 优点：本机什么都不用装，几分钟搞定，立刻全自动。
- 选型：搜「微信公众号 RSS 服务」，有免费的也有按年付费的（付费的更稳）。
- 一个公众号一条命令；加完就被 15 分钟轮询自动收走。

### 路 B：自建 wewe-rss（免费、可控，需要装 Docker Desktop）
`wewe-rss` 通过**微信读书**读取公众号文章，**不碰群聊、不钩主号客户端**。
强烈建议用一个**小号**登录微信读书。

1. 装 Docker Desktop（Windows，一次性）。
2. 起服务：
   ```bash
   cd deploy
   docker compose -f wewe-rss.docker-compose.yml up -d
   ```
3. 打开 http://localhost:4000 ，用 `AUTH_CODE`（默认 `poke-2026`，在 compose 里改）登录后台 →
   扫码登录微信读书**小号** → 在后台「订阅」你要的公众号。
4. 把合并总 feed 接进来（一条命令，全部公众号都进来）：
   ```bash
   cd ..
   node scripts/source.js add "http://localhost:4000/feeds/all.rss" "公众号合集"
   node scripts/source.js poll
   ```

之后你只要在 wewe-rss 后台「订阅新公众号」，破壳会自动收，无需再加源。

---

## 2. 让【学校官网 / B站 / 知乎 / 微博】全自动

- 学校官网通知页：很多有 RSS；没有的可用 RSSHub 生成。
- B站 UP / 知乎专栏 / 微博：用公共 RSSHub 实例，例如：
  ```bash
  node scripts/source.js add "https://rsshub.app/bilibili/user/dynamic/<UID>" "某社团B站"
  ```
- 都是一条命令，加完即自动。

---

## 3. 微信群聊 — 四条路（按推荐顺序）

**你的环境：Windows + 微信 `4.1.x`（Weixin.exe）。**

| 方案 | 要不要小号/降级 | 自动化程度 | 说明 |
|------|----------------|------------|------|
| **B. wechat-cli 读本地库** | ❌ 主号即可 | 群直读全自动，或「转发到文件传输助手」半自动 | **推荐**。支持 4.x，只读本机 DB，不 Hook |
| **A. 文件传输助手 + 粘贴** | ❌ | 手动复制/转发后一键导入 | 已实现：小程序「导入」或 `/api/ingest/paste` |
| **C. 企业微信会话存档** | 需企业认证 | 全自动、合规 | 有公司/社团企业微信时用官方 API |
| **D. wechaty + 3.9 旧版** | ✅ 小号+旧设备 | 全自动 | 封号风险高，见下文 |

---

### 方案 B（推荐）：wechat-cli + 微信 4.x

不降级、不注入 DLL，从本机已登录微信的**加密数据库**只读新消息（[wechat-cli](https://github.com/r266-tech/wechat-cli)）。

**一次性安装（管理员 PowerShell，微信保持登录）：**

```powershell
cd poke-server
powershell -ExecutionPolicy Bypass -File scripts/install-wechat-cli.ps1
```

**配置 `.env`（二选一）：**

```env
WECHAT_CLI=1
WECHAT_CLI_HUB=1          # 推荐：只监听「文件传输助手」
# 群里有用的消息 → 右键「转发」→ 文件传输助手 → 30 秒内自动进破壳
```

或直读群聊（群名必须与微信左侧列表**完全一致**）：

```env
WECHAT_CLI=1
ROOM_WHITELIST=机械2201班级群,东华二手市场群
WECHAT_CLI_POLL_SEC=30
```

重启 `npm start`。可与 `AUTO_INGEST=1`（东华官网）**同时开**。

**风险**：读本地库属于灰色地带，比 Hook/降级安全，但仍非腾讯官方接口；仅采自己所在群、注意隐私。

---

### 方案 A：粘贴 / 导出（零安装）

- 小程序 **今天 → 导入**，或控制台 http://localhost:5701 粘贴
- PC 微信 **导出聊天记录** → `parse` 模式 `export` 自动识别时间+发送者

---

### 方案 C：企业微信会话存档（合规、需组织）

学校社团/创业团队若有**企业微信**，可开 [会话内容存档](https://developer.work.weixin.qq.com/document/path/91774) API，稳定合法。需要企业认证 + 成员用企业微信。

---

### 方案 D（不推荐主号）：wechaty + 微信 3.9.10.27
1. 准备一个**小号**（专门用来采集，封了不心疼）。
2. 用一台**旧手机/旧电脑/虚拟机**，装 **微信 3.9.10.27**：
   https://github.com/tom-snow/wechat-windows-versions/releases/download/v3.9.10.27/WeChatSetup-3.9.10.27.exe
   关掉自动更新；用小号登录（若提示需更新，按 puppet-xp issue #231 的内存改版本号脚本处理）。
3. 在那台机器上装 **Node 18**（puppet-xp 的 frida 有预编译，不用装 VS 编译器）：
   - 装 nvm-windows → `nvm install 18` → `nvm use 18`
4. 装依赖并配置：
   ```bash
   npm i            # package.json 已钉 wechaty@1.20 + wechaty-puppet-xp@2.1.1
   ```
   `.env` 改：
   ```
   INGEST_MODE=wechaty
   WECHATY_PUPPET=wechaty-puppet-xp
   ROOM_WHITELIST=兼职信息群,二手交易群   # 只采这些群，留空=全部（不建议）
   ```
5. `npm start` → 终端出现二维码 → 小号扫码登录 → 白名单群消息自动进 AI 管线。

> 合规与隐私：只采你**自己在群里、且群友知情**的群；采集他人消息有法律与道德风险，后果自担。

---

## 4. 一句话总结

- **今天就全自动**：公众号(路A最快) + 官网/B站(RSSHub) → 已建的 15 分钟调度器全收。
- **群聊**：优先 **wechat-cli（4.x 主号）** 或 **转发到文件传输助手**；别用主号跑 wechaty 旧版。
