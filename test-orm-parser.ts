// 파서에서 @db_table 어노테이션 파싱 테스트
import { Lexer, TokenBuffer } from './src/lexer/lexer';
import { Parser } from './src/parser/parser';
import { generateORMMeta } from './src/codegen/orm-codegen';

const source = `
@db_table(name: wash_logs)
struct WashLog {
  @db_id @db_auto_inc id: int,
  @db_column(type: varchar) site_name: string,
  @db_column(type: integer) machine_id: int,
  @db_column(type: timestamp) created_at: int
}

fn main() {
  println("hello")
}
`;

const lexer = new Lexer(source);
const tokenBuffer = new TokenBuffer(lexer, { preserveNewlines: false });
const parser = new Parser(tokenBuffer);
const parsedModule = parser.parseModule() as any;

console.log('=== 파싱된 statements ===');
for (const stmt of parsedModule.statements) {
  console.log('type:', stmt.type, '| name:', stmt.name);
  if (stmt.type === 'struct') {
    console.log('  annotations:', JSON.stringify(stmt.annotations));
    for (const f of stmt.fields) {
      console.log(`  field: ${f.name} (${f.fieldType})`, f.annotations ? JSON.stringify(f.annotations) : '');
    }
  }
}

console.log('\n=== ORM 코드젠 결과 ===');
const metas = generateORMMeta(parsedModule);
for (const m of metas) {
  console.log('struct:', m.structName, '→', m.tableName);
  console.log('  CREATE:', m.sql.createTable);
  console.log('  INSERT:', m.sql.insertAll);
}
