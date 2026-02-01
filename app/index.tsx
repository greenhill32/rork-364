import { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/about');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dw5cqqo9ifwkheb98ipzl' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  },
});
