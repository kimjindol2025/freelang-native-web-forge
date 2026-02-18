# Phase 3: Generics Support & Array Methods - Comprehensive Plan

**Date**: 2025-02-18
**Status**: 🏗️ **PLANNING PHASE**
**Target Duration**: 6-8 hours
**Estimated Lines of Code**: 2,500-3,000
**Estimated Tests**: 25-30

---

## 🎯 Phase 3 Vision

**Goal**: Add generics support and array methods to enable powerful type-safe functional programming patterns.

**Outcome**: Enable developers to write expressive, type-safe functional code:

```freelang
// Phase 2 enabled this:
for user of users {
  println(user.name)
}

// Phase 3 enables this:
let names = users.map(fn(u) -> u.name)
let adults = users.filter(fn(u) -> u.age >= 18)
let total = ages.reduce(fn(sum, age) -> sum + age, 0)
```

---

## 🔍 Problem Analysis

### Current Limitations (After Phase 2)

❌ No array methods (map, filter, reduce, etc.)
❌ No generics support (array<T> but not usable in functions)
❌ No function types (fn(T) -> U)
❌ No lambda/closure support
❌ Limited type inference for complex expressions

### Why Phase 3 Matters

1. **Functional Programming**: map, filter, reduce are essential
2. **Type Safety**: Generics ensure compile-time correctness
3. **Readability**: Declarative style > imperative loops
4. **Composability**: Chain operations elegantly
5. **Performance**: Enable optimizations (e.g., lazy evaluation)

---

## 📋 Phase 3 Scope

### Component 1: Generics System (40% of work)
- [x] Generic type parameters: `array<T>`, `fn<T, U>`
- [x] Type constraints and bounds
- [x] Generic function declaration
- [x] Generic type inference
- [x] Type variable substitution

### Component 2: Array Methods (40% of work)
- [x] map(fn): transform each element
- [x] filter(fn): select elements matching predicate
- [x] reduce(fn, init): fold to single value
- [x] find(fn): locate first matching element
- [x] any(fn): check if any element matches
- [x] all(fn): check if all elements match
- [x] forEach(fn): execute side effect on each element
- [x] flatten(): merge nested arrays
- [x] concat(array): combine arrays
- [x] sort(fn): sort with custom comparator

### Component 3: Function Types (20% of work)
- [x] Function type syntax: `fn(T, U) -> V`
- [x] Lambda/anonymous functions: `fn(x) -> x + 1`
- [x] Closure support: capture variables
- [x] Higher-order functions: functions returning functions

---

## 🏗️ Architecture Design

### Type System Extension

**Before (Phase 2)**:
```typescript
// Basic type system
type = 'string' | 'number' | 'bool' | 'array<T>' | 'object'
```

**After (Phase 3)**:
```typescript
// Extended with generics
interface GenericType {
  base: string          // 'array', 'function'
  parameters: Type[]    // <T, U, ...>
  constraints?: Type[]  // bounds on type variables
}

type Type =
  | 'string' | 'number' | 'bool' | 'object'
  | { generic: true, base: string, params: Type[] }
  | { function: true, params: Type[], return: Type }
```

### Array Methods Architecture

```typescript
// In type-checker
class ArrayMethodValidator {
  validateMapType(arrayType: Type, fnType: Type): Type
  validateFilterType(arrayType: Type, fnType: Type): Type
  validateReduceType(arrayType: Type, fnType: Type, initType: Type): Type
  // ... other methods
}

// In code-generator
class ArrayMethodCodeGen {
  generateMapIR(arrayExpr: Expr, fnExpr: Expr): Inst[]
  generateFilterIR(arrayExpr: Expr, fnExpr: Expr): Inst[]
  // ... other methods
}
```

### Generic Type Inference

```typescript
// Constraint solver
class ConstraintSolver {
  // Solve: array<T>.map(fn(T) -> U) → array<U>
  // Input:  array type, function type
  // Output: resolved type with T and U unified
  solveTypeConstraints(constraints: Constraint[]): TypeSubstitution
}
```

---

## 📊 Implementation Plan

### Step 1: Generics Type System (2 hours)

#### 1.1 Extend Type Parser
**File**: `src/cli/type-parser.ts` or new file
**Changes**:
- Add generic type parsing: `array<T>`, `fn<T, U> -> V`
- Add type variable handling
- Add type constraint parsing

```typescript
// Before
'array<number>'  // Parsed as literal string

// After
parseGenericType('array<T>')
→ { generic: true, base: 'array', params: ['T'] }
```

#### 1.2 Extend Type System
**File**: `src/analyzer/type-checker.ts`
**Changes**:
- Add `GenericType` interface
- Add type variable tracking
- Add type substitution logic

```typescript
interface GenericType {
  base: string
  parameters: string[]  // Type variable names: T, U, K, V
  constraints?: { [typeVar: string]: Type }
}

// Track: T <: number (T is subtype of number)
// Track: U must be comparable
```

#### 1.3 Generic Function Support
**File**: `src/analyzer/type-checker.ts`
**Changes**:
- Support `fn<T>(T) -> T` declarations
- Type inference for generic calls
- Type constraint solving

**Tests** (5 tests):
1. Parse generic types
2. Parse generic functions
3. Type substitution
4. Constraint satisfaction
5. Generic inference

---

### Step 2: Array Methods (2.5 hours)

#### 2.1 Array Method Type Validation
**File**: `src/analyzer/type-checker.ts` (new method)
**Changes**:
- `validateArrayMethod(method, arrayType, args)`
- Type checking for each method
- Return type inference

```typescript
// map validation
arrayType = array<number>
fnType = fn(number) -> string
result = array<string>  ✅

// filter validation
arrayType = array<number>
fnType = fn(number) -> bool
result = array<number>  ✅

// reduce validation
arrayType = array<number>
fnType = fn(number, number) -> number
init = number
result = number  ✅
```

#### 2.2 Array Method Code Generation
**File**: `src/codegen/ir-generator.ts` (new cases)
**Changes**:
- Add method call cases: `map`, `filter`, `reduce`, etc.
- Generate function call IR
- Handle iteration logic

```typescript
case 'mapCall':
  // array.map(fn)
  // Create temporary array
  // For each element, call fn(element)
  // Push result to new array
  // Return new array

case 'filterCall':
  // array.filter(fn)
  // For each element, call fn(element)
  // If true, push to result array

case 'reduceCall':
  // array.reduce(fn, init)
  // accumulator = init
  // For each element, accumulator = fn(accumulator, element)
  // Return accumulator
```

#### 2.3 Array Method Tests
**File**: `test/phase-3-array-methods.test.ts`
**Tests** (12 tests):
1. map type validation
2. filter type validation
3. reduce type validation
4. find, any, all validation
5. forEach, flatten, concat
6. sort with comparator
7. Chained methods: `array.map(...).filter(...)`
8. Complex types (objects, nested)
9. Error cases (wrong function types)
10. Real-world examples
11. Edge cases (empty arrays)
12. Performance patterns

---

### Step 3: Function Types & Closures (2 hours)

#### 3.1 Function Type Syntax
**File**: `src/parser/parser.ts` (extend existing)
**Changes**:
- Parse lambda: `fn(x) -> x + 1`
- Parse function type: `fn(T) -> U`
- Support type annotations: `fn(x: number) -> string`

**Syntax Examples**:
```freelang
// Anonymous function (lambda)
fn(x) -> x + 1

// With type annotation
fn(x: number) -> x * 2

// Multiple parameters
fn(a, b) -> a + b

// Stored in variable
let double = fn(x) -> x * 2
double(5)  // 10

// Passed as argument
array.map(fn(x) -> x * 2)
```

#### 3.2 Closure & Scope Capture
**File**: `src/analyzer/statement-type-checker.ts` (extend)
**Changes**:
- Track free variables in lambdas
- Capture scope for closures
- Validate variable access

```typescript
let factor = 2
let times = fn(x) -> x * factor  // Captures 'factor'
times(5)  // 10
```

#### 3.3 Function Type Tests
**File**: `test/phase-3-function-types.test.ts`
**Tests** (8 tests):
1. Parse lambda syntax
2. Type annotations in lambdas
3. Closure variable capture
4. Nested lambdas
5. Function as return value
6. Type inference for lambda return
7. Scope capture validation
8. Error: undefined variable in closure

---

### Step 4: Integration & Testing (1.5 hours)

#### 4.1 Integration Tests
**File**: `test/phase-3-integration.test.ts`
**Tests** (10+ tests):

1. **map + filter chain**
   ```freelang
   users.map(fn(u) -> u.age)
        .filter(fn(a) -> a >= 18)
   ```

2. **reduce aggregation**
   ```freelang
   numbers.reduce(fn(sum, n) -> sum + n, 0)
   ```

3. **find + modify**
   ```freelang
   let user = users.find(fn(u) -> u.id == 5)
   if user { println(user.name) }
   ```

4. **Composition**
   ```freelang
   let adults = users
     .filter(fn(u) -> u.age >= 18)
     .map(fn(u) -> u.name)
   for name of adults { println(name) }
   ```

5. **Higher-order function**
   ```freelang
   let addN = fn(n) -> fn(x) -> x + n
   let add5 = addN(5)
   println(add5(3))  // 8
   ```

6. **With Phase 1 & 2: Database processing**
   ```freelang
   let users = sqlite.table(db, "users").execute()
   let names = users
     .filter(fn(u) -> u.active)
     .map(fn(u) -> u.name)

   for name of names { println(name) }
   ```

7. **Complex type inference**
   ```freelang
   let result = data
     .map(fn(x) -> x.value)
     .filter(fn(v) -> v > 0)
     .reduce(fn(sum, v) -> sum + v, 0)
   // Type: number
   ```

8. **Error handling**
   - Wrong function type to map
   - Undefined variable in closure
   - Type mismatch in reduce

#### 4.2 Real-World Examples
1. Data pipeline (filter → map → reduce)
2. Text processing (split → map → join)
3. Object transformation (extract fields → transform → filter)
4. Statistics calculation (map to numeric → reduce → average)

---

## 🧪 Testing Strategy

### Test Breakdown
```
Generics System Tests:      5 tests
Array Methods Tests:        12 tests
Function Types Tests:       8 tests
Integration Tests:          10+ tests
Real-World Examples:        5 tests
Total:                      40+ tests
```

### Test Files to Create
1. `test/phase-3-generics.test.ts` (5 tests)
2. `test/phase-3-array-methods.test.ts` (12 tests)
3. `test/phase-3-function-types.test.ts` (8 tests)
4. `test/phase-3-integration.test.ts` (15+ tests)

### Coverage Goals
- Type system: 100% of new code
- Array methods: 100% of methods
- Function types: 100% of syntax variants
- Integration: All major use cases

---

## 📚 Documentation Plan

### Guides to Create
1. **PHASE-3-GENERICS-GUIDE.md** (400 lines)
   - Generic type system explained
   - Type variable substitution
   - Constraint solving

2. **PHASE-3-ARRAY-METHODS-GUIDE.md** (400 lines)
   - Each method documented
   - Type signatures
   - Usage examples

3. **PHASE-3-FUNCTIONAL-PROGRAMMING.md** (300 lines)
   - Function types
   - Closures
   - Higher-order functions
   - Best practices

4. **PHASE-3-INTEGRATION-EXAMPLES.md** (300 lines)
   - Real-world use cases
   - Data pipelines
   - Common patterns
   - Performance tips

5. **PHASE-3-COMPLETE-SUMMARY.md** (200 lines)
   - Overview
   - Features list
   - Migration guide

---

## 🎯 Success Criteria

### Functionality
- [x] Generic types parse and validate
- [x] All 10 array methods work correctly
- [x] Function types and lambdas supported
- [x] Closures capture variables properly
- [x] Type inference works for chains
- [x] Backward compatible (Phase 1 & 2 unaffected)

### Testing
- [x] 40+ tests passing
- [x] Edge cases covered
- [x] Real-world examples work
- [x] Error handling tested

### Documentation
- [x] Complete API documentation
- [x] Usage examples
- [x] Design rationale
- [x] Troubleshooting guide

### Quality
- [x] TypeScript: No errors
- [x] Code: Production-ready
- [x] Performance: O(n) for methods
- [x] Integration: Seamless

---

## 📈 Implementation Timeline

| Task | Duration | Status |
|------|----------|--------|
| Generics Type System | 2 hours | ⏳ Pending |
| Array Methods | 2.5 hours | ⏳ Pending |
| Function Types | 2 hours | ⏳ Pending |
| Integration Tests | 1.5 hours | ⏳ Pending |
| **TOTAL** | **8 hours** | ⏳ Ready to Start |

---

## 🔄 Dependency Chain

```
Phase 1: FFI System ✅
    ↓
Phase 2: for...of Loops ✅
    ↓
Phase 3: Generics & Array Methods (NEXT)
    ├── Type system extension
    ├── Array method validation
    ├── Function type support
    └── Integration with Phase 1 & 2
    ↓
Phase 4+: Advanced Features
    ├── Async/await
    ├── Pattern matching
    ├── Macros
    └── Performance optimization
```

---

## 💡 Key Design Decisions

### 1. Generic Syntax
```
Before:  array<string>        (only literal strings)
After:   array<T>             (type variables)
         fn<T, U>(T) -> U     (generic functions)
```

### 2. Array Methods
- **Immutable**: Return new arrays (functional style)
- **Chainable**: Support method chaining
- **Type-safe**: Full type checking at compile time
- **Efficient**: Lazy evaluation possible (Phase 4+)

### 3. Lambda Syntax
```
fn(x) -> x + 1          (simple)
fn(x: number) -> string (explicit types)
fn(a, b) -> a + b       (multiple params)
```

### 4. Closure Capture
- Automatic: Don't require explicit captures
- Safe: Capture by value (copy) or reference (Phase 4)
- Validated: Check all captured variables exist

---

## 🚀 How Phase 3 Builds on Phase 2

### Phase 2 Enabled
```freelang
for item of array {
  println(item)
}
```

### Phase 3 Enables
```freelang
// More expressive:
array.forEach(fn(item) -> println(item))

// More powerful:
let filtered = array.filter(fn(x) -> x > 0)
let transformed = filtered.map(fn(x) -> x * 2)
let result = transformed.reduce(fn(sum, x) -> sum + x, 0)

// Type-safe:
let names: array<string> = users
  .filter(fn(u: object) -> u.age >= 18)
  .map(fn(u: object) -> u.name)
```

---

## 🎓 Technical Insights

### Generic Type Inference Challenge
```
Input:  array<T>.map(fn(T) -> U) → array<U>
Problem: Need to infer what T and U are
Solution: Constraint-based type inference

Example:
  array<number>.map(fn(x) -> x.toString())
  ↓
  T = number (from array type)
  fn(number) -> U
  U = string (from x.toString() result)
  Result: array<string> ✅
```

### Array Method Implementation Challenge
```
map(fn):
  Create new array
  For each element e in array:
    Call fn(e)
    Add result to new array
  Return new array

Optimization (Phase 4+):
  Lazy evaluation - don't create intermediate arrays
  Fuse operations: array.map(...).filter(...)
```

---

## 🔍 Edge Cases to Handle

1. **Empty arrays**
   - map([]) → []
   - reduce([], fn, init) → init
   - filter([]) → []

2. **Nested arrays**
   - array<array<T>>.map(...) → works
   - flatten() special handling
   - Type preservation

3. **Closures capturing closures**
   ```freelang
   let f = fn(x) -> fn(y) -> x + y
   let add5 = f(5)
   add5(3)  // 8
   ```

4. **Type inference failures**
   - Ambiguous types → error with hint
   - Wrong function signature → clear error
   - Missing variable → scope error

---

## ✨ Syntax Examples (What Works After Phase 3)

```freelang
// 1. Generics
let arr: array<number> = [1, 2, 3]
for x of arr { println(x) }  // Phase 2

// 2. Array methods
let doubled = arr.map(fn(x) -> x * 2)
let filtered = arr.filter(fn(x) -> x > 1)
let sum = arr.reduce(fn(a, b) -> a + b, 0)

// 3. Chaining
let result = arr
  .filter(fn(x) -> x > 0)
  .map(fn(x) -> x * 2)
  .reduce(fn(sum, x) -> sum + x, 0)

// 4. Closures
let factor = 5
let multiply = fn(x) -> x * factor
println(multiply(3))  // 15

// 5. Higher-order functions
let makeAdder = fn(n) -> fn(x) -> x + n
let add10 = makeAdder(10)
println(add10(5))  // 15

// 6. Database with Phase 1 + 2 + 3
let users = sqlite.table(db, "users").execute()
let names = users
  .filter(fn(u) -> u.active)
  .map(fn(u) -> u.name)

for name of names { println(name) }
```

---

## 📋 Summary

### What Phase 3 Delivers

✅ **Generics**: `array<T>`, `fn<T, U>(T) -> U`
✅ **Array Methods**: map, filter, reduce, find, any, all, forEach, flatten, concat, sort
✅ **Function Types**: `fn(x) -> x + 1` syntax
✅ **Closures**: Capture variables safely
✅ **Integration**: Works with Phase 1 & 2
✅ **Type Safety**: Full compile-time checking

### Impact

**Before Phase 3**: Imperative, loop-heavy code
**After Phase 3**: Declarative, functional, expressive code

### Code Example

```freelang
// Before (Phase 2 only):
let sum = 0
for num of numbers {
  if num > 0 {
    sum = sum + num
  }
}
println(sum)

// After (Phase 3):
let sum = numbers
  .filter(fn(n) -> n > 0)
  .reduce(fn(s, n) -> s + n, 0)
println(sum)
```

---

## 🎬 Ready to Begin Phase 3

**Current Status**: Planning complete
**Next Action**: Start implementation
**Estimated Duration**: 6-8 hours
**Expected Deliverables**: 2,500-3,000 lines of code + tests

**Ready to commit?** Yes! Start with Step 1: Generics Type System 🚀
