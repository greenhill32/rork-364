import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.75;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function SpinWheelScreen() {
  const insets = useSafeAreaInsets();
  const { setLuckyDay } = useApp();
  
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isSpinning, setIsSpinning] = useState(false);
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const daysInSelectedMonth = getDaysInMonth(selectedMonth, currentYear);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    triggerHaptic();

    const randomMonth = Math.floor(Math.random() * 12);
    const daysInMonth = getDaysInMonth(randomMonth, currentYear);
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1;

    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 5,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedMonth(randomMonth);
      setSelectedDay(randomDay);
      setIsSpinning(false);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    triggerHaptic();
    const newMonth = direction === 'prev' 
      ? (selectedMonth === 0 ? 11 : selectedMonth - 1)
      : (selectedMonth === 11 ? 0 : selectedMonth + 1);
    setSelectedMonth(newMonth);
    const maxDays = getDaysInMonth(newMonth, currentYear);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  };

  const handleDayChange = (direction: 'prev' | 'next') => {
    triggerHaptic();
    const maxDays = daysInSelectedMonth;
    const newDay = direction === 'prev'
      ? (selectedDay === 1 ? maxDays : selectedDay - 1)
      : (selectedDay === maxDays ? 1 : selectedDay + 1);
    setSelectedDay(newDay);
  };

  const handleConfirm = () => {
    triggerHaptic();
    const luckyDate = {
      month: selectedMonth,
      day: selectedDay,
      year: currentYear,
    };
    setLuckyDay(luckyDate);
    router.replace('/calendar');
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 5],
    outputRange: ['0deg', '1800deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <Text style={styles.title}>Pick Your</Text>
          <Text style={styles.titleGold}>Lucky Day</Text>
          <View style={styles.decorativeLine} />
        </View>

        <Text style={styles.instruction}>
          One day of the year when &quot;no&quot; becomes &quot;yes&quot;
        </Text>

        <View style={styles.wheelContainer}>
          <Animated.View 
            style={[
              styles.wheel, 
              { transform: [{ rotate: spinRotation }] }
            ]}
          >
            <View style={styles.wheelInner}>
              <Animated.View style={[styles.wheelGlow, { opacity: glowOpacity }]} />
              <View style={styles.dateDisplay}>
                <View style={styles.dateRow}>
                  <TouchableOpacity 
                    onPress={() => handleMonthChange('prev')} 
                    style={styles.arrowButton}
                    disabled={isSpinning}
                  >
                    <Text style={styles.arrowText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthText}>{MONTHS[selectedMonth]}</Text>
                  <TouchableOpacity 
                    onPress={() => handleMonthChange('next')} 
                    style={styles.arrowButton}
                    disabled={isSpinning}
                  >
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateRow}>
                  <TouchableOpacity 
                    onPress={() => handleDayChange('prev')} 
                    style={styles.arrowButton}
                    disabled={isSpinning}
                  >
                    <Text style={styles.arrowText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.dayText}>{selectedDay}</Text>
                  <TouchableOpacity 
                    onPress={() => handleDayChange('next')} 
                    style={styles.arrowButton}
                    disabled={isSpinning}
                  >
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        <TouchableOpacity 
          style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]} 
          onPress={handleSpin}
          activeOpacity={0.8}
          disabled={isSpinning}
        >
          <Text style={styles.spinButtonText}>
            {isSpinning ? 'Spinning...' : 'Spin to Randomize'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={isSpinning}
        >
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  decorativeLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.5,
    marginVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.cream,
    letterSpacing: 2,
  },
  titleGold: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 2,
  },
  instruction: {
    fontSize: 14,
    color: Colors.cream,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
  },
  wheelInner: {
    width: WHEEL_SIZE - 40,
    height: WHEEL_SIZE - 40,
    borderRadius: (WHEEL_SIZE - 40) / 2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  wheelGlow: {
    position: 'absolute',
    width: WHEEL_SIZE - 60,
    height: WHEEL_SIZE - 60,
    borderRadius: (WHEEL_SIZE - 60) / 2,
    backgroundColor: Colors.gold,
    opacity: 0.1,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  arrowButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 32,
    color: Colors.gold,
    fontWeight: '300',
  },
  monthText: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.cream,
    width: 80,
    textAlign: 'center',
  },
  dayText: {
    fontSize: 56,
    fontWeight: '300',
    color: Colors.gold,
    width: 80,
    textAlign: 'center',
  },
  spinButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gold,
    letterSpacing: 1,
  },
  confirmButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.backgroundDark,
    letterSpacing: 2,
  },
});
