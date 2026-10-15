import { spawn } from "node:child_process";
const mode = process.argv[2] || "dev";
if (!["dev", "build", "start"].includes(mode)) throw new Error("dev, build, start 중 하나를 지정해 주세요.");
const args = ["node_modules/next/dist/bin/next", mode, ...(mode === "build" ? [] : ["--hostname", "127.0.0.1", "--port", process.env.PORT || "3100"])];
const child = spawn(process.execPath, args, { stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_DEMO_MODE: "false" } });
child.on("exit", code => { process.exitCode = code ?? 1; });
