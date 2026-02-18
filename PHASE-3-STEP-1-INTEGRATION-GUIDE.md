# Phase 3 Step 1: Integration with Parser & Code Generator

**How to use the new generic type system in Steps 2-3**

---

## Overview

Phase 3 Step 1 provides the **foundation** for generic type checking. Steps 2-3 will build on this to enable:

- Step 2: Array methods (map, filter, reduce, etc.)
- Step 3: Function types and closures

This guide shows how to integrate the generic system into the existing parser and code generator.

---

## Integration Points

### 1. Parser Integration (for Step 2/3)

The parser needs to recognize:

#### Generic Type Annotations
```freelang
let arr: array<number> = [1, 2, 3]
let fn: fn<T>(T) -> T = fn(x) -> x
```

**Required Parser Changes**:
- Extend type annotation regex to accept `<>`
- Current: `(\\w+|array<[^>]+>)`
- New: Use `TypeParser.isValidType()` to validate

**Implementation**:
```typescript
// In src/parser/parser.ts

import { TypeParser } from '../cli/type-parser';

// Modify type annotation parsing
const typeAnnotation = source.match(/:\s*(.+?)(?=[,\)\{])/);
if (typeAnnotation) {
  const typeStr = typeAnnotation[1].trim();
  if (TypeParser.isValidType(typeStr)) {
    // Accept this type
    paramType = typeStr;
  }
}
```

#### Method Calls (for Step 2)
```freelang
array.map(fn(x) -> x + 1)
array.filter(fn(x) -> x > 0)
array.reduce(fn(sum, x) -> sum + x, 0)
```

**Required Parser Changes**:
- Recognize method call syntax: `expr.methodName(args)`
- Create MethodCall AST node
- Pass context for type checking

**Implementation**:
```typescript
// Recognize method call pattern
if (source.includes('.') && !source.includes('..')) {
  // Parse: object.method(args)
  const methodMatch = source.match(/(\w+)\.(\w+)\((.*)\)/);
  if (methodMatch) {
    return {
      type: 'MethodCall',
      object: methodMatch[1],
      method: methodMatch[2],
      args: parseArgs(methodMatch[3])
    };
  }
}
```

#### Lambda Expressions (for Step 3)
```freelang
fn(x) -> x + 1
fn(x: number) -> x * 2
fn(x, y) -> x + y
```

Parser already supports these via `parseLambdaExpression()`. Type checker will enhance with generics.

---

### 2. Type Checker Integration (Steps 2-3)

#### For Array Methods (Step 2)

**Current structure**:
```typescript
// In src/analyzer/type-checker.ts
checkFunctionCall(funcName, argTypes, expectedParams, expectedParamNames)
```

**Enhancement for methods**:
```typescript
/**
 * Check array method call with generic types
 * Example: array<number>.map(fn(number) -> string)
 */
checkArrayMethodCall(
  method: string,              // 'map', 'filter', 'reduce'
  arrayType: string,           // 'array<number>'
  argTypes: string[],          // ['fn(number) -> string']
  context?: any
): { result: TypeCheckResult; resultType?: string } {

  // Get method signature (pre-defined in step 2)
  const methodSig = getArrayMethodSignature(method);

  // Check with generic type checker
  const check = this.checkGenericFunctionCall(
    method,
    methodSig,
    [arrayType, ...argTypes],
    ['array', ...methodSig.params]
  );

  if (check.result.compatible && check.substitution) {
    // Infer result type
    const resultType = this.inferGenericReturnType(
      methodSig.returnType,
      check.substitution
    );
    return { result: check.result, resultType };
  }

  return { result: check.result };
}

/**
 * Pre-defined signatures for array methods
 */
function getArrayMethodSignature(method: string): GenericFunctionType {
  const signatures: Record<string, GenericFunctionType> = {
    'map': {
      typeVars: ['T', 'U'],
      params: { 'array': 'array<T>', 'transform': 'fn(T) -> U' },
      returnType: 'array<U>'
    },
    'filter': {
      typeVars: ['T'],
      params: { 'array': 'array<T>', 'predicate': 'fn(T) -> bool' },
      returnType: 'array<T>'
    },
    'reduce': {
      typeVars: ['T', 'U'],
      params: {
        'array': 'array<T>',
        'reducer': 'fn(U, T) -> U',
        'initial': 'U'
      },
      returnType: 'U'
    },
    // ... more methods
  };
  return signatures[method] || { typeVars: [], params: {}, returnType: 'any' };
}
```

#### For Lambda Functions (Step 3)

**Type inference for lambdas**:
```typescript
/**
 * Infer lambda parameter types from context
 * Example: In map(fn(x) -> x+1), x must be a number
 */
inferLambdaParameterTypes(
  lambdaExpr: string,
  expectedType: string,
  context?: any
): Record<string, string> {

  // Parse lambda
  const lambda = parseLambda(lambdaExpr);

  // If expectedType is fn<T>(T) -> U, infer parameter types
  if (expectedType.startsWith('fn')) {
    const fnType = TypeParser.parseFunctionType(expectedType);
    if (fnType) {
      const paramTypes: Record<string, string> = {};
      for (let i = 0; i < lambda.params.length; i++) {
        paramTypes[lambda.params[i]] = fnType.paramTypes[i] || 'any';
      }
      return paramTypes;
    }
  }

  return {};
}
```

---

### 3. Code Generator Integration (Steps 2-3)

The IR generator needs to handle:

#### Method Call IR Generation (Step 2)

```typescript
// In src/codegen/ir-generator.ts

case 'MethodCall':
  return this.generateMethodCallIR(node);

/**
 * Generate IR for array method calls
 * array.map(fn) → IR instructions
 */
private generateMethodCallIR(node: any): IRInstruction[] {
  const instructions: IRInstruction[] = [];

  // 1. Evaluate object expression
  instructions.push(...this.traverse(node.object));

  // 2. Evaluate arguments
  const argVars: string[] = [];
  for (const arg of node.args) {
    const argVar = this.newVar();
    instructions.push(...this.traverse(arg));
    instructions.push({
      type: 'assign',
      target: argVar,
      value: 'TOS' // Top of stack
    });
    argVars.push(argVar);
  }

  // 3. Call method
  // Map calls require special handling for the function parameter
  if (node.method === 'map') {
    const arrayVar = node.object.type === 'Identifier' ? node.object.name : 'TOS';
    const fnVar = argVars[0];

    // Generate loop for each element
    instructions.push(...this.generateMapLoopIR(arrayVar, fnVar));
  } else if (node.method === 'filter') {
    // Similar for filter
    instructions.push(...this.generateFilterLoopIR(arrayVar, fnVar));
  }
  // ... more methods

  return instructions;
}

private generateMapLoopIR(arrayVar: string, fnVar: string): IRInstruction[] {
  const result = this.newVar();
  const indexVar = this.newVar();
  const elementVar = this.newVar();

  // Initialize result array
  return [
    { type: 'const', target: result, value: '[]' },
    { type: 'const', target: indexVar, value: '0' },
    // Loop: while index < array.length
    // ...
  ];
}
```

#### Lambda Function IR (Step 3)

```typescript
case 'LambdaExpression':
  return this.generateLambdaIR(node);

/**
 * Generate IR for lambda expressions
 * fn(x) -> x + 1 → function object
 */
private generateLambdaIR(node: any): IRInstruction[] {
  // Lambda becomes a function object in IR
  const fnId = `_lambda_${this.lambdaCounter++}`;

  return [
    {
      type: 'function',
      name: fnId,
      params: node.params,
      body: this.traverse(node.body),
      closureVars: this.collectClosureVariables(node) // Variable capture
    },
    {
      type: 'const',
      target: this.lastVar,
      value: fnId // Return reference to function
    }
  ];
}

/**
 * Collect variables from enclosing scope (for closures)
 */
private collectClosureVariables(node: any): Record<string, string> {
  const captured: Record<string, string> = {};

  // Find all free variables in lambda body
  const bodyVars = extractFreeVariables(node.body);

  // Map to their types from current scope
  for (const varName of bodyVars) {
    const varType = this.currentScope.getType(varName);
    if (varType) {
      captured[varName] = varType;
    }
  }

  return captured;
}
```

---

## Step-by-Step Integration Plan

### Step 2: Array Methods

1. **Extend AST** (src/parser/ast.ts)
   - Add MethodCall node
   - Add method name, arguments

2. **Parser changes** (src/parser/parser.ts)
   - Recognize `expr.method(args)` syntax
   - Parse method arguments

3. **Type Checker** (already done in Step 1)
   - checkArrayMethodCall() using generic types
   - Infer result types using unification

4. **Code Generator** (src/codegen/ir-generator.ts)
   - Generate loop IR for map/filter
   - Handle function arguments
   - Manage temporary variables

5. **Tests** (test/phase-3-array-methods.test.ts)
   - Parser: recognizes method calls
   - Type checker: validates types
   - Generator: produces correct IR
   - Integration: end-to-end

---

### Step 3: Functions & Closures

1. **Extend Parser** (src/parser/parser.ts)
   - Already has lambda parsing
   - Just validate with new type system

2. **Type Checker** (src/analyzer/type-checker.ts)
   - inferLambdaParameterTypes()
   - Track closure variables
   - Type check lambda body

3. **Code Generator** (src/codegen/ir-generator.ts)
   - generateLambdaIR() function objects
   - Capture closure variables
   - Create callable function references

4. **Tests**
   - Lambda type checking
   - Closure variable capture
   - Higher-order functions

---

## Data Flow Example

### Array Map Example

```
Source Code:
  numbers.map(fn(x) -> x * 2)

Parser:
  MethodCall {
    object: Identifier('numbers'),
    method: 'map',
    args: [LambdaExpression({ params: ['x'], body: BinaryOp(...) })]
  }

Type Checker:
  1. array<number>.map(fn(x) -> x * 2)
  2. Get method signature: fn<T, U>(array<T>, fn(T) -> U) -> array<U>
  3. Unify array<number> with array<T> → {T: number}
  4. Infer lambda type: fn(number) -> number
  5. Result: array<number> ✓

Code Generator:
  1. Evaluate object: _tmp_0 = numbers
  2. Create result: _result = []
  3. Create index: _i = 0
  4. While _i < _tmp_0.length:
       - _elem = _tmp_0[_i]
       - _transformed = call_lambda(x, _elem)
       - _result.push(_transformed)
       - _i = _i + 1
  5. Return _result
```

---

## Testing Integration

### Phase 3 Step 2 Tests

```typescript
describe('Phase 3 Step 2: Array Methods', () => {
  test('Parser: recognizes array.map(fn)', () => {
    const ast = parser.parse('numbers.map(fn(x) -> x * 2)');
    expect(ast.type).toBe('MethodCall');
    expect(ast.method).toBe('map');
  });

  test('Type Checker: validates map types', () => {
    // Uses Generic type checker from Step 1
    const result = checker.checkArrayMethodCall(
      'map',
      'array<number>',
      ['fn(number) -> string']
    );
    expect(result.resultType).toBe('array<string>');
  });

  test('Code Generator: produces correct IR', () => {
    const ir = generator.generate(ast);
    expect(ir).toContainArrayLoopWith('map');
    expect(ir).toContainFunctionCall();
  });

  test('Integration: parse → check → generate', () => {
    // Full pipeline
  });
});
```

---

## Key Integration Points Summary

| Component | Uses From Step 1 | New Functionality |
|-----------|------------------|-------------------|
| **Parser** | `TypeParser.isValidType()` | Recognize method calls |
| **Type Checker** | `checkGenericFunctionCall()` | Method validation |
| **Code Gen** | Result types from checker | Generate loop IR |

---

## Implementation Checklist for Step 2

- [ ] Add MethodCall AST node
- [ ] Extend parser for method syntax
- [ ] Implement checkArrayMethodCall()
- [ ] Define getArrayMethodSignature()
- [ ] Generate IR for map loop
- [ ] Generate IR for filter loop
- [ ] Generate IR for reduce loop
- [ ] Write parser tests
- [ ] Write type checker tests
- [ ] Write code generator tests
- [ ] Integration tests
- [ ] Documentation

---

## Implementation Checklist for Step 3

- [ ] Verify parser lambda support
- [ ] Implement inferLambdaParameterTypes()
- [ ] Implement collectClosureVariables()
- [ ] Generate lambda function objects
- [ ] Type check lambda bodies
- [ ] Write lambda type tests
- [ ] Write closure capture tests
- [ ] Higher-order function tests
- [ ] Integration tests
- [ ] Documentation

---

## Notes

1. **Backward Compatibility**
   - All Phase 1-2 features still work
   - Optional type annotations
   - Existing function definitions still valid

2. **Generic Type Cache**
   - Consider caching parsed generic signatures
   - Avoid re-parsing `fn<T, U>...` repeatedly

3. **Error Messages**
   - Leverage TypeCheckResult for detailed errors
   - Show expected vs actual types
   - Suggest fixes for common errors

4. **Performance**
   - Unification is O(n) where n = type depth
   - Cache substitution results for complex chains
   - Lazy evaluation of type checking

---

**Next**: Begin Phase 3 Step 2 - Array Methods Implementation

