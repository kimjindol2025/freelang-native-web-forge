# FreeLang Phase 2 - 부분 컴파일 (Partial Compilation)

**목표**: AI가 불완전한 코드를 작성해도 컴파일 가능한 언어
**설계 철학**: "코드가 부분적이어도 구조는 완전해야 함"
**버전**: v1.0-alpha (Phase 2, Q1 2026)

---

## 📖 목차

1. [핵심 철학](#핵심-철학)
2. [부분 컴파일의 4가지 유형](#부분-컴파일의-4가지-유형)
3. [Stub 생성 규칙](#stub-생성-규칙)
4. [예제](#예제)
5. [Type Inference for Incomplete Code](#type-inference-for-incomplete-code)
6. [Phase 2 구현 Task](#phase-2-구현-task)
7. [BNF 확장](#bnf-확장)

---

## 핵심 철학

### Phase 1 vs Phase 2

**Phase 1 (완료)**: 완전한 코드만 컴파일
```freelang
fn hello
  intent: "인사말 출력"
  output: string
  do
    return "Hello, FreeLang!"  // ← 완전함
```

**Phase 2 (목표)**: 불완전한 코드도 컴파일
```freelang
fn hello
  intent: "인사말 출력"
  output: string
  do
    // ← 비어있음 (AI가 생성 중)

// 또는

fn process
  intent: "배열 처리"
  input: array<number>
  output: array<number>
  do
    for item in input
      // ← 루프 바디 비어있음
```

### AI-First 설계

```
AI의 코드 생성 과정:

1️⃣ 함수 시그니처 생성 (완전)
   fn process input array<number> output number

2️⃣ 함수 바디 생성 중 (불완전)
   do
     sum = 0
     for item in input
       // ← 여기서 멈춤 (토큰 제한)

3️⃣ FreeLang 컴파일러가 자동으로 바디를 stub으로 완성
   do
     sum = 0
     for item in input
       sum = stub(number)  // ← 자동 생성
     return sum
```

---

## 부분 컴파일의 4가지 유형

### 1️⃣ 빈 함수 본체 (Empty Body)

**입력** (AI 생성):
```freelang
fn calculate
  intent: "계산"
  input: x: number
  output: number
  do
    // 비어있음
```

**컴파일 결과**:
```freelang
fn calculate(x: number) -> number {
  return stub(number);  // ← 자동 생성
}
```

**C 코드 생성**:
```c
int64_t calculate(int64_t x) {
  // Stub: return default value
  return 0;  // number의 기본값
}
```

---

### 2️⃣ 불완전한 루프 (Incomplete Loop)

**입력** (AI 생성):
```freelang
fn sum_array
  intent: "배열 합계"
  input: arr: array<number>
  output: number
  do
    total = 0
    for item in arr
      // 루프 바디 미완성
    return total
```

**컴파일 결과**:
```freelang
fn sum_array(arr: array<number>) -> number {
  total = 0
  for item in arr
    total = stub(number)  // ← 루프 바디 자동 완성
  return total
}
```

**C 코드**:
```c
int64_t sum_array(array_t* arr) {
  int64_t total = 0;
  for (int i = 0; i < arr->len; i++) {
    int64_t item = arr->data[i];
    total = 0;  // Stub: do nothing or default
  }
  return total;
}
```

---

### 3️⃣ 불완전한 조건문 (Incomplete If-Else)

**입력** (AI 생성):
```freelang
fn classify
  intent: "숫자 분류"
  input: num: number
  output: string
  do
    if num > 0
      return "positive"
    else
      // else 본체 미완성
```

**컴파일 결과**:
```freelang
fn classify(num: number) -> string {
  if num > 0
    return "positive"
  else
    return stub(string)  // ← 자동 생성
}
```

---

### 4️⃣ 누락된 반환값 (Missing Return)

**입력** (AI 생성):
```freelang
fn process
  intent: "데이터 처리"
  output: number
  do
    x = 10
    y = 20
    // return 문 없음
```

**컴파일 결과**:
```freelang
fn process() -> number {
  x = 10
  y = 20
  return stub(number)  // ← 자동 생성 (타입: output)
}
```

---

## Stub 생성 규칙

### 규칙 1: 타입별 기본값

| 타입 | Stub 값 | C 코드 |
|------|---------|--------|
| `number` | `stub(number)` | `0` |
| `string` | `stub(string)` | `""` (빈 문자열) |
| `bool` | `stub(bool)` | `false` |
| `array<T>` | `stub(array<T>)` | `[]` (빈 배열) |
| `map<K,V>` | `stub(map<K,V>)` | `{}` (빈 맵) |
| `any` | `stub(any)` | `null` |

### 규칙 2: 컨텍스트별 Stub

**변수 할당에서 미완성**:
```freelang
x =
  // ← 값 없음

// 컴파일 결과:
x = stub(any)  // 타입 불명확, any 사용
```

**반환값 미완성**:
```freelang
fn foo() -> number
  do
    if condition
      return 42
    // else에서 return 없음

// 컴파일 결과:
fn foo() -> number
  do
    if condition
      return 42
    else
      return stub(number)  // output 타입 사용
```

**함수 호출 미완성**:
```freelang
result = process()
  // 인자 없음 (함수가 input 필요로 함)

// 컴파일 결과 (경고 포함):
result = process(stub(number))  // 인자 자동 생성
```

### 규칙 3: 스코프 내 Stub

```freelang
for item in array
  // 루프 바디 비어있음

// 컴파일 결과:
for item in array
  _ = stub(type_of_item)  // 루프 변수 타입 사용
```

---

## Type Inference for Incomplete Code

### 상황 1: Intent만으로 타입 추론

**입력**:
```freelang
fn process
  intent: "배열 처리 후 합계"
  do
    // 타입 없음, 본체 비어있음
```

**추론**:
```
Intent: "배열 처리 후 합계"
  ├─ "배열" → input: array<number>
  └─ "합계" → output: number

결과:
fn process(arr: array<number>) -> number {
  return stub(number);
}
```

### 상황 2: 부분 구현에서 타입 추론

**입력**:
```freelang
fn double_sum
  intent: "배열 합계의 두 배"
  input: arr: array<number>
  do
    sum = 0
    for item in arr
      sum = sum + item
    // return 문 없음
```

**추론**:
```
✓ input: array<number> (명시)
✓ 루프 내: item은 number (배열 요소)
✓ sum = 0이므로 sum: number
✓ sum = sum + item이므로 sum: number
✓ output 타입 없음 → Intent에서 추론 → number

결과:
fn double_sum(arr: array<number>) -> number {
  sum = 0
  for item in arr
    sum = sum + item
  return sum * 2  // 또는 stub(number)
}
```

---

## 예제

### 예제 1: AI 코드 생성 (중단된 상태)

**사용자 요청**: "배열의 합을 구하는 함수"

**AI 생성 (불완전)**:
```freelang
fn sum_array
  intent: "배열의 합계를 계산한다"
  input: numbers: array<number>
  output: number
  do
    total = 0
    for n in numbers
      total = total +
      // 토큰 제한으로 여기서 중단
```

**FreeLang 컴파일러 처리**:

1️⃣ 파싱
```
✓ 함수명: sum_array
✓ intent: "배열의 합계를..."
✓ input: numbers: array<number>
✓ output: number
⚠️ 루프 바디 불완전: "total = total +" (표현식 미완성)
```

2️⃣ 타입 추론
```
total: number (0으로 초기화)
n: number (배열 요소)
표현식 "total + _" → _ 는 number여야 함
```

3️⃣ Stub 생성 및 수정
```
"total = total +"
  → "total = total + stub(number)"  # ← Stub 자동 삽입
```

4️⃣ 컴파일 결과
```freelang
fn sum_array(numbers: array<number>) -> number {
  total = 0
  for n in numbers
    total = total + 0  # stub 값 (또는 n)
  return total
}
```

5️⃣ C 코드 생성
```c
int64_t sum_array(array_t* numbers) {
  int64_t total = 0;
  for (int i = 0; i < numbers->len; i++) {
    int64_t n = numbers->data[i];
    total = total + 0;  // Stub
  }
  return total;
}
```

✅ **완성도**: 90% (실제로는 n을 더해야 함이 명백하지만, 구문상 완전)

---

### 예제 2: 여러 불완전성

**입력**:
```freelang
fn process_data
  intent: "데이터 필터링 후 변환"
  input: data
  do
    result = []
    for item in data
      if item > 0
        result.push
      else
```

**분석**:
- ⚠️ input 타입 없음 (Intent에서 추론 불가)
- ⚠️ result.push 인자 없음
- ⚠️ else 본체 비어있음
- ⚠️ return 문 없음

**컴파일 결과**:
```freelang
fn process_data(data: array<any>) -> array<any> {
  result = []
  for item in data
    if item > 0
      result.push(stub(any))
    else
      stub(void)  // else 바디 스텁
  return result
}
```

---

## Phase 2 구현 Task

### Task 2.1: Stub 생성 엔진

**파일**: `src/compiler/stub-generator.ts`

```typescript
interface StubGeneratorConfig {
  defaultValue: boolean;  // true: 기본값 (0, ""), false: null
  autoComplete: boolean;  // true: 자동 완성, false: 경고만
  strictMode: boolean;    // true: stub은 에러, false: 경고
}

class StubGenerator {
  /**
   * 타입에 맞는 Stub 값 생성
   * @param type - 타입 (number, string, array<T> 등)
   * @returns Stub AST 노드 또는 기본값
   */
  generateStub(type: string): ASTNode | DefaultValue;

  /**
   * 불완전한 표현식 수정
   * @param expr - 부분 표현식
   * @param expectedType - 예상 타입
   * @returns 완성된 표현식
   */
  completeExpression(expr: string, expectedType: string): string;

  /**
   * 누락된 return 삽입
   * @param func - 함수 AST
   * @param returnType - 반환 타입
   * @returns 수정된 함수 AST
   */
  insertMissingReturn(func: FunctionStatement, returnType: string): FunctionStatement;
}
```

**테스트**: `tests/stub-generator.test.ts` (15개)

### Task 2.2: 불완전한 문법 파서 확장

**파일**: `src/parser/partial-parser.ts`

```typescript
class PartialParser extends StatementParser {
  /**
   * 불완전한 표현식도 파싱
   * 예: "total = total +" → 마지막 + 이후 stub 자동 추가
   */
  parseIncompleteExpression(tokens: Token[]): Expression;

  /**
   * 빈 블록 처리
   * 예: if condition do (아무것도 없음) → do stub(void)
   */
  handleEmptyBlock(block: BlockStatement): BlockStatement;

  /**
   * 누락된 세미콜론/괄호 자동 추가
   */
  autoCompleteTokens(tokens: Token[]): Token[];
}
```

**테스트**: `tests/partial-parser.test.ts` (20개)

### Task 2.3: 타입 추론 개선 (불완전 코드용)

**파일**: `src/analyzer/type-inference.ts` 수정

```typescript
class TypeInferenceEngine {
  /**
   * 부분 구현에서 타입 추론
   * - Intent만 있어도 input/output 추론
   * - 부분 구현에서 변수 타입 추론
   * - 누락된 부분의 타입 추론
   */
  inferTypesForIncompleteCode(
    func: FunctionStatement,
    config: InferenceConfig
  ): {
    inputTypes: Map<string, string>;
    outputType: string;
    suggestedImplementation: string[];
  };

  /**
   * Intent에서만 함수 시그니처 생성
   */
  inferSignatureFromIntent(intent: string): FunctionSignature;

  /**
   * 루프/조건문에서 컨텍스트 기반 타입 추론
   */
  inferContextualTypes(context: ASTNode): Map<string, string>;
}
```

**테스트**: `tests/type-inference-partial.test.ts` (25개)

### Task 2.4: 경고 및 제안 시스템

**파일**: `src/compiler/suggestion-engine.ts`

```typescript
interface CompileWarning {
  type: 'INCOMPLETE' | 'AMBIGUOUS' | 'MISSING_RETURN';
  line: number;
  col: number;
  message: string;
  suggestion: string;  // 자동 수정 제안
  autoFixed: boolean;  // 자동으로 수정했는지
}

class SuggestionEngine {
  /**
   * 불완전한 코드 분석 후 제안
   */
  analyzeParts(code: string): CompileWarning[];

  /**
   * 자동 수정 가능한지 판단
   */
  canAutoFix(warning: CompileWarning): boolean;

  /**
   * 사용자 피드백 기반 학습
   * (Phase 3에서 활용)
   */
  recordFix(original: string, fixed: string): void;
}
```

**테스트**: `tests/suggestion-engine.test.ts` (20개)

### Task 2.5: E2E 통합 테스트

**파일**: `tests/phase-2-e2e.test.ts`

```typescript
describe('Phase 2: Partial Compilation E2E', () => {
  test('Empty function body → auto stub', () => {
    const code = `
      fn hello
        intent: "인사말"
        output: string
        do
    `;
    const result = compile(code);
    expect(result.success).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('Incomplete loop body', () => { /* ... */ });
  test('Missing return statement', () => { /* ... */ });
  test('Intent-based type inference', () => { /* ... */ });
  test('Multiple incompleteness', () => { /* ... */ });
  // ... 총 15개
});
```

---

## BNF 확장

### Phase 1 BNF (완전한 문법)
```bnf
<block> ::= NEWLINE INDENT <statement>+ DEDENT
          | "{" <statement>+ "}"
```

### Phase 2 BNF (부분 문법 허용)

```bnf
<program> ::= <function>*

<function> ::= "fn" <identifier>
               (("input" | "in") <input_spec>)?
               (("output" | "out") <output_spec>)?
               (("intent" | "int") <string>)?
               ("do" <block>)?
               // ↑ "do" 블록이 선택사항으로 변경

<block> ::= NEWLINE INDENT <partial_statement>* DEDENT
          | "{" <partial_statement>* "}"
          | NEWLINE                    // ← 완전히 빈 블록

<partial_statement> ::= <statement>
                     | <incomplete_expr>  // ← NEW
                     | <empty_line>       // ← NEW

<incomplete_expr> ::= <identifier> "="      // "x =" (값 없음)
                   | <identifier> "." <identifier>  // "arr.push" (인자 없음)
                   | <expr> <binop>                 // "total +" (우측 없음)

<empty_line> ::= NEWLINE                    // 빈 줄도 유효

<if_stmt> ::= "if" <expression> <block> ("else" <block>)?
           | "if" <expression> <block>  // else 선택사항으로 변경 (Phase 2)

<for_stmt> ::= "for" <identifier> "in" <expression> <block>
            | "for" <identifier> "in" <expression>  // 빈 블록

<return_stmt> ::= "return" <expression>
               | "return"              // 값 없음 (stub 생성)
               |                        // return 문 자체 없음
```

---

## 컴파일 플로우 (Phase 2)

```
입력 (불완전한 FreeLang 코드)
  ↓
[1. Lexer] 토큰화
  ↓
[2. PartialParser] 불완전한 문법 파싱
  ├─ autoCompleteTokens (누락된 토큰 추가)
  ├─ handleEmptyBlock (빈 블록 처리)
  └─ parseIncompleteExpression (부분 표현식)
  ↓
[3. TypeInferenceEngine] 타입 추론
  ├─ Intent에서 함수 시그니처 추론
  ├─ 부분 구현에서 변수 타입 추론
  └─ 컨텍스트 기반 타입 추론
  ↓
[4. StubGenerator] Stub 생성
  ├─ 누락된 return 추가
  ├─ 빈 루프 바디 채우기
  └─ 불완전한 표현식 완성
  ↓
[5. SuggestionEngine] 경고 및 제안
  ├─ 자동 수정 여부 판단
  └─ 사용자 피드백 기록
  ↓
[6. CodeGen] C 코드 생성
  └─ stub 값으로 컴파일
  ↓
출력 (완전한 C 코드)
```

---

## 예상 결과

### 컴파일 전
```freelang
fn sum_array
  intent: "배열 합계"
  input: arr: array<number>
  output: number
  do
    sum = 0
    for item in arr
      sum = sum +
```

### 컴파일 후
```freelang
fn sum_array(arr: array<number>) -> number {
  sum = 0
  for item in arr
    sum = sum + 0  // stub
  return sum
}
```

### C 코드
```c
int64_t sum_array(array_t* arr) {
  int64_t sum = 0;
  for (int i = 0; i < arr->len; i++) {
    int64_t item = arr->data[i];
    sum = sum + 0;  // stub
  }
  return sum;
}
```

### 컴파일 보고
```
✅ Compilation successful (with warnings)

Warnings:
  [Line 6] INCOMPLETE: Loop body incomplete
    Suggestion: "sum = sum + item" (77% confident)
    Auto-fixed: sum = sum + 0

  [Line 5] AMBIGUOUS: Empty return type, inferred from intent
    Inferred: number (95% confident)

Files:
  - sum_array.c (C code with stubs)
  - sum_array.warnings (suggestions for improvement)
```

---

## Phase 2 vs Phase 3 vs Phase 4

| Phase | 목표 | 기능 | 테스트 |
|-------|------|------|--------|
| **2** | 불완전한 코드 컴파일 | Stub 생성, 자동 완성, 기본 경고 | 80개 |
| **3** | 자동 완성 DB 구축 | 패턴 학습, 개선된 추론, 사용자 피드백 | 50개 |
| **4** | 메타프로그래밍 | 동적 코드 생성, 자가 개선 | 40개 |

---

## 성공 기준

### 정량적
- ✅ 80개 새로운 테스트 (모두 통과)
- ✅ Stub 정확도 90% 이상
- ✅ 컴파일 시간 < 5ms
- ✅ 경고 제안 정확도 80% 이상

### 정성적
- ✅ AI가 중단된 코드를 완성 가능
- ✅ 자동 수정이 실제 의도와 90% 이상 일치
- ✅ 컴파일 오류 제로 (stub 덕분)
- ✅ 사용자 피드백으로 개선 가능

---

## 다음 단계

### Week 3-4 (Phase 2 구현)
1. Task 2.1: Stub 생성 엔진
2. Task 2.2: 불완전한 문법 파서
3. Task 2.3: 타입 추론 개선
4. Task 2.4: 경고 및 제안 시스템
5. Task 2.5: E2E 통합 테스트

### Week 5-6 (Phase 3 준비)
- 패턴 DB 설계
- 학습 알고리즘 설계
- 사용자 피드백 시스템 설계

---

**문서 작성 일자**: 2026-02-17 (Phase 2 명세)
**버전**: v1.0-alpha
**상태**: 구현 준비 완료 ✅

