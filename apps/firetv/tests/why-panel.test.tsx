import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WhyPanel } from '../src/features/player/presentation/WhyPanel';
import { Description } from '@narratv/contracts';

describe('WhyPanel Component (Decision & Provenance Inspector)', () => {
  const mockDescription: Description = {
    id: 'desc-sintel-1',
    tStart: 12.4,
    tEnd: 16.9,
    text: 'Sintel pulls back her hood, gazing up at the icy stone towers.',
    confidence: 0.96,
    frameRef: 'sintel/frame_012.jpg',
    model: 'amazon.nova-pro-v1:0',
    status: 'ai-draft',
    placementRule: 'gap 00:12.4–00:16.9, 4.5 s, fits 11 words (2.8s)'
  };

  test('renders full provenance breakdown: model, confidence, frame, and placement formula', () => {
    render(<WhyPanel description={mockDescription} onClose={jest.fn()} />);

    expect(screen.getByText('Why This Description?')).toBeTruthy();
    expect(screen.getByText('Model: amazon.nova-pro-v1:0')).toBeTruthy();
    expect(screen.getByText('Confidence: 96%')).toBeTruthy();
    expect(screen.getByText('sintel/frame_012.jpg')).toBeTruthy();
    expect(screen.getByText('"Sintel pulls back her hood, gazing up at the icy stone towers."')).toBeTruthy();
    expect(screen.getByText('gap 00:12.4–00:16.9, 4.5 s, fits 11 words (2.8s)')).toBeTruthy();
  });

  test('renders null when description is null', () => {
    const { toJSON } = render(<WhyPanel description={null} onClose={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });
});
