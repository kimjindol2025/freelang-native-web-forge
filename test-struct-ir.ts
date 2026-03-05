/**
 * Test struct support in IR generator
 */

import { IRGenerator } from './src/codegen/ir-generator';
import { Op } from './src/types';

const generator = new IRGenerator();

// Test 1: Simple struct declaration
const structAST = {
  type: 'struct',
  name: 'Token',
  fields: [
    { name: 'kind', fieldType: 'string' },
    { name: 'value', fieldType: 'string' },
    { name: 'line', fieldType: 'int' },
    { name: 'col', fieldType: 'int' },
    { name: 'length', fieldType: 'int' }
  ]
};

console.log('=== Testing Struct IR Generation ===\n');

try {
  const ir = generator.generateIR(structAST);
  console.log('✅ IR Generation Success!');
  console.log('\nGenerated IR Instructions:');
  ir.forEach((inst, idx) => {
    const opName = Object.entries(Op).find(([_, val]) => val === inst.op)?.[0] || `Op(${inst.op})`;
    console.log(`  [${idx}] ${opName} ${inst.arg ? `arg: ${inst.arg}` : ''}`);
  });

  // Check for struct opcodes
  const hasStructNew = ir.some(inst => inst.op === Op.STRUCT_NEW);
  const hasStructField = ir.some(inst => inst.op === Op.STRUCT_FIELD);
  const hasStore = ir.some(inst => inst.op === Op.STORE);
  const hasHalt = ir.some(inst => inst.op === Op.HALT);

  console.log('\n✅ Struct IR Check:');
  console.log(`  - STRUCT_NEW: ${hasStructNew ? '✓' : '✗'}`);
  console.log(`  - STRUCT_FIELD: ${hasStructField ? '✓' : '✗'}`);
  console.log(`  - STORE: ${hasStore ? '✓' : '✗'}`);
  console.log(`  - HALT: ${hasHalt ? '✓' : '✗'}`);

  if (hasStructNew && hasStructField && hasStore && hasHalt) {
    console.log('\n✅ All struct IR components present!');
  } else {
    console.log('\n⚠️ Some struct IR components missing');
  }
} catch (error) {
  console.error('❌ Error:', (error as any).message);
  process.exit(1);
}

console.log('\n=== Test Complete ===');
