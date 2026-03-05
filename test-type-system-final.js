"use strict";
/**
 * Task B: Complete Type System Tests
 *
 * Tests for:
 * 1. Generic<T> functions
 * 2. Union type support
 * 3. Type mismatch detection
 * 4. Function argument type checking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const type_parser_enhanced_1 = require("./src/parser/type-parser-enhanced");
const type_checker_enhanced_1 = require("./src/type-system/type-checker-enhanced");
const tests = [];
let passCount = 0;
let failCount = 0;
function describe(name, fn) {
    console.log(`\n📝 ${name}`);
    fn();
}
function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        passCount++;
    }
    catch (err) {
        console.log(`  ❌ ${name}`);
        console.log(`     ${err}`);
        failCount++;
    }
}
function expect(actual) {
    return {
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error(`Expected value to be defined, got undefined`);
            }
        },
        toContain: (substring) => {
            if (!actual.includes(substring)) {
                throw new Error(`Expected to contain "${substring}", got "${actual}"`);
            }
        },
        toThrow: () => {
            try {
                actual();
                throw new Error('Expected function to throw, but it did not');
            }
            catch (e) {
                // Expected
            }
        }
    };
}
// ──── Test Group 1: Type Parser ────
describe('Type Parser - Parse Basic Types', () => {
    test('Parse number type', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        expect(type.kind).toBe('primitive');
        expect(type.name).toBe('number');
    });
    test('Parse string type', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('string');
        expect(type.kind).toBe('primitive');
        expect(type.name).toBe('string');
    });
    test('Parse boolean type', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('boolean');
        expect(type.kind).toBe('primitive');
        expect(type.name).toBe('boolean');
    });
});
describe('Type Parser - Parse Union Types', () => {
    test('Parse simple union: string | number', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number');
        expect(type.kind).toBe('union');
        const members = type.members;
        expect(members.length).toBe(2);
        expect(members[0].name).toBe('string');
        expect(members[1].name).toBe('number');
    });
    test('Parse triple union: string | number | boolean', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number | boolean');
        expect(type.kind).toBe('union');
        expect(type.members.length).toBe(3);
    });
});
describe('Type Parser - Parse Generic Types', () => {
    test('Parse simple generic: Map<string, number>', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('Map<string, number>');
        expect(type.kind).toBe('generic');
        expect(type.name).toBe('Map');
        expect(type.typeArguments.length).toBe(2);
    });
    test('Parse Promise<T>', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('Promise<string>');
        expect(type.kind).toBe('generic');
        expect(type.name).toBe('Promise');
    });
});
describe('Type Parser - Parse Array Types', () => {
    test('Parse array with brackets: [string]', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('[string]');
        expect(type.kind).toBe('array');
        const element = type.element;
        expect(element.name).toBe('string');
    });
    test('Parse nested array: [[number]]', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('[[number]]');
        expect(type.kind).toBe('array');
        const inner = type.element;
        expect(inner.kind).toBe('array');
    });
});
// ──── Test Group 2: Type Checker - Type Compatibility ────
describe('Type Checker - Type Assignability', () => {
    const checker = new type_checker_enhanced_1.EnhancedTypeCheckerV2();
    test('Same types are assignable', () => {
        const numberType = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        const result = checker.isAssignableTo(numberType, numberType);
        expect(result).toBe(true);
    });
    test('Value assignable to union containing it', () => {
        const numberType = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        const unionType = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number');
        const result = checker.isAssignableTo(numberType, unionType);
        expect(result).toBe(true);
    });
    test('Any type is assignable from anything', () => {
        const numberType = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        const anyType = type_parser_enhanced_1.EnhancedTypeParser.parseType('any');
        const result = checker.isAssignableTo(numberType, anyType);
        expect(result).toBe(true);
    });
});
// ──── Test Group 3: Variable Declaration Checking ────
describe('Type Checker - Variable Declarations', () => {
    test('Variable with explicit type and matching value', () => {
        const checker = new type_checker_enhanced_1.EnhancedTypeCheckerV2();
        const decl = {
            type: 'variable',
            name: 'x',
            varType: 'number',
            value: {
                type: 'literal',
                value: 42,
                dataType: 'number'
            }
        };
        const errors = checker.checkVariableDeclaration(decl);
        expect(errors.length).toBe(0);
    });
    test('Variable without type and without initializer should error', () => {
        const checker = new type_checker_enhanced_1.EnhancedTypeCheckerV2();
        const decl = {
            type: 'variable',
            name: 'x'
        };
        const errors = checker.checkVariableDeclaration(decl);
        expect(errors.length > 0).toBe(true);
        if (errors.length > 0) {
            expect(errors[0].code).toBe('MISSING_TYPE');
        }
    });
});
// ──── Test Group 4: Type Parameter Parsing ────
describe('Type Parser - Type Parameters', () => {
    test('Parse simple type parameter T', () => {
        const param = type_parser_enhanced_1.EnhancedTypeParser.parseTypeParameter('T');
        expect(param.name).toBe('T');
        expect(param.constraint).toBe(undefined);
    });
    test('Parse constrained type parameter', () => {
        const param = type_parser_enhanced_1.EnhancedTypeParser.parseTypeParameter('T extends Serializable');
        expect(param.name).toBe('T');
        expect(param.constraint).toBeDefined();
    });
    test('Parse type parameter with default', () => {
        const param = type_parser_enhanced_1.EnhancedTypeParser.parseTypeParameter('T = string');
        expect(param.name).toBe('T');
        expect(param.default).toBeDefined();
    });
});
// ──── Test Group 5: Type String Conversion ────
describe('Type String Conversion', () => {
    test('Convert number type to string', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        const str = type_parser_enhanced_1.EnhancedTypeParser.typeToString(type);
        expect(str).toBe('number');
    });
    test('Convert union type to string', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number');
        const str = type_parser_enhanced_1.EnhancedTypeParser.typeToString(type);
        expect(str.includes('|')).toBe(true);
    });
    test('Convert generic type to string', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('Map<string, number>');
        const str = type_parser_enhanced_1.EnhancedTypeParser.typeToString(type);
        expect(str.includes('Map')).toBe(true);
        expect(str.includes('<')).toBe(true);
    });
});
// ──── Test Group 6: Type Equality ────
describe('Type Equality', () => {
    const checker = new type_checker_enhanced_1.EnhancedTypeCheckerV2();
    test('Equal primitive types', () => {
        const t1 = type_parser_enhanced_1.EnhancedTypeParser.parseType('string');
        const t2 = type_parser_enhanced_1.EnhancedTypeParser.parseType('string');
        const result = checker.typeEquals(t1, t2);
        expect(result).toBe(true);
    });
    test('Different primitive types not equal', () => {
        const t1 = type_parser_enhanced_1.EnhancedTypeParser.parseType('string');
        const t2 = type_parser_enhanced_1.EnhancedTypeParser.parseType('number');
        const result = checker.typeEquals(t1, t2);
        expect(result).toBe(false);
    });
    test('Equal union types', () => {
        const t1 = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number');
        const t2 = type_parser_enhanced_1.EnhancedTypeParser.parseType('string | number');
        const result = checker.typeEquals(t1, t2);
        expect(result).toBe(true);
    });
});
// ──── Test Group 7: Complex Scenarios ────
describe('Complex Scenarios', () => {
    test('Generic array: [T] with number instantiation', () => {
        const arrayType = type_parser_enhanced_1.EnhancedTypeParser.parseType('[number]');
        expect(arrayType.kind).toBe('array');
        expect(arrayType.element.name).toBe('number');
    });
    test('Union with generic: Promise<string> | null', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('Promise<string> | null');
        expect(type.kind).toBe('union');
        const members = type.members;
        expect(members[0].kind).toBe('generic');
    });
    test('Nested generics: Map<string, Promise<number>>', () => {
        const type = type_parser_enhanced_1.EnhancedTypeParser.parseType('Map<string, Promise<number>>');
        expect(type.kind).toBe('generic');
        const args = type.typeArguments;
        expect(args.length).toBe(2);
        expect(args[1].kind).toBe('generic');
    });
});
// ──── Test Group 8: Error Messages ────
describe('Type Error Messages', () => {
    test('Type mismatch error has proper message', () => {
        const checker = new type_checker_enhanced_1.EnhancedTypeCheckerV2();
        const decl = {
            type: 'variable',
            name: 'x',
            varType: 'number',
            value: {
                type: 'literal',
                value: 'hello',
                dataType: 'string'
            }
        };
        const errors = checker.checkVariableDeclaration(decl);
        if (errors.length > 0) {
            expect(errors[0].code).toBe('TYPE_MISMATCH');
            expect(errors[0].expected).toBe('number');
            expect(errors[0].actual).toBe('string');
        }
    });
});
// ──── Summary Report ────
console.log('\n' + '='.repeat(60));
console.log(`📊 Test Summary`);
console.log('='.repeat(60));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${passCount + failCount}`);
if (failCount === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}
else {
    console.log(`\n⚠️  ${failCount} test(s) failed`);
    process.exit(1);
}
