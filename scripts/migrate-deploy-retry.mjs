import { spawn } from "node:child_process";

const MAX_ATTEMPTS = Number(process.env.PRISMA_MIGRATE_MAX_ATTEMPTS || 5);
const BASE_DELAY_MS = Number(process.env.PRISMA_MIGRATE_RETRY_DELAY_MS || 4000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runMigrateDeploy() {
  return new Promise((resolve) => {
    const child = spawn("bunx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const exitCode = await runMigrateDeploy();
  if (exitCode === 0) {
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS) {
    process.exit(exitCode);
  }

  const delay = BASE_DELAY_MS * attempt;
  console.warn(
    `[migrate] Attempt ${attempt}/${MAX_ATTEMPTS} failed. Retrying in ${delay}ms...`
  );
  await sleep(delay);
}
