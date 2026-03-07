import { ProgramRunner } from './src/cli/runner';
import * as fs from 'fs';

const src = fs.readFileSync('./test-orm-compile.free', 'utf8');
const runner = new ProgramRunner();
const result = runner.runString(src);
console.log('success:', result.success);
if (result.output !== undefined) console.log('output:', result.output);
if ((result as any).error) console.log('error:', (result as any).error);
