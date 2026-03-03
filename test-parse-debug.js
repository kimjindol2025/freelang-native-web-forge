const { Lexer, TokenBuffer } = require('./dist/lexer/lexer');
const { Parser } = require('./dist/parser/parser');

const source = 'fn test() { let x = 5; println(x); return x } test()';
const lexer = new Lexer(source);
const tokenBuffer = new TokenBuffer(lexer);
const parser = new Parser(tokenBuffer);
const ast = parser.parseModule();

console.log('AST statements:');
ast.statements.forEach((stmt, idx) => {
  console.log(`\n[${idx}] type: ${stmt.type}`);
  if (stmt.type === 'function') {
    console.log(`    name: ${stmt.name}`);
    console.log(`    params:`, stmt.params);
    console.log(`    body type: ${stmt.body.type}`);
    console.log(`    body.body:`, stmt.body.body?.length, 'statements');
    if (stmt.body.body) {
      stmt.body.body.forEach((s, i) => {
        console.log(`      [${i}] ${s.type}${s.name ? ` (${s.name})` : ''}`);
      });
    }
  }
  if (stmt.type === 'expression') {
    console.log(`    expression type: ${stmt.expression?.type || stmt.expression}`);
  }
});
