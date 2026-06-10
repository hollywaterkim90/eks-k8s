# =============================================================
#  로컬 개발 스택 시작 스크립트
#  순서: 인프라(docker) → Eureka → member/ordering/product → API Gateway → 프론트(Vite)
#  각 백엔드/프론트는 로그 확인이 쉽도록 별도 창에서 실행된다.
#
#  사용: PowerShell 에서
#        .\start-all.ps1
#        .\start-all.ps1 -GatewayPort 8081      # 게이트웨이 포트 지정(기본 8081)
#        .\start-all.ps1 -Java17Home "C:\Path\To\jdk17"   # Java17 경로 수동 지정
#
#  종료: .\stop-all.ps1
# =============================================================
param(
    [int]$GatewayPort = 8081,                  # 8080은 흔히 점유되어 있어 기본 8081 사용
    [string]$Java17Home = $env:JAVA17_HOME     # 미지정 시 자동 탐지
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# ---------- 헬퍼 ----------
function Find-Java17 {
    param([string]$Override)
    $cands = @()
    if ($Override) { $cands += $Override }
    foreach ($base in @('C:\Program Files\Java', 'C:\Program Files\Eclipse Adoptium', 'C:\Program Files\Microsoft')) {
        if (Test-Path $base) {
            $cands += (Get-ChildItem $base -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
        }
    }
    foreach ($c in $cands) {
        $java = Join-Path $c 'bin\java.exe'
        if (Test-Path $java) {
            $v = & $java -version 2>&1 | Out-String
            if ($v -match 'version "17') { return $c }
        }
    }
    return $null
}

function Start-ServiceWindow {
    param([string]$Name, [string]$Dir, [string]$GradleArgs = '')
    $cmd = "`$host.UI.RawUI.WindowTitle='$Name'; `$env:JAVA_HOME='$Java17Home'; Set-Location '$Dir'; .\gradlew bootRun --console=plain $GradleArgs"
    Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd | Out-Null
    Write-Host ("  -> '{0}' 시작 (새 창)" -f $Name) -ForegroundColor DarkGray
}

function Wait-Url {
    param([string]$Url, [int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch { }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Wait-EurekaApps {
    param([string[]]$Names, [int]$TimeoutSec = 120)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-RestMethod -Uri 'http://localhost:8761/eureka/apps' -Headers @{ Accept = 'application/json' } -TimeoutSec 3
            $apps = @($resp.applications.application.name)
            $missing = $Names | Where-Object { $apps -notcontains $_ }
            if (-not $missing) { return $true }
        } catch { }
        Start-Sleep -Seconds 3
    }
    return $false
}

# ---------- 0. Java 17 확인 ----------
Write-Host "==> Java 17 탐지 중..." -ForegroundColor Cyan
$Java17Home = Find-Java17 -Override $Java17Home
if (-not $Java17Home) {
    Write-Host "Java 17 을 찾을 수 없습니다. -Java17Home 으로 경로를 지정하세요." -ForegroundColor Red
    Write-Host "예: .\start-all.ps1 -Java17Home 'C:\Program Files\Java\jdk-17'" -ForegroundColor Red
    exit 1
}
Write-Host ("  사용할 JAVA_HOME = {0}" -f $Java17Home) -ForegroundColor Green

# ---------- 1. 인프라 ----------
Write-Host "==> 인프라(docker compose) 기동 중..." -ForegroundColor Cyan
Push-Location $root
docker compose up -d | Out-Null
Pop-Location

Write-Host "  컨테이너 healthy 대기 중 (MySQL/Redis/Kafka)..."
$deadline = (Get-Date).AddMinutes(3)
$infraOk = $false
while ((Get-Date) -lt $deadline) {
    $states = docker inspect --format '{{.State.Health.Status}}' ordermsa-mysql ordermsa-redis ordermsa-kafka 2>$null
    if ($states -and (@($states | Where-Object { $_ -ne 'healthy' }).Count -eq 0) -and (@($states).Count -eq 3)) {
        $infraOk = $true; break
    }
    Start-Sleep -Seconds 3
}
if (-not $infraOk) {
    Write-Host "인프라가 healthy 상태가 되지 않았습니다. 'docker compose ps' 로 확인하세요." -ForegroundColor Red
    exit 1
}
Write-Host "  인프라 healthy 확인" -ForegroundColor Green

# ---------- 2. Eureka ----------
Write-Host "==> Eureka 기동 중 (8761)..." -ForegroundColor Cyan
Start-ServiceWindow -Name 'eureka' -Dir (Join-Path $root 'eureka')
if (Wait-Url -Url 'http://localhost:8761/' -TimeoutSec 120) {
    Write-Host "  Eureka 응답 확인 (8761)" -ForegroundColor Green
} else {
    Write-Host "  Eureka 응답 없음 — eureka 창 로그를 확인하세요." -ForegroundColor Yellow
}

# ---------- 3. member / ordering / product ----------
Write-Host "==> 백엔드 서비스 기동 중 (local 프로파일)..." -ForegroundColor Cyan
Start-ServiceWindow -Name 'member-service'   -Dir (Join-Path $root 'member')   -GradleArgs "--args='--spring.profiles.active=local'"
Start-ServiceWindow -Name 'ordering-service' -Dir (Join-Path $root 'ordering') -GradleArgs "--args='--spring.profiles.active=local'"
Start-ServiceWindow -Name 'product-service'  -Dir (Join-Path $root 'product')  -GradleArgs "--args='--spring.profiles.active=local'"

Write-Host "  유레카 등록 대기 중 (MEMBER/ORDERING/PRODUCT-SERVICE)..."
if (Wait-EurekaApps -Names @('MEMBER-SERVICE', 'ORDERING-SERVICE', 'PRODUCT-SERVICE') -TimeoutSec 150) {
    Write-Host "  3개 서비스 유레카 등록 확인" -ForegroundColor Green
} else {
    Write-Host "  일부 서비스 등록 미확인 — 각 서비스 창 로그를 확인하세요." -ForegroundColor Yellow
}

# ---------- 4. API Gateway ----------
Write-Host ("==> API Gateway 기동 중 ({0})..." -f $GatewayPort) -ForegroundColor Cyan
Start-ServiceWindow -Name 'api-gateway' -Dir (Join-Path $root 'apigateway') -GradleArgs ("--args='--spring.profiles.active=local --server.port={0}'" -f $GatewayPort)
if (Wait-Url -Url ("http://localhost:{0}/" -f $GatewayPort) -TimeoutSec 120) {
    Write-Host ("  게이트웨이 응답 확인 ({0})" -f $GatewayPort) -ForegroundColor Green
} else {
    Write-Host "  게이트웨이 응답 없음 — api-gateway 창 로그를 확인하세요." -ForegroundColor Yellow
}

# ---------- 5. 프론트엔드 ----------
Write-Host "==> 프론트엔드(Vite) 기동 중 (3000)..." -ForegroundColor Cyan
$feDir = Join-Path $root 'frontend'
if (-not (Test-Path (Join-Path $feDir 'node_modules'))) {
    Write-Host "  node_modules 없음 — npm install 실행..." -ForegroundColor Yellow
    Push-Location $feDir; npm install; Pop-Location
}
$feCmd = "`$host.UI.RawUI.WindowTitle='frontend'; Set-Location '$feDir'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $feCmd | Out-Null

# ---------- 안내 ----------
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " 전체 스택 기동 요청 완료" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host (" 프론트엔드 : http://localhost:3000")
Write-Host (" 게이트웨이 : http://localhost:{0}" -f $GatewayPort)
Write-Host (" 유레카     : http://localhost:8761")
Write-Host " 로그인     : admin@naver.com / 12341234"
Write-Host ""
Write-Host " 주의: 게이트웨이 포트가 8081이 아니면 frontend\.env 의" -ForegroundColor Yellow
Write-Host "       VITE_API_BASE_URL 값도 맞춰야 합니다." -ForegroundColor Yellow
Write-Host " 종료: .\stop-all.ps1"
