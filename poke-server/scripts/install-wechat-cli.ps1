# 安装 wechat-cli（Windows · 微信 4.x 本地读库，无需降级）
# 用法：在 poke-server 目录，右键「以管理员身份运行」PowerShell，然后：
#   powershell -ExecutionPolicy Bypass -File scripts/install-wechat-cli.ps1

$ErrorActionPreference = "Stop"

Write-Host "== 1/3 检查 Python ==" -ForegroundColor Cyan
python --version
if ($LASTEXITCODE -ne 0) {
  Write-Host "请先安装 Python 3.10+ 并勾选 Add to PATH: https://www.python.org/downloads/" -ForegroundColor Red
  exit 1
}

Write-Host "`n== 2/3 安装 wechat-cli ==" -ForegroundColor Cyan
Write-Host "方式 A（推荐）：官方 release 安装脚本" -ForegroundColor Yellow
Write-Host '  irm https://raw.githubusercontent.com/r266-tech/wechat-cli/main/scripts/install-release.ps1 | iex'
Write-Host "`n若 pip 可用，也可尝试方式 B：" -ForegroundColor Yellow
pip install --upgrade wechat-cli 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "pip 未找到 wechat-cli 包，请用上面的 irm 官方脚本安装。" -ForegroundColor Red
  Write-Host "安装后重新打开管理员 PowerShell，运行: wechat-cli --version" -ForegroundColor Yellow
  exit 1
}

Write-Host "`n== 3/3 提取微信数据库密钥（需微信已登录） ==" -ForegroundColor Cyan
Write-Host "若提示权限不足，请确保本窗口是「以管理员身份运行」" -ForegroundColor Yellow
wechat-cli init
if ($LASTEXITCODE -ne 0) {
  Write-Host "`ninit 失败常见原因：微信未打开 / 非管理员 / 多账号选错" -ForegroundColor Red
  Write-Host "可稍后手动运行: wechat-cli init" -ForegroundColor Yellow
  exit 1
}

Write-Host "`n验证：" -ForegroundColor Green
wechat-cli sessions --limit 3

Write-Host "`n安装完成。在 poke-server/.env 里设：" -ForegroundColor Green
Write-Host "  WECHAT_CLI=1"
Write-Host "  WECHAT_CLI_HUB=1          # 推荐：只监听文件传输助手，群消息转发过来"
Write-Host "  # 或 ROOM_WHITELIST=兼职群,二手群   # 直读指定群（群名要完全一致）"
Write-Host "`n然后 npm start 重启后端。" -ForegroundColor Green
