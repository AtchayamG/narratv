import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radii } from '../core/theme';

export interface TruthPillProps {
  isLive?: boolean;
  latencyMs?: number;
}

export const TruthPill: React.FC<TruthPillProps> = ({ isLive = false, latencyMs }) => {
  return (
    <View
      style={[
        styles.container,
        isLive ? styles.liveContainer : styles.demoContainer
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={isLive ? `Live Mode Active${latencyMs ? `, ${latencyMs} milliseconds` : ''}` : 'Demo Mode Active, using deterministic local fixtures'}
    >
      <View style={[styles.dot, isLive ? styles.liveDot : styles.demoDot]} />
      <Text style={[styles.text, isLive ? styles.liveText : styles.demoText]}>
        {isLive ? `LIVE ${latencyMs ? `· ${latencyMs}ms` : ''}` : 'DEMO MODE'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1.5
  },
  demoContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.primary
  },
  liveContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginRight: 6
  },
  demoDot: {
    backgroundColor: colors.primary
  },
  liveDot: {
    backgroundColor: colors.error
  },
  text: {
    ...typography.badge,
    fontSize: 12
  },
  demoText: {
    color: colors.primary
  },
  liveText: {
    color: colors.error
  }
});
