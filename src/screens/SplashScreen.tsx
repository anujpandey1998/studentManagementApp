import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

type Props = { onFinish: () => void };

export default function SplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/vidyapp.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12343B' },
  image: { width: '100%', height: '100%' },
});
