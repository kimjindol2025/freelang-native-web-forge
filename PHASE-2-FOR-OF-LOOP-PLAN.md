# Phase 2: for...of Loop Implementation Plan

**Goal**: Add for...of loop syntax to FreeLang
**Status**: Planning Phase
**Priority**: HIGH (enables array iteration)
**Timeline**: ~3-4 days

---

## 🎯 Current vs Target

### Current (Broken)
```freelang
// This doesn't work:
for (let item of array) {
  println(item)
}

// Error: "Expected while or if at line X"
```

### Target (Working)
```freelang
// This will work:
for (let item of array) {
  println(item)
}

// Internal compilation to:
let i = 0
while i < array.length {
  let item = array[i]
  println(item)
  i = i + 1
}
```

---

## 🏗️ Implementation Layers

### Layer 1: Parser (Syntax Recognition)

**File to Modify**: `src/parser/parser.ts` or similar

**What to Add**:
```typescript
// Recognize for...of syntax
parseForOfStatement() {
  // for (let item of array) { ... }
  //     ↓
  // {
  //   type: 'ForOfStatement',
  //   variable: { name: 'item', type: 'inferred' },
  //   iterable: 'array',
  //   body: [ ... ]
  // }
}
```

**Changes**:
- Add ForOfStatement to AST
- Update parseForStatement() to detect "of" keyword
- Handle variable binding: `let item`
- Extract iterable expression: `array`

### Layer 2: Type Checker (Validation)

**File to Modify**: `src/analyzer/type-checker.ts` or similar

**What to Check**:
```typescript
checkForOfStatement(stmt) {
  // 1. Check iterable is an array
  const iterableType = typeOf(stmt.iterable)
  if (!isArrayType(iterableType)) {
    error("for...of requires array type, got " + iterableType)
  }

  // 2. Infer element type from array
  const elementType = iterableType.elementType  // array<string> → string

  // 3. Bind variable in scope
  scope.declare(stmt.variable.name, elementType)
}
```

**Changes**:
- Validate iterable is array type
- Extract element type from array<T>
- Type-check loop body with bound variable

### Layer 3: Code Generator (Compilation)

**File to Modify**: `src/codegen/c-generator.ts` or similar

**What to Generate**:
```typescript
generateForOfStatement(stmt) {
  // for (let item of array) { ... }
  //     ↓
  // let _idx = 0
  // while _idx < array.length {
  //   let item = array[_idx]
  //   { loop body }
  //   _idx = _idx + 1
  // }

  const indexVar = `_for_idx_${generateId()}`
  const arrayVar = stmt.iterable

  emit(`let ${indexVar} = 0`)
  emit(`while ${indexVar} < ${arrayVar}.length {`)
  emit(`  let ${stmt.variable.name} = ${arrayVar}[${indexVar}]`)
  emitBlockStatements(stmt.body)
  emit(`  ${indexVar} = ${indexVar} + 1`)
  emit(`}`)
}
```

**Changes**:
- Generate index variable
- Generate while loop
- Generate element binding
- Generate increment
- Handle nested loops (unique index vars)

---

## 📋 Step-by-Step Implementation

### Step 1: AST Definition (30 min)

**File**: `src/ast/ast.ts` or similar

```typescript
export interface ForOfStatement extends Statement {
  type: 'ForOfStatement'
  variable: {
    name: string
    type?: string
  }
  iterable: Expression
  body: Statement[]
}
```

**Verification**: Compile with new AST type

### Step 2: Parser Update (1-2 hours)

**File**: `src/parser/parser.ts`

```typescript
parseForStatement() {
  if (this.match('for')) {
    if (this.peek().value === '(let' || this.peek().value === '(var') {
      // Could be for...of
      if (this.lookAhead(3).value === 'of') {
        return this.parseForOfStatement()
      }
    }
    // else: parse traditional for loop
  }
}

parseForOfStatement() {
  this.expect('for')
  this.expect('(')
  const varToken = this.next()  // 'let' or 'var'
  const varName = this.next().value
  this.expect('of')
  const iterable = this.parseExpression()
  this.expect(')')
  const body = this.parseBlock()

  return {
    type: 'ForOfStatement',
    variable: { name: varName },
    iterable: iterable,
    body: body
  }
}
```

**Tests**:
- ✅ Parse simple for...of
- ✅ Parse nested for...of
- ✅ Parse with complex iterable
- ✅ Error on invalid syntax

### Step 3: Type Checker Update (1-2 hours)

**File**: `src/analyzer/type-checker.ts`

```typescript
checkForOfStatement(stmt: ForOfStatement) {
  // Check iterable
  const iterableType = this.checkExpression(stmt.iterable)

  if (!iterableType.startsWith('array<')) {
    this.error(
      `for...of requires array type, got ${iterableType}`,
      stmt.iterable
    )
    return
  }

  // Extract element type: array<string> → string
  const elementType = iterableType.slice(6, -1)  // "string"

  // Enter new scope with variable binding
  this.enterScope()
  this.scope.declare(stmt.variable.name, elementType)

  // Check body with bound variable
  stmt.body.forEach(s => this.checkStatement(s))

  this.exitScope()
}
```

**Tests**:
- ✅ Accept array types
- ✅ Reject non-array types
- ✅ Infer element type correctly
- ✅ Variable accessible in body
- ✅ Error on invalid array type

### Step 4: Code Generator Update (1-2 hours)

**File**: `src/codegen/c-generator.ts`

```typescript
generateForOfStatement(stmt: ForOfStatement) {
  const indexVar = `_for_idx_${this.idCounter++}`
  const arrayExpr = this.generateExpression(stmt.iterable)

  // let _idx = 0
  this.emit(`let ${indexVar} = 0`)

  // while _idx < array.length
  this.emit(`while ${indexVar} < ${arrayExpr}.length {`)

  // let item = array[_idx]
  this.emit(`  let ${stmt.variable.name} = ${arrayExpr}[${indexVar}]`)

  // Loop body
  this.indent++
  stmt.body.forEach(s => this.generateStatement(s))
  this.indent--

  // _idx = _idx + 1
  this.emit(`  ${indexVar} = ${indexVar} + 1`)

  // }
  this.emit(`}`)
}
```

**Tests**:
- ✅ Generate correct while loop
- ✅ Unique index variables
- ✅ Correct element binding
- ✅ Proper indentation

### Step 5: Integration & Testing (1 hour)

**Files to Update**:
- Parser dispatcher
- Type checker dispatcher
- Code generator dispatcher

**Tests to Write**:
```freelang
// Test 1: Simple iteration
let arr = [1, 2, 3]
for (let x of arr) {
  println(x)
}
// Expected output: 1 \n 2 \n 3

// Test 2: String array
let names = ["Alice", "Bob", "Charlie"]
for (let name of names) {
  println("Hello " + name)
}

// Test 3: Nested loops
let matrix = [[1, 2], [3, 4]]
for (let row of matrix) {
  for (let cell of row) {
    println(cell)
  }
}

// Test 4: Filter with for...of
let nums = [1, 2, 3, 4, 5]
for (let n of nums) {
  if n > 2 {
    println(n)
  }
}

// Test 5: Type mismatch error
let notArray = "string"
for (let x of notArray) {  // ❌ ERROR
  println(x)
}
```

---

## 📁 Files to Modify

### Parser
- [ ] `src/parser/parser.ts` - Add parseForOfStatement()
- [ ] `src/ast/ast.ts` - Add ForOfStatement interface

### Type Checker
- [ ] `src/analyzer/type-checker.ts` - Add checkForOfStatement()
- [ ] Update scope management for loop variable binding

### Code Generator
- [ ] `src/codegen/c-generator.ts` - Add generateForOfStatement()
- [ ] Update statement dispatcher

### Tests
- [ ] Create `test/for-of-loop.test.ts` - Comprehensive tests
- [ ] Add examples to `examples/for-of-demo.free`

---

## 🧪 Test Strategy

### Unit Tests (Parser)
```
✅ Parse valid for...of
✅ Parse nested for...of
✅ Parse with simple variable
✅ Error on missing 'of'
✅ Error on non-variable
```

### Unit Tests (Type Checker)
```
✅ Accept array<T>
✅ Bind variable with correct type
✅ Error on non-array type
✅ Variable accessible in body
✅ Proper scope management
```

### Unit Tests (Code Generator)
```
✅ Generate while loop
✅ Unique index variables
✅ Correct element binding
✅ Proper indentation
✅ Preserve loop body
```

### Integration Tests
```
✅ Full compilation pipeline
✅ Type errors caught early
✅ Generated code executes correctly
✅ Works with nested loops
✅ Works with complex expressions
```

---

## 📈 Success Criteria

### Functional Requirements
- [x] Syntax: `for (let item of array) { ... }` recognized
- [x] Type checking: Array type validated
- [x] Element type: Correctly inferred
- [x] Compilation: Converts to while loop
- [x] Execution: Works correctly

### Quality Requirements
- [x] Error messages: Clear and helpful
- [x] Type safety: All types checked
- [x] Performance: Generated code is efficient
- [x] Documentation: Examples provided
- [x] Tests: 100% coverage

### Developer Experience
- [x] Natural syntax (matches expectations)
- [x] Clear error messages
- [x] Works with existing code
- [x] Extensible to future features

---

## 🔄 Rollout Plan

### Phase 2.1: Core Implementation (2-3 days)
- Parser update
- Type checker update
- Code generator update
- Basic tests

### Phase 2.2: Testing & Refinement (1 day)
- Comprehensive testing
- Error handling improvements
- Performance optimization
- Documentation

### Phase 2.3: Integration (0.5 day)
- Update main compiler
- Update examples
- Verify no regressions
- Final tests

---

## 🎓 How It Will Look After Implementation

### Usage Example
```freelang
import sqlite from "./stdlib/db/sqlite.free"

fn processFreelancers(db: object) -> void {
  let freelancers = sqlite.table(db, "freelancers")
    .select(["name", "rating"])
    .execute()

  // NOW THIS WORKS! (instead of while loop)
  for (let freelancer of freelancers) {
    println(freelancer.name + ": " + freelancer.rating)
  }
}

fn main() -> void {
  let db = ffi_sqlite.ffiOpen("freelancers.db")
  processFreelancers(db)
  ffi_sqlite.ffiClose(db)
}
```

### Before (What We Do Now)
```freelang
let freelancers = [...]
let i = 0
while i < freelancers.length {
  let freelancer = freelancers[i]
  println(freelancer.name)
  i = i + 1
}
```

### After (What We Can Do)
```freelang
let freelancers = [...]
for (let freelancer of freelancers) {
  println(freelancer.name)
}
```

---

## 🚀 Next Phases (After for...of)

### Phase 3: Generic Types <T>
```freelang
fn getValue<T>(arr: array<T>, idx: number) -> T {
  return arr[idx]
}
```

### Phase 4: Array Methods (map, filter, reduce)
```freelang
let doubled = numbers.map(fn(x) -> x * 2)
let filtered = doubled.filter(fn(x) -> x > 10)
```

### Phase 5: Better Type Inference
```freelang
for (let item of array) {  // item type inferred
  println(item.name)       // works!
}
```

---

## 📚 References

### Similar Implementations
- Python: `for x in iterable`
- JavaScript: `for (const x of iterable)`
- Rust: `for x in iterable`
- Go: `for _, x := range iterable`

### Key Concepts
- **AST (Abstract Syntax Tree)**: Parser output
- **Type Inference**: Extracting element type
- **Code Generation**: Converting to while loop
- **Scope Management**: Variable binding

---

## 🎯 Summary

**What**: Add for...of loop syntax
**Why**: Simpler array iteration, better code readability
**How**:
1. Parser recognizes for...of
2. Type checker validates array and infers element type
3. Code generator converts to while loop

**Impact**:
- ✅ Enables cleaner iteration code
- ✅ Better developer experience
- ✅ Prepares for future features (map, filter)
- ✅ Brings FreeLang closer to modern languages

**Timeline**: 3-4 days
**Difficulty**: Medium (parser + type system + codegen)
**Blocker**: Understanding FreeLang compiler structure

---

**Status**: Ready to implement
**Next Step**: Start with Step 1 (AST Definition)
**Ready to begin?** ✅
