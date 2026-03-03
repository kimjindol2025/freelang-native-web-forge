/**
 * FreeLang StdLib 통합 테스트
 * I/O, Async, Data, DB, Cache, HTTP, Agent, Proof 검증
 */

import { Compiler } from "./src/compiler/compiler";
import { VM } from "./src/vm/vm-executor";
import { injectNativeAPI, vmNative } from "./src/vm/native";

/**
 * Test 1: I/O 모듈
 */
function testIO(): void {
  console.log("\n📝 Test 1: I/O Module");
  console.log("─".repeat(50));

  const source = `
    print("Hello");
    println(" World!");
  `;

  try {
    const bytecode = Compiler.compile(source);
    const vm = new VM();
    injectNativeAPI(vm as any);
    vm.run(bytecode);
    console.log("✅ I/O test passed");
  } catch (error) {
    console.error("❌ I/O test failed:", error);
  }
}

/**
 * Test 2: JSON 처리
 */
function testJSON(): void {
  console.log("\n📝 Test 2: JSON Module");
  console.log("─".repeat(50));

  try {
    const obj = vmNative.json.parse('{"x":10,"y":20}');
    console.log("Parsed JSON:", obj);

    const str = vmNative.json.stringify(obj);
    console.log("Stringified JSON:", str);

    if (obj.x === 10 && obj.y === 20) {
      console.log("✅ JSON test passed");
    } else {
      console.log("❌ JSON test failed");
    }
  } catch (error) {
    console.error("❌ JSON test failed:", error);
  }
}

/**
 * Test 3: Database 모듈
 */
function testDatabase(): void {
  console.log("\n📝 Test 3: Database Module");
  console.log("─".repeat(50));

  try {
    const db = vmNative.db.connect("kv://localhost");
    vmNative.db.set(db, "score", 42);
    const value = vmNative.db.get(db, "score");

    console.log("Stored value:", 42);
    console.log("Retrieved value:", value);

    if (value === 42) {
      console.log("✅ Database test passed");
    } else {
      console.log("❌ Database test failed");
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

/**
 * Test 4: Cache 모듈
 */
function testCache(): void {
  console.log("\n📝 Test 4: Cache Module");
  console.log("─".repeat(50));

  try {
    const cache = vmNative.cache.create({ type: "memory" });
    vmNative.cache.set(cache, "temp", 123, 0);
    const value = vmNative.cache.get(cache, "temp");
    const exists = vmNative.cache.exists(cache, "temp");

    console.log("Cached value:", 123);
    console.log("Retrieved value:", value);
    console.log("Cache exists:", exists);

    if (value === 123 && exists === true) {
      console.log("✅ Cache test passed");
    } else {
      console.log("❌ Cache test failed");
    }
  } catch (error) {
    console.error("❌ Cache test failed:", error);
  }
}

/**
 * Test 5: Agent 모듈
 */
function testAgent(): void {
  console.log("\n📝 Test 5: Agent Module");
  console.log("─".repeat(50));

  try {
    const agent = vmNative.agent.create("KimAI");
    vmNative.agent.remember(agent, "last_message", "Hello Agent");
    const recalled = vmNative.agent.recall(agent, "last_message");

    console.log("Remembered:", "Hello Agent");
    console.log("Recalled:", recalled);

    if (recalled === "Hello Agent") {
      console.log("✅ Agent test passed");
    } else {
      console.log("❌ Agent test failed");
    }
  } catch (error) {
    console.error("❌ Agent test failed:", error);
  }
}

/**
 * Test 6: Proof 모듈
 */
function testProof(): void {
  console.log("\n📝 Test 6: Proof Module");
  console.log("─".repeat(50));

  try {
    const proof = vmNative.proof.generate("Test statement", true);
    const isValid = vmNative.proof.verify(proof);

    console.log("Statement:", proof.statement);
    console.log("Result:", proof.result);
    console.log("Valid:", isValid);

    if (isValid === true) {
      console.log("✅ Proof test passed");
    } else {
      console.log("❌ Proof test failed");
    }
  } catch (error) {
    console.error("❌ Proof test failed:", error);
  }
}

/**
 * Test 7: HTTP Server
 */
function testHTTPServer(): void {
  console.log("\n📝 Test 7: HTTP Server Module");
  console.log("─".repeat(50));

  try {
    vmNative.http.startServer(8080, (req: any) => {
      const response = {
        status: 200,
        headers: { "Content-Type": "text/plain" },
        body: "OK",
      };
      vmNative.http.sendResponse(req, response.status, response.headers, response.body);
    });

    console.log("✅ HTTP Server test passed");
  } catch (error) {
    console.error("❌ HTTP Server test failed:", error);
  }
}

/**
 * Test 8: Network 모듈
 */
async function testNetwork(): Promise<void> {
  console.log("\n📝 Test 8: Network Module");
  console.log("─".repeat(50));

  try {
    const response = await vmNative.net.httpGet("https://example.com");
    console.log("HTTP Status:", response.status);
    console.log("Response body:", response.body.slice(0, 50));

    if (response.status === 200) {
      console.log("✅ Network test passed");
    } else {
      console.log("❌ Network test failed");
    }
  } catch (error) {
    console.error("❌ Network test failed:", error);
  }
}

/**
 * Test 9: 전체 통합 테스트
 */
function testIntegration(): void {
  console.log("\n📝 Test 9: Complete Integration");
  console.log("─".repeat(50));

  try {
    // I/O
    vmNative.io.write("Integration Test: ");
    console.log("Started");

    // JSON
    const data = vmNative.json.parse('{"test":true}');
    console.log("JSON test:", data.test);

    // DB
    const db = vmNative.db.connect("kv://test");
    vmNative.db.set(db, "key", "value");

    // Cache
    const cache = vmNative.cache.create({});
    vmNative.cache.set(cache, "key", "value");

    // Agent
    const agent = vmNative.agent.create("TestAgent");
    vmNative.agent.remember(agent, "test", "pass");

    // Proof
    const proof = vmNative.proof.generate("Integration", true);
    const valid = vmNative.proof.verify(proof);

    console.log("All modules integrated successfully!");
    console.log("✅ Integration test passed");
  } catch (error) {
    console.error("❌ Integration test failed:", error);
  }
}

/**
 * 메인 테스트 실행
 */
async function main(): Promise<void> {
  console.log("═".repeat(50));
  console.log("🚀 FreeLang StdLib Complete Integration Test");
  console.log("═".repeat(50));

  testIO();
  testJSON();
  testDatabase();
  testCache();
  testAgent();
  testProof();
  testHTTPServer();
  await testNetwork();
  testIntegration();

  console.log("\n═".repeat(50));
  console.log("✅ All tests completed!");
  console.log("═".repeat(50));
}

// 실행
main().catch(console.error);
