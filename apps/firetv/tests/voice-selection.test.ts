import {
  chooseVoice,
  scoreVoice,
  initialLeadInFor,
  getNarrationVoice,
  resetVoiceCache,
  NARRATION_RATE
} from '../src/features/player/data/voice-selection';

describe('narration voice selection', () => {
  beforeEach(() => resetVoiceCache());

  test('prefers the network voice over the embedded LSTM one', () => {
    // The embedded voice is the flat, mechanical default on this image.
    const chosen = chooseVoice([
      { identifier: 'en-us-x-iog-lstm-embedded', name: 'a', language: 'en-US', quality: 'Default' },
      { identifier: 'en-us-x-tpf-network', name: 'b', language: 'en-US', quality: 'Enhanced' }
    ]);
    expect(chosen?.identifier).toBe('en-us-x-tpf-network');
  });

  test('never selects a non-English voice', () => {
    const chosen = chooseVoice([
      { identifier: 'fr-fr-x-frd-network', name: 'f', language: 'fr-FR', quality: 'Enhanced' }
    ]);
    expect(chosen).toBeNull();
    expect(scoreVoice({ identifier: 'fr-fr-x-frd-network', name: 'f', language: 'fr-FR' })).toBeLessThan(0);
  });

  test('returns null rather than throwing when nothing is available', () => {
    expect(chooseVoice([])).toBeNull();
  });

  test('seeds a longer lead-in for network voices, which are slower to start', () => {
    expect(initialLeadInFor({ identifier: 'en-us-x-tpf-network', name: 'b' })).toBeGreaterThan(
      initialLeadInFor({ identifier: 'en-us-x-iog-lstm-embedded', name: 'a' })
    );
    expect(initialLeadInFor(null)).toBeGreaterThan(0);
  });

  test('resolves the device voice list and caches the result', async () => {
    const first = await getNarrationVoice();
    expect(first?.identifier).toBe('en-us-x-tpf-network');
    const second = await getNarrationVoice();
    expect(second).toBe(first);
  });

  test('narration rate is measured, not hurried', () => {
    expect(NARRATION_RATE).toBeGreaterThan(0.85);
    expect(NARRATION_RATE).toBeLessThanOrEqual(1.0);
  });
});
