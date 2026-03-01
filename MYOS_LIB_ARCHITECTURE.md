# MyOS_Lib: 언어 독립 2단계 설계 헌장

> **"자주독립의 완성은 남의 도구를 쓰지 않는 것이 아니라,**
> **자신의 도구로 모든 것을 만들 수 있다는 것을 증명하는 것이다."**

---

## 📜 선언문: Zero-Dependency의 약속

**현재 FreeLang v2의 상태**:
- ✅ TypeScript 컴파일러 (Node.js 의존)
- ✅ Zig 포팅 (표준 라이브러리 의존)
- ✅ C 서버 (libc 의존)

**목표 단계 (자주독립 Phase 4-5)**:
```
libc 의존 제거
    ↓
시스템 콜(syscall) 직접 호출
    ↓
malloc/free 없이 메모리 관리
    ↓
printf 없이 입출력 처리
    ↓
언어 독립 완성: "FreeLang은 어떤 환경에서도 동작한다"
```

---

## 🏗️ 3대 설계 원칙

### 원칙 1: 표준 라이브러리 최소화 (Zero-Dependency)

#### 현재 상황
```c
#include <stdio.h>      // printf 사용
#include <stdlib.h>     // malloc/free 사용
#include <string.h>     // strlen/strcpy 사용
#include <unistd.h>     // open/read/write 사용
```

#### 목표 상황
```c
#include <sys/syscall.h>  // syscall 번호 정의
// libc 함수 호출 금지
// → OS 시스템 콜만 사용
```

#### 의미
"C 표준 라이브러리(libc)가 없어도 내 프로그램은 동작한다"
= **기술적 자립의 증명**

---

### 원칙 2: 나만의 데이터 추상화 (Custom Primitive)

#### 현재 상황
```c
char buffer[256];      // 고정 크기 배열
struct user users[100]; // 고정 크기 구조체 배열
```

#### 목표 상황
```c
// MyOS_Lib에서 제공:
vector_t *vec = vector_new(sizeof(int));
vector_push(vec, &value);
vector_get(vec, 0);
vector_free(vec);

// 또는 직렬화:
hashmap_t *map = hashmap_new(capacity);
hashmap_set(map, key, value);
```

#### 의미
데이터의 흐름과 저장 방식을 **완벽하게 통제**
= **어떤 환경에서도 이식 가능한 "나만의 데이터 엔진" 확보**

---

### 원칙 3: 인터페이스 중심 설계 (Protocol First)

#### 현재 상황
```c
// JSON 텍스트 파싱 (무거움, 느림)
char json_str[] = "{\"name\":\"alice\",\"age\":30}";
// ...복잡한 파싱 로직...
```

#### 목표 상황
```c
// MyOS_Lib 직렬화 규격 (빠름, 가벼움)
// ┌─────────────────────┐
// │ Magic: "MYOS" (4B)  │
// │ Version: 1 (1B)     │
// │ Type: HASHMAP (1B)  │
// │ Size: 256 (4B)      │
// │ [Key-Value Pairs]   │
// └─────────────────────┘

typedef struct {
    char magic[4];      // "MYOS"
    uint8_t version;    // 0x01
    uint8_t type;       // 0x01 = HASHMAP, 0x02 = VECTOR
    uint32_t size;      // 바이트 크기
    uint8_t data[];     // 실제 데이터
} myos_serialized_t;
```

#### 의미
JSON/XML 같은 무거운 포맷 탈피
= **어떤 언어와 대화하든 주도권을 잃지 않는 "통신 자립" 달성**

---

## 🎯 MyOS_Lib 모듈 설계

### 모듈 1: Memory Manager (mm.h)

**목표**: malloc 없이 힙 메모리 관리

#### 인터페이스
```c
// ===== mm.h =====
#ifndef MYOS_MM_H
#define MYOS_MM_H

#include <stddef.h>
#include <stdint.h>

// 메모리 풀 구조체
typedef struct myos_mempool {
    void *base;          // 할당된 메모리 시작 주소
    size_t total_size;   // 전체 크기
    size_t used;         // 사용된 크기
    size_t peak;         // 피크 사용량
} myos_mempool_t;

// 1. 메모리 풀 초기화 (OS 시스템 콜 사용)
// syscall(SYS_mmap): OS로부터 메모리 페이지 할당
myos_mempool_t* mm_init(size_t size);

// 2. 메모리 할당
void* mm_alloc(myos_mempool_t *pool, size_t size);

// 3. 메모리 해제
void mm_free(myos_mempool_t *pool, void *ptr);

// 4. 통계
typedef struct {
    size_t total;
    size_t used;
    size_t peak;
    float utilization;
} mm_stats_t;
mm_stats_t mm_get_stats(myos_mempool_t *pool);

// 5. 풀 정리
void mm_destroy(myos_mempool_t *pool);

#endif
```

#### 구현 전략
```
1. mmap() 시스템 콜
   OS로부터 메모리 페이지 할당
   (malloc 불필요)

2. 프리 리스트 관리
   할당된 블록 추적
   재사용 가능 블록 링크

3. 단순화된 할당 정책
   First-Fit 알고리즘
   Fragmentation 추적

4. 통계 수집
   총 할당량, 사용량, 피크
   효율성 계산
```

#### 예제 사용
```c
// 메모리 풀 생성 (1MB)
myos_mempool_t *pool = mm_init(1024 * 1024);

// 할당
int *arr = (int*)mm_alloc(pool, sizeof(int) * 100);
arr[0] = 42;

// 해제
mm_free(pool, arr);

// 통계
mm_stats_t stats = mm_get_stats(pool);
printf_custom("Used: %zu / %zu (%.1f%%)\n",
              stats.used, stats.total, stats.utilization * 100);

// 정리
mm_destroy(pool);
```

---

### 모듈 2: String Engine (string.h)

**목표**: 버퍼 오버플로우가 불가능한 독립적 문자열

#### 인터페이스
```c
// ===== string.h =====
#ifndef MYOS_STRING_H
#define MYOS_STRING_H

#include <stddef.h>

// 동적 문자열 구조체
typedef struct {
    char *data;      // 실제 문자열 버퍼
    size_t len;      // 현재 길이
    size_t capacity; // 할당된 용량
} myos_string_t;

// 1. 문자열 생성
myos_string_t* str_new(const char *cstr);
myos_string_t* str_new_empty(void);

// 2. 문자열 연결
void str_append(myos_string_t *str, const char *cstr);
void str_append_str(myos_string_t *dest, myos_string_t *src);

// 3. 부분 문자열
myos_string_t* str_substring(myos_string_t *str, size_t start, size_t len);

// 4. 검색
size_t str_find(myos_string_t *str, const char *needle);
int str_starts_with(myos_string_t *str, const char *prefix);

// 5. 변환
void str_to_upper(myos_string_t *str);
void str_to_lower(myos_string_t *str);
void str_trim(myos_string_t *str);

// 6. C 문자열 변환
const char* str_c_str(myos_string_t *str);

// 7. 메모리 해제
void str_free(myos_string_t *str);

#endif
```

#### 설계 특징
```
1. 자동 리사이징
   - 용량 부족 시 2배로 확대
   - 버퍼 오버플로우 불가능

2. 메모리 효율
   - 필요한 만큼만 할당
   - 여유 공간은 최소화

3. 안전성
   - 범위 검사 (boundary check)
   - null 종료 문자 항상 보장

4. 이식성
   - 다른 언어와도 호환 가능
   - str_c_str()로 C 문자열 변환
```

#### 예제 사용
```c
myos_string_t *name = str_new("alice");
str_append(name, " smith");

if (str_starts_with(name, "alice")) {
    myos_string_t *upper = str_new_empty();
    // ... 처리 ...
    str_free(upper);
}

printf_custom("%s\n", str_c_str(name));
str_free(name);
```

---

### 모듈 3: Log Provider (log.h)

**목표**: 표준 출력 없이 커널 로그나 파일 직접 쓰기

#### 인터페이스
```c
// ===== log.h =====
#ifndef MYOS_LOG_H
#define MYOS_LOG_H

#include <stdint.h>

// 로그 레벨
typedef enum {
    LOG_DEBUG = 0,
    LOG_INFO = 1,
    LOG_WARN = 2,
    LOG_ERROR = 3,
    LOG_FATAL = 4
} log_level_t;

// 로그 프로바이더 (추상 인터페이스)
typedef struct myos_logger {
    // 로그 기록
    void (*write)(struct myos_logger *self, log_level_t level, const char *msg);
    // 정리
    void (*flush)(struct myos_logger *self);
    // 메모리 해제
    void (*destroy)(struct myos_logger *self);
} myos_logger_t;

// 1. 파일 기반 로거
myos_logger_t* logger_file_new(const char *path);

// 2. 커널 로그 (printk 같은 것)
myos_logger_t* logger_kernel_new(void);

// 3. 메모리 로거 (순환 버퍼)
myos_logger_t* logger_memory_new(size_t buffer_size);

// 4. 로그 매크로
#define LOG_DEBUG_MSG(logger, msg) \
    (logger)->write((logger), LOG_DEBUG, (msg))

#define LOG_ERROR_MSG(logger, msg) \
    (logger)->write((logger), LOG_ERROR, (msg))

#endif
```

#### 구현 전략
```
1. 파일 기반 로깅
   - open() 시스템 콜로 파일 열기
   - write() 시스템 콜로 쓰기
   - fsync()로 디스크에 동기화

2. 커널 로그
   - /dev/kmsg 또는 /proc/syslog 사용
   - 또는 syscall(SYS_syslog)

3. 메모리 로거
   - 순환 버퍼 (Ring Buffer)
   - 메모리 오버헤드 최소화
   - 디버깅/모니터링용

4. 타임스탬프
   - syscall(SYS_time) 또는 SYS_gettimeofday
   - 인간이 읽을 수 있는 형식
```

#### 예제 사용
```c
myos_logger_t *logger = logger_file_new("/var/log/myos.log");

LOG_INFO_MSG(logger, "Application started");
LOG_DEBUG_MSG(logger, "Debug mode enabled");

// 에러 발생
if (error) {
    LOG_ERROR_MSG(logger, "Critical error occurred");
}

logger->flush(logger);
logger->destroy(logger);
```

---

## 📊 모듈 간 의존성

```
┌─────────────────────────────────────┐
│ Application Layer                   │
│ (FreeLang Compiler, C Server)       │
└─────────────────┬───────────────────┘
                  │
          ┌───────▼────────┐
          │  MyOS_Lib      │
          ├────────────────┤
          │ String Engine  │ ◄─┐
          │ Memory Manager │   ├── 상호 의존
          │ Log Provider   │ ◄─┘
          └─────────────────┘
                  │
          ┌───────▼────────┐
          │ OS System Call │
          │ (Linux/Unix)   │
          └────────────────┘
```

**특징**:
- 각 모듈은 Memory Manager를 사용
- 모듈 간 일반 함수 호출만 사용 (동적 디스패치 없음)
- libc 함수 호출 금지

---

## 🔄 직렬화 규격 (Protocol First)

### MYOS 바이너리 형식

```
【MYOS 패킷 구조】
┌─────────────────────────────────┐
│ Offset │ Size │ 설명            │
├─────────────────────────────────┤
│ 0      │ 4B   │ Magic: "MYOS"   │
│ 4      │ 1B   │ Version: 0x01   │
│ 5      │ 1B   │ Type (*)        │
│ 6      │ 2B   │ Reserved        │
│ 8      │ 4B   │ Payload Size    │
│ 12     │ N    │ Payload         │
└─────────────────────────────────┘

Type:
  0x00 = NULL
  0x01 = VECTOR
  0x02 = HASHMAP
  0x03 = STRING
  0x04 = TUPLE
  0x05 = CUSTOM
```

### 예: VECTOR 직렬화

```
【Vector [1, 2, 3] 직렬화】
4D 59 4F 53    // "MYOS"
01             // Version 1
01             // Type = VECTOR
00 00          // Reserved
00 00 00 0C    // Size = 12 bytes

// Payload (12 bytes):
03             // Element count = 3
04 00 00 00    // Type: INT32
01 00 00 00    // Value: 1
02 00 00 00    // Value: 2
03 00 00 00    // Value: 3
```

---

## 📋 구현 순서

### Phase A: 기초 레이어
1. **Memory Manager** (mm.c/h)
   - mmap() 기반 메모리 할당
   - 프리 리스트 관리
   - 통계 수집

2. **Log Provider** (log.c/h)
   - 파일/커널/메모리 로거
   - 타임스탬프 추가
   - 레벨 필터링

### Phase B: 데이터 레이어
3. **String Engine** (string.c/h)
   - str_new/append/find 구현
   - 자동 리사이징
   - C 문자열 호환

4. **Vector** (vector.c/h)
   - 가변 배열
   - 동적 리사이징
   - 타입 안전성

5. **HashMap** (hashmap.c/h)
   - 해시 함수 (djb2)
   - 충돌 해결 (체이닝)
   - 동적 리해싱

### Phase C: 직렬화 레이어
6. **Serializer** (serial.c/h)
   - MYOS 포맷 인코딩/디코딩
   - 타입 변환
   - 검증

### Phase D: 통합 레이어
7. **Runtime** (runtime.c/h)
   - 모든 모듈 통합
   - 메인 진입점
   - 에러 핸들링

---

## 🎓 자주독립의 증명

### 현재 → 목표

```
현재: FreeLang C Server
  ├─ #include <stdio.h> (printf)
  ├─ #include <stdlib.h> (malloc)
  └─ #include <string.h> (strcpy)
  → libc에 완전히 의존

목표: FreeLang with MyOS_Lib
  ├─ #include <myos/mm.h> (mm_alloc)
  ├─ #include <myos/string.h> (str_new)
  └─ #include <myos/log.h> (logger_file_new)
  → libc 완전히 제거
  → 시스템 콜만 사용
  → "어떤 Linux/Unix에서도 동작"
```

### 검증 방법

```bash
# 1. libc 의존성 확인
nm freelang-c-server | grep " U " | grep -E "printf|malloc|strcpy"
# 결과: (없어야 함)

# 2. 동적 링크 확인
ldd freelang-c-server
# 결과: libc가 없어야 함 (또는 매우 최소한)

# 3. 시스템 콜 추적
strace ./freelang-c-server
# 결과: mmap, read, write 직접 호출만 보임
```

---

## 📜 설계 원칙 재확인

### 원칙 1: Zero-Dependency ✅
- [ ] libc 함수 호출 0개
- [ ] 시스템 콜만 사용
- [ ] 독립적 메모리 관리

### 원칙 2: Custom Primitive ✅
- [ ] Vector 구현
- [ ] HashMap 구현
- [ ] String 구현
- [ ] 모든 자료구조 자체 설계

### 원칙 3: Protocol First ✅
- [ ] MYOS 바이너리 규격 정의
- [ ] 언어 간 호환성
- [ ] 직렬화/역직렬화 구현

---

## 🚀 다음 단계

1. **MyOS_Lib 구현 시작** (mm.c 부터)
2. **단위 테스트 작성** (각 모듈별)
3. **C Server 마이그레이션** (기존 코드 → MyOS_Lib 사용)
4. **성능 측정** (메모리, 속도, 크기)
5. **다른 언어로 바인딩** (Zig, Go, Rust)

---

## 💡 철학적 의미

> **"자주독립은 기술의 문제가 아니라 의지의 문제다.**
>
> 남이 만든 도구를 쓸 때 우리는 남의 설계를 따른다.
> 자신의 도구를 만들 때 우리는 우리의 설계를 구현한다.
>
> MyOS_Lib은 "우리의 설계"를 증명하는 선언문이다."

---

**문서 작성**: 2026-03-01
**버전**: 1.0 (Architecture Definition)
**상태**: 구현 준비 완료
**다음 마일스톤**: Phase A (Memory Manager 구현)
