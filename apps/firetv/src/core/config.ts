export interface AppConfig {
  demoMode: boolean;
  apiUrl: string;
  mediaCdnUrl: string;
  appRevision: string;
  version: string;
}

/**
 * Why none of this reads process.env any more.
 *
 * This file used to read process.env.DEMO_MODE and process.env.API_URL, and
 * the app told people to "Set DEMO_MODE=false" to get live inference. That
 * could never have worked, for two compounding reasons found while shooting
 * the demo video:
 *
 *  1. babel-preset-expo inlines only EXPO_PUBLIC_* names into a bundle. A bare
 *     DEMO_MODE is simply absent from the JS runtime on an Android device.
 *  2. babel.config.js calls api.cache(true), which caches transform output
 *     regardless of the environment. So even the EXPO_PUBLIC_ names were left
 *     as live `process.env.X` lookups instead of being replaced by values.
 *     Verified by reading assets/index.android.bundle straight out of the APK
 *     (ops-tools/inspect-apk-bundle.ps1): the endpoint URL was ABSENT and the
 *     string EXPO_PUBLIC_DEMO_MODE was PRESENT - the opposite of inlining.
 *
 * The net effect was that demoMode was permanently true and apiUrl permanently
 * empty, in every build, with no way to change either.
 *
 * So the endpoint is committed here instead. It holds no secret: the Lambda
 * behind it owns the AWS credentials, and the television only ever makes a
 * plain fetch(). That is the whole point of the architecture, and it is why a
 * runtime toggle is safe - switching to LIVE puts no key on the device.
 *
 * demoMode still DEFAULTS to true, so a judge who builds this repo with no
 * configuration gets the working no-credentials path, as the rules require.
 * It is switchable at runtime from the System Status screen, which is what
 * makes live Bedrock inference demonstrable without rebuilding.
 */

/** The deployed pipeline from services/pipeline. Public by design. */
export const DEPLOYED_API_URL =
  'https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com';

export const DEPLOYED_MEDIA_CDN_URL = 'https://d2ef099dzscscm.cloudfront.net';

export const config: AppConfig = {
  demoMode: true,
  apiUrl: DEPLOYED_API_URL,
  mediaCdnUrl: DEPLOYED_MEDIA_CDN_URL,
  appRevision: '2026.09.14-runtime-toggle.v5',
  version: '1.0.0'
};

type ModeListener = (demoMode: boolean) => void;
const listeners = new Set<ModeListener>();

/**
 * Flips between DEMO and LIVE at runtime. Callers that read config.demoMode
 * inside an event handler (the player's Describe button, the health probe)
 * pick the new value up on their next invocation; anything that needs to
 * re-render subscribes with onModeChange.
 */
export function setDemoMode(next: boolean): void {
  if (config.demoMode === next) return;
  config.demoMode = next;
  for (const listener of listeners) listener(next);
}

export function onModeChange(listener: ModeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** LIVE is only meaningful if we actually have somewhere to call. */
export function canGoLive(): boolean {
  return config.apiUrl.trim().length > 0;
}
