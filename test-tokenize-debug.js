const { Lexer, TokenBuffer } = require('./dist/lexer/lexer');

const source = 'fn test() { let x = 5; println(x); return x } test()';
const lexer = new Lexer(source);
const tokenBuffer = new TokenBuffer(lexer);

console.log('Tokens:');
let token = tokenBuffer.peek();
let count = 0;
while (token && count < 30) {
  console.log(`  type=${token.type}, value="${token.value}"`);
  tokenBuffer.advance();
  token = tokenBuffer.peek();
  count++;
}
