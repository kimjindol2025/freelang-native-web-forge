const { TokenType } = require('./dist/lexer/token');
const { Lexer, TokenBuffer } = require('./dist/lexer/lexer');

const source = 'fn test() { }';
const lexer = new Lexer(source);
const tokenBuffer = new TokenBuffer(lexer);

const token1 = tokenBuffer.current();
console.log('Current token type:', token1.type);
console.log('TokenType.FN:', TokenType.FN);
console.log('Token 1 value:', token1.value);
console.log('Match:', token1.type === TokenType.FN);
