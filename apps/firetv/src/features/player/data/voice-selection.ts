import * as Speech from 'expo-speech';

/**
 * Voice selection for audio description.
 *
 * The default Fire TV / emulator voice is Google's embedded LSTM voice
 * (`en-us-x-iog-lstm-embedded`), which is the flat, mechanical one. Google TTS
 * ships several better voices on the same engine; the network ones in
 * particular are close to natural speech. Audio description is listened to for
 * a whole film, so voice quality is an accessibility concern, not a polish
 * item: a harsh voice is fatiguing and hurts comprehension.
 *
 * LIVE mode does not use this at all - it plays Amazon Polly neural audio
 * (Joanna) rendered by the pipeline. This picks the best DEVICE voice for the
 * offline/demo path.
 */

export interface NarrationVoice {
  identifier?: string;
  name: string;
  quality?: string;
  language?: string;
}

/** Speech rate for narration. Slightly under 1.0 reads as measured, not slow. */
export const NARRATION_RATE = 0.95;
export const NARRATION_PITCH = 1.0;

/** Families known to sound natural, best first. */
const PREFERRED_FAMILIES = [
  'en-us-x-tpf', // warm US female
  'en-us-x-tpc',
  'en-us-x-sfg',
  'en-gb-x-gba', // UK female, the classic AD register
  'en-gb-x-rjs',
  'en-us-x-iom',
  'en-us-x-iog'
];

export function scoreVoice(v: NarrationVoice): number {
  const id = (v.identifier || v.name || '').toLowerCase();
  const lang = (v.language || '').toLowerCase();
  if (!lang.startsWith('en')) return -1;

  let score = 0;

  // Network voices are markedly more natural than the embedded ones.
  if (id.includes('network')) score += 60;
  if (id.includes('embedded') || id.includes('local')) score -= 25;

  // Expo reports Enhanced for higher-quality system voices.
  if ((v.quality || '').toLowerCase() === 'enhanced') score += 40;

  const family = PREFERRED_FAMILIES.findIndex(f => id.includes(f));
  if (family >= 0) score += (PREFERRED_FAMILIES.length - family) * 5;

  // Prefer en-US/en-GB over regional variants we have not auditioned.
  if (lang.startsWith('en-us') || lang.startsWith('en-gb')) score += 10;

  return score;
}

export function chooseVoice(voices: NarrationVoice[]): NarrationVoice | null {
  const ranked = voices
    .map(v => ({ v, s: scoreVoice(v) }))
    .filter(x => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return ranked.length ? ranked[0].v : null;
}

let cached: NarrationVoice | null | undefined;

/**
 * Resolves once and caches. Returns null when the platform exposes no voice
 * list, in which case the engine default is used - narration must never fail
 * just because voice enumeration did.
 */
export async function getNarrationVoice(): Promise<NarrationVoice | null> {
  if (cached !== undefined) return cached;
  try {
    const voices = (await Speech.getAvailableVoicesAsync()) as unknown as NarrationVoice[];
    cached = chooseVoice(voices || []);
    if (cached) {
      console.log(
        `[narratv] narration voice: ${cached.identifier || cached.name} (${cached.language}, ${cached.quality || 'default'})`
      );
    } else {
      console.log('[narratv] no English voice enumerated; using engine default');
    }
  } catch (err) {
    console.warn('[narratv] voice enumeration failed; using engine default:', err);
    cached = null;
  }
  return cached;
}

/**
 * Starting lead-in for a given voice, before any utterance has been measured.
 *
 * Measured on the Fire TV image: the embedded voice becomes audible in ~0.6s,
 * the network voice in ~1.1s. Seeding from the voice class matters because the
 * rolling average needs a few utterances to converge, and until it does the
 * FIRST descriptions of a film land late - which is exactly where a viewer
 * forms their impression of whether the narration is in sync.
 */
export function initialLeadInFor(voice: NarrationVoice | null): number {
  const id = (voice?.identifier || voice?.name || '').toLowerCase();
  if (id.includes('network')) return 1.1;
  return 0.6;
}

/** Test seam. */
export function resetVoiceCache() {
  cached = undefined;
}
