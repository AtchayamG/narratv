import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TruthPill } from '../src/shared/TruthPill';

describe('TruthPill & Runtime Truth Verification', () => {
  test('renders DEMO MODE when isLive is false', () => {
    render(<TruthPill isLive={false} />);
    expect(screen.getByText('DEMO MODE')).toBeTruthy();
    expect(screen.queryByText(/LIVE/)).toBeNull();
  });

  test('renders LIVE with latency indicator when isLive is true', () => {
    render(<TruthPill isLive={true} latencyMs={340} />);
    expect(screen.getByText(/LIVE/)).toBeTruthy();
    expect(screen.getByText(/340ms/)).toBeTruthy();
  });
});
