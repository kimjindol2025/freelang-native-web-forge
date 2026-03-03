#!/usr/bin/env node

/**
 * Test: robot-ai-project 실행 가능성 검증
 */

const fs = require('fs');
const { ProgramRunner } = require('./dist/cli/runner');

const robotAiPath = '/home/kimjin/Desktop/kim/robot-ai-project/software/robot_ai_operational.fl';

console.log('🤖 Testing Robot AI FreeLang Execution\n');
console.log(`📁 File: ${robotAiPath}`);
console.log(`📄 Size: ${fs.statSync(robotAiPath).size} bytes\n`);

// 파일 내용 읽기
const source = fs.readFileSync(robotAiPath, 'utf-8');
const lines = source.split('\n');
const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

console.log(`📊 File stats:`);
console.log(`   Total lines: ${lines.length}`);
console.log(`   Code lines: ${codeLines}`);
console.log(`   Comments: ${lines.filter(l => l.trim().startsWith('//')).length}\n`);

// 실행
const runner = new ProgramRunner();
console.log('🚀 Executing robot_ai_operational.fl...\n');

const startTime = Date.now();
const result = runner.runString(source);
const executionTime = Date.now() - startTime;

console.log(`⏱️  Execution time: ${executionTime}ms\n`);

if (result.success) {
  console.log('✅ SUCCESS');
  console.log(`   Output: ${JSON.stringify(result.output).substring(0, 100)}...`);
} else {
  console.log('❌ FAILED');
  console.log(`   Error: ${result.error}`);
  console.log(`   Exit code: ${result.exitCode}`);
}

console.log(`\n📈 Result: ${result.success ? '✅ 실행 가능' : '❌ 실행 불가능'}`);
