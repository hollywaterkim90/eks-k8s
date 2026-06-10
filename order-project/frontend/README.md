# Order System Frontend (Next.js + TypeScript)

member · ordering · product MSA 백엔드를 **API 게이트웨이**로 연동하는 **Next.js(App Router) + TypeScript** 프론트엔드입니다.
(Vite + React(JS) → Next.js App Router → TypeScript 순으로 리팩토링했습니다.)

## 실행

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

- 개발 서버 포트는 3000 고정 (`next dev -p 3000`) — 게이트웨이 CORS 허용 오리진과 일치
- API 게이트웨이 주소는 `.env.local` 의 `NEXT_PUBLIC_API_BASE_URL` 로 설정 (기본 `http://localhost:8081`)
- 프로덕션: `npm run build && npm run start`

## 백엔드 전제 조건

게이트웨이가 `local` 프로파일로 떠 있어야 CORS(localhost:3000)가 허용됩니다.
유레카(8761), member/ordering/product 서비스, Redis, Kafka 가 함께 실행되어 있어야 합니다.
프로젝트 루트의 `start-all.ps1` 로 한 번에 기동할 수 있습니다.

기본 관리자 계정: `admin@naver.com` / `12341234`

## 아키텍처 메모

- **App Router + 클라이언트 컴포넌트 중심**: 인증 토큰을 `localStorage` 에 저장하고 axios 로
  게이트웨이를 직접 호출하므로, 상호작용 페이지는 모두 `'use client'` 컴포넌트입니다.
  (SSR 쿠키 세션이 아닌, 기존 SPA 와 동일한 클라이언트 사이드 인증 모델을 유지)
- **인증 주입**: 로그인 시 받은 JWT 를 `Authorization: Bearer` 로만 전송하면, 게이트웨이가
  검증 후 `X-User-Id` 헤더를 백엔드에 주입합니다. 프론트는 `X-User-Id` 를 직접 보내지 않습니다.
- **토큰 재발급**: axios 응답 인터셉터가 401 시 `refresh-token` 으로 access token 을 재발급해 1회 재시도합니다.
- **보호 라우트**: `ProtectedRoute` 클라이언트 컴포넌트가 비로그인 사용자를 `/login` 으로 보냅니다.

## 라우트 / API

| 화면 | 경로(Route) | 연동 API |
|------|------------|----------|
| 홈 | `/` | - |
| 로그인 | `/login` | `POST /member-service/member/doLogin` |
| 회원가입 | `/signup` | `POST /member-service/member/create` |
| 상품 조회 | `/products/lookup` | `GET /product-service/product/{id}` |
| 상품 목록 | `/products/list` | `GET /product-service/product/list` |
| 상품 등록 | `/products/new` | `POST /product-service/product/create` (form-urlencoded) |
| 주문하기 | `/orders/new` | `POST /ordering-service/ordering/create` |

> 상품 등록은 백엔드가 `@RequestBody` 가 아닌 모델 바인딩을 쓰므로 `application/x-www-form-urlencoded` 로 전송합니다.

## 구조 (App Router)

```
frontend/
├── next.config.mjs
├── jsconfig.json            # @/* → ./src/*
├── .env.local               # NEXT_PUBLIC_API_BASE_URL
└── src/
    ├── app/
    │   ├── layout.jsx        # 루트 레이아웃 (AuthProvider + Navbar)
    │   ├── globals.css
    │   ├── page.jsx          # 홈
    │   ├── login/page.jsx
    │   ├── signup/page.jsx
    │   ├── products/lookup/page.jsx
    │   ├── products/list/page.jsx
    │   ├── products/new/page.jsx
    │   └── orders/new/page.jsx
    ├── components/           # Navbar, ProtectedRoute
    └── lib/
        ├── api/              # client(axios+인터셉터), member, product, ordering
        └── auth/             # AuthContext
```
