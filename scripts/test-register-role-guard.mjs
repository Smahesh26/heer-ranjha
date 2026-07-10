import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const port = Number(process.env.SECURITY_TEST_PORT || 4010);
const baseUrl = `http://localhost:${port}`;
const require = createRequire(import.meta.url);
const nextCliPath = require.resolve("next/dist/bin/next");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRandomEmail(prefix) {
  return `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

function parseJsonSafe(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function waitForServerReady(proc, timeoutMs = 90_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes("Ready in") || text.includes("started server on") || text.includes(`http://localhost:${port}`)) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Next dev process exited before ready (code: ${code ?? "unknown"})`));
    };

    const timer = setInterval(() => {
      if (Date.now() - start > timeoutMs) {
        cleanup();
        reject(new Error("Timed out waiting for Next dev server to start"));
      }
    }, 500);

    function cleanup() {
      clearInterval(timer);
      proc.stdout?.off("data", onData);
      proc.stderr?.off("data", onData);
      proc.off("exit", onExit);
    }

    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("exit", onExit);
  });
}

async function stopServer(proc) {
  if (!proc || proc.killed) return;
  proc.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => proc.once("exit", resolve)),
    sleep(8_000).then(() => {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
    }),
  ]);
}

async function run() {
  const userEmail = createRandomEmail("role-guard");
  const adminEmail = createRandomEmail("role-guard-admin");

  console.log(`Starting Next dev on port ${port} for security regression check...`);

  const devProc = spawn(process.execPath, [nextCliPath, "dev", "-p", String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  devProc.stdout?.on("data", (d) => process.stdout.write(`[next] ${d}`));
  devProc.stderr?.on("data", (d) => process.stderr.write(`[next] ${d}`));

  try {
    await waitForServerReady(devProc);

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Role Guard",
        email: userEmail,
        password: "Password123",
        role: "ADMIN",
      }),
    });

    const registerText = await registerRes.text();
    const registerData = parseJsonSafe(registerText);

    if (!registerRes.ok) {
      throw new Error(`Expected register 200, got ${registerRes.status}. Body: ${registerText}`);
    }

    const role = registerData?.user?.role;
    if (role !== "CUSTOMER") {
      throw new Error(`Expected registered user role CUSTOMER, got: ${String(role)}`);
    }

    console.log("Public register role guard check: PASS (ADMIN payload became CUSTOMER)");

    const adminRegisterRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin Guard",
        email: adminEmail,
        password: "Password123",
      }),
    });

    if (!adminRegisterRes.ok) {
      const body = await adminRegisterRes.text();
      throw new Error(`Setup account creation failed: ${adminRegisterRes.status}. Body: ${body}`);
    }

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "Password123" }),
    });

    if (adminLoginRes.status !== 401) {
      const body = await adminLoginRes.text();
      throw new Error(`Expected admin login 401 for public user, got ${adminLoginRes.status}. Body: ${body}`);
    }

    console.log("Admin login guard check: PASS (customer cannot access admin login)");
    console.log("Security regression test passed.");
  } finally {
    await stopServer(devProc);
  }
}

run().catch((error) => {
  console.error("Security regression test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
