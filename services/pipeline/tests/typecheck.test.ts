import { spawnSync } from 'child_process';
import * as path from 'path';

describe('Monorepo Typecheck Gate', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  test('monorepo typecheck script exits 0 across all workspaces with no TypeScript diagnostics', () => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'yarn.cmd' : 'yarn';
    const result = spawnSync(cmd, ['typecheck'], {
      cwd: rootDir,
      encoding: 'utf-8',
      shell: true,
      timeout: 60000
    });

    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const combinedOutput = `${stdout}\n${stderr}`.trim();

    if (result.status !== 0) {
      // eslint-disable-next-line no-console
      console.error('Typecheck failure output:\n' + combinedOutput);
    }

    expect(result.error).toBeUndefined();
    expect(combinedOutput).not.toMatch(/error TS\d+:/);
    expect(result.status).toBe(0);
  }, 60000);
});
