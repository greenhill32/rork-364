import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 60) / 7;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 1).getDay();
}

export default function SpinWheelScreen() {
  const insets = useSafeAreaInsets();
  const { setLuckyDay } = useApp();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const prevArrowAnim = useRef(new Animated.Value(0)).current;
  const nextArrowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showSplashCeremony, setShowSplashCeremony] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const animateArrow = (animValue: Animated.Value, direction: 'left' | 'right') => {
    const startValue = direction === 'left' ? 0 : 10;
    const endValue = direction === 'left' ? -10 : 0;

    animValue.setValue(startValue);
    Animated.timing(animValue, {
      toValue: endValue,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePrevMonth = useCallback(() => {
    triggerHaptic();
    animateArrow(prevArrowAnim, 'left');
    if (selectedMonth === 0) {
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }, [selectedMonth, triggerHaptic]);

  const handleNextMonth = useCallback(() => {
    triggerHaptic();
    animateArrow(nextArrowAnim, 'right');
    if (selectedMonth === 11) {
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }, [selectedMonth, triggerHaptic]);

  const handleDayPress = (day: number) => {
    triggerHaptic();
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    triggerHaptic();
    const luckyDate = {
      month: selectedMonth,
      day: selectedDay,
      year: currentYear,
    };
    setLuckyDay(luckyDate);

    // Fade out to purple
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Show splash screen briefly
      setShowSplashCeremony(true);

      // After 350ms, start fading and navigate
      setTimeout(() => {
        // Navigate while still at full opacity
        router.replace('/calendar');

        // Then fade out the overlay
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }).start(() => {
          setShowSplashCeremony(false);
        });
      }, 1500);
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, currentYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, currentYear);
    const days: React.ReactElement[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === selectedDay;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDayCell,
          ]}
          onPress={() => handleDayPress(day)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Main Calendar Content */}
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <Text style={styles.title}>Pick Your</Text>
          <Text style={styles.titleGold}>Lucky Day</Text>
          <View style={styles.decorativeLine} />
        </View>

        <Text style={styles.instruction}>
          One day of the year when &quot;no&quot; becomes &quot;yes&quot;
        </Text>

        <View style={styles.monthHeader}>
          <Animated.View style={{ transform: [{ translateX: prevArrowAnim }] }}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <ChevronLeft size={28} color={Colors.gold} />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.monthText}>
            {MONTHS[selectedMonth]} {currentYear}
          </Text>

          <Animated.View style={{ transform: [{ translateX: nextArrowAnim }] }}>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <ChevronRight size={28} color={Colors.gold} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={index} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        <ScrollView
          style={styles.calendarScroll}
          contentContainerStyle={styles.calendarGrid}
          showsVerticalScrollIndicator={false}
        >
          {renderCalendarDays()}
        </ScrollView>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>

      {/* Ceremony Transition Overlay - sits on top */}
      <Animated.View
        style={[
          styles.fadeOverlay,
          { opacity: fadeAnim },
        ]}
        pointerEvents="none"
      >
        {showSplashCeremony && (
          <Image
            source={require('@/assets/images/curtains.png')}
            style={styles.splashImage}
            resizeMode="cover"
          />
        )}
      </Animated.View>
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
    paddingHorizontal: 20,
    zIndex: 1,
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
    marginBottom: 20,
    fontStyle: 'italic',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.cream,
    letterSpacing: 1,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
  },
  calendarScroll: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCell: {
    backgroundColor: Colors.gold,
    borderRadius: DAY_SIZE / 2,
  },
  dayText: {
    fontSize: 16,
    color: Colors.cream,
  },
  selectedDayText: {
    color: Colors.backgroundDark,
    fontWeight: '700',
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
    alignSelf: 'center',
    marginTop: 2,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.backgroundDark,
    letterSpacing: 2,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 999,
  },
  splashImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
