# wechat-cli 安装与排错（Windows · v1.6.19）

> **Win 微信 4.1.10+ 目前无法提取密钥**（`wxkey setup failed`）。个人自用请改走 **[WeWe-RSS 公众号方案](./wewe-rss.md)**，群消息仍用手动转发 + 小程序「导入」。

## 你已完成的步骤

```powershell
irm .../install-release.ps1 | iex   # ✅ install complete
```

## v1.6 没有 `init` 命令

旧文档里的 `wechat-cli init` 已废弃。改用：

```powershell
# 1. 微信保持登录，打开任意一个聊天
# 2. 提取密钥 + 建缓存（可能需要 1-3 分钟）
wechat-cli cache refresh --force

# 3. 验证
wechat-cli status --pretty
wechat-cli sessions --limit 5
```

`status` 里 `readiness: ready` 且 `live_read_ok: true` 才算成功。

## 错误：未找到微信数据目录

若你改过存储位置（华为迁移常见路径）：

```text
D:\HuaweiMoveData\Users\chent\Documents\xwechat_files\wxid_suwg2rrxn1z322_89cb
```

已在 `poke-server/.env` 写入 `WECHAT_CLI_DB_ROOT`（账号目录 = 含 `db_storage` 的那一层）。

若你改过存储位置（或在 D 盘），需要手动指定 **账号目录**（包含 `db_storage` 的那一层，不是 db_storage 本身）：

```powershell
cd D:\AI项目\idea-forge\idea-forge\poke-server
powershell -ExecutionPolicy Bypass -File scripts/find-wechat-db.ps1
```

或手动：

```powershell
[Environment]::SetEnvironmentVariable(
  "WECHAT_CLI_DB_ROOT",
  "D:\你的路径\xwechat_files\wxid_xxxxx",
  "User"
)
$env:WECHAT_CLI_DB_ROOT = "D:\你的路径\xwechat_files\wxid_xxxxx"
wechat-cli cache refresh --force
```

在 `poke-server/.env` 同步加：

```env
WECHAT_CLI_DB_ROOT=D:\你的路径\xwechat_files\wxid_xxxxx
WECHAT_CLI_BIN=C:\Users\chent\AppData\Local\Microsoft\WindowsApps\wechat-cli.cmd
```

## 重启破壳后端（5701 被占用时）

```powershell
# 查占用端口的进程
netstat -ano | findstr :5701
# 结束旧 node（把 PID 换成上面最后一列）
taskkill /F /PID 23020

cd D:\AI项目\idea-forge\idea-forge\poke-server
npm start
```

启动后应看到 `[wechat-cli] 监听：文件传输助手`。

验证 API：

```powershell
Invoke-RestMethod http://localhost:5701/api/wechat-cli/status | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method POST http://localhost:5701/api/wechat-cli/poll
```

## 使用方式

1. 群里有用消息 → **转发** → **文件传输助手**
2. ~30 秒内自动进破壳「今天」

直读群聊：`.env` 设 `WECHAT_CLI_HUB=0` + `ROOM_WHITELIST=群名`（与微信左侧完全一致，`wechat-cli sessions` 可查）。
