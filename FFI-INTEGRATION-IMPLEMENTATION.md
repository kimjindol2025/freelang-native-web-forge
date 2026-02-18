# FFI 통합 구현 가이드

**상태**: Phase 1C - FFI 래퍼 완성 🎉
**파일**: `stdlib/ffi/sqlite_ffi_wrapper.free`
**크기**: 400+ 줄
**날짜**: 2025-02-18

---

## 🎯 목표

FreeLang 애플리케이션에서 **C 바인딩을 직접 호출**하여 실제 SQLite 쿼리를 실행할 수 있도록 구현

---

## 📊 3단계 아키텍처

```
┌─────────────────────────────────────┐
│  Step 1: FreeLang Application       │
│  (examples/freelancer_sqlite.free)  │
└────────────┬────────────────────────┘
             │ sqlite.open()
             │ sqlite.table().select()...
             │ sqlite.execute()
             ↓
┌─────────────────────────────────────┐
│  Step 2: FFI Wrapper                │
│  (stdlib/ffi/sqlite_ffi_wrapper.free)│
│  - ffiOpen(path: string)            │
│  - ffiExecute(db, query)            │
│  - ffiClose(db)                     │
│  - ffiBeginTransaction()            │
│  - ffiCommitTransaction()           │
│  - ffiRollbackTransaction()         │
└────────────┬────────────────────────┘
             │ extern fn native_sqlite_*
             │ (FFI System Routes to C)
             ↓
┌─────────────────────────────────────┐
│  Step 3: C Binding                  │
│  (stdlib/core/sqlite_binding.c)     │
│  - fl_sqlite_open()                 │
│  - fl_sqlite_execute()              │
│  - fl_sqlite_close()                │
└────────────┬────────────────────────┘
             │ SQLite3 API
             ↓
┌─────────────────────────────────────┐
│  Step 4: Database                   │
│  (freelancers.db)                   │
└─────────────────────────────────────┘
```

---

## 🔗 FFI 래퍼 함수 (20개+)

### 데이터베이스 연결 (3개)

```freelang
fn ffiOpen(path: string) -> object
  Opens database via fl_sqlite_open()
  Returns: connection object with native handle

fn ffiClose(db: object) -> bool
  Closes database via fl_sqlite_close()
  Returns: success status

fn ffiIsOpen(db: object) -> bool
  Checks if connection is still open
```

### 쿼리 실행 (2개)

```freelang
fn ffiExecute(db: object, query: string) -> array
  Executes SELECT query via fl_sqlite_execute()
  Parses result set
  Returns: array of row objects

fn ffiExecuteUpdate(db: object, query: string) -> number
  Executes INSERT/UPDATE/DELETE via fl_sqlite_execute_update()
  Returns: number of affected rows (-1 on error)
```

### 에러 처리 (2개)

```freelang
fn ffiGetError(db: object) -> string
  Gets last error message via fl_sqlite_get_error()

fn ffiGetErrorCode(db: object) -> number
  Gets error code via fl_sqlite_get_error_code()
```

### 트랜잭션 (3개)

```freelang
fn ffiBeginTransaction(db: object) -> bool
  Starts transaction via fl_sqlite_begin()

fn ffiCommitTransaction(db: object) -> bool
  Commits transaction via fl_sqlite_commit()

fn ffiRollbackTransaction(db: object) -> bool
  Rolls back transaction via fl_sqlite_rollback()
```

### 결과 처리 (5개)

```freelang
fn parseResultSet(result_set: object) -> array
  Parses result set structure
  Fetches all rows
  Returns array of parsed rows

fn getColumnValue(result, column_index, type)
  Extracts specific column value
  Supports: text, int, double

fn checkConnection(db: object) -> bool
  Validates connection object

fn handleQueryError(db: object) -> string
  Handles and logs query errors

fn createResult(success, data, error_msg) -> object
  Creates standardized result object
```

### 디버깅 (2개)

```freelang
fn printConnectionStatus(db: object) -> void
  Prints connection status info

fn logFFIOperation(operation, details) -> void
  Logs FFI operations for debugging
```

---

## 🔌 extern Function Declarations (14개)

```freelang
// Connection
extern fn native_sqlite_open(path: string) -> object
extern fn native_sqlite_close(conn: object) -> number

// Query Execution
extern fn native_sqlite_execute(conn, query: string) -> object
extern fn native_sqlite_execute_update(conn, query: string) -> number

// Result Navigation
extern fn native_sqlite_fetch_row(result: object) -> number

// Column Value Extraction
extern fn native_sqlite_get_column_text(result, idx: number) -> string
extern fn native_sqlite_get_column_int(result, idx: number) -> number
extern fn native_sqlite_get_column_double(result, idx: number) -> number

// Error Handling
extern fn native_sqlite_get_error(conn: object) -> string
extern fn native_sqlite_get_error_code(conn: object) -> number

// Transactions
extern fn native_sqlite_begin(conn: object) -> number
extern fn native_sqlite_commit(conn: object) -> number
extern fn native_sqlite_rollback(conn: object) -> number
```

---

## 📝 사용 예제

### 1️⃣ 기본 사용법 (완성 후)

```freelang
import sqlite from "./stdlib/db/sqlite.free"
import ffi_sqlite from "./stdlib/ffi/sqlite_ffi_wrapper.free"

fn main() -> void {
  // 데이터베이스 열기
  let db = ffi_sqlite.ffiOpen("freelancers.db")

  // 쿼리 빌더
  let query = sqlite.table(db, "freelancers")
    .select(["name", "rating"])
    .where("rating", ">", 4.7)
    .build()

  // 실행
  let results = ffi_sqlite.ffiExecute(db, query)

  // 결과 처리
  for (let row of results) {
    println("Name: " + row.name + ", Rating: " + row.rating)
  }

  // 닫기
  ffi_sqlite.ffiClose(db)
}
```

### 2️⃣ 트랜잭션 (완성 후)

```freelang
if ffi_sqlite.ffiBeginTransaction(db) {
  println("Transaction started")

  let query1 = "INSERT INTO freelancers (name, rating) VALUES ('Alice', 4.8)"
  ffi_sqlite.ffiExecuteUpdate(db, query1)

  let query2 = "UPDATE freelancers SET rating = 4.9 WHERE name = 'Alice'"
  ffi_sqlite.ffiExecuteUpdate(db, query2)

  if ffi_sqlite.ffiCommitTransaction(db) {
    println("Transaction committed")
  }
}
```

### 3️⃣ 에러 처리 (완성 후)

```freelang
let result = ffi_sqlite.ffiExecute(db, sql)

if result.length == 0 {
  let error = ffi_sqlite.ffiGetError(db)
  let code = ffi_sqlite.ffiGetErrorCode(db)
  println("Error [" + code + "]: " + error)
}
```

---

## 🛠️ 구현 상태

### ✅ 완료

```
[x] FFI 래퍼 모듈 생성 (sqlite_ffi_wrapper.free)
[x] extern 함수 선언 (14개)
[x] 래퍼 함수 구현 (20+ 개)
[x] 문서화 작성
[x] Query Builder 업데이트 (FFI 호출점 주석 추가)
```

### ⏳ 다음 단계

```
[ ] FreeLang FFI 시스템 노출
    - extern fn을 실제로 동작하도록 수정
    - dlopen/dlsym 연결

[ ] 통합 테스트
    - freelancer_sqlite_e2e_test.free 작성
    - 실제 데이터베이스 쿼리 테스트

[ ] 성능 최적화
    - 결과 파싱 성능
    - 메모리 관리

[ ] 에러 처리 강화
    - FFI 호출 실패 처리
    - 메모리 누수 방지
```

---

## 🔧 FFI 시스템 활성화 방법

### 현재 상태
- `extern fn` 선언되어 있음
- C 바인딩 구현됨 (sqlite_binding.c)
- FreeLang 래퍼 작성됨 (sqlite_ffi_wrapper.free)

### 필요한 작업

#### 1️⃣ FreeLang 컴파일러/런타임 수정

**파일**: `src/runtime/vm.c` 또는 `src/compiler/codegen.c`

```c
// FFI 동적 로딩 등록
void register_ffi_functions() {
  // SQLite 바인딩 로드
  void* sqlite_lib = dlopen("./stdlib/core/libfreelang_sqlite.so", RTLD_LAZY);

  // extern fn native_sqlite_open 등록
  void (*fn_open)(const char*) = dlsym(sqlite_lib, "fl_sqlite_open");
  register_external_function("native_sqlite_open", fn_open);

  // 다른 함수들도 등록...
}
```

#### 2️⃣ C 바인딩 라이브러리 컴파일

```bash
# sqlite_binding.c를 공유 라이브러리로 컴파일
gcc -shared -fPIC \
    stdlib/core/sqlite_binding.c \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3
```

#### 3️⃣ FreeLang 프로그램에서 호출

```freelang
import ffi_sqlite from "./stdlib/ffi/sqlite_ffi_wrapper.free"

// extern fn native_sqlite_open이 작동하면
// ffi_sqlite.ffiOpen()이 실제로 C 함수를 호출
```

---

## 📊 파일 구조

```
v2-freelang-ai/
├── stdlib/
│   ├── ffi/
│   │   └── sqlite_ffi_wrapper.free (400+ 줄) ← NEW
│   ├── db/
│   │   └── sqlite.free (업데이트됨)
│   └── core/
│       ├── sqlite_binding.c (350줄)
│       └── sqlite_binding.h (160줄)
├── schema.sql (230줄)
└── examples/
    └── freelancer_sqlite_simple_test.free
```

---

## 🔗 데이터 흐름 상세

### SELECT 쿼리 실행

```
1. FreeLang Code
   sqlite.table(db, "freelancers")
     .select(["name", "rating"])
     .where("rating", ">", 4.7)
     .execute()

2. Query Builder
   → SQL 생성: "SELECT name, rating FROM freelancers WHERE rating > 4.7"
   → execute() 호출

3. FFI Wrapper (sqlite_ffi_wrapper.free)
   → ffiExecute(db, sql)
   → native_sqlite_execute(db.native_handle, sql) 호출

4. FFI System
   → extern fn native_sqlite_execute와 C 함수 매핑
   → libfreelang_sqlite.so에서 fl_sqlite_execute 호출

5. C Binding (sqlite_binding.c)
   → fl_sqlite_execute() 함수 실행
   → sqlite3_prepare_v2(), sqlite3_step() 호출

6. SQLite3 Library
   → 쿼리 파싱 및 실행
   → 결과 집합 생성

7. Result Parsing (sqlite_ffi_wrapper.free)
   → parseResultSet() 호출
   → native_sqlite_fetch_row() 반복 호출
   → native_sqlite_get_column_*() 으로 값 추출
   → 행 객체 생성

8. Return to Application
   → rows = [{name: "Alice", rating: 4.8}, ...]
   → FreeLang 애플리케이션에서 사용
```

---

## 🧪 테스트 계획

### Unit Tests (아직 미작성)

```freelang
fn test_ffi_open() -> void {
  let db = ffi_sqlite.ffiOpen("test.db")
  assert db.isOpen == true
  ffi_sqlite.ffiClose(db)
}

fn test_ffi_execute_select() -> void {
  let db = ffi_sqlite.ffiOpen("freelancers.db")
  let results = ffi_sqlite.ffiExecute(db, "SELECT * FROM freelancers LIMIT 1")
  assert results.length > 0
  ffi_sqlite.ffiClose(db)
}

fn test_ffi_execute_update() -> void {
  let db = ffi_sqlite.ffiOpen("freelancers.db")
  let affected = ffi_sqlite.ffiExecuteUpdate(db, "INSERT INTO freelancers ...")
  assert affected > 0
  ffi_sqlite.ffiClose(db)
}
```

### Integration Tests (아직 미작성)

```freelang
fn test_full_workflow() -> void {
  // 데이터베이스 열기
  let db = ffi_sqlite.ffiOpen("freelancers.db")

  // 쿼리 빌더 사용
  let query = sqlite.table(db, "freelancers")
    .select(["name", "rating"])
    .where("rating", ">", 4.5)
    .build()

  // 실행
  let results = ffi_sqlite.ffiExecute(db, query)

  // 검증
  assert results.length > 0
  assert results[0].name != null

  // 정리
  ffi_sqlite.ffiClose(db)
}
```

---

## 📋 체크리스트

### FFI 래퍼 구현

```
[x] sqlite_ffi_wrapper.free 파일 생성
[x] extern fn 선언 (14개)
[x] 래퍼 함수 구현 (20+개)
[x] 에러 처리 함수
[x] 트랜잭션 함수
[x] 결과 파싱 함수
[x] 디버깅 함수
[x] 문서화
```

### Query Builder 통합

```
[x] sqlite.free 업데이트 (FFI 호출점 주석)
[x] execute() 함수 문서화
[x] close() 함수 문서화
[ ] 실제 FFI 호출로 변경 (FFI 활성화 후)
```

### FreeLang FFI 시스템

```
[ ] extern fn 동작 확인
[ ] dlopen/dlsym 설정
[ ] C 라이브러리 링킹
[ ] FFI 함수 호출 테스트
```

### 테스트 & 검증

```
[ ] Unit 테스트 작성
[ ] Integration 테스트 작성
[ ] E2E 테스트 실행
[ ] 성능 벤치마크
```

---

## 🚀 다음 단계 (우선순위)

### 1️⃣ HIGH - FFI 활성화 (이번주)
- FreeLang 컴파일러/런타임 수정
- C 라이브러리 컴파일 및 링킹
- extern fn 동작 테스트

### 2️⃣ HIGH - 통합 테스트 (이번주)
- freelancer_sqlite_e2e_test.free 작성
- 실제 데이터베이스 쿼리 실행
- 결과 검증

### 3️⃣ MEDIUM - 성능 최적화 (다음주)
- 결과 파싱 최적화
- 메모리 관리 개선
- 성능 벤치마크

### 4️⃣ MEDIUM - 추가 기능 (다음주)
- PostgreSQL/MySQL 드라이버
- 연결 풀링
- 쿼리 캐싱

---

## 💡 설계 결정사항

### 1. Two-Layer Wrapper 패턴
- **Layer 1**: FreeLang 래퍼 (sqlite_ffi_wrapper.free)
  - 타입 안전성
  - 에러 처리
  - 메모리 관리

- **Layer 2**: C 바인딩 (sqlite_binding.c)
  - 저수준 접근
  - 성능 최적화
  - SQLite3 직접 제어

**장점**: 명확한 책임 분리, 재사용성, 테스트 용이

### 2. extern fn 사용
- `extern fn` 선언으로 FFI 함수 정의
- FreeLang 타입 시스템과 C 함수 매핑
- 동적 로딩 지원

**장점**: 유연성, 런타임 바인딩, 모듈화

### 3. 에러 처리 전략
- `getError()` / `getErrorCode()` 함수 제공
- 각 FFI 함수가 상태 정보 반환
- 로깅 및 디버깅 함수 포함

**장점**: 안정성, 디버깅 용이, 실시간 모니터링

---

## 📞 문제 해결

### FFI 함수가 작동하지 않을 때

1. C 라이브러리가 컴파일되었는지 확인
   ```bash
   ls -la stdlib/core/libfreelang_sqlite.so
   ```

2. 라이브러리 경로가 올바른지 확인
   ```bash
   ldd stdlib/core/libfreelang_sqlite.so
   ```

3. FreeLang FFI 설정을 확인
   ```bash
   grep "native_sqlite_open" src/runtime/*.c
   ```

4. 디버깅 로그 활성화
   ```freelang
   ffi_sqlite.logFFIOperation("execute", "query: " + sql)
   ```

---

## 📚 참고

- **C 바인딩**: stdlib/core/sqlite_binding.c
- **구문 규칙**: SQLITE-BINDING-README.md
- **설계 가이드**: C-BINDING-INTEGRATION-GUIDE.md
- **아키텍처**: PHASE-1B-STATUS.md

---

**상태**: ✅ FFI 래퍼 완성 (Phase 1C)
**다음**: FFI 시스템 활성화 및 E2E 테스트
**예상 완료**: 1-2주

