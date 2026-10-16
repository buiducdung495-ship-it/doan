// Bundle the server with the project's installed esbuild so the same command
// works on machines that have Node.js but not the Bun runtime.
import { build } from "esbuild";
import path from "node:path";

await build({
  absWorkingDir: process.cwd(),
  entryPoints: [path.resolve(process.cwd(), "server.ts")],
  platform: "node",
  target: "node22",
  format: "cjs",
  packages: "external",
  outfile: "./dist/server.cjs",
  sourcemap: true,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});
console.log("Built dist/server.cjs for Node.js");
