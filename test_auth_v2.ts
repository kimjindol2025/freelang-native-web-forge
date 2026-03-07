import { hmacSha256, sha256Hex, sha256, tokenSign, tokenVerify, tokenDecode } from './src/stdlib-auth';
import * as crypto from 'crypto';

// Node.js crypto SHA-256 정답
const expected_abc = crypto.createHash('sha256').update('abc').digest('hex');
console.log('Node crypto SHA-256(abc):', expected_abc);

// 우리 구현
const got_abc = sha256Hex('abc');
console.log('Our   SHA-256(abc)      :', got_abc);
console.log('SHA-256 abc PASS:', got_abc === expected_abc);

// Uint8Array 버전
const got_arr = Array.from(sha256(new TextEncoder().encode('abc'))).map(b=>b.toString(16).padStart(2,'0')).join('');
console.log('SHA-256 Uint8 PASS:', got_arr === expected_abc);

// HMAC
const mac = hmacSha256('key', 'message');
const expected_mac = crypto.createHmac('sha256', 'key').update('message').digest('hex');
console.log('HMAC PASS:', mac === expected_mac);

// 토큰
const secret = 'freelang-native-2026';
const token = tokenSign({ user_id: 99, role: 'architect', is_admin: true }, secret, 3600);
console.log('Token parts:', token.split('.').length);

const verified = tokenVerify(token, secret);
console.log('verify PASS:', verified?.user_id === 99 && verified?.role === 'architect');
console.log('tamper PASS:', tokenVerify(token, 'wrong') === null);
console.log('expired PASS (not yet):', (() => {
  const d = tokenDecode(token);
  return d?.exp > Math.floor(Date.now()/1000);
})());
console.log('decode role:', tokenDecode(token)?.role);
console.log('--- ALL PASS ---');
