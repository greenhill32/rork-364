import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
  Platform,
  PanResponder,
  GestureResponderEvent,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, X, Lock, RotateCcw, Settings } from 'lucide-react-native';
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

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { 
    isPurchased, 
    currentQuote, 
    remainingFreeTaps, 
    allTimeSeenCount,
    handleTap, 
    purchase,
    setPaidForTesting,
    hasRealPurchase,
    devForcePurchased,
    setCurrentQuote,
    isLuckyDay,
    clearLuckyDay,
    resetForTesting,
  } = useApp();
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showChangeLuckyDayModal, setShowChangeLuckyDayModal] = useState(false);
  const [isGoldQuote, setIsGoldQuote] = useState(false);
  const [visitedDays, setVisitedDays] = useState<Set<number>>(new Set());

  const isGoldFullScreen = isGoldQuote && isPurchased;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePrevMonth = useCallback(() => {
    triggerHaptic();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }, [currentMonth, currentYear, triggerHaptic]);

  const handleNextMonth = useCallback(() => {
    triggerHaptic();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }, [currentMonth, currentYear, triggerHaptic]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt: GestureResponderEvent, gestureState) => {
        const { dx } = gestureState;
        const threshold = 50;

        if (dx > threshold) {
          // Swiped right - go to previous month
          handlePrevMonth();
        } else if (dx < -threshold) {
          // Swiped left - go to next month
          handleNextMonth();
        }
      },
    })
  ).current;

  const handleDayPress = (day: number) => {
    triggerHaptic();
    // Add day to visited set (permanent greying)
    setVisitedDays(prev => new Set(prev).add(day));

    const isGold = isLuckyDay(currentMonth, day);

    if (isGold && !isPurchased) {
      setShowPurchaseModal(true);
      return;
    }

    const result = handleTap(isGold);

    if (result.needsPurchase) {
      setShowPurchaseModal(true);
      return;
    }

    if (result.success && result.quote) {
      setIsGoldQuote(result.isGold);
      setShowQuoteModal(true);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: isGold ? 220 : 320,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDayLongPress = (day: number) => {
    const isGold = isLuckyDay(currentMonth, day);
    if (isGold) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      setShowChangeLuckyDayModal(true);
    }
  };

  const handleChangeLuckyDay = async () => {
    await clearLuckyDay();
    setShowChangeLuckyDayModal(false);
    router.replace('/spin-wheel');
  };

  const handlePurchase = async () => {
    await purchase();
    setShowPurchaseModal(false);
    triggerHaptic();
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setCurrentQuote(null);
    setIsGoldQuote(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: React.ReactElement[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === new Date().getDate() && 
        currentMonth === new Date().getMonth() && 
        currentYear === new Date().getFullYear();

      const isGold = isLuckyDay(currentMonth, day);

      const isVisited = visitedDays.has(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && !isGold && styles.todayCell,
            isGold && styles.goldDayCell,
            isVisited && styles.clickedDayCell,
          ]}
          onPress={() => handleDayPress(day)}
          onLongPress={() => handleDayLongPress(day)}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dayText,
            isToday && !isGold && styles.todayText,
            isGold && styles.goldDayText,
            isVisited && styles.clickedDayText,
          ]}>
            {day}
          </Text>
          {isGold && <View style={styles.goldIndicator} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              triggerHaptic();
              router.push('/settings');
            }}
            activeOpacity={0.7}
          >
            <Settings size={24} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>364</Text>
          <Text style={styles.headerSubtitle}>WAYS TO SAY NO</Text>
          <Text style={styles.progressText} testID="quotes-progress">
            {Math.min(364, Math.max(0, allTimeSeenCount))}/364
          </Text>
        </View>

        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ChevronLeft size={28} color={Colors.gold} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight size={28} color={Colors.gold} />
          </TouchableOpacity>
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

        {!isPurchased && (
          <View style={styles.tapCounter}>
            <Text style={styles.tapCounterText}>
              {remainingFreeTaps} free {remainingFreeTaps === 1 ? 'tap' : 'taps'} remaining
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={() => setShowChangeLuckyDayModal(true)}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={Colors.gold} />
          <Text style={styles.resetButtonText}>Change Lucky Day</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.devResetButton} 
          onPress={async () => {
            await resetForTesting();
            router.replace('/');
          }}
          activeOpacity={0.7}
          testID="dev-reset-cache"
        >
          <Text style={styles.devResetText}>Reset Cache & Restart (Testing)</Text>
        </TouchableOpacity>

        <View style={styles.devRow} testID="dev-paid-flag-row">
          <View style={styles.devRowLeft}>
            <Text style={styles.devRowTitle}>Paid flag (testing)</Text>
            <Text style={styles.devRowSubtitle}>
              {hasRealPurchase ? 'Real purchase active' : devForcePurchased ? 'Forced ON' : 'Forced OFF'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.devPill, devForcePurchased && styles.devPillActive]}
            onPress={async () => {
              const next = !devForcePurchased;
              console.log('[Calendar] Toggling paid flag (testing)', { next });
              await setPaidForTesting(next);
            }}
            activeOpacity={0.85}
            testID="dev-toggle-paid-flag"
          >
            <Text style={[styles.devPillText, devForcePurchased && styles.devPillTextActive]}>
              {devForcePurchased ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showQuoteModal}
        transparent
        animationType="fade"
        onRequestClose={closeQuoteModal}
      >
        <View style={[styles.modalOverlay, isGoldFullScreen && styles.modalOverlayFull]}>
          <Animated.View
            style={[
              styles.quoteModal,
              { opacity: fadeAnim },
              isGoldQuote && styles.goldQuoteModal,
              isGoldFullScreen && styles.quoteModalFullScreen,
              isGoldFullScreen && {
                paddingTop: insets.top + 28,
                paddingBottom: insets.bottom + 24,
              },
              !isGoldFullScreen && isGoldQuote && isPurchased && styles.goldQuoteModalLarge,
            ]}
          >
            <TouchableOpacity
              testID="quote-modal-close"
              style={[styles.closeButton, isGoldFullScreen && styles.closeButtonFull]}
              onPress={closeQuoteModal}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.75}
            >
              <X size={26} color={Colors.gold} />
            </TouchableOpacity>

            {isGoldQuote && (
              <Image
                source={require('@/assets/images/wink.gif')}
                style={styles.winkGif}
              />
            )}

            <View style={styles.quoteDecorator}>
              <View style={styles.decorLine} />
              <View style={[styles.sparkle, isGoldQuote && styles.goldSparkle]} />
              <View style={styles.decorLine} />
            </View>
            
            <Text style={[styles.quoteText, isGoldQuote && styles.goldQuoteText]}>
              {isGoldQuote ? currentQuote : `"${currentQuote}"`}
            </Text>
            
            <View style={styles.quoteDecorator}>
              <View style={styles.decorLine} />
              <View style={[styles.sparkle, isGoldQuote && styles.goldSparkle]} />
              <View style={styles.decorLine} />
            </View>
            
            <TouchableOpacity 
              style={[styles.dismissButton, isGoldQuote && styles.goldDismissButton]} 
              onPress={closeQuoteModal}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>
                {isGoldQuote ? '😈' : 'Noted'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.purchaseModal}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowPurchaseModal(false)}
            >
              <X size={24} color={Colors.gold} />
            </TouchableOpacity>
            
            <Lock size={48} color={Colors.gold} style={styles.lockIcon} />
            
            <Text style={styles.purchaseTitle}>Unlock All 364</Text>
            <Text style={styles.purchaseDescription}>
              You have used your free excuses. Unlock the full collection of creative ways to say no.
            </Text>
            
            <TouchableOpacity 
              style={styles.purchaseButton} 
              onPress={handlePurchase}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseButtonText}>Unlock Now - $2.99</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowPurchaseModal(false)}
              style={styles.laterButton}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showChangeLuckyDayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangeLuckyDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changeLuckyDayModal}>
            <Text style={styles.changeLuckyDayTitle}>Change lucky day?</Text>
            
            <View style={styles.changeLuckyDayButtons}>
              <TouchableOpacity 
                style={styles.changeLuckyDayConfirm} 
                onPress={handleChangeLuckyDay}
                activeOpacity={0.8}
              >
                <Text style={styles.changeLuckyDayConfirmText}>Yes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.changeLuckyDayCancel} 
                onPress={() => setShowChangeLuckyDayModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.changeLuckyDayCancelText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.gold,
    fontStyle: 'italic',
    fontFamily: 'Didot',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 4,
    opacity: 0.8,
    fontFamily: 'Didot',
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.gold,
    opacity: 0.5,
    letterSpacing: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
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
  todayCell: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: DAY_SIZE / 2,
  },
  goldDayCell: {
    backgroundColor: Colors.gold,
    borderRadius: DAY_SIZE / 2,
  },
  dayText: {
    fontSize: 16,
    color: Colors.cream,
  },
  todayText: {
    color: Colors.gold,
    fontWeight: '600',
  },
  goldDayText: {
    color: Colors.backgroundDark,
    fontWeight: '700',
  },
  clickedDayCell: {
    opacity: 0.5,
  },
  clickedDayText: {
    opacity: 0.6,
  },
  goldIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundDark,
  },
  tapCounter: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  tapCounterText: {
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 14,
    color: Colors.gold,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayFull: {
    padding: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: Colors.overlay,
  },
  quoteModal: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goldQuoteModal: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  goldQuoteModalLarge: {
    maxWidth: 520,
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderRadius: 26,
  },
  quoteModalFullScreen: {
    flex: 1,
    width: '100%',
    maxWidth: undefined,
    borderRadius: 0,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  winkGif: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  closeButtonFull: {
    top: 16,
    right: 16,
    padding: 12,
  },
  quoteDecorator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  decorLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.5,
  },
  sparkle: {
    width: 8,
    height: 8,
    backgroundColor: Colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 12,
  },
  goldSparkle: {
    width: 12,
    height: 12,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  quoteText: {
    fontSize: 18,
    color: Colors.cream,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  goldQuoteText: {
    fontSize: 26,
    color: Colors.gold,
    fontWeight: '700',
    fontStyle: 'normal',
    lineHeight: 34,
  },
  dismissButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 46,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 22,
    minWidth: 180,
  },
  goldDismissButton: {
    backgroundColor: Colors.gold,
  },
  dismissButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.backgroundDark,
    letterSpacing: 1,
  },
  purchaseModal: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockIcon: {
    marginTop: 20,
    marginBottom: 16,
  },
  purchaseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 12,
  },
  purchaseDescription: {
    fontSize: 15,
    color: Colors.cream,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.backgroundDark,
    textAlign: 'center',
    letterSpacing: 1,
  },
  laterButton: {
    paddingVertical: 16,
  },
  laterButtonText: {
    fontSize: 14,
    color: Colors.cream,
    opacity: 0.7,
  },
  changeLuckyDayModal: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  changeLuckyDayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.cream,
    marginBottom: 24,
    textAlign: 'center',
  },
  changeLuckyDayButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  changeLuckyDayConfirm: {
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  changeLuckyDayConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.backgroundDark,
  },
  changeLuckyDayCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  changeLuckyDayCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gold,
  },
  devResetButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  devResetText: {
    fontSize: 12,
    color: Colors.cream,
    opacity: 0.4,
  },
  devRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 211, 0.12)',
    backgroundColor: 'rgba(42, 15, 42, 0.55)',
    marginBottom: 10,
  },
  devRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  devRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.cream,
    letterSpacing: 0.2,
  },
  devRowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.cream,
    opacity: 0.65,
  },
  devPill: {
    minWidth: 64,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  devPillActive: {
    borderColor: 'rgba(212, 175, 55, 0.8)',
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
  },
  devPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: Colors.gold,
  },
  devPillTextActive: {
    color: Colors.goldLight,
  },
});
