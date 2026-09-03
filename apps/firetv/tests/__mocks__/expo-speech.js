// Mirrors the subset of expo-speech the player uses. getAvailableVoicesAsync
// returns a realistic Fire TV voice list so voice selection is exercised rather
// than falling through to its "enumeration failed" path.
module.exports = {
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([
    { identifier: 'en-us-x-iog-lstm-embedded', name: 'en-us-x-iog-lstm-embedded', language: 'en-US', quality: 'Default' },
    { identifier: 'en-us-x-tpf-network', name: 'en-us-x-tpf-network', language: 'en-US', quality: 'Enhanced' },
    { identifier: 'fr-fr-x-frd-local', name: 'fr-fr-x-frd-local', language: 'fr-FR', quality: 'Default' }
  ])
};
