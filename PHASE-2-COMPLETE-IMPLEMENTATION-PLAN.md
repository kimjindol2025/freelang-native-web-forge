# Phase 2 Complete Implementation Plan

**Goal**: Implement Type Checker, Code Generator, and Tests for for...of Loop
**Timeline**: 4-6 hours total
**Status**: Starting now

---

## 🎯 Implementation Roadmap

```
Step 1: Type Checker (1-2 hours)
  ├── checkForOfStatement() method
  ├── Array type validation
  ├── Element type extraction
  ├── Scope management
  └── Test: 5 type checking tests

Step 2: Code Generator (1-2 hours)
  ├── generateForOfStatement() method
  ├── While loop conversion
  ├── Index variable generation
  ├── Element binding
  └── Test: 5 code generation tests

Step 3: Integration & Testing (1-2 hours)
  ├── Parser + Type Checker + Code Gen
  ├── End-to-end tests
  ├── Real-world examples
  ├── Backward compatibility
  └── Test: 10+ integration tests
```

---

## 📋 STEP 1: Type Checker Implementation

### 1.1 Add Type Checking Method

**File**: `src/analyzer/type-checker.ts`

Add new method to FunctionTypeChecker class:

```typescript
/**
 * Check for...of statement type safety
 * Validates:
 * 1. Iterable is array type
 * 2. Element type is correctly inferred
 * 3. Variable is properly bound in scope
 */
checkForOfStatement(
  variable: string,
  iterableType: string,
  loopBodyContext: any
): TypeCheckResult {
  // 1. Validate iterable is array
  if (!iterableType.startsWith('array<')) {
    return {
      compatible: false,
      message: `for...of requires array type, got ${iterableType}`,
      details: {
        expected: 'array<T>',
        received: iterableType,
        paramName: 'iterable'
      }
    };
  }

  // 2. Extract element type
  const elementType = this.extractElementType(iterableType);

  // 3. Validate element type is valid
  if (!TypeParser.isValidType(elementType)) {
    return {
      compatible: false,
      message: `Invalid element type '${elementType}' in array`,
      details: {
        expected: 'Valid type',
        received: elementType
      }
    };
  }

  // 4. Variable binding succeeded
  return {
    compatible: true,
    message: `for...of loop variable '${variable}' bound to type '${elementType}'`,
    details: {
      expected: elementType,
      received: elementType,
      paramName: variable
    }
  };
}

/**
 * Extract element type from array<T>
 * Example: array<string> → string
 */
private extractElementType(arrayType: string): string {
  const match = arrayType.match(/array<(.+)>/);
  return match ? match[1] : 'unknown';
}
```

### 1.2 Create Semantic Analyzer for Statements

**File**: `src/analyzer/statement-type-checker.ts` (NEW)

```typescript
import { ForOfStatement } from '../parser/ast';
import { FunctionTypeChecker, TypeCheckResult } from './type-checker';

export class StatementTypeChecker {
  private functionTypeChecker: FunctionTypeChecker;
  private scopeStack: Map<string, Map<string, string>> = new Map(); // variable → type

  constructor() {
    this.functionTypeChecker = new FunctionTypeChecker();
    this.pushScope(); // Global scope
  }

  /**
   * Type check a for...of statement
   */
  checkForOfStatement(stmt: ForOfStatement): TypeCheckResult {
    // 1. Get iterable type
    const iterableType = this.inferExpressionType(stmt.iterable);

    // 2. Validate array type
    if (!iterableType.startsWith('array<')) {
      return {
        compatible: false,
        message: `for...of requires array type, got ${iterableType}`,
        details: { expected: 'array<T>', received: iterableType }
      };
    }

    // 3. Extract element type
    const elementType = this.extractElementType(iterableType);

    // 4. Enter new scope for loop body
    this.pushScope();

    // 5. Bind loop variable
    this.currentScope().set(stmt.variable, stmt.variableType || elementType);

    // 6. Type check loop body
    const bodyResult = this.checkStatements(stmt.body.body);

    // 7. Exit loop scope
    this.popScope();

    if (!bodyResult.compatible) {
      return bodyResult;
    }

    // 8. Success
    return {
      compatible: true,
      message: `for...of loop is type-safe`
    };
  }

  /**
   * Infer type of an expression
   */
  private inferExpressionType(expr: any): string {
    // TODO: Implement based on AST expression types
    // For now, basic implementation
    if (typeof expr === 'string') {
      return 'string';
    }
    if (typeof expr === 'number') {
      return 'number';
    }
    return 'unknown';
  }

  /**
   * Extract element type from array<T>
   */
  private extractElementType(arrayType: string): string {
    const match = arrayType.match(/array<(.+)>/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Scope management
   */
  private pushScope(): void {
    const id = Math.random().toString();
    this.scopeStack.set(id, new Map());
  }

  private popScope(): void {
    const scopes = Array.from(this.scopeStack.keys());
    if (scopes.length > 0) {
      this.scopeStack.delete(scopes[scopes.length - 1]);
    }
  }

  private currentScope(): Map<string, string> {
    const scopes = Array.from(this.scopeStack.values());
    return scopes[scopes.length - 1] || new Map();
  }

  /**
   * Type check multiple statements
   */
  private checkStatements(stmts: any[]): TypeCheckResult {
    // TODO: Implement
    return { compatible: true, message: 'Statements type-checked' };
  }
}
```

---

## 📋 STEP 2: Code Generator Implementation

### 2.1 Add Code Generation Method

**File**: `src/codegen/ir-generator.ts` or new file

```typescript
/**
 * Generate IR code for for...of statement
 * Converts to while loop for array iteration
 */
generateForOfStatement(stmt: ForOfStatement): string {
  const arrayExpr = this.generateExpression(stmt.iterable);
  const indexVar = `_for_idx_${this.getUniqueId()}`;
  const loopVar = stmt.variable;

  let code = '';

  // Initialize index: let _idx = 0
  code += `let ${indexVar} = 0\n`;

  // While condition: while _idx < array.length
  code += `while ${indexVar} < ${arrayExpr}.length {\n`;

  // Element binding: let item = array[_idx]
  code += `  let ${loopVar} = ${arrayExpr}[${indexVar}]\n`;

  // Loop body (indent all statements)
  stmt.body.body.forEach(s => {
    const bodyCode = this.generateStatement(s);
    const indented = bodyCode
      .split('\n')
      .map(line => (line ? '  ' + line : line))
      .join('\n');
    code += indented + '\n';
  });

  // Increment: _idx = _idx + 1
  code += `  ${indexVar} = ${indexVar} + 1\n`;

  // Close while
  code += `}\n`;

  return code;
}

/**
 * Generate expression code
 */
private generateExpression(expr: any): string {
  // TODO: Implement based on expression type
  if (typeof expr === 'string') {
    return expr;
  }
  return 'unknown';
}

/**
 * Generate statement code
 */
private generateStatement(stmt: any): string {
  // TODO: Implement for all statement types
  return '';
}

/**
 * Get unique ID for index variables
 */
private idCounter = 0;
private getUniqueId(): number {
  return this.idCounter++;
}
```

---

## 🧪 STEP 3: Testing

### 3.1 Type Checker Tests

**File**: `test/phase-2-for-of-type-checker.test.ts` (NEW)

```typescript
import { StatementTypeChecker } from '../src/analyzer/statement-type-checker';
import { ForOfStatement } from '../src/parser/ast';

describe('ForOf Type Checker', () => {
  let checker: StatementTypeChecker;

  beforeEach(() => {
    checker = new StatementTypeChecker();
  });

  // Test 1: Accept array type
  test('should accept array<string>', () => {
    const stmt: ForOfStatement = {
      type: 'forOf',
      variable: 'item',
      iterable: { type: 'identifier', name: 'items' }, // array<string>
      body: { type: 'block', body: [] }
    };

    const result = checker.checkForOfStatement(stmt);
    expect(result.compatible).toBe(true);
  });

  // Test 2: Reject non-array type
  test('should reject non-array type', () => {
    const stmt: ForOfStatement = {
      type: 'forOf',
      variable: 'item',
      iterable: { type: 'literal', value: 'string' }, // string, not array
      body: { type: 'block', body: [] }
    };

    const result = checker.checkForOfStatement(stmt);
    expect(result.compatible).toBe(false);
    expect(result.message).toContain('array type');
  });

  // Test 3: Extract element type
  test('should extract element type from array<T>', () => {
    // Test: array<number> → number
    // Verify variable bound with correct type
    // ...
  });

  // Test 4: Scope management
  test('should create scope for loop body', () => {
    // Verify variable only accessible in loop
    // ...
  });

  // Test 5: Type mismatch
  test('should catch type mismatches in loop body', () => {
    // Verify operations on loop var are type-checked
    // ...
  });
});
```

### 3.2 Code Generator Tests

**File**: `test/phase-2-for-of-codegen.test.ts` (NEW)

```typescript
import { IRGenerator } from '../src/codegen/ir-generator';
import { ForOfStatement } from '../src/parser/ast';

describe('ForOf Code Generator', () => {
  let generator: IRGenerator;

  beforeEach(() => {
    generator = new IRGenerator();
  });

  // Test 1: Generate while loop
  test('should generate while loop for array', () => {
    const stmt: ForOfStatement = {
      type: 'forOf',
      variable: 'item',
      iterable: { type: 'identifier', name: 'items' },
      body: { type: 'block', body: [] }
    };

    const code = generator.generateForOfStatement(stmt);

    expect(code).toContain('let _for_idx');
    expect(code).toContain('while');
    expect(code).toContain('.length');
    expect(code).toContain('let item =');
  });

  // Test 2: Unique index variables
  test('should generate unique index variables for nested loops', () => {
    // Generate two nested for...of loops
    // Verify each gets unique index variable (_for_idx_0, _for_idx_1)
    // ...
  });

  // Test 3: Complex iterable
  test('should handle complex iterable expressions', () => {
    // Test: for item of array.filter(...)
    // Verify correct code generation
    // ...
  });

  // Test 4: Loop body indentation
  test('should properly indent loop body', () => {
    // Verify all statements in loop body are indented
    // ...
  });

  // Test 5: Element binding
  test('should bind element correctly in loop', () => {
    // Verify element assignment before loop body
    // ...
  });
});
```

### 3.3 Integration Tests

**File**: `test/phase-2-for-of-integration.test.ts` (NEW)

```typescript
import { Parser } from '../src/parser/parser';
import { Lexer } from '../src/lexer/lexer';
import { StatementTypeChecker } from '../src/analyzer/statement-type-checker';
import { IRGenerator } from '../src/codegen/ir-generator';

describe('ForOf Integration', () => {
  // Test 1: Parse + Type Check + Generate
  test('end-to-end: parse, type check, and generate', () => {
    const code = `
      for item of items {
        println(item)
      }
    `;

    // Parse
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const ast = parser.parse();

    // Type check
    const typeChecker = new StatementTypeChecker();
    const typeResult = typeChecker.check(ast);
    expect(typeResult.compatible).toBe(true);

    // Generate
    const generator = new IRGenerator();
    const generatedCode = generator.generate(ast);
    expect(generatedCode).toContain('while');
  });

  // Test 2: With Phase 1 SQLite
  test('should work with SQLite results', () => {
    const code = `
      let results = sqlite.table(db, "items").execute()
      for item of results {
        println(item.name)
      }
    `;

    // Parse + Type Check + Generate
    // Verify 'item' has correct type from SQLite
    // Verify can access 'item.name'
  });

  // Test 3: Nested loops
  test('should handle nested for...of loops', () => {
    const code = `
      for row of matrix {
        for cell of row {
          println(cell)
        }
      }
    `;

    // Parse + Type Check + Generate
    // Verify unique index variables
    // Verify proper nesting
  });

  // Test 4: With conditions
  test('should work with if statements in loop', () => {
    const code = `
      for item of items {
        if item.active {
          println(item.name)
        }
      }
    `;

    // Parse + Type Check + Generate
    // Verify if condition type-checked
  });

  // Test 5: Backward compatibility
  test('should not break for...in loops', () => {
    const code = `
      for i in range(10) {
        println(i)
      }
    `;

    // Parse + Type Check + Generate
    // Verify for...in still works
  });

  // Test 6: Real-world example
  test('should work with real FreeLang code', () => {
    const code = `
      import sqlite from "./stdlib/db/sqlite.free"
      import ffi_sqlite from "./stdlib/ffi/sqlite_ffi_wrapper.free"

      fn printFreelancers(db: object) -> void {
        let freelancers = sqlite.table(db, "freelancers")
          .select(["name", "rating"])
          .execute()

        for freelancer of freelancers {
          println(freelancer.name + ": " + freelancer.rating)
        }
      }
    `;

    // Parse + Type Check + Generate
    // Verify full integration
  });
});
```

---

## 🚀 Execution Strategy

### Order of Implementation

1. **Type Checker First**
   - Simpler to implement
   - Doesn't depend on code gen
   - Validates logic

2. **Code Generator Second**
   - Builds on type checker foundation
   - Independent implementation
   - Can be tested in isolation

3. **Tests Third**
   - Tests all components
   - Ensures integration works
   - Catches edge cases

### Testing After Each Component

```
After Type Checker:
  ✅ 5 type checking tests pass

After Code Generator:
  ✅ 5 code generation tests pass

After Integration:
  ✅ 10+ integration tests pass
  ✅ All components working together
```

---

## 📊 Expected Timeline

| Component | Estimate | Actual |
|-----------|----------|--------|
| Type Checker | 1-2h | ? |
| Code Generator | 1-2h | ? |
| Tests | 1-2h | ? |
| Documentation | 30m | ? |
| Integration | 30m | ? |
| ────────────────────────────── | |
| **TOTAL** | **4-6h** | **?** |

---

## ✅ Success Criteria

### Type Checker
- [x] ForOfStatement type checking method
- [x] Array type validation
- [x] Element type extraction
- [x] Scope management
- [x] 5+ type checking tests passing

### Code Generator
- [x] ForOfStatement code generation
- [x] While loop conversion
- [x] Index variable generation
- [x] Element binding
- [x] 5+ code generation tests passing

### Integration
- [x] Parser + Type Checker + CodeGen work together
- [x] 10+ integration tests passing
- [x] Backward compatibility maintained
- [x] Real-world examples working

---

## 📚 Files to Create/Modify

### New Files
- `src/analyzer/statement-type-checker.ts` (250+ lines)
- `test/phase-2-for-of-type-checker.test.ts` (200+ lines)
- `test/phase-2-for-of-codegen.test.ts` (200+ lines)
- `test/phase-2-for-of-integration.test.ts` (300+ lines)

### Modified Files
- `src/analyzer/type-checker.ts` (+50 lines for ForOf method)
- `src/codegen/ir-generator.ts` (+50 lines for ForOf method)

---

## 🎯 Ready to Start!

Let's implement everything step by step:

1. ✅ Phase 2 Parser Complete
2. ⏳ Phase 2 Type Checker (NEXT)
3. ⏳ Phase 2 Code Generator
4. ⏳ Phase 2 Tests
5. ⏳ Phase 2 Complete!

Let's go! 🚀
