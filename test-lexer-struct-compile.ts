/**
 * Test that lexer.fl (with struct definitions) can be parsed and compiled
 */

import * as fs from 'fs';
import { Lexer } from './src/parser/lexer';
import { Parser } from './src/parser/parser';
import { IRGenerator } from './src/codegen/ir-generator';

const lexerCode = fs.readFileSync('./src/stdlib/lexer.fl', 'utf-8');

console.log('=== Testing lexer.fl Struct Compilation ===\n');
console.log(`File size: ${lexerCode.length} bytes`);
console.log(`First 200 chars:\n${lexerCode.substring(0, 200)}\n`);

try {
  // Step 1: Tokenize
  console.log('Step 1: Tokenizing lexer.fl...');
  const lexer = new Lexer(lexerCode);
  const tokens = lexer.tokenize();
  console.log(`✅ Tokenized: ${tokens.length} tokens\n`);

  // Step 2: Parse
  console.log('Step 2: Parsing tokens...');
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log(`✅ Parsed successfully\n`);

  // Check for struct declarations
  const structStatements = ast.body.filter((stmt: any) => stmt.type === 'struct' || stmt.type === 'StructDeclaration');
  console.log(`Found struct declarations: ${structStatements.length}`);
  structStatements.forEach((stmt: any, idx: number) => {
    console.log(`  [${idx + 1}] struct ${stmt.name} with ${stmt.fields?.length || 0} fields`);
  });
  console.log('');

  // Step 3: Generate IR
  console.log('Step 3: Generating IR...');
  const generator = new IRGenerator();
  const ir = generator.generateIR(ast);
  console.log(`✅ Generated ${ir.length} IR instructions\n`);

  // Summary
  console.log('=== Compilation Summary ===');
  console.log(`✅ lexer.fl compiled successfully without struct errors`);
  console.log(`✅ Struct declarations: ${structStatements.length}`);
  console.log(`✅ Total IR instructions: ${ir.length}`);

} catch (error) {
  console.error('❌ Compilation Error:');
  console.error((error as any).message);
  if ((error as any).stack) {
    console.error((error as any).stack);
  }
  process.exit(1);
}
