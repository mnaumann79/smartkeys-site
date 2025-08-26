#!/usr/bin/env node

// Command-line script to test error handling endpoints
// Importance: Allows developers to test error handling without using the browser interface

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const errorTypes = ["validation", "authentication", "authorization", "database", "stripe", "license", "unexpected", "async"];

async function testError(errorType) {
  try {
    console.log(`\n🧪 Testing ${errorType} error...`);

    const response = await fetch(`${BASE_URL}/api/test/errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ errorType }),
    });

    const data = await response.json();

    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error testing ${errorType}:`, error.message);
    return { error: error.message };
  }
}

async function testAllErrors() {
  console.log("🚀 Starting error handling tests...\n");

  const results = {};

  for (const errorType of errorTypes) {
    results[errorType] = await testError(errorType);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("\n📋 Test Summary:");
  console.log("================");

  Object.entries(results).forEach(([errorType, result]) => {
    const status = result.status || "ERROR";
    const icon = result.status >= 400 ? "❌" : "✅";
    console.log(`${icon} ${errorType}: ${status}`);
  });

  console.log("\n✨ Error handling tests completed!");
}

async function testEndpointInfo() {
  try {
    console.log("🔍 Getting endpoint information...\n");

    const response = await fetch(`${BASE_URL}/api/test/errors`);
    const data = await response.json();

    console.log("📄 Endpoint Info:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Error getting endpoint info:", error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Error Handling Test Script

Usage:
  node scripts/test-errors.js [options]

Options:
  --info, -i     Get endpoint information
  --all, -a      Test all error types (default)
  --type <type>  Test specific error type
  --help, -h     Show this help message

Examples:
  node scripts/test-errors.js --all
  node scripts/test-errors.js --type validation
  node scripts/test-errors.js --info
    `);
    return;
  }

  if (args.includes("--info") || args.includes("-i")) {
    await testEndpointInfo();
    return;
  }

  if (args.includes("--type")) {
    const typeIndex = args.indexOf("--type");
    const errorType = args[typeIndex + 1];

    if (!errorType) {
      console.error("❌ Error type not specified");
      return;
    }

    if (!errorTypes.includes(errorType)) {
      console.error(`❌ Invalid error type. Available types: ${errorTypes.join(", ")}`);
      return;
    }

    await testError(errorType);
    return;
  }

  // Default: test all errors
  await testAllErrors();
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
