const { ProgramRunner } = require('./dist/cli/runner');
const { Op } = require('./dist/types');

const r = new ProgramRunner();
const code = 'fn test() { let x = 5; println(x); return x } test()';
const ir = r.getIR(code);

console.log('Full IR:');
const opNames = {};
Object.entries(Op).forEach(([name, val]) => {
  if (typeof val === 'number') opNames[val] = name;
});

ir.forEach((inst, idx) => {
  const opName = opNames[inst.op] || `Op(${inst.op})`;
  console.log(`  [${idx}] ${opName} ${inst.arg !== undefined ? inst.arg : ''}`);
});
