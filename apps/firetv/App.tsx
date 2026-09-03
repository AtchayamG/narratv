import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { CatalogScreen } from './src/features/catalog/presentation/CatalogScreen';
import { PlayerScreen } from './src/features/player/presentation/PlayerScreen';
import { SystemStatusScreen } from './src/features/settings/presentation/SystemStatusScreen';
import { colors } from './src/core/theme';

export type ScreenState =
  | { name: 'Catalog'; params?: undefined }
  | { name: 'Player'; params: { titleId: string } }
  | { name: 'SystemStatus'; params?: undefined };

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('./assets/fonts/Inter.ttf'),
    SpaceGrotesk: require('./assets/fonts/SpaceGrotesk.ttf')
  });

  const [history, setHistory] = useState<ScreenState[]>([{ name: 'Catalog' }]);

  const currentScreen = history[history.length - 1];

  const navigation = {
    navigate: (name: string, params?: any) => {
      setHistory(prev => [...prev, { name: name as any, params }]);
    },
    goBack: () => {
      setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        navigation.goBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [history]);

  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {currentScreen.name === 'Catalog' && (
        <CatalogScreen navigation={navigation} />
      )}
      {currentScreen.name === 'Player' && (
        <PlayerScreen
          route={{ params: currentScreen.params || { titleId: 'sintel' } }}
          navigation={navigation}
        />
      )}
      {currentScreen.name === 'SystemStatus' && (
        <SystemStatusScreen navigation={navigation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});
