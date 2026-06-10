# 查找微信 4.x 账号目录（含 db_storage 的文件夹）
# 用法：powershell -ExecutionPolicy Bypass -File scripts/find-wechat-db.ps1

Write-Host "搜索 db_storage（微信 4.x 账号目录）..." -ForegroundColor Cyan

$roots = @(
  "$env:USERPROFILE\Documents",
  "$env:USERPROFILE\Documents\WeChat Files",
  "$env:USERPROFILE\Documents\xwechat_files",
  "D:\HuaweiMoveData\Users\$env:USERNAME\Documents\xwechat_files",
  "D:\HuaweiMoveData\Users\$env:USERNAME\Documents",
  "D:\", "E:\", "F:\"
)

$found = @()
foreach ($root in $roots) {
  if (-not (Test-Path $root)) { continue }
  try {
    Get-ChildItem -LiteralPath $root -Recurse -Directory -Filter "db_storage" -ErrorAction SilentlyContinue -Depth 10 |
      ForEach-Object { $_.Parent.FullName } |
      ForEach-Object { if ($_ -notin $found) { $found += $_ } }
  } catch { }
}

if (-not $found.Count) {
  Write-Host "`n未找到 db_storage。" -ForegroundColor Yellow
  Write-Host "请确认："
  Write-Host "  1) PC 微信已登录（Weixin.exe）"
  Write-Host "  2) 打开过至少一个聊天（让数据库生成）"
  Write-Host "  3) 微信 → 设置 → 文件管理，查看存储路径"
  Write-Host "`n若路径非默认，手动设置（账号目录 = 直接包含 db_storage 的那一层）："
  Write-Host '  [Environment]::SetEnvironmentVariable("WECHAT_CLI_DB_ROOT", "你的路径\xwechat_files\wxid_xxx", "User")'
  exit 1
}

Write-Host "`n找到 $($found.Count) 个账号目录：" -ForegroundColor Green
$i = 0
foreach ($p in $found) { $i++; Write-Host "  [$i] $p" }

$pick = $found[0]
if ($found.Count -gt 1) {
  Write-Host "`n多个账号时请在 .env 里手动选 WECHAT_CLI_DB_ROOT" -ForegroundColor Yellow
}

Write-Host "`n写入用户环境变量 WECHAT_CLI_DB_ROOT ..." -ForegroundColor Cyan
[Environment]::SetEnvironmentVariable("WECHAT_CLI_DB_ROOT", $pick, "User")
$env:WECHAT_CLI_DB_ROOT = $pick

Write-Host "已设置: $pick" -ForegroundColor Green
Write-Host "`n下一步（微信保持登录，打开任意聊天）："
Write-Host "  wechat-cli cache refresh --force"
Write-Host "  wechat-cli sessions --limit 5"
Write-Host "`n然后在 poke-server/.env 加一行（或确认已有）："
Write-Host "  WECHAT_CLI_DB_ROOT=$pick"
