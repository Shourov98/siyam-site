import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const HOST = process.env.HOST ?? "localhost";
const parsedPort = Number.parseInt(process.env.PORT ?? "3000", 10);
const DEFAULT_PORT = Number.isNaN(parsedPort) ? 3000 : parsedPort;
const MAX_PORT_ATTEMPTS = 10;

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function getListeningPortsOnWindows() {
  const result = run("netstat", ["-ano", "-p", "tcp"]);
  if (result.status !== 0) {
    throw new Error("Failed to inspect TCP listeners with netstat.");
  }

  const ports = new Set();

  for (const line of result.stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("TCP")) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 4 || parts[3] !== "LISTENING") {
      continue;
    }

    const localAddress = parts[1];
    const separatorIndex = localAddress.lastIndexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const port = Number.parseInt(localAddress.slice(separatorIndex + 1), 10);
    if (!Number.isNaN(port)) {
      ports.add(port);
    }
  }

  return ports;
}

function getListeningPortsOnPosix() {
  const result = run("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"]);
  if (result.status !== 0) {
    throw new Error("Failed to inspect TCP listeners with lsof.");
  }

  const ports = new Set();

  for (const line of result.stdout.split(/\r?\n/).slice(1)) {
    const match = line.match(/:(\d+)\s+\(LISTEN\)$/);
    if (!match) {
      continue;
    }

    ports.add(Number.parseInt(match[1], 10));
  }

  return ports;
}

function isPortAvailable(port) {
  const listeningPorts =
    process.platform === "win32" ? getListeningPortsOnWindows() : getListeningPortsOnPosix();

  return !listeningPorts.has(port);
}

async function getAvailablePort(startPort) {
  console.log(`Checking for an available port starting at ${HOST}:${startPort}...`);

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    const port = startPort + attempt;
    if (await isPortAvailable(port)) {
      if (port === startPort) {
        console.log(`Port ${port} is free.`);
      } else {
        console.log(`Port ${startPort} is busy, using ${port} instead.`);
      }
      return port;
    }
  }

  console.error(`Could not find a free port between ${startPort} and ${startPort + MAX_PORT_ATTEMPTS - 1}.`);
  process.exit(1);
}

const port = await getAvailablePort(DEFAULT_PORT);

console.log(`Starting dev server on ${HOST}:${port}...`);

const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--webpack",
    "--hostname",
    HOST,
    "--port",
    String(port),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      WATCHPACK_POLLING: "true",
      WATCHPACK_POLLING_INTERVAL: "1000",
      CHOKIDAR_USEPOLLING: "true",
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
