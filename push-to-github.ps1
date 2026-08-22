# 切换到脚本所在目录
Set-Location $PSScriptRoot

# 初始化 git
if (-not (Test-Path .git)) {
    git init
    git branch -M main
}

# 设置 remote
$remoteUrl = "https://github.com/LxCheeseRoll/cheeseroll-blog.git"
$existing = git remote get-url origin 2>$null
if (-not $existing) {
    git remote add origin $remoteUrl
} else {
    git remote set-url origin $remoteUrl
}

# 配置 git 用户（如果没配过）
git config user.email "blog@cheeseroll.local" 2>$null
git config user.name "LxCheeseRoll" 2>$null

# 提交
git add .
git commit -m "feat: init personal blog from smart-nav"

Write-Host ""
Write-Host "[INFO] Preparing to push to GitHub..." -ForegroundColor Cyan
Write-Host "[INFO] Login window may popup, enter your GitHub credentials" -ForegroundColor Yellow
Write-Host ""

# 强制推送（覆盖空仓库）
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Push success!" -ForegroundColor Green
    Write-Host "[NEXT] Go to Cloudflare Pages and connect this new repo" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[FAIL] Push failed, check error above" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
