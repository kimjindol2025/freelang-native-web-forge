# FreeLang v2 - 프로그래밍 언어 런타임

[![Gogs](https://img.shields.io/badge/Gogs-kim/v2--freelang--ai-blue)](https://gogs.dclub.kr/kim/v2-freelang-ai)

프로덕션급 프로그래밍 언어 RuntimeSystem. 한국어 기반 자체 설계 언어로 고성능 컴파일 및 실행 환경을 제공합니다.

## 🚀 Quick Start

```bash
# 설치
npm install

# 빌드
npm run build

# 실행 (REPL)
node dist/index.js

# 파일 실행
node dist/index.js <파일명>
```

## 📁 프로젝트 구조

```
v2-freelang-ai/
├── src/              # 컴파일러 & 런타임 핵심 코드
│   ├── lexer.ts      # 토큰 분석
│   ├── parser.ts     # 구문 분석
│   ├── compiler.ts   # 바이트코드 생성
│   └── vm.ts         # 가상 머신
├── stdlib/           # 표준 라이브러리
├── examples/         # 예제 코드
├── tests/            # 테스트 스위트
├── package.json
└── tsconfig.json
```

## ✨ 주요 기능

### 언어 특성
- ✅ 타입 추론 (Type Inference)
- ✅ 패턴 매칭 (Pattern Matching)
- ✅ 제네릭스 (Generics)
- ✅ 유니온 타입 (Union Types)
- ✅ 비트와이즈 연산자 (Bitwise Operators)
- ✅ 단락 평가 (Short-circuit Evaluation)

### 성능
- **렉서**: O(n) 단일 패스 토큰화
- **파서**: 재귀 하강 + 프랫 우선순위 등반
- **컴파일러**: 30개 옵코드 기반 바이트코드
- **런타임**: 스택 기반 가상 머신

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# 특정 테스트만 실행
npm test -- --testNamePattern="pattern"
```

**테스트 현황**: ✅ 248/248 테스트 통과 (100%)

## 📚 문서 & 데이터

| 저장소 | 설명 |
|--------|------|
| [v2-freelang-ai-docs](https://gogs.dclub.kr/kim/v2-freelang-ai-docs) | 📚 언어 명세 & 학습 자료 (90 파일) |
| [v2-freelang-ai-data](https://gogs.dclub.kr/kim/v2-freelang-ai-data) | 📊 테스트 데이터 & 벤치마크 |

## 🛠️ 개발

### 빌드
```bash
npm run build
```

### 워치 모드
```bash
npm run dev
```

### 린트
```bash
npm run lint
```

## 📝 라이선스

비공개 (Internal Use Only)

---

**Last Updated**: 2026-02-28 | **Commit**: 1f4305a
