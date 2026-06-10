# Order System (MSA)

회원(member) · 주문(ordering) · 상품(product) 서비스를 **Spring Cloud Gateway / Eureka** 로 묶고,
**React(Vite)** 프론트엔드로 사용하는 마이크로서비스 데모 프로젝트입니다.

---

## 🔑 기본 계정 (Default Accounts)

| 구분 | 이메일 | 비밀번호 | 역할 | 비고 |
|------|--------|----------|------|------|
| 관리자 | `admin@naver.com` | `12341234` | `ADMIN` | member 서비스 기동 시 자동 생성 (`InitialDataLoader`) |

- 일반 사용자는 프론트엔드의 **회원가입** 또는 `POST /member-service/member/create` 로 생성하며, 기본 역할은 `USER` 입니다.
- 비밀번호는 BCrypt 로 암호화되어 저장됩니다.
- 인증은 JWT(access token + refresh token) 기반이며, refresh token 은 Redis 에 저장됩니다(TTL 200일).

> ⚠️ JWT 시크릿 키, DB 비밀번호(`root`/`1234`) 등은 데모용으로 소스에 하드코딩되어 있습니다. 실서비스에서는 환경변수/시크릿으로 분리하세요.

---

## 🧱 구성 (Modules)

| 모듈 | 설명 | 포트 | 비고 |
|------|------|------|------|
| `eureka` | 서비스 디스커버리 | **8761** | |
| `apigateway` | API 게이트웨이 / JWT 인증 필터 | **8081** | 기본 8080이나 로컬에서 Oracle TNS(8080) 충돌로 8081 사용 |
| `member` | 회원/인증 (JWT, Redis) | 랜덤 | Eureka 등록 |
| `product` | 상품/재고 (Kafka Consumer) | 랜덤 | Eureka 등록 |
| `ordering` | 주문 (Feign + Kafka Producer) | 랜덤 | Eureka 등록 |
| `frontend` | Next.js(App Router) UI | **3000** | 게이트웨이로 호출 |

### 기술 스택
- **Backend**: Java 17, Spring Boot 3.4.2, Spring Cloud Gateway, Netflix Eureka, OpenFeign, Spring Data JPA, Spring Security(BCrypt), JJWT
- **Infra**: MySQL 8, Redis 7, Apache Kafka 3.9 (KRaft)
- **Frontend**: Next.js 14 (App Router), React 18, **TypeScript**, Axios

### 인프라 의존성 (local 프로파일)
| 인프라 | 주소 | 용도 |
|--------|------|------|
| MySQL | `localhost:3306` / DB `ordermsa` / `root` / `1234` | 각 서비스 영속화 (`ddl-auto: create` — 재시작 시 테이블 재생성) |
| Redis | `localhost:6379` | refresh token 저장 (member) |
| Kafka | `localhost:9092` / topic `update-stock-topic` | 주문→재고 차감 비동기 연동 |

---

## 🔌 API

게이트웨이는 `StripPrefix=1` 로 라우팅하므로 **서비스 접두어**(`/member-service`, `/ordering-service`, `/product-service`)를 붙여 호출합니다.
인증이 필요한 요청은 `Authorization: Bearer <token>` 만 보내면 게이트웨이(JwtAuthFilter)가 검증 후 `X-User-Id` / `X-User-Role` 헤더를 백엔드에 주입합니다.

| 기능 | 메서드 / 경로 | 인증 | 요청 / 응답 |
|------|--------------|:----:|------|
| 회원가입 | `POST /member-service/member/create` | ✕ | `{name,email,password}` → memberId |
| 로그인 | `POST /member-service/member/doLogin` | ✕ | `{email,password}` → `{id,token,refreshToken}` |
| 토큰 재발급 | `POST /member-service/member/refresh-token` | ✕ | `{refreshToken}` → `{token}` |
| 상품 목록 | `GET /product-service/product/list` | ✕ | → `[{id,name,price,stockQuantity}, ...]` |
| 상품 조회 | `GET /product-service/product/{id}` | ○ | → `{id,name,price,stockQuantity}` |
| 상품 등록 | `POST /product-service/product/create` | ○ | **form-urlencoded** `{name,category,price,stockQuantity}` → productId |
| 재고 수정 | `PUT /product-service/product/updatestock` | ○ | `{productId,productQuantity}` → productId |
| 주문 생성 | `POST /ordering-service/ordering/create` | ○ | `{productId,productCount}` → orderId |

> 인증 불필요(✕) 경로는 게이트웨이 `ALLOWED_PATHS` 에 등록되어 있습니다. 그 외 경로는 토큰이 없으면 `401` 입니다.

### 주문 처리 흐름
```
[프론트] ──POST /ordering/create──▶ [ordering]
                                      │ ① Feign: GET product/{id} (재고 확인)
                                      │ ② 재고 부족 시 예외, 충분하면 주문 저장
                                      └ ③ Kafka publish "update-stock-topic"
                                                   │
                                                   ▼
                                              [product] Kafka consume → 재고 차감
```

---

## 🚀 실행 (로컬)

### 사전 준비
- Docker Desktop, **JDK 17**(백엔드 빌드/실행 — `build.gradle` 의 toolchain 이 17), Node.js 18+
- PowerShell (Windows)

### 한 번에 시작 / 종료 (권장)
```powershell
cd order-project

.\start-all.ps1            # 인프라 → Eureka → member/ordering/product → gateway(8081) → frontend(3000)
.\stop-all.ps1             # 전체 종료 (DB 데이터 유지)
.\stop-all.ps1 -Volumes    # 전체 종료 + Docker 볼륨(DB/Kafka) 삭제
```
- `start-all.ps1` 은 JDK 17 을 자동 탐지하고, 각 서비스를 별도 창에서 띄우며 헬스체크 후 다음 단계로 진행합니다.
- 실행 정책 오류 시: `powershell -ExecutionPolicy Bypass -File .\start-all.ps1`
- 게이트웨이 포트를 바꾸려면 `.\start-all.ps1 -GatewayPort 8090` + `frontend/.env` 의 `VITE_API_BASE_URL` 동시 수정.

### 수동 실행
```powershell
# 1) 인프라
docker compose up -d            # MySQL / Redis / Kafka (healthy 확인: docker compose ps)

# 2) 백엔드 (각각 별도 터미널, JDK17, local 프로파일)
#    Eureka 먼저, 그 다음 나머지
cd eureka      ;  .\gradlew bootRun
cd member      ;  .\gradlew bootRun --args='--spring.profiles.active=local'
cd ordering    ;  .\gradlew bootRun --args='--spring.profiles.active=local'
cd product     ;  .\gradlew bootRun --args='--spring.profiles.active=local'
cd apigateway  ;  .\gradlew bootRun --args='--spring.profiles.active=local --server.port=8081'

# 3) 프론트엔드
cd frontend    ;  npm install  ;  npm run dev
```

### 접속
| 항목 | 주소 |
|------|------|
| 프론트엔드 | http://localhost:3000 |
| API 게이트웨이 | http://localhost:8081 |
| Eureka 대시보드 | http://localhost:8761 |

로그인: `admin@naver.com` / `12341234`

---

## 📁 디렉터리
```
order-project/
├── docker-compose.yml      # 인프라(MySQL/Redis/Kafka)
├── start-all.ps1           # 전체 기동 스크립트
├── stop-all.ps1            # 전체 종료 스크립트
├── eureka/                 # 서비스 디스커버리
├── apigateway/             # 게이트웨이 + JWT 필터
├── member/                 # 회원/인증
├── ordering/               # 주문
├── product/                # 상품/재고
└── frontend/               # Next.js(App Router) UI  (자세한 내용: frontend/README.md)
```

---

## 📝 참고 / 알려진 사항
- 백엔드 기본 프로파일은 `prod` 이므로, 로컬 실행 시 반드시 `--spring.profiles.active=local` 을 지정해야 CORS(`localhost:3000`)가 허용됩니다.
- `ddl-auto: create` 이므로 **서비스 재시작 시 해당 서비스의 테이블이 재생성**됩니다(데이터 초기화). 데이터 유지가 필요하면 `update` 로 변경하세요.
- 상품의 `category` 는 등록 시 입력받지만 엔티티에는 저장되지 않습니다(`Product.toEntity` 에서 미사용).
- 로컬 8080 포트가 다른 프로세스(예: Oracle TNS Listener)에 점유된 경우를 고려해 게이트웨이를 8081 로 운영합니다.
