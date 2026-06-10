# =============================================================
#  로컬 개발 스택 종료 스크립트
#  대상: order-project 백엔드(Java) + 프론트(Next.js/node) + 인프라(docker)
#  사용: PowerShell 에서
#        .\stop-all.ps1            # 컨테이너 중지(데이터 유지)
#        .\stop-all.ps1 -Volumes   # 컨테이너 중지 + 볼륨(DB/Kafka 데이터) 삭제
# =============================================================
param(
    [switch]$Volumes  # 지정 시 docker 볼륨까지 삭제
)

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "==> 백엔드 Java 프로세스 종료 중 (eureka/member/ordering/product/apigateway, gradle)..."
# Spring Boot bootRun / Gradle 데몬 JVM 은 커맨드라인에 프로젝트 경로(order-project)를 포함한다.
# member/ordering/product 는 랜덤 포트라 포트가 아닌 커맨드라인으로 식별한다.
$killed = 0
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
    Where-Object { $_.CommandLine -match 'order-project' } |
    ForEach-Object {
        Write-Host ("  - java PID {0} 종료" -f $_.ProcessId)
        Stop-Process -Id $_.ProcessId -Force
        $killed++
    }
if ($killed -eq 0) { Write-Host "  (실행 중인 order-project Java 프로세스 없음)" }

Write-Host "==> 프론트엔드(Next.js/node) dev 서버 종료 중..."
$killedNode = 0
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'order-project' -and ($_.CommandLine -match 'next' -or $_.CommandLine -match 'vite') } |
    ForEach-Object {
        Write-Host ("  - node PID {0} 종료" -f $_.ProcessId)
        Stop-Process -Id $_.ProcessId -Force
        $killedNode++
    }
if ($killedNode -eq 0) { Write-Host "  (실행 중인 Vite 프로세스 없음)" }

Write-Host "==> 인프라 컨테이너(docker compose) 종료 중..."
Push-Location $PSScriptRoot
if ($Volumes) {
    Write-Host "  (-Volumes 지정: 볼륨 데이터까지 삭제)"
    docker compose down -v
} else {
    docker compose down
}
Pop-Location

Write-Host ""
Write-Host "완료. 전체 종료됨." -ForegroundColor Green
Write-Host "남은 프로세스 확인:  netstat -ano | Select-String ':8761|:8081|:3000'"
