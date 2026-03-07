import { Lexer, TokenBuffer } from './src/lexer/lexer';
import { Parser } from './src/parser/parser';
import { generateORMMeta } from './src/codegen/orm-codegen';

const src = `@db_table(name: wash_logs)
struct WashLog {
  @db_id @db_auto_inc id: int,
  @db_column(type: varchar) site_name: string
}
`;

const lexer = new Lexer(src);
const buf = new TokenBuffer(lexer, { preserveNewlines: false });
const parser = new Parser(buf);
const ast = parser.parseModule() as any;

const structs = ast.statements.filter((s: any) => s.type === 'struct');
console.log('structs found:', structs.length);
if (structs.length > 0) {
  const s = structs[0];
  console.log('name:', s.name);
  console.log('annotations:', JSON.stringify(s.annotations));
  console.log('fields:', JSON.stringify(s.fields));
}

const metas = generateORMMeta(ast);
console.log('orm metas:', metas.length);
if (metas.length > 0) {
  console.log('table:', metas[0].tableName);
  console.log('CREATE:', metas[0].sql.createTable);
  console.log('INSERT:', metas[0].sql.insertAll);
}
