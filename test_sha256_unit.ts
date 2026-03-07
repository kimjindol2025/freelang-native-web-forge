import { hmacSha256, sha256, tokenSign, tokenVerify, tokenDecode } from './src/stdlib-auth';

const enc = new TextEncoder();

// NIST SHA-256 벡터
function toHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('');
}

const v1 = toHex(sha256(enc.encode('')));
const v2 = toHex(sha256(enc.encode('abc')));
const v3 = toHex(sha256(enc.encode('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')));

console.log('SHA-256 empty PASS:', v1 === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
console.log('SHA-256 abc   PASS:', v2 === 'ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469348423f656b6a567d');
console.log('SHA-256 long  PASS:', v3 === '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
if (v2 !== 'ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469348423f656b6a567d') {
  console.log('got:', v2);
}

// HMAC-SHA256 RFC 4231 TC1: key=0b*20, data='Hi There'
const key1Bytes = new Uint8Array(20).fill(0x0b);
const key1 = Array.from(key1Bytes).map(b => String.fromCharCode(b)).join('');
const mac1 = hmacSha256(key1, 'Hi There');
console.log('HMAC TC1 PASS:', mac1 === 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
if (mac1 !== 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7') {
  console.log('got:', mac1);
}

// 토큰
const secret = 'freelang-native-2026';
const token = tokenSign({ user_id: 99, role: 'architect' }, secret, 3600);
const verified = tokenVerify(token, secret);
console.log('token verify:', (verified?.user_id === 99 && verified?.role === 'architect') ? 'PASS' : 'FAIL');
console.log('tamper detect:', tokenVerify(token, 'wrong-secret') === null ? 'PASS' : 'FAIL');
console.log('decode role:', tokenDecode(token)?.role);
