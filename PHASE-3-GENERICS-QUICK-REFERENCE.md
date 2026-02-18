# Phase 3: Generics Quick Reference

**Quick lookup for generic type system features**

---

## Type Variables

### Definition
Single uppercase letter, optionally followed by digits.

```typescript
Valid:   T, U, K, V, A, B, T1, U2, Param1, Result5
Invalid: t (lowercase), 1T (starts with digit), param (multiple chars without digits)
```

### Pattern
```regex
/^[A-Z]\d*$/
```

---

## Generic Types

### Array Type
```typescript
array<T>           // Generic array
array<number>      // Concrete array type
array<array<T>>    // Nested generic
```

### Map/Dictionary Type
```typescript
map<K, V>                    // Generic map
map<string, number>          // Concrete map
map<string, array<number>>   // Complex types
```

### Other Generic Types
```typescript
pair<T, U>        // Tuple/pair
list<T>           // Linked list
set<T>            // Set
dict<K, V>        // Dictionary
```

---

## Generic Functions

### Syntax
```typescript
fn<TypeVars>(params) -> ReturnType
```

### Examples

**Identity function** (simplest)
```typescript
fn<T>(T) -> T
```

**Map transformation** (common)
```typescript
fn<T, U>(array<T>, fn(T) -> U) -> array<U>
```

**Filter predicate** (selection)
```typescript
fn<T>(array<T>, fn(T) -> bool) -> array<T>
```

**Reduce/fold** (aggregation)
```typescript
fn<T, U>(array<T>, fn(U, T) -> U, U) -> U
```

---

## Type Parser API

### Check if Type Variable
```typescript
TypeParser.isTypeVariable('T')        // true
TypeParser.isTypeVariable('number')   // false
```

### Parse Generic Type
```typescript
const generic = TypeParser.parseGenericType('array<T>');
// Returns: { base: 'array', parameters: ['T'] }

const map = TypeParser.parseGenericType('map<K, V>');
// Returns: { base: 'map', parameters: ['K', 'V'] }
```

### Parse Function Type
```typescript
const fn = TypeParser.parseFunctionType('fn<T>(T) -> T');
// Returns: {
//   typeVars: ['T'],
//   paramTypes: ['T'],
//   returnType: 'T'
// }

const map = TypeParser.parseFunctionType('fn<T, U>(array<T>, fn(T) -> U) -> array<U>');
// Returns: {
//   typeVars: ['T', 'U'],
//   paramTypes: ['array<T>', 'fn(T) -> U'],
//   returnType: 'array<U>'
// }
```

### Substitute Type Variables
```typescript
TypeParser.substituteType('array<T>', { T: 'number' });
// Returns: 'array<number>'

TypeParser.substituteType('pair<T, U>', { T: 'string', U: 'bool' });
// Returns: 'pair<string, bool>'

TypeParser.substituteType('fn(T) -> U', { T: 'number', U: 'string' });
// Returns: 'fn(number) -> string'
```

### Unify Types
```typescript
// Simple unification
TypeParser.unifyTypes('array<T>', 'array<number>');
// Returns: { T: 'number' }

// Multiple variables
TypeParser.unifyTypes('map<K, V>', 'map<string, number>');
// Returns: { K: 'string', V: 'number' }

// With existing constraints
TypeParser.unifyTypes('array<T>', 'array<U>', { U: 'number' });
// Returns: { U: 'number', T: 'number' }

// Incompatible types
TypeParser.unifyTypes('number', 'string');
// Returns: null (failure)
```

### Validate Type
```typescript
TypeParser.isValidType('T')                 // true (type variable)
TypeParser.isValidType('number')            // true (basic type)
TypeParser.isValidType('array<T>')          // true (generic)
TypeParser.isValidType('unknown')           // false
TypeParser.isValidType('array<unknown>')    // false
```

### Check Type Compatibility
```typescript
TypeParser.areTypesCompatible('T', 'number')           // true (variable)
TypeParser.areTypesCompatible('array<T>', 'array<number>')  // true
TypeParser.areTypesCompatible('number', 'string')      // false
TypeParser.areTypesCompatible('any', 'number')         // true (any matches)
```

---

## Type Checker API

### Validate Generic Type
```typescript
const checker = new FunctionTypeChecker();

const result = checker.validateGenericType('array<T>');
// result.compatible: true
// result.message: "Generic type 'array<T>' is valid"

const bad = checker.validateGenericType('array<unknown>');
// bad.compatible: false
// bad.message: "Invalid type parameter: 'unknown'..."
```

### Validate Generic Function
```typescript
const result = checker.validateGenericFunction('identity', 'fn<T>(T) -> T');
// result.compatible: true

const result2 = checker.validateGenericFunction('bad', 'fn<T>(invalid) -> T');
// result2.compatible: false
```

### Get Type Variables
```typescript
const vars = checker.getTypeVariablesFromFunction('fn<T, U>(T) -> U');
// Returns: ['T', 'U']

const single = checker.getTypeVariablesFromFunction('fn<T>(T) -> T');
// Returns: ['T']
```

### Check Generic Function Call
```typescript
const mapFunc: GenericFunctionType = {
  typeVars: ['T', 'U'],
  params: { 'array': 'array<T>', 'fn': 'fn(T) -> U' },
  returnType: 'array<U>'
};

const result = checker.checkGenericFunctionCall(
  'map',
  mapFunc,
  ['array<number>', 'fn(number) -> string'],
  ['array', 'fn']
);

// result.result.compatible: true
// result.substitution: { T: 'number', U: 'string' }
```

### Apply Type Substitution
```typescript
const result = checker.substituteTypeVariables(
  'array<U>',
  { U: 'number' }
);
// Returns: 'array<number>'
```

### Unify Generic Types
```typescript
const sub = checker.unifyGenericTypes('array<T>', 'array<number>');
// Returns: { T: 'number' }
```

### Infer Return Type
```typescript
const returnType = checker.inferGenericReturnType(
  'fn<T, U>(array<T>, fn(T) -> U) -> array<U>',
  { T: 'number', U: 'string' }
);
// Returns: 'array<string>'
```

---

## Type Checking Workflow

### Step 1: Parse Function Signature
```typescript
const funcType = 'fn<T, U>(array<T>, fn(T) -> U) -> array<U>';
const parsed = TypeParser.parseFunctionType(funcType);
// typeVars: ['T', 'U']
// paramTypes: ['array<T>', 'fn(T) -> U']
// returnType: 'array<U>'
```

### Step 2: Check Function Call
```typescript
const result = checker.checkGenericFunctionCall(
  'map',
  { typeVars: parsed.typeVars, params: {...}, returnType: parsed.returnType },
  ['array<number>', 'fn(number) -> string'],
  ['array', 'fn']
);
// Returns: { result, substitution: {T: 'number', U: 'string'} }
```

### Step 3: Verify Compatibility
```typescript
if (result.result.compatible) {
  // Type check passed!

  // Get inferred return type
  const returnType = checker.inferGenericReturnType(
    funcType,
    result.substitution!
  );
  // Returns: 'array<string>'
}
```

---

## Common Patterns

### Identity Function
```
Pattern: fn<T>(T) -> T
Usage: Pass through unchanged
Returns same type as input
```

### Map/Transform
```
Pattern: fn<T, U>(array<T>, fn(T) -> U) -> array<U>
Usage: Transform each element
Input type T → Output type U
```

### Filter/Select
```
Pattern: fn<T>(array<T>, fn(T) -> bool) -> array<T>
Usage: Keep/discard elements
Returns same type as input
```

### Reduce/Fold
```
Pattern: fn<T, U>(array<T>, fn(U, T) -> U, U) -> U
Usage: Combine to single value
Accumulator type U, Element type T
```

### Pair/Tuple
```
Pattern: pair<T, U>
Usage: Two values of different types
Common in reduce (accumulator, element)
```

---

## Error Cases

### Type Mismatch
```typescript
// Function expects array<T>, provided string
checkGenericFunctionCall('map', mapFunc, ['string', 'fn'], ...)
// Error: "Cannot unify string with array<T>"
```

### Invalid Type Parameter
```typescript
validateGenericType('array<unknown>')
// Error: "Invalid type parameter: 'unknown'..."
```

### Parameter Count
```typescript
checkGenericFunctionCall('map', mapFunc, ['array<number>'], [...])
// Error: "expects 2 arguments, got 1"
```

### Occurs Check
```typescript
unifyTypes('T', 'array<T>')
// Returns: null (T cannot occur in its own constraint)
```

---

## Testing Checklist

When testing generic types:

- [ ] Type variable detection (T, U, etc.)
- [ ] Generic type parsing (array<T>, map<K,V>)
- [ ] Function type parsing (fn<T>(T)->U)
- [ ] Type substitution (variables replaced)
- [ ] Type unification (constraints solved)
- [ ] Compatibility checking (types match)
- [ ] Function call validation (args match)
- [ ] Return type inference (correct result)
- [ ] Error cases (mismatches detected)
- [ ] Real-world scenarios (map/filter/reduce)

---

## Examples

### Simple Array Map
```typescript
// Function type
fn<T, U>(array<T>, fn(T) -> U) -> array<U>

// Call
array<number>.map(fn(x) -> x.toString())

// Type variables
T = number, U = string

// Return
array<string>
```

### Chained Operations
```typescript
// Filter
array<number>
  .filter(fn(x) -> x > 0)
  → array<number> (T stays same)

// Map
  .map(fn(x) -> x.toString())
  → array<string> (T becomes string)

// Reduce
  .reduce(fn(acc, s) -> acc + s.length, 0)
  → number (U is number)
```

### Higher-Order Functions
```typescript
// Create adder
fn<T>(T) -> fn(T) -> T

// Call with 5
→ fn(number) -> number

// Call with "hello"
→ fn(string) -> string
```

---

## Files Reference

**Type Parser**: `src/cli/type-parser.ts`
- parseGenericType()
- parseFunctionType()
- substituteType()
- unifyTypes()
- isTypeVariable()
- isValidType()
- areTypesCompatible()

**Type Checker**: `src/analyzer/type-checker.ts`
- validateGenericType()
- validateGenericFunction()
- checkGenericFunctionCall()
- substituteTypeVariables()
- unifyGenericTypes()
- getTypeVariablesFromFunction()
- inferGenericReturnType()

**Tests**:
- `test/phase-3-generics.test.ts` (13 tests)
- `test/phase-3-type-checker.test.ts` (15 tests)

---

**Last Updated**: 2025-02-18
**Status**: Phase 3 Step 1 Complete

