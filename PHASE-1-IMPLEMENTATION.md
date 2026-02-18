# Phase 1: Type System 강화 & SQLite 드라이버

**상태**: 🚀 진행중
**기간**: 2-3주
**목표**: 제네릭 타입 + SQLite + Fluent API

---

## 📋 Phase 1 체크리스트

### ✅ 완료 (Week 1)
- [x] SQLite 드라이버 기본 구조 (stdlib/db/sqlite.free)
- [x] Query Builder (Fluent API)
- [x] WHERE 조건 처리
- [x] ORDER BY, LIMIT, OFFSET
- [x] 실제 사용 예제 (freelancer_sqlite.free)

### ⏳ 진행중
- [ ] C 바인딩 구현 (stdlib/core/sql.c 연결)
- [ ] 실제 SQLite 실행 (sqlite3 라이브러리 연동)
- [ ] 결과 집합 처리 (ResultSet)

### 📌 예정 (Week 2)
- [ ] 제네릭 타입 지원 (`<T>`)
- [ ] `for...of` 루프 추가
- [ ] 배열 메서드 (map, filter, reduce)
- [ ] 에러 처리 개선

---

## 🏗️ 현재 구현 상태

### 1. SQLite 드라이버 구조

```
stdlib/db/
├── sqlite.free (이 주에 생성) 320줄
│   ├── open() - DB 연결
│   ├── table() - 테이블 선택
│   ├── select() - 컬럼 선택
│   ├── where() - WHERE 조건
│   ├── orderBy() - 정렬
│   ├── limit()/offset() - 페이징
│   ├── build() - SQL 쿼리 생성
│   └── execute() - 쿼리 실행
└── postgresql.free (예정)
```

### 2. Query Builder (Fluent API)

```freelang
// 현재 가능한 패턴
sqlite.table(db, "freelancers")
  .select(["name", "rating"])
  .where("rating", ">", 4.7)
  .orderBy("rating", false)
  .limit(10)
  .offset(0)
  .execute()
```

### 3. 지원되는 쿼리

✅ **SELECT**
```freelang
SELECT name, rating FROM freelancers WHERE rating > 4.7 ORDER BY rating DESC LIMIT 10
```

✅ **WHERE 조건** (AND 지원)
```freelang
.where("rating", ">", 4.5)
.where("hourlyRate", "<", 70)
→ WHERE rating > 4.5 AND hourlyRate < 70
```

✅ **정렬 및 페이징**
```freelang
.orderBy("rating", false)  // DESC
.limit(10)
.offset(0)
```

---

## 🔧 C 바인딩 (다음 단계)

### 현재 상태
```
stdlib/core/
├── sql.h (135줄) - 헤더 정의 ✅
├── sql.c (466줄) - 구현 코드 ✅
└── → FreeLang 함수와 연결 필요
```

### 해야할 일
1. `fl_sqlite_execute()` - SQL 실행
2. `fl_sqlite_bind_param()` - 파라미터 바인딩
3. `fl_sqlite_fetch_row()` - 결과 가져오기
4. `fl_sqlite_close()` - 연결 종료

---

## 📊 현재 진행률

```
Phase 1 Progress: ████████░░ 45%

- SQL 드라이버 구조: ✅ 100%
- Fluent API: ✅ 100%
- 예제 코드: ✅ 100%
- C 바인딩: ⏳ 0% (다음)
- 제네릭 타입: ⏳ 0% (Week 2)
- for...of 루프: ⏳ 0% (Week 2)
- 배열 메서드: ⏳ 0% (Week 2)
```

---

## 🎯 이번 주 목표

### [목표 1] SQLite 드라이버 완성 ✅
```
상태: 90% (C 바인딩만 남음)
파일: stdlib/db/sqlite.free (320줄)
테스트: freelancer_sqlite.free (150줄)
```

### [목표 2] 실제 실행 가능한 쿼리
```
현재: SQL 문자열 생성만 가능
목표: 실제 SQLite DB 쿼리 실행
방법: C 바인딩 추가
```

### [목표 3] 에러 처리
```
대기중 에러 처리 개선
- NULL 값 처리
- 연결 실패 처리
- SQL 문법 오류 감지
```

---

## 📝 다음 단계 (Week 2)

### [우선순위 1] 제네릭 타입 추가
**문제**: 현재 배열 타입 체킹이 strict
```freelang
// 현재 ❌ 문제
for freelancer in freelancers { }  // Type error

// 목표 ✅ 해결
for (let f of freelancers: Freelancer) { }
```

### [우선순위 2] for...of 루프
```freelang
// 추가할 문법
for (let item of array) { }
for (let [key, value] of map) { }
```

### [우선순위 3] 배열 메서드
```freelang
// 구현할 메서드
array.map(x => x * 2)
array.filter(x => x > 5)
array.reduce((a, b) => a + b, 0)
array.forEach(item => print(item))
```

---

## 🚀 실행 방법

### 1. SQLite 드라이버 테스트
```bash
cd ~/v2-freelang-ai
freelang run examples/freelancer_sqlite.free
```

### 2. SQL 쿼리 생성 확인
```
프로그램 실행 → SQL 쿼리 생성 확인
예:
  SELECT id, name, rating FROM freelancers WHERE rating > 4.7 LIMIT 10
```

### 3. 실제 DB 연동 (C 바인딩 후)
```bash
# SQLite 설치
apt-get install sqlite3 libsqlite3-dev

# 테스트 DB 생성
sqlite3 freelancers.db < schema.sql

# FreeLang 쿼리 실행
freelang run examples/freelancer_sqlite.free
```

---

## 📚 참고: C 바인딩 구현 예

```c
// stdlib/core/sql.c에 추가할 함수

// SQLite 실행
int fl_sqlite_execute(const char *db_path, const char *query, fl_sql_result_t *result) {
  sqlite3 *db;
  sqlite3_stmt *stmt;

  sqlite3_open(db_path, &db);
  sqlite3_prepare_v2(db, query, -1, &stmt, NULL);

  // 결과 처리...

  sqlite3_finalize(stmt);
  sqlite3_close(db);
  return 0;
}

// 파라미터 바인딩
int fl_sqlite_bind_param(sqlite3_stmt *stmt, int index, const fl_sql_param_t *param) {
  if (param->type == FL_SQL_INTEGER) {
    return sqlite3_bind_int64(stmt, index, param->value.integer_val);
  }
  // 다른 타입들...
}
```

---

## 📞 문의/이슈

### 현재 제한사항
1. **C 바인딩 미완성** - SQL 실행 불가 (아직 문자열만 생성)
2. **제네릭 타입 미지원** - 배열 타입 체킹 어려움
3. **비동기 미완성** - Promise 부분 구현

### 해결 계획
- Week 2: C 바인딩 완성 + 제네릭 타입
- Week 3: 배열 메서드 + 성능 최적화

---

## ✨ 완성 후 모습

```freelang
import sqlite from "std/db/sqlite"

// 데이터베이스 열기
let db = sqlite.open("app.db")

// 쿼리 실행
let results = db.table("users")
  .select(["id", "name", "email"])
  .where("age", ">", 18)
  .orderBy("created_at", false)
  .limit(10)
  .execute()

// 결과 처리
for (let user of results) {
  println("User: " + user.name + " (" + user.email + ")")
}

// 트랜잭션
db.transaction(() => {
  db.table("users").insert({ name: "Alice", email: "alice@example.com" })
  db.table("logs").insert({ action: "user_created", user_id: 1 })
})

db.close()
```

---

**다음 미팅**: Week 2 - 제네릭 타입 & for...of 구현
