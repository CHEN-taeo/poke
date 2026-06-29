# WeWe-RSS 接入（个人公众号 → 破壳自动采集）

**适用场景**：个人自用、不想折腾 wechat-cli / 企微。用「微信读书」扫码登录 WeWe-RSS，把关注的**公众号**转成 RSS，破壳定时拉取并 AI 整理。

与 **wechat-cli**（读本地微信群聊）互补：WeWe-RSS 只管**公众号推文**，不管群消息。

---

## 1. 前置

- 已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)（Windows）
- 一个可扫码的微信（用于微信读书授权，**不是**企业微信）
- 破壳 `poke-server` 已能 `npm start`

---

## 2. 启动 WeWe-RSS

在 `poke-server/` 目录：

```powershell
# .env 里可改（可选）
# WEWE_RSS_BASE=http://127.0.0.1:4000
# WEWE_RSS_AUTH_CODE=123567

npm run wewe:up
npm run wewe -- check
```

浏览器打开 **http://127.0.0.1:4000**，按页面提示用**微信读书**扫码登录。

> 数据目录：`poke-server/data/wewe-rss/`（容器重启不丢订阅）

---

## 3. 添加公众号

1. 在微信里打开目标公众号任意一篇文章 → **复制链接**
2. 在 WeWe-RSS 管理台「添加订阅」粘贴链接
3. 订阅成功后，在源列表里**复制 RSS 地址**（形如 `http://127.0.0.1:4000/feeds/MP_WXS_….rss`）

东华常用建议（也可用 `npm run wewe -- template` 查看）：

| 破壳来源名 | 微信搜索 |
|-----------|---------|
| 东华大学 | 东华大学 |
| 东华团委 | 东华大学团委 |
| 东华图书馆 | 东华大学图书馆 |
| 东华就业 | 东华大学学生就业服务网 |

---

## 4. 写入破壳采集源

任选一种：

```powershell
# 推荐：带来源标记 wewe:true
npm run wewe -- add http://127.0.0.1:4000/feeds/MP_WXS_xxxx.rss 东华团委

# 或通用 CLI
npm run source -- add http://127.0.0.1:4000/feeds/MP_WXS_xxxx.rss 东华团委 rss

# 立刻拉一次
npm run poll
```

也可在 Web 控制台 **http://127.0.0.1:5701** →「自动采集源」粘贴 RSS。

`AUTO_INGEST=1` 时，每 15 分钟会自动轮询（与官网 web 源相同管线）。

---

## 5. 与 wechat-cli 的关系

| 方式 | 内容 | Windows 4.1.11 现状 |
|------|------|---------------------|
| **WeWe-RSS** | 公众号推文 | ✅ 推荐（本方案） |
| **wechat-cli** | 群聊 / 文件传输助手 | ❌ 密钥扫描失败，见 `wechat-cli-setup.md` |
| **手动导入** | 任意粘贴 | ✅ 小程序「导入」页 |

建议在 `.env` 关闭无效的 wechat-cli 轮询：

```env
WECHAT_CLI=0
```

群消息仍可：转发到文件传输助手 → 小程序粘贴导入。

---

## 6. 运维

```powershell
npm run wewe:down          # 停止容器
docker logs poke-server-wewe-rss-1   # 若 compose 项目名不同，用 docker ps 查看
```

WeWe-RSS 自带定时更新公众号（默认每天两次）。破壳只读 RSS，不负责更新微信侧缓存。

---

## 7. 故障排查

| 现象 | 处理 |
|------|------|
| `npm run wewe -- check` 连不上 | Docker 是否运行；`npm run wewe:up` |
| RSS 有条目但破壳没新卡 | `npm run poll`；看 `sources.json` 里该源 `lastError` |
| 公众号添加失败 | 换一篇该号的文章链接；微信读书重新扫码 |
| 4000 端口占用 | `.env` 设 `WEWE_RSS_PORT=4001`，RSS URL 用新端口 |

---

## 参考

- 上游项目：[cooderl/wewe-rss](https://github.com/cooderl/wewe-rss)
- 破壳源配置：`data/sources.json`
- 示例模板：`data/wewe-feeds.template.json`
