import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(
    () =>
      NetInfo.addEventListener(state => {
        setIsOffline(
          state.isConnected === false || state.isInternetReachable === false,
        );
      }),
    [],
  );

  if (!isOffline) {
    return null;
  }

  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <Text style={styles.text}>You're offline · showing saved data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#7A3E00',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  text: { color: '#FFFFFF', textAlign: 'center', fontWeight: '600' },
});
