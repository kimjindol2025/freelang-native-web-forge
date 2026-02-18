# Phase 3 Step 2: Array Methods - Quick Reference

**Quick lookup for array method signatures, usage, and type checking**

---

## Method Overview

| Method | Purpose | Type Signature | Returns |
|--------|---------|---|---------|
| **map** | Transform elements | `fn<T, U>(array<T>, fn(T)->U)->array<U>` | `array<U>` |
| **filter** | Select matching | `fn<T>(array<T>, fn(T)->bool)->array<T>` | `array<T>` |
| **reduce** | Aggregate to value | `fn<T,U>(array<T>, fn(U,T)->U, U)->U` | `U` |
| **find** | Get first match | `fn<T>(array<T>, fn(T)->bool)->T` | `T` |
| **any** | Check any match | `fn<T>(array<T>, fn(T)->bool)->bool` | `bool` |
| **all** | Check all match | `fn<T>(array<T>, fn(T)->bool)->bool` | `bool` |
| **forEach** | Side effects | `fn<T>(array<T>, fn(T)->void)->void` | `void` |
| **flatten** | Merge nested | `fn<T>(array<array<T>>)->array<T>` | `array<T>` |
| **concat** | Join arrays | `fn<T>(array<T>, array<T>)->array<T>` | `array<T>` |
| **sort** | Custom sort | `fn<T>(array<T>, fn(T,T)->number)->array<T>` | `array<T>` |

---

## Detailed Signatures

### Transform Methods

#### map: Transform each element
```typescript
fn<T, U>(array<T>, fn(T) -> U) -> array<U>

// Type variables:
T = input element type
U = output element type

// Example:
array<number>.map(fn(x: number) -> string) → array<string>

// Usage:
let doubled = [1, 2, 3].map(fn(x) -> x * 2)
let strings = [1, 2, 3].map(fn(x) -> x.toString())
```

#### reduce: Fold/aggregate
```typescript
fn<T, U>(array<T>, fn(U, T) -> U, U) -> U

// Type variables:
T = element type
U = accumulator type

// Function signature:
fn(accumulator: U, element: T) -> U

// Example:
array<number>.reduce(fn(sum, n) -> sum + n, 0) → number

// Usage:
let sum = [1, 2, 3].reduce(fn(s, n) -> s + n, 0)  // 6
let product = [1, 2, 3].reduce(fn(p, n) -> p * n, 1)  // 6
let joined = ["a", "b"].reduce(fn(s, x) -> s + x, "")  // "ab"
```

### Filter Methods

#### filter: Select matching elements
```typescript
fn<T>(array<T>, fn(T) -> bool) -> array<T>

// Type: Element type preserved

// Example:
array<number>.filter(fn(x) -> x > 0) → array<number>

// Usage:
let positive = [1, -2, 3, -4].filter(fn(x) -> x > 0)
// Result: [1, 3]

let adults = users.filter(fn(u) -> u.age >= 18)
// Element type unchanged
```

#### find: Get first matching element
```typescript
fn<T>(array<T>, fn(T) -> bool) -> T

// Type: Returns single element

// Example:
array<number>.find(fn(x) -> x > 10) → number

// Usage:
let found = [1, 5, 10].find(fn(x) -> x > 7)
// Result: 10

let user = users.find(fn(u) -> u.id == 5)
// Result: single user object (not array)
```

### Test Methods

#### any: Check if any element matches
```typescript
fn<T>(array<T>, fn(T) -> bool) -> bool

// Type: Always returns bool

// Example:
array<number>.any(fn(x) -> x > 10) → bool

// Usage:
let hasPositive = [1, -2, 3].any(fn(x) -> x > 0)  // true
let allOdd = [1, 2, 3].any(fn(x) -> x % 2 == 0)   // true (has even)
```

#### all: Check if all elements match
```typescript
fn<T>(array<T>, fn(T) -> bool) -> bool

// Type: Always returns bool

// Example:
array<number>.all(fn(x) -> x > 0) → bool

// Usage:
let allPositive = [1, 2, 3].all(fn(x) -> x > 0)  // true
let allOdd = [1, 3, 5].all(fn(x) -> x % 2 != 0)  // true
let allEven = [1, 2, 3].all(fn(x) -> x % 2 == 0) // false
```

### Side-Effect Method

#### forEach: Execute function on each element
```typescript
fn<T>(array<T>, fn(T) -> void) -> void

// Type: No return value

// Example:
array<number>.forEach(fn(x) -> println(x))

// Usage:
[1, 2, 3].forEach(fn(x) -> println(x))  // Prints: 1, 2, 3
```

### Combination Methods

#### concat: Merge two arrays
```typescript
fn<T>(array<T>, array<T>) -> array<T>

// Type: Both arrays must have same element type

// Example:
array<number>.concat(array<number>) → array<number>

// Usage:
let combined = [1, 2].concat([3, 4])
// Result: [1, 2, 3, 4]

let merged = [1, 2].concat([3, 4])  // Type safe ✅
// let bad = [1, 2].concat(["a", "b"])  // Error ❌
```

#### flatten: Merge nested arrays
```typescript
fn<T>(array<array<T>>) -> array<T>

// Type: Removes one level of nesting

// Example:
array<array<number>>.flatten() → array<number>

// Usage:
let flat = [[1, 2], [3, 4]].flatten()
// Result: [1, 2, 3, 4]

let nested = [["a"], ["b", "c"]].flatten()
// Result: ["a", "b", "c"]

let deepFlat = [[[1]], [[2]]].flatten()
// Result: [[1], [2]] (still nested one level)
```

### Sort Method

#### sort: Custom comparator sort
```typescript
fn<T>(array<T>, fn(T, T) -> number) -> array<T>

// Type: Array type preserved

// Comparator function:
fn(a, b) -> number
- Returns < 0 if a < b (comes first)
- Returns 0 if a == b
- Returns > 0 if a > b (comes last)

// Example:
array<number>.sort(fn(a, b) -> a - b) → array<number>

// Usage:
let sorted = [3, 1, 4, 1, 5].sort(fn(a, b) -> a - b)
// Result: [1, 1, 3, 4, 5]

let descending = [3, 1, 4].sort(fn(a, b) -> b - a)
// Result: [4, 3, 1]

let byLength = ["abc", "a", "ab"].sort(fn(a, b) -> a.length - b.length)
// Result: ["a", "ab", "abc"]
```

---

## Type Checking API

### Checker Methods

```typescript
// Get method signature
const sig = checker.getArrayMethodSignature('map');
// Returns: GenericFunctionType with typeVars, params, returnType

// Check array method call
const result = checker.checkArrayMethodCall(
  'map',
  'array<number>',
  ['fn(number) -> string']
);
// Returns: { compatible: true, resultType: 'array<string>' }

// Validate method chain
const chainResult = checker.validateMethodChain(
  'array<number>',
  [
    { method: 'filter', argTypes: ['fn(number) -> bool'] },
    { method: 'map', argTypes: ['fn(number) -> string'] }
  ]
);
// Returns: { type: 'array<string>', compatible: true }

// Check array type
const isArray = checker.isArrayType('array<number>');  // true
const isArray2 = checker.isArrayType('string');        // false

// Get element type
const elemType = checker.getArrayElementType('array<number>');  // 'number'

// Create array type
const arrType = checker.createArrayType('string');  // 'array<string>'
```

---

## Common Patterns

### Data Pipeline
```freelang
let result = data
  .filter(fn(x) -> x.valid)        // Filter invalid
  .map(fn(x) -> x.value * 2)       // Transform
  .reduce(fn(sum, v) -> sum + v, 0) // Aggregate
// Type: array → array → array → number
```

### Find and Use
```freelang
let target = items.find(fn(x) -> x.id == searchId)
if target {
  // Found!
  println(target.name)
}
```

### Validation
```freelang
let allValid = items.all(fn(x) -> x.check())
let hasAny = items.any(fn(x) -> x.error)
```

### Transformation Chain
```freelang
let processed = users
  .map(fn(u) -> u.email)           // array<string>
  .filter(fn(e) -> e.length > 0)   // array<string>
  .concat(defaultEmails)            // array<string>
  .sort(fn(a, b) -> a < b ? -1 : 1) // array<string>
```

### Object Processing
```freelang
let names = users.map(fn(u) -> u.name)
let adults = users.filter(fn(u) -> u.age >= 18)
let total = orders.reduce(fn(sum, o) -> sum + o.total, 0)
let found = products.find(fn(p) -> p.sku == "ABC123")
```

---

## Type Inference Examples

### Example 1: map with multiple steps
```
Input array: array<number>
Function: fn(number) -> string
Method signature: fn<T, U>(array<T>, fn(T)->U)->array<U>

Unification:
  array<number> ← array<T>  ∴ T = number
  fn(number) -> string ← fn(T)->U  ∴ U = string

Result type: array<U> = array<string> ✅
```

### Example 2: reduce with accumulator
```
Input array: array<number>
Function: fn(number, number) -> number
Init value: 0 (type: number)
Method signature: fn<T,U>(array<T>, fn(U,T)->U, U)->U

Unification:
  array<number> ← array<T>  ∴ T = number
  fn(number, number)->number ← fn(U,T)->U  ∴ U = number
  number (init) matches U  ✅

Result type: U = number ✅
```

### Example 3: filter chain
```
Input: array<number>
First filter: fn(number) -> bool
  Result: array<number> (preserves)

Second operation: map(fn(number) -> string)
  Result: array<string>

Type progression: array<number> → array<number> → array<string> ✅
```

---

## Error Cases

### Type Mismatch
```
array<number>.map(fn(string) -> number)
Error: Cannot unify number with string
```

### Wrong Function Return
```
array<number>.filter(fn(x) -> x + 1)  // Returns number, not bool
Error: Cannot unify number with bool
```

### Element Type Mismatch
```
array<number>.concat(array<string>)  // Types don't match
Error: Cannot unify number with string
```

### Missing Argument
```
array<number>.map()  // Missing function argument
Error: Not enough arguments for map
```

### Wrong Accumulator Type
```
array<number>.reduce(fn(s, n) -> s + n, "")  // Init should be number
// May work with string type inference, but not type safe
```

---

## Testing Checklist

When testing array methods:

- [ ] Method applies to array<T>
- [ ] Function type matches (T input type)
- [ ] Return type correct for method
- [ ] Type variables unified correctly
- [ ] Chaining preserves types correctly
- [ ] Element type errors detected
- [ ] Function type errors detected
- [ ] Parameter count validation
- [ ] Real-world scenarios work
- [ ] Error messages clear

---

## Files Reference

**Type Checker**: `src/analyzer/type-checker.ts`
- getArrayMethodSignature()
- checkArrayMethodCall()
- isArrayType()
- getArrayElementType()
- createArrayType()
- validateMethodChain()

**Code Generator**: `src/codegen/ir-generator.ts`
- generateMethodCallIR() - All 10 methods

**Tests**: `test/phase-3-array-methods.test.ts`
- 16 comprehensive tests
- All methods covered
- Real-world scenarios
- Error cases

---

**Last Updated**: 2025-02-18
**Status**: Phase 3 Step 2 Complete

