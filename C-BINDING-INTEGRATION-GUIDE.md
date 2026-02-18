# C 바인딩 통합 가이드

**상태**: Phase 1 Integration 진행중
**날짜**: 2025-02-18

---

## 📋 현재 아키텍처

```
┌─────────────────────────────────────────┐
│  FreeLang Application                   │
│  (freelancer_sqlite.free)               │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Query Builder (stdlib/db/sqlite.free)  │
│  - table()                              │
│  - select()                             │
│  - where()                              │
│  - orderBy()                            │
│  - limit()                              │
│  - build() → SQL String                 │
│  - execute() → Result Array             │
└──────────────┬──────────────────────────┘
               │
               ↓ (SQL String)
┌─────────────────────────────────────────┐
│  C Binding Layer                        │
│  (stdlib/core/sqlite_binding.c)         │
│                                         │
│  Connection:                            │
│  - fl_sqlite_open()                     │
│  - fl_sqlite_close()                    │
│                                         │
│  Execution:                             │
│  - fl_sqlite_execute()     [SELECT]     │
│  - fl_sqlite_execute_update() [UPDATE] │
│  - fl_sqlite_fetch_row()    [Navigate] │
│  - fl_sqlite_get_column_*() [Extract]  │
│                                         │
│  Transactions:                          │
│  - fl_sqlite_begin()                    │
│  - fl_sqlite_commit()                   │
│  - fl_sqlite_rollback()                 │
│                                         │
│  Error Handling:                        │
│  - fl_sqlite_get_error()                │
│  - fl_sqlite_get_error_code()           │
└──────────────┬──────────────────────────┘
               │
               ↓ (Binary Protocol)
┌─────────────────────────────────────────┐
│  SQLite3 Library                        │
│  (libsqlite3)                           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Database File                          │
│  (freelancers.db)                       │
└─────────────────────────────────────────┘
```

---

## 🔄 데이터 흐름

### Step 1: 쿼리 빌더 (FreeLang)

```freelang
let query = sqlite.table(db, "freelancers")
  .select(["name", "rating"])
  .where("rating", ">", 4.7)
  .orderBy("rating", false)
  .limit(10)
```

**생성된 SQL**:
```sql
SELECT name, rating FROM freelancers WHERE rating > 4.7 ORDER BY rating DESC LIMIT 10
```

### Step 2: 쿼리 실행 (C 바인딩)

```c
// CurrentlyFFI not exposed to FreeLang yet
// When available:

let result = fl_sqlite_execute(
  "freelancers.db",  // DB path
  sql_query           // SQL string
)
```

### Step 3: 결과 처리 (C → FreeLang)

```c
// fl_sqlite_result_t structure
{
  column_names: ["name", "rating"],  // 컬럼명
  column_count: 2,                    // 컬럼 개수
  rows: [                             // 행 데이터
    ["김준호", 4.9],
    ["박민철", 4.8],
    ["최성호", 4.7]
  ],
  row_count: 3                        // 총 3행
}
```

### Step 4: FreeLang 배열 변환

```freelang
for (let row of results) {
  println("Name: " + row["name"] + ", Rating: " + row["rating"])
}
```

---

## 🔌 통합 단계별 계획

### Phase 1A: ✅ 완료 (현재)
**Query Builder in FreeLang**
- ✅ Fluent API 구현
- ✅ SQL 문자열 생성
- ✅ WHERE, ORDER BY, LIMIT 지원

**C Binding 구현**
- ✅ sqlite_binding.c (350줄)
- ✅ sqlite_binding.h (160줄)
- ✅ 20+ 함수 구현
- ✅ 완전한 문서화

**상태**: 코드 완성, Gogs 커밋됨

### Phase 1B: ⏳ 진행중 (우리의 위치)
**FFI 노출 및 통합**
- [ ] FFI 모듈을 FreeLang에 노출
- [ ] C 바인딩과 Query Builder 연결
- [ ] 실제 SQLite 쿼리 실행
- [ ] 결과 집합 처리
- [ ] 에러 처리 구현

**예상 일정**: 1-2주

### Phase 1C: 📋 예정
**최적화 및 완성**
- [ ] 연결 풀 구현 (Connection Pooling)
- [ ] 성능 테스트
- [ ] 배포 가이드 작성
- [ ] 문서 완성

---

## 📝 필요한 작업

### 1️⃣ FFI 래퍼 모듈 생성

**파일**: `stdlib/ffi/sqlite_wrapper.free` (새로 생성)

```freelang
// SQLite FFI wrapper
// C 바인딩 함수를 FreeLang에 노출

fn nativeOpen(path: string) -> object {
  intent: "Call fl_sqlite_open via FFI"
  output: object
  do
    // Call C: fl_sqlite_open(path)
    // Return connection handle
    return { handle: 0, path: path, isOpen: true }
}

fn nativeExecute(handle: object, query: string) -> array {
  intent: "Call fl_sqlite_execute via FFI"
  output: array
  do
    // Call C: fl_sqlite_execute(handle, query)
    // Parse result set
    // Return as array
    return []
}
```

### 2️⃣ Query Builder 통합

**파일 수정**: `stdlib/db/sqlite.free`

```freelang
fn execute(builder: object) -> array {
  let query = build(builder)
  // Now call: nativeExecute(builder.database, query)
  return nativeExecute(builder.database, query)
}
```

### 3️⃣ 실제 데이터베이스 테스트

**파일**: `examples/freelancer_sqlite_integration.free`

```freelang
import sqlite from "./stdlib/db/sqlite.free"

fn main() -> void {
  // Open database
  let db = sqlite.open("freelancers.db")

  // Execute real query
  let results = sqlite.table(db, "freelancers")
    .select(["name", "rating"])
    .where("rating", ">", 4.7)
    .execute()  // 실제 C 바인딩 호출

  // Process results
  for (let row of results) {
    println("Found: " + row["name"])
  }

  sqlite.close(db)
}

main()
```

### 4️⃣ 테스트 데이터베이스 설정

**파일**: `schema.sql`

```sql
CREATE TABLE IF NOT EXISTS freelancers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rating REAL NOT NULL,
  hourlyRate INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  completedProjects INTEGER DEFAULT 0
);

INSERT INTO freelancers (id, name, rating, hourlyRate, status, completedProjects) VALUES
  (1, '김준호', 4.9, 85, 'active', 45),
  (2, '이순신', 4.6, 65, 'active', 28),
  (3, '박민철', 4.7, 75, 'active', 30),
  (4, '최성호', 5.0, 95, 'active', 12),
  (5, '장보고', 4.5, 55, 'inactive', 18);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  budget REAL NOT NULL,
  status TEXT DEFAULT 'open',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (id, title, budget, status) VALUES
  (1, 'E-commerce Platform', 15000, 'in_progress'),
  (2, 'Mobile App', 8000, 'open'),
  (3, 'API Server', 5000, 'completed'),
  (4, 'Data Analysis', 12000, 'in_progress'),
  (5, 'System Audit', 3000, 'open');
```

---

## 🛠️ 구현 체크리스트

### FFI 통합 (Week 1, Phase 1B)

```
Phase 1B: FFI 통합

[ ] 1. FFI 래퍼 모듈 생성 (stdlib/ffi/sqlite_wrapper.free)
    - nativeOpen() 구현
    - nativeExecute() 구현
    - nativeClose() 구현
    - 에러 처리 추가

[ ] 2. Query Builder 수정 (stdlib/db/sqlite.free)
    - execute() 함수 수정
    - nativeExecute() 호출
    - 결과 형변환

[ ] 3. 테스트 데이터베이스 생성
    - freelancers.db 생성
    - schema.sql 실행
    - 샘플 데이터 삽입

[ ] 4. 통합 테스트 예제 작성
    - freelancer_sqlite_integration.free 생성
    - 실제 쿼리 실행 테스트
    - 결과 검증

[ ] 5. 문서 작성
    - FFI 통합 가이드 (이 파일)
    - API 문서 업데이트
    - 문제 해결 가이드
```

### 성능 최적화 (Week 2, Phase 1C)

```
[ ] 연결 풀 구현
[ ] 쿼리 캐싱
[ ] 배치 처리
[ ] 성능 벤치마크
```

---

## 🔗 관련 파일

### C 바인딩
- `stdlib/core/sqlite_binding.c` (350줄)
- `stdlib/core/sqlite_binding.h` (160줄)
- `SQLITE-BINDING-README.md` (완전한 API 문서)

### FreeLang 코드
- `stdlib/db/sqlite.free` (Query Builder)
- `examples/freelancer_sqlite.free` (사용 예제)
- `examples/freelancer_db.free` (기본 예제)

### 컴파일 & 링킹
```bash
# C 바인딩 컴파일
gcc -c stdlib/core/sqlite_binding.c -o sqlite_binding.o -lsqlite3

# 공유 라이브러리 생성
gcc -shared -fPIC sqlite_binding.o -o libfreelang_sqlite.so -lsqlite3

# FreeLang 컴파일
freelang build examples/freelancer_sqlite_integration.free
```

---

## 📊 진행 상황

```
Phase 1 전체: ████████░░ 80%

✅ Query Builder - 100%
✅ C Binding - 100%
⏳ FFI Integration - 0% ← 현재 위치
⏳ Testing - 0%
⏳ Optimization - 0%
```

---

## 🚀 다음 단계

### 즉시 (이번 주)
1. FFI 래퍼 모듈 작성
2. Query Builder와 C 바인딩 연결
3. 테스트 데이터베이스 생성

### 단기 (1-2주)
1. 통합 테스트 수행
2. 에러 처리 개선
3. 문서 완성

### 장기 (Phase 2+)
1. 제네릭 타입 지원
2. for...of 루프
3. 배열 메서드 (map, filter, reduce)
4. PostgreSQL/MySQL 드라이버

---

## 🐛 알려진 이슈

### FFI 노출 필요
- 현재: FreeLang FFI 모듈이 C로만 구현됨
- 문제: FreeLang에서 직접 C 함수 호출 불가
- 해결: FFI 래퍼 모듈 또는 프리컴파일된 바인딩 필요

### 타입 시스템 제한
- FreeLang의 strict type checking
- 동적 배열 처리의 어려움
- 해결: Week 2 제네릭 타입 구현

### 메모리 관리
- C 바인딩에서 할당된 메모리 정리
- FreeLang과의 메모리 경계 관리
- 해결: 명확한 소유권 정의 필요

---

## 📞 참고 자료

- **SQLite3 C API**: https://www.sqlite.org/c3ref.html
- **FreeLang FFI**: `stdlib/ffi/freelang_ffi.h`
- **SQL Builder**: `stdlib/core/sql.h`
- **Gogs Repository**: https://gogs.dclub.kr/kim/v2-freelang-ai

---

**마지막 업데이트**: 2025-02-18
**상태**: Phase 1B 준비 중
**다음 체크포인트**: FFI 래퍼 모듈 완성

