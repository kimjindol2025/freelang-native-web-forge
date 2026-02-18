# Virtual Machine API

## Overview

The Virtual Machine is a stack-based interpreter that executes Intermediate Representation (IR) bytecode. It provides type-safe execution, runtime validation, performance monitoring, and support for user-defined functions and iterators.

**Version**: v2.0.0
**Module**: `src/vm.ts`, `src/vm/`
**Key Features**:
- Stack-based bytecode execution
- Type-safe runtime validation (Phase 21)
- User-defined function support (Phase 19)
- Iterator support for lazy evaluation
- Performance profiling (cycles, milliseconds)
- Type warnings and error reporting

---

## Architecture

```
IR Instructions
      ↓
┌─────────────────────┐
│   VM.run()          │
├─────────────────────┤
│ Stack:  [value]     │
│ Vars:   {x: 5}      │
│ PC:     0           │
└─────────────────────┘
      ↓
┌─────────────────────┐
│   exec(inst)        │
│   ├─ PUSH/POP       │
│   ├─ Arithmetic     │
│   ├─ Array ops      │
│   ├─ Control flow   │
│   └─ Callbacks      │
└─────────────────────┘
      ↓
   VMResult
```

---

## Main Class

### VM

Stack-based bytecode interpreter.

#### Constructor

```typescript
constructor(functionRegistry?: FunctionRegistry)
```

**Parameters**:
- `functionRegistry` (FunctionRegistry, optional): User-defined functions

#### Methods

##### `run(program: Inst[]): VMResult`

Executes an IR program and returns the result.

**Parameters**:
- `program` (Inst[]): Array of IR instructions to execute

**Returns**: `VMResult` - Execution result with value, cycles, and timing

**Features**:
- Stack-based execution
- Cycle limit: 100,000 (prevents infinite loops)
- Stack limit: 10,000 values
- Performance tracking
- Type safety (Phase 21)

**Example**:
```typescript
import { VM } from './vm';

// IR: 5 + 3
const program = [
  { op: Op.PUSH, arg: 5 },
  { op: Op.PUSH, arg: 3 },
  { op: Op.ADD },
  { op: Op.HALT }
];

const vm = new VM();
const result = vm.run(program);

console.log(result);
// Output: {
//   ok: true,
//   value: 8,
//   cycles: 4,
//   ms: 0.5
// }
```

---

##### `getTypeWarnings(): TypeWarning[]`

Returns all type warnings from execution.

**Returns**: `TypeWarning[]` - Type compatibility issues

**Example**:
```typescript
const warnings = vm.getTypeWarnings();
warnings.forEach(w => {
  console.log(`${w.functionName}: ${w.message}`);
  console.log(`  Expected: ${w.expectedType}, Got: ${w.receivedType}`);
});
```

---

##### `clearTypeWarnings(): void`

Clears accumulated type warnings.

---

##### `getWarningCount(): number`

Returns count of type warnings.

---

## Interfaces

### VMResult

Result of program execution.

```typescript
interface VMResult {
  ok: boolean;              // Execution successful?
  value?: unknown;          // Return value (top of stack)
  error?: VMError;          // Error details if failed
  cycles: number;           // Instructions executed
  ms: number;              // Execution time (milliseconds)
}
```

**Success Case**:
```typescript
{
  ok: true,
  value: 42,
  cycles: 15,
  ms: 1.2
}
```

**Failure Case**:
```typescript
{
  ok: false,
  error: {
    code: 1,
    op: Op.DIV,
    pc: 5,
    stack_depth: 2,
    detail: "Division by zero"
  },
  cycles: 5,
  ms: 0.8
}
```

---

### VMError

Error information from failed execution.

```typescript
interface VMError {
  code: number;             // Error code
  op: Op;                   // Operation that failed
  pc: number;               // Program counter at error
  stack_depth: number;      // Stack depth at error
  detail: string;           // Error description
}
```

**Error Codes**:

| Code | Meaning | Example |
|------|---------|---------|
| 1 | Cycle limit exceeded | Infinite loop detected |
| 2 | Stack underflow | Pop on empty stack |
| 3 | Stack overflow | Too many values |
| 4 | Illegal operation | Invalid opcode |
| 5 | Type error | Wrong type for operation |
| 99 | Runtime error | Uncaught exception |

---

### TypeWarning

Type safety warning during execution.

```typescript
interface TypeWarning {
  functionName: string;     // Function where warning occurred
  message: string;          // Warning message
  timestamp: Date;          // When it occurred
  paramName?: string;       // Parameter name (if applicable)
  expectedType?: string;    // Expected type
  receivedType?: string;    // Actual type
}
```

---

### LocalScope

Variable scope for function execution.

```typescript
interface LocalScope {
  variables: Map<string, any>;   // Local variables
  parentScope?: LocalScope;      // Outer scope
}
```

---

## Supported Instructions

The VM supports the following IR operations:

### Stack Operations

| Op | Effect | Example |
|----|----|---------|
| `PUSH` | Push value to stack | `PUSH 42` |
| `POP` | Discard top value | `POP` |
| `DUP` | Duplicate top value | `DUP` |
| `SWAP` | Swap top two values | `SWAP` |

### Arithmetic

| Op | Stack | Example |
|----|-------|---------|
| `ADD` | [a, b] → [a+b] | `ADD` |
| `SUB` | [a, b] → [a-b] | `SUB` |
| `MUL` | [a, b] → [a*b] | `MUL` |
| `DIV` | [a, b] → [a/b] | `DIV` |
| `MOD` | [a, b] → [a%b] | `MOD` |
| `NEG` | [a] → [-a] | `NEG` |

### Comparison

| Op | Stack | Result |
|----|-------|--------|
| `EQ` | [a, b] → [bool] | a == b |
| `NEQ` | [a, b] → [bool] | a != b |
| `LT` | [a, b] → [bool] | a < b |
| `GT` | [a, b] → [bool] | a > b |
| `LTE` | [a, b] → [bool] | a <= b |
| `GTE` | [a, b] → [bool] | a >= b |

### Logic

| Op | Stack | Example |
|----|-------|---------|
| `AND` | [a, b] → [bool] | `AND` |
| `OR` | [a, b] → [bool] | `OR` |
| `NOT` | [a] → [bool] | `NOT` |

### Array Operations

| Op | Effect | Example |
|----|--------|---------|
| `ARR_NEW` | Create array | `ARR_NEW` |
| `ARR_PUSH` | Add element | `ARR_PUSH` |
| `ARR_GET` | Get element | `ARR_GET` |
| `ARR_SET` | Set element | `ARR_SET` |
| `ARR_LEN` | Get length | `ARR_LEN` |
| `ARR_SUM` | Sum elements | `ARR_SUM` |
| `ARR_MAP` | Map function | `ARR_MAP` (with sub-program) |
| `ARR_FILTER` | Filter elements | `ARR_FILTER` (with sub-program) |
| `ARR_SORT` | Sort array | `ARR_SORT` |

### String Operations

| Op | Effect | Example |
|----|--------|---------|
| `STR_NEW` | Create string | `STR_NEW "hello"` |
| `STR_LEN` | Get length | `STR_LEN` |
| `STR_AT` | Get character | `STR_AT` |
| `STR_SUB` | Get substring | `STR_SUB` |
| `STR_CONCAT` | Concatenate | `STR_CONCAT` |

### Control Flow

| Op | Effect | Example |
|----|--------|---------|
| `JMP` | Jump to PC | `JMP 10` |
| `JMP_IF` | Jump if true | `JMP_IF 10` |
| `JMP_NOT` | Jump if false | `JMP_NOT 10` |
| `CALL` | Call function | `CALL "add"` |
| `RET` | Return | `RET` |
| `HALT` | Stop execution | `HALT` |

### Variables

| Op | Effect | Example |
|----|--------|---------|
| `LOAD` | Load variable | `LOAD "x"` |
| `STORE` | Store variable | `STORE "x"` |

---

## Usage Examples

### Simple Arithmetic

```typescript
import { VM } from './vm';
import { Op } from './types';

const vm = new VM();

// Calculate: (2 + 3) * 4 = 20
const program = [
  { op: Op.PUSH, arg: 2 },
  { op: Op.PUSH, arg: 3 },
  { op: Op.ADD },
  { op: Op.PUSH, arg: 4 },
  { op: Op.MUL },
  { op: Op.HALT }
];

const result = vm.run(program);
console.log(`Result: ${result.value}`);    // 20
console.log(`Cycles: ${result.cycles}`);   // 6
console.log(`Time: ${result.ms}ms`);       // ~0.5ms
```

---

### Array Operations

```typescript
// Create array [1, 2, 3] and sum it
const program = [
  { op: Op.ARR_NEW },
  { op: Op.PUSH, arg: 1 },
  { op: Op.ARR_PUSH },
  { op: Op.PUSH, arg: 2 },
  { op: Op.ARR_PUSH },
  { op: Op.PUSH, arg: 3 },
  { op: Op.ARR_PUSH },
  { op: Op.ARR_SUM },    // Result: 6
  { op: Op.HALT }
];

const result = vm.run(program);
console.log(`Sum: ${result.value}`); // 6
```

---

### Variable Storage and Retrieval

```typescript
// x = 10; y = x + 5; result = y
const program = [
  { op: Op.PUSH, arg: 10 },
  { op: Op.STORE, arg: 'x' },
  { op: Op.LOAD, arg: 'x' },
  { op: Op.PUSH, arg: 5 },
  { op: Op.ADD },
  { op: Op.STORE, arg: 'y' },
  { op: Op.LOAD, arg: 'y' },
  { op: Op.HALT }
];

const result = vm.run(program);
console.log(`Result: ${result.value}`); // 15
```

---

### Error Handling

```typescript
// Division by zero
const program = [
  { op: Op.PUSH, arg: 10 },
  { op: Op.PUSH, arg: 0 },
  { op: Op.DIV },  // Error!
  { op: Op.HALT }
];

const result = vm.run(program);
if (!result.ok) {
  console.error(`Error: ${result.error?.detail}`);
  console.error(`At operation: ${result.error?.op}`);
  console.error(`Stack depth: ${result.error?.stack_depth}`);
}
```

---

### Type Safety (Phase 21)

```typescript
const vm = new VM();
const result = vm.run(program);

// Check for type warnings
const warnings = vm.getTypeWarnings();
if (warnings.length > 0) {
  console.warn(`${warnings.length} type warnings:`);
  warnings.forEach(w => {
    console.warn(`  ${w.functionName}: ${w.message}`);
    console.warn(`    Expected: ${w.expectedType}`);
    console.warn(`    Got: ${w.receivedType}`);
  });
}
```

---

## Performance Characteristics

| Operation | Cycles | Time | Notes |
|-----------|--------|------|-------|
| PUSH | 1 | <0.1ms | Constant |
| ADD | 1 | <0.1ms | Constant |
| ARR_PUSH | 1 | <0.1ms | Amortized O(1) |
| ARR_GET | 1 | <0.1ms | O(1) |
| ARR_SUM | n | <1ms | O(n) |
| ARR_SORT | n log n | <5ms | O(n log n) |

---

## Limits and Constraints

| Limit | Value | Purpose |
|-------|-------|---------|
| Max Cycles | 100,000 | Prevent infinite loops |
| Max Stack Size | 10,000 | Prevent stack overflow |
| Stack Value Size | Unlimited | Depends on available memory |

---

## Best Practices

1. **Always check result.ok**: Verify execution succeeded
2. **Monitor cycles**: Watch for inefficient programs
3. **Check type warnings**: Fix type mismatches
4. **Limit stack depth**: Use variables for complex expressions
5. **Profile with metrics**: Use cycles and ms for optimization

---

## Related Documentation

- [Code Generator](./code-generator.md) - IR generation
- [Optimizer](./optimizer.md) - IR optimization
- [Compiler Pipeline](../COMPILER-PIPELINE.md) - Full flow

---

**Last Updated**: 2026-02-18
**Status**: Production Ready (Phase 21+)
**Test Coverage**: 1,942+ tests passing ✅
