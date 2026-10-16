import { spawnSync } from 'node:child_process';
const result = await Bun.build({
  entrypoints: ['./tests/hr.test.ts'], target: 'node', format: 'cjs',
  packages: 'external', outdir: './work', naming: 'hr.test.cjs',
});
if (!result.success) { console.error(result.logs); process.exit(1); }
const test = spawnSync('node', ['--test', 'work/hr.test.cjs'], { stdio: 'inherit' });
if (test.error) console.error(test.error);
process.exit(test.status ?? 1);
