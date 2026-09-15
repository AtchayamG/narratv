/**
 * The bug this pins, and why the fix looks the way it does.
 *
 * core/config.ts read process.env.DEMO_MODE and process.env.API_URL, and the
 * app told people to "Set DEMO_MODE=false" for live inference. That could not
 * work, for two compounding reasons:
 *
 *  1. babel-preset-expo inlines only EXPO_PUBLIC_* names into a bundle, so a
 *     bare DEMO_MODE does not exist in the device runtime at all.
 *  2. babel.config.js calls api.cache(true), so transform output is cached
 *     regardless of environment - even EXPO_PUBLIC_ names were left as live
 *     process.env lookups rather than replaced with values.
 *
 * Proved by reading the JS bundle out of the built APK: the endpoint URL was
 * ABSENT and the literal string EXPO_PUBLIC_DEMO_MODE was PRESENT, which is
 * the exact opposite of inlining. So demoMode was permanently true and apiUrl
 * permanently empty in every build ever produced.
 *
 * The fix stops depending on build-time environment entirely: the endpoint is
 * committed, demo mode still defaults to true, and the switch is made at
 * runtime. These tests exist so nobody reintroduces an env-var switch that
 * silently does nothing.
 */
import fs from 'node:fs';
import path from 'node:path';

const configPath = path.resolve(__dirname, '../src/core/config.ts');
const configSource = fs.readFileSync(configPath, 'utf8');

const freshConfig = () => {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../src/core/config');
};

describe('runtime config does not depend on build-time environment variables', () => {
  it('reads no process.env at all', () => {
    // The whole class of bug was "an env var that never arrives". The only
    // safe number of env reads in this file is zero.
    const withoutComments = configSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(withoutComments).not.toContain('process.env');
  });

  it('defaults to demo mode, so an unconfigured build still works for a judge', () => {
    const { config } = freshConfig();
    expect(config.demoMode).toBe(true);
  });

  it('ships a real endpoint so LIVE has somewhere to call', () => {
    const { config, canGoLive } = freshConfig();
    expect(config.apiUrl).toMatch(/^https:\/\//);
    expect(canGoLive()).toBe(true);
  });
});

describe('the mode can be switched at runtime', () => {
  it('flips demo mode and reports it back', () => {
    const { config, setDemoMode } = freshConfig();
    expect(config.demoMode).toBe(true);
    setDemoMode(false);
    expect(config.demoMode).toBe(false);
    setDemoMode(true);
    expect(config.demoMode).toBe(true);
  });

  it('notifies subscribers, and stops after unsubscribe', () => {
    const { setDemoMode, onModeChange } = freshConfig();
    const seen: boolean[] = [];
    const off = onModeChange((v: boolean) => seen.push(v));

    setDemoMode(false);
    setDemoMode(true);
    expect(seen).toEqual([false, true]);

    off();
    setDemoMode(false);
    expect(seen).toEqual([false, true]);
  });

  it('does not notify when the value is unchanged', () => {
    const { setDemoMode, onModeChange } = freshConfig();
    const seen: boolean[] = [];
    onModeChange((v: boolean) => seen.push(v));
    setDemoMode(true); // already true
    expect(seen).toEqual([]);
  });
});

describe('the LIVE-unavailable message does not name a broken switch', () => {
  const playerSource = fs.readFileSync(
    path.resolve(__dirname, '../src/features/player/presentation/PlayerScreen.tsx'),
    'utf8'
  );

  // There are several "LIVE ..." toasts in this screen - the demo-mode refusal
  // and a Bedrock error path among them. Match the demo-mode one by the switch
  // it advertises, not by a prefix that other toasts share.
  const demoToast = playerSource
    .split('\n')
    .find(line => line.includes('setToastMessage') && /LIVE is off/.test(line));

  it('no longer tells anyone to set an environment variable', () => {
    expect(demoToast).toBeDefined();
    // Scope this to the strings a user can actually read. The source still
    // mentions DEMO_MODE=false in a comment explaining why it was wrong, and
    // that comment is the point - it should not be what trips the test.
    const userFacingToasts = playerSource
      .split('\n')
      .filter(line => line.includes('setToastMessage('));
    for (const toast of userFacingToasts) {
      expect(toast).not.toContain('DEMO_MODE=false');
    }
  });

  it('points at the System Status screen, which is where the switch now lives', () => {
    expect(demoToast).toMatch(/System Status/i);
  });
});
