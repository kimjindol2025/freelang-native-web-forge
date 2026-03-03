const { ProgramRunner } = require('./dist/cli/runner');

const tests = [
  {
    name: "Module level var",
    code: `let x = 5; println(x)`,
    expected: "5"
  },
  {
    name: "Function with var + return",
    code: `fn test() { let x = 5; return x } println(test())`,
    expected: "5"
  },
  {
    name: "Function with var + call builtin",
    code: `fn test() { let x = 5; println(x); return x } test()`,
    expected: "5"
  },
  {
    name: "Function with var + str() builtin",
    code: `fn test() { let x = 5; str(x); return x } test()`,
    expected: "5"
  },
  {
    name: "Nested: let y = x then call",
    code: `fn test() { let x = 5; let y = x; str(y); return y } test()`,
    expected: "5"
  },
];

const runner = new ProgramRunner();

tests.forEach((test, idx) => {
  const result = runner.runString(test.code);
  const status = result.success ? "✅" : "❌";
  console.log(`${status} [${idx+1}] ${test.name}`);
  if (!result.success) {
    console.log(`    Error: ${result.error?.substring(0, 80)}`);
  } else {
    console.log(`    Output: ${result.output}`);
  }
});
