# Phase 3 Step 3: Function Types & Closures - Quick Reference

**Quick lookup for lambda syntax, type checking, closure capture, and real-world patterns**

---

## Lambda Expression Syntax

### Basic Syntax

```
fn(param1, param2, ...) -> body
```

### Examples

| Format | Example | Type Inferred |
|--------|---------|---------------|
| **No params** | `fn() -> 42` | `fn() -> number` |
| **One param** | `fn(x) -> x + 1` | `fn(unknown) -> number` |
| **Multiple params** | `fn(a, b) -> a + b` | `fn(unknown, unknown) -> number` |
| **Type annotation** | `fn(x: number) -> x * 2` | `fn(number) -> number` |
| **Multiple types** | `fn(x: number, y: string) -> x` | `fn(number, string) -> number` |
| **Return type** | `fn(x: number) -> number -> x + 1` | `fn(number) -> number` |
| **Array type** | `fn(arr: array<number>) -> arr.length` | `fn(array<number>) -> number` |
| **Generic type** | `fn(a: array<T>) -> a` | `fn(array<T>) -> array<T>` |

---

## Function Type Construction

```typescript
// Format: fn(paramType1, paramType2, ...) -> returnType

fn() -> number                    // No params
fn(number) -> number              // One param
fn(number, string) -> bool        // Multiple params
fn(array<number>) -> number       // Array param
fn(number, number) -> number      // Same types
fn(number) -> fn(number) -> number // Returns function (curry)
```

---

## Type Annotations

### Parameter Types

```freelang
fn(x: number) -> x + 1                    // number parameter
fn(x: string) -> x.length                 // string parameter
fn(arr: array<number>) -> arr.length      // array parameter
fn(a: number, b: number) -> a + b         // multiple types
fn(x: array<array<number>>) -> x          // nested generic
```

### Return Types

```freelang
fn(x: number) -> number -> x * 2          // explicit return type
fn(x) -> bool                             // inferred return from body
fn(x) -> fn(y) -> x + y                   // returns function
```

---

## Closure Variable Capture

### Basic Closure

```freelang
let multiplier = 2

let scale = fn(x) -> x * multiplier
// Captures: [multiplier]

scale(5)  // 10
```

### Multiple Captured Variables

```freelang
let a = 10
let b = 20

let sum = fn(x) -> x + a + b
// Captures: [a, b]
```

### Closure in Array Methods

```freelang
let threshold = 5

let filtered = numbers
  .filter(fn(x) -> x > threshold)  // captures: [threshold]
  .map(fn(x) -> x * 2)
```

### Parameter vs Capture

```freelang
let outer = fn(x) -> {
  // x is a parameter, not captured
  let inner = fn(y) -> x + y  // captures: [x] from outer param
  return inner
}
```

---

## Type Inference

### Inference Levels

| Level | Example | Inferred Type |
|-------|---------|---------------|
| **Explicit** | `fn(x: number) -> number` | `fn(number) -> number` |
| **Partial** | `fn(x: number) -> x * 2` | `fn(number) -> number` (from body) |
| **Full** | `fn(x) -> x * 2` | `fn(unknown) -> number` (body only) |
| **Context** | `numbers.map(fn(x) -> x + 1)` | `fn(number) -> number` (from usage) |

### Type Variables

```typescript
// Generic type variables
T, U, V, K, V  // Common type variables

// Example: map preserves element type
array<T>.map(fn(T) -> U) -> array<U>

// Example: reduce with accumulator
array<T>.reduce(fn(U, T) -> U, U) -> U
```

---

## Higher-Order Functions

### Function Returning Function (Curry)

```freelang
let add = fn(a: number) -> fn(b: number) -> a + b
// Type: fn(number) -> fn(number) -> number

let add5 = add(5)      // Type: fn(number) -> number
let result = add5(10)  // 15
```

### Function Accepting Function

```freelang
let apply = fn(f: fn, value: number) -> f(value)

let double = fn(x: number) -> x * 2
let result = apply(double, 5)  // 10
```

### Function Composition

```freelang
let compose = fn(f) -> fn(g) -> fn(x) -> f(g(x))

let double = fn(x) -> x * 2
let increment = fn(x) -> x + 1

let composed = compose(double)(increment)
let result = composed(5)  // (5+1)*2 = 12
```

---

## Array Method Integration

### map: Transform elements

```freelang
// Type: array<T>.map(fn(T) -> U) -> array<U>

let numbers = [1, 2, 3]
let doubled = numbers.map(fn(x) -> x * 2)
// Result: [2, 4, 6]

let strings = numbers.map(fn(x: number) -> x.toString())
// Result: ["1", "2", "3"]
```

### filter: Select elements

```freelang
// Type: array<T>.filter(fn(T) -> bool) -> array<T>

let numbers = [1, 2, 3, 4, 5]
let even = numbers.filter(fn(x) -> x % 2 == 0)
// Result: [2, 4]
```

### reduce: Aggregate

```freelang
// Type: array<T>.reduce(fn(U, T) -> U, U) -> U

let numbers = [1, 2, 3, 4, 5]
let sum = numbers.reduce(fn(acc, x) -> acc + x, 0)
// Result: 15

let product = numbers.reduce(fn(p, x) -> p * x, 1)
// Result: 120
```

### find: First match

```freelang
// Type: array<T>.find(fn(T) -> bool) -> T

let users = [{id: 1, name: "A"}, {id: 2, name: "B"}]
let user = users.find(fn(u) -> u.id == 2)
// Result: {id: 2, name: "B"}
```

### any/all: Test conditions

```freelang
// Type: array<T>.any(fn(T) -> bool) -> bool
let numbers = [1, 2, 3]
let hasEven = numbers.any(fn(x) -> x % 2 == 0)
// Result: true

// Type: array<T>.all(fn(T) -> bool) -> bool
let allPositive = numbers.all(fn(x) -> x > 0)
// Result: true
```

---

## Method Chaining with Lambdas

### Basic Pipeline

```freelang
let result = [1, 2, 3, 4, 5]
  .filter(fn(x) -> x > 1)              // array<number>
  .map(fn(x) -> x * 2)                 // array<number>
  .reduce(fn(sum, x) -> sum + x, 0)    // number
// Result: 28
```

### Complex Pipeline

```freelang
let threshold = 2
let multiplier = 3

let result = numbers
  .filter(fn(x) -> x >= threshold)
  .map(fn(x) -> x * multiplier)
  .filter(fn(x) -> x < 20)
  .reduce(fn(sum, x) -> sum + x, 0)
```

### With Data Objects

```freelang
let users = [
  {id: 1, age: 25, active: true},
  {id: 2, age: 17, active: false},
  {id: 3, age: 30, active: true}
]

let activeAdults = users
  .filter(fn(u) -> u.active)
  .filter(fn(u) -> u.age >= 18)
  .map(fn(u) -> u.id)
// Result: [1, 3]
```

---

## Closure Context Management

### Scope Resolution

```freelang
let global = 100

let outer = fn(x) -> {
  let outer_var = 50

  let inner = fn(y) -> {
    // Can access: x, outer_var, global
    return x + outer_var + global
  }

  return inner
}

let result = outer(10)(20)  // 10 + 50 + 100 = 160
```

### Variable Shadowing

```freelang
let x = 10

let shadowed = fn(x) -> x + 1  // Parameter shadows outer x
shadowed(5)  // 6 (uses parameter x, not outer x)
```

---

## Type Checking API

### Validation Methods

```typescript
// Validate entire lambda
const result = checker.validateLambda(lambda, context);
// Returns: LambdaExpressionResult

// Create function type
const fnType = checker.createFunctionType(['number', 'string'], 'bool');
// Returns: "fn(number, string) -> bool"

// Infer parameter types
const paramTypes = checker.inferLambdaParameterTypes(
  lambda,
  expectedType,
  context
);
// Returns: string[] of parameter types

// Collect captured variables
const captured = checker.collectClosureVariables(
  body,
  context,
  paramNames
);
// Returns: string[] of captured variable names
```

### Result Structure

```typescript
interface LambdaExpressionResult {
  compatible: boolean;           // Type check passed?
  functionType?: string;         // "fn(T) -> U"
  paramTypes?: string[];         // Inferred param types
  returnType?: string;           // Inferred return type
  capturedVars?: string[];       // Captured from scope
  error?: TypeCheckResult;       // Error if incompatible
}
```

---

## Common Patterns

### Map & Transform

```freelang
let numbers = [1, 2, 3]

// Double each
let doubled = numbers.map(fn(x) -> x * 2)

// Convert to string
let strings = numbers.map(fn(x) -> x.toString())

// Complex transformation
let transformed = numbers.map(fn(x) -> {
  if x > 1 then x * 2 else x
})
```

### Filter & Select

```freelang
let numbers = [1, 2, 3, 4, 5]

// Simple condition
let even = numbers.filter(fn(x) -> x % 2 == 0)

// Compound condition
let range = numbers.filter(fn(x) -> x > 1 && x < 5)

// Closure-based filter
let min = 2
let filtered = numbers.filter(fn(x) -> x >= min)
```

### Reduce & Aggregate

```freelang
let numbers = [1, 2, 3, 4, 5]

// Sum
let sum = numbers.reduce(fn(acc, x) -> acc + x, 0)

// Product
let product = numbers.reduce(fn(acc, x) -> acc * x, 1)

// Collect into string
let joined = numbers.reduce(fn(s, x) -> s + x.toString(), "")

// Object aggregation
let groups = items.reduce(fn(acc, item) -> {
  acc[item.type] = (acc[item.type] || 0) + 1
  return acc
}, {})
```

### Curried Functions

```freelang
// Curry: break multi-arg function into chained single-arg functions
let add = fn(a) -> fn(b) -> a + b

let add5 = add(5)
let result = add5(10)  // 15

// Generic curry factory
let curry2 = fn(f) -> fn(a) -> fn(b) -> f(a, b)

let multiply = curry2(fn(x, y) -> x * y)
let double = multiply(2)
let result = double(5)  // 10
```

### Callback & Event Handler

```freelang
let state = 0

let handle_click = fn(event) -> {
  state = state + 1
  return state
}

// Lambda as callback
let handler = fn(e) -> {
  state = state + 10
  return state
}
```

---

## Error Messages & Debugging

### Type Mismatch

```
Error: Lambda parameter type mismatch
Expected: fn(number) -> bool
Got: fn(string) -> bool
```

### Missing Parameter Type

```
Error: Cannot infer parameter type
Parameter: 'x'
Context: No type annotation, usage not clear
Suggestion: Add explicit type annotation
```

### Undefined Variable in Closure

```
Error: Variable 'undefined_var' not in scope
Location: Lambda body
Suggestion: Ensure variable is defined in outer scope
```

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| **Lambda parsing** | O(n) | Linear scan of parameters |
| **Type inference** | O(n) | Walk expression tree |
| **Closure detection** | O(n) | Walk for identifiers |
| **Type checking** | O(n) | Unification algorithm |
| **Code generation** | O(n) | Generate IR instructions |

---

## Files Reference

**Parser**: `src/parser/parser.ts`
- `parseLambda()` - Parse fn(params) -> body syntax
- `parseType()` - Parse type annotations

**Type Checker**: `src/analyzer/type-checker.ts`
- `validateLambda()` - Validate entire lambda
- `inferLambdaParameterTypes()` - Infer param types
- `collectClosureVariables()` - Find captured vars
- `validateExpression()` - Type check expressions
- `createFunctionType()` - Build function type string

**Code Generator**: `src/codegen/ir-generator.ts`
- `generateLambdaIR()` - Generate IR for lambdas

**Opcodes**: `src/types.ts`
- `Op.LAMBDA_NEW` - Create lambda object
- `Op.LAMBDA_CAPTURE` - Capture variable
- `Op.LAMBDA_SET_BODY` - Set lambda body

**Tests**: `test/phase-3-function-types.test.ts`
- 35+ comprehensive tests
- All lambda features covered
- Real-world scenarios

---

## Next Steps

**Phase 3 Step 4** adds:
- Module system with function exports
- Import function types from other files
- First-class function passing between modules
- Functional programming patterns across files

Lambdas enable:
- Higher-order functions in modules
- Callback-based APIs
- Functional composition patterns
- DSL implementation

---

**Last Updated**: 2025-02-18
**Status**: Phase 3 Step 3 Complete
