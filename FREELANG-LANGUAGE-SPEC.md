# FreeLang v1.0 - 언어 명세서

**목표**: AI가 쉽게 쓸 수 있는 언어
**설계 철학**: "너가 쓸때 편하게 코딩자유를 주는언어"
**버전**: v1.0-alpha (Phase 1, Q1 2026)

---

## 📖 목차

1. [핵심 철학](#핵심-철학)
2. [문법 (Syntax)](#문법-syntax)
3. [타입 시스템](#타입-시스템)
4. [의미론 (Semantics)](#의미론-semantics)
5. [예제](#예제)
6. [Phase 1 기능](#phase-1-기능)

---

## 핵심 철학

### 3가지 자유도

```
1️⃣ 문법 자유도 (Syntax Freedom)
   - 세미콜론 선택적
   - 중괄호 선택적 (들여쓰기로 대체)
   - 타입 표기 선택적 (Intent에서 추론)
   - 괄호 선택적

2️⃣ 코딩 자유도 (Coding Freedom)
   - 부분 구현 가능 (불완전한 코드도 컴파일)
   - Intent 기반 Type Inference
   - 자동 완성 가능

3️⃣ AI 친화도 (AI-Friendly)
   - AI가 쉽게 읽고 쓸 수 있음
   - 명확한 Intent 표현
   - 자동 최적화 지시문 (Directive)
```

---

## 문법 (Syntax)

### 1. 최소 형식 (Minimal - 권장)

```freelang
fn functionName
  intent: "함수의 의도"
  input: type
  output: type
```

**예시**:
```freelang
fn sum
  intent: "배열의 합계 계산"
  input: array<number>
  output: number
```

### 2. 완전 형식 (Full)

```freelang
fn functionName
  intent: "설명"
  input: paramName: type
  output: returnType
  directive: "optimization_hint"
  do
    // 함수 본체
```

**예시**:
```freelang
fn sum
  intent: "배열의 합계"
  input: numbers: array<number>
  output: number
  directive: speed
  do
    result = 0
    for i in 0..numbers.len()
      result = result + numbers[i]
    return result
```

### 3. 자유 형식 (Free - AI-First)

```freelang
fn sum input array<number> output number intent "합계"
fn sum(arr: array<number>) -> number { sum += arr[i] }
fn sum arr output number { for i in arr { sum += i } }
```

**특징**:
- 줄바꿈 생략 가능
- 콜론(:) 생략 가능
- 괄호 생략 가능
- 타입 생략 가능

---

## 타입 시스템

### 1. 기본 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `number` | 정수/실수 | `42`, `3.14` |
| `string` | 문자열 | `"hello"`, `'world'` |
| `bool` | 참/거짓 | `true`, `false` |
| `array<T>` | 배열 | `array<number>`, `[1,2,3]` |
| `map<K,V>` | 맵 | `map<string,number>` |
| `any` | 임의 타입 | 타입 추론 실패 시 |

### 2. 타입 표기

```freelang
// 명시적 (Explicit)
fn sum input: array<number> output: number

// 암시적 (Implicit - Intent에서 추론)
fn sum intent: "배열 합계"
// 추론 결과: input: array<number>, output: number

// 생략 (Omitted - 자유도)
fn sum input array<number> output number
```

### 3. 타입 추론 규칙

**Rule 1**: Intent에서 기본 타입 추론
```
intent: "배열"           → input: array<any>
intent: "합계"           → output: number
intent: "문자열 처리"     → input: string
```

**Rule 2**: 함수 본체에서 타입 추론
```freelang
do
  for i in arr[0..10]    // arr: array<any>

  result = result + 5    // result: number

  str.uppercase()        // str: string
```

**Rule 3**: 변수 할당에서 타입 추론
```freelang
x = 10                   // x: number
y = "hello"              // y: string
z = [1,2,3]             // z: array<number>
```

---

## 의미론 (Semantics)

### 1. 변수 선언과 할당

```freelang
// 선언과 동시 할당
x = 10                   // number
name = "Alice"           // string
items = [1,2,3]         // array<number>

// 명시적 타입
x: number = 10
name: string = "Alice"
```

### 2. 제어 흐름

```freelang
// if-else (들여쓰기 기반)
if x > 10
  print("큼")
else
  print("작음")

// for 루프
for i in 0..10
  print(i)

for item in array
  print(item)

// while 루프
while x < 100
  x = x * 2
```

### 3. 함수 정의와 호출

```freelang
// 정의
fn add
  input: x: number, y: number
  output: number
  do
    return x + y

// 호출
result = add(5, 3)
result = add x=5 y=3
```

### 4. 반환값

```freelang
// 명시적 return
fn sum
  intent: "합계"
  output: number
  do
    result = 0
    for i in arr
      result = result + i
    return result

// 암시적 return (마지막 식)
fn double
  output: number
  do
    x * 2          // 이것이 반환됨
```

---

## 예제

### 예제 1: 기본 합계 함수

```freelang
fn sum_array
  intent: "배열의 합계를 계산한다"
  input: numbers: array<number>
  output: number
  do
    total = 0
    for num in numbers
      total = total + num
    return total
```

**컴파일 결과**:
```
Function: sum_array
Input: numbers (array<number>)
Output: number
Directive: speed (루프 + 누적 감지)
Confidence: 0.98
```

---

### 예제 2: 자유도 최대 (AI-First)

```freelang
fn average arr
  intent: "배열 평균"
  sum = 0 for i in arr sum = sum + arr[i]
  return sum / arr.len()
```

**컴파일 과정**:
1. 파싱: 문법 분석 (줄바꿈 없음, 콜론 없음)
2. 타입 추론: intent에서 array<number> → number 추론
3. 패턴 분석: 루프 + 누적 감지 → `directive: speed`
4. 최적화: speed 지시문 적용

---

### 예제 3: 부분 구현 (AI 코드 생성 용)

```freelang
fn process_data
  intent: "데이터 처리"
  input: data: array<number>
  output: array<number>
  do
    // 자동으로 채워질 부분
    for item in data
      // body는 AI가 채움
```

**가능한 완성**:
```freelang
fn process_data
  intent: "데이터 처리"
  input: data: array<number>
  output: array<number>
  do
    result = []
    for item in data
      if item > 0
        result.push(item * 2)
    return result
```

---

## Phase 1 기능

### Task 1.1: Lexer (토큰화)

**구현 대상**:
- ✅ 기본 토큰 (식별자, 숫자, 문자열, 키워드)
- ✅ 연산자 (=, +, -, *, /, <, >, ==, etc.)
- ✅ 구분자 (괄호, 대괄호, 콜론)
- ✅ 들여쓰기 토큰 (INDENT, DEDENT)
- ✅ 개행 토큰 (NEWLINE)

**예시**:
```
Input:  fn sum input array<number> output number
Output: [KEYWORD(fn), ID(sum), KEYWORD(input), ...]
```

---

### Task 1.2: Statement Parser (문장 파싱)

**구현 대상**:
- ✅ 함수 선언 (fn ... do)
- ✅ 할당 (x = 10)
- ✅ 제어 흐름 (if, for, while)
- ✅ 반환값 (return)
- ✅ 함수 호출 (add(x, y))

**예시**:
```
Input:  fn sum input array<number> output number
Output: FunctionStatement {
          name: "sum",
          input: { type: "array<number>" },
          output: "number"
        }
```

---

### Task 1.3: Type Inference (타입 추론)

**구현 대상**:
- ✅ 리터럴 타입 (10 → number, "hello" → string)
- ✅ 변수 타입 (x = 10 → x: number)
- ✅ Intent 기반 타입
- ✅ 함수 매개변수 타입
- ✅ 반환값 타입

**예시**:
```
Input:  fn sum intent "배열 합계"
Output: {
          input: "array<number>",
          output: "number",
          confidence: 0.95
        }
```

---

### Task 1.4: E2E 파이프라인

**구현 대상**:
- ✅ 전체 파이프라인 (Lexer → Parser → Type Inference)
- ✅ 오류 처리 (구문 오류, 타입 오류)
- ✅ 성능 검증 (< 2ms)

**예시**:
```freelang
fn calculate
  intent: "계산"
  input: numbers: array<number>
  output: number
  do
    sum = 0
    for n in numbers
      sum = sum + n
    return sum
```

결과:
```json
{
  "function": "calculate",
  "input": { "numbers": "array<number>" },
  "output": "number",
  "pattern": {
    "loop": true,
    "accumulation": true,
    "directive": "speed"
  },
  "confidence": 0.98
}
```

---

## 문법 요약 (BNF)

```bnf
<program> ::= <function>*

<function> ::= "fn" <identifier>
               ("input" <input_spec>)?
               ("output" <output_spec>)?
               ("intent" <string>)?
               ("do" <block>)?

<input_spec> ::= <identifier> ":" <type>
               | <type>

<output_spec> ::= <type>

<block> ::= NEWLINE INDENT <statement>+ DEDENT
          | "{" <statement>+ "}"

<statement> ::= <assignment>
              | <if_stmt>
              | <for_stmt>
              | <return_stmt>
              | <expr_stmt>

<assignment> ::= <identifier> "=" <expression>

<if_stmt> ::= "if" <expression> <block> ("else" <block>)?

<for_stmt> ::= "for" <identifier> "in" <expression> <block>

<return_stmt> ::= "return" <expression>

<expression> ::= <term> (("+" | "-") <term>)*

<term> ::= <factor> (("*" | "/") <factor>)*

<factor> ::= <primary>

<primary> ::= <number>
            | <string>
            | <identifier>
            | "(" <expression> ")"
            | <function_call>

<type> ::= "number"
         | "string"
         | "bool"
         | "array" "<" <type> ">"
         | "map" "<" <type> "," <type> ">"
         | "any"

<identifier> ::= [a-zA-Z_][a-zA-Z0-9_]*

<number> ::= [0-9]+("."[0-9]+)?

<string> ::= "\"" [^"]* "\""
           | "'" [^']* "'"
```

---

## 컴파일러가 해야 할 일

### Phase 1 (현재 - Q1 2026)

```
1. Lexer
   - 토큰화 ✅
   - 들여쓰기 처리 ✅

2. Parser
   - 함수 선언 파싱 ✅
   - 문장 파싱 ✅
   - 블록 구조 ✅

3. Type Inference
   - Intent 기반 추론 ✅
   - 변수 타입 추론 ✅
   - 함수 타입 추론 ✅

4. E2E Validation
   - 전체 파이프라인 ✅
   - 오류 처리 ✅
```

### Phase 2 (Q2 2026)

```
5. 부분 컴파일 (Partial Compilation)
   - 불완전한 코드도 컴파일
   - Stub 자동 생성

6. 자동 완성 DB (Auto-Complete Database)
   - 함수 서명 캐싱
   - 타입 힌트 제공

7. Intent 기반 코드 생성
   - Intent → 함수 본체 생성
   - Directive 기반 최적화
```

### Phase 3-5 (Q3-Q4 2026)

```
메타프로그래밍, 동적 기능, 완전한 AI-by-AI 언어
```

---

## 다음 단계

### 1단계: 첫 FreeLang 프로그램 작성

```freelang
fn hello
  intent: "인사말 출력"
  output: string
  do
    return "Hello, FreeLang!"
```

### 2단계: TS 컴파일러로 컴파일

```bash
freec hello.free
./hello
# Output: Hello, FreeLang!
```

### 3단계: 복잡한 프로그램 작성

```freelang
fn fibonacci
  intent: "피보나치 수열 계산"
  input: n: number
  output: number
  do
    if n <= 1
      return n
    else
      return fibonacci(n-1) + fibonacci(n-2)
```

---

**문서 작성 일자**: 2026-02-15
**버전**: v1.0-alpha
**상태**: Phase 1 설계 완료, Phase 2 구현 대기

