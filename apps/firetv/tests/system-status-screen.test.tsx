import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SystemStatusScreen } from '../src/features/settings/presentation/SystemStatusScreen';
import { config } from '../src/core/config';

describe('SystemStatusScreen Component', () => {
  beforeEach(() => {
    config.demoMode = true;
  });

  test('renders System Status & Diagnostics screen with provider checks', async () => {
    const mockNav = { goBack: jest.fn(), navigate: jest.fn() };

    render(<SystemStatusScreen navigation={mockNav} />);

    expect(await screen.findByText('System Status & Transparency')).toBeTruthy();
    expect(screen.getByText('Amazon Bedrock Multimodal')).toBeTruthy();
    expect(screen.getByText('Amazon Polly Neural TTS')).toBeTruthy();
    expect(screen.getByText('Deterministic Refusal Invariants')).toBeTruthy();
    expect(screen.getByText('Creative Commons Open Movie Credits')).toBeTruthy();
    expect(screen.getByText(/Sintel, Big Buck Bunny and Elephants Dream © Blender Foundation/i)).toBeTruthy();
    expect(screen.getByText(/durian\.blender\.org \| CC-BY 3\.0/i)).toBeTruthy();
    expect(screen.getByText('Refresh Status')).toBeTruthy();
    expect(screen.getByText('Back to Catalog')).toBeTruthy();
  });
});
