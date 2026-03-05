/**
 * Test multiple struct types (like in lexer.fl)
 */

import { IRGenerator } from './src/codegen/ir-generator';
import { Op } from './src/types';

const generator = new IRGenerator();

console.log('=== Testing Multiple Struct Definitions (lexer.fl scenario) ===\n');

// Test 1: Token struct (from lexer.fl line 33)
const tokenStruct = {
  type: 'struct',
  name: 'Token',
  fields: [
    { name: 'kind' },
    { name: 'value' },
    { name: 'line' },
    { name: 'col' },
    { name: 'length', fieldType: 'int' }
  ]
};

// Test 2: Lexer struct (from lexer.fl line 54)
const lexerStruct = {
  type: 'struct',
  name: 'Lexer',
  fields: [
    { name: 'source' },
    { name: 'pos' },
    { name: 'line' },
    { name: 'col' },
    { name: 'tokens', fieldType: 'array' }
  ]
};

let successCount = 0;
let totalTests = 2;

try {
  // Test Token struct
  console.log('Test 1: struct Token');
  const ir1 = generator.generateIR(tokenStruct);
  const hasToken = ir1.some(inst => inst.op === Op.STRUCT_NEW && inst.arg === 'Token');
  console.log(`  ✓ Generated ${ir1.length} instructions`);
  console.log(`  ✓ STRUCT_NEW with 'Token': ${hasToken ? '✓' : '✗'}`);
  if (hasToken) successCount++;
  console.log('');

  // Test Lexer struct
  console.log('Test 2: struct Lexer');
  const ir2 = generator.generateIR(lexerStruct);
  const hasLexer = ir2.some(inst => inst.op === Op.STRUCT_NEW && inst.arg === 'Lexer');
  console.log(`  ✓ Generated ${ir2.length} instructions`);
  console.log(`  ✓ STRUCT_NEW with 'Lexer': ${hasLexer ? '✓' : '✗'}`);
  if (hasLexer) successCount++;
  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log(`✅ ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log('\n✅ lexer.fl can define structs without errors!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error:');
  console.error((error as any).message);
  process.exit(1);
}
