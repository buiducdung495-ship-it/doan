// Cross-platform production entrypoint. Setting the mode before importing the
// server keeps Vite development middleware out of the production process.
process.env.NODE_ENV = "production";
await import("../server");

