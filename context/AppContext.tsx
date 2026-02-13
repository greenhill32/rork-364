import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { POOL_A_QUOTES, POOL_B_QUOTES, GOLD_QUOTE, FREE_TAP_LIMIT } from '@/data/quotes';
import { useRevenueCat } from '@/context/RevenueCatContext';

export interface LuckyDay {
  month: number;
  day: number;
  year: number;
}

const STORAGE_KEYS = {
  PURCHASED: 'app_purchased',
  DEV_FORCE_PURCHASED: 'dev_force_purchased',
  TAP_COUNT: 'tap_count',
  USED_POOL_A_INDICES: 'used_pool_a_indices',
  USED_POOL_B_INDICES: 'used_pool_b_indices',
  LUCKY_DAY: 'lucky_day',
  ALL_TIME_SEEN_QUOTES: 'all_time_seen_quotes',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const { hasActiveEntitlement, customerInfo } = useRevenueCat();
  const [isPurchased, setIsPurchased] = useState(false);
  const [devForcePurchased, setDevForcePurchased] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [usedPoolAIndices, setUsedPoolAIndices] = useState<number[]>([]);
  const [usedPoolBIndices, setUsedPoolBIndices] = useState<number[]>([]);
  const [allTimeSeenQuotes, setAllTimeSeenQuotes] = useState<string[]>([]);
  const [currentQuote, setCurrentQuote] = useState<string | null>(null);
  const [luckyDay, setLuckyDayState] = useState<LuckyDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [purchased, devPurchased, taps, usedA, usedB, storedLuckyDay, storedAllTimeSeen] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PURCHASED),
          AsyncStorage.getItem(STORAGE_KEYS.DEV_FORCE_PURCHASED),
          AsyncStorage.getItem(STORAGE_KEYS.TAP_COUNT),
          AsyncStorage.getItem(STORAGE_KEYS.USED_POOL_A_INDICES),
          AsyncStorage.getItem(STORAGE_KEYS.USED_POOL_B_INDICES),
          AsyncStorage.getItem(STORAGE_KEYS.LUCKY_DAY),
          AsyncStorage.getItem(STORAGE_KEYS.ALL_TIME_SEEN_QUOTES),
        ]);

        const isDevPurchased = devPurchased === 'true';
        console.log('[AppContext] Loaded flags', { purchased, devPurchased: isDevPurchased });

        if (purchased === 'true') setIsPurchased(true);
        if (isDevPurchased) setDevForcePurchased(true);
        if (taps) setTapCount(parseInt(taps, 10));
        if (usedA) setUsedPoolAIndices(JSON.parse(usedA));
        if (usedB) setUsedPoolBIndices(JSON.parse(usedB));
        if (storedLuckyDay) setLuckyDayState(JSON.parse(storedLuckyDay));
        if (storedAllTimeSeen) {
          const parsed = JSON.parse(storedAllTimeSeen) as unknown;
          if (Array.isArray(parsed)) {
            setAllTimeSeenQuotes(parsed.filter((q): q is string => typeof q === 'string'));
          }
        }
      } catch (error) {
        console.log('Error loading app data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const syncRevenueCat = hasActiveEntitlement('premium');
    console.log('[AppContext] RevenueCat sync:', { syncRevenueCat, customerInfo: !!customerInfo });
    if (syncRevenueCat && !isPurchased) {
      console.log('[AppContext] ✅ Premium unlocked via RevenueCat!');
      setIsPurchased(true);
      AsyncStorage.setItem(STORAGE_KEYS.PURCHASED, 'true').catch(() => undefined);
    }
  }, [customerInfo, hasActiveEntitlement, isPurchased]);

  const setLuckyDay = useCallback(async (day: LuckyDay) => {
    setLuckyDayState(day);
    await AsyncStorage.setItem(STORAGE_KEYS.LUCKY_DAY, JSON.stringify(day));
  }, []);

  const clearLuckyDay = useCallback(async () => {
    setLuckyDayState(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.LUCKY_DAY);
  }, []);

  const isLuckyDay = useCallback((month: number, day: number) => {
    if (!luckyDay) return false;
    return luckyDay.month === month && luckyDay.day === day;
  }, [luckyDay]);

  const isEntitled = useMemo(() => {
    const revenueCatActive = hasActiveEntitlement('premium');
    return isPurchased || devForcePurchased || revenueCatActive;
  }, [isPurchased, devForcePurchased, hasActiveEntitlement]);

  const canGetFreeQuote = useMemo(() => {
    return !isEntitled && tapCount < FREE_TAP_LIMIT;
  }, [isEntitled, tapCount]);

  const remainingFreeTaps = useMemo(() => {
    return Math.max(0, FREE_TAP_LIMIT - tapCount);
  }, [tapCount]);

  const trackAllTimeSeenQuote = useCallback((quote: string) => {
    setAllTimeSeenQuotes((prev) => {
      if (prev.includes(quote)) return prev;
      const next = [...prev, quote];
      AsyncStorage.setItem(STORAGE_KEYS.ALL_TIME_SEEN_QUOTES, JSON.stringify(next)).catch((e) => {
        console.log('[AppContext] Failed to persist all-time seen quotes', e);
      });
      return next;
    });
  }, []);

  const getRandomQuote = useCallback((isGoldDay: boolean = false) => {
    if (isGoldDay) {
      trackAllTimeSeenQuote(GOLD_QUOTE);
      return GOLD_QUOTE;
    }

    const pool = isEntitled ? POOL_B_QUOTES : POOL_A_QUOTES;
    const usedIndices = isEntitled ? usedPoolBIndices : usedPoolAIndices;

    const availableIndices = pool
      .map((_, index) => index)
      .filter((index) => !usedIndices.includes(index));

    if (availableIndices.length === 0) {
      if (isEntitled) {
        setUsedPoolBIndices([]);
        AsyncStorage.setItem(STORAGE_KEYS.USED_POOL_B_INDICES, JSON.stringify([])).catch(() => undefined);
      } else {
        setUsedPoolAIndices([]);
        AsyncStorage.setItem(STORAGE_KEYS.USED_POOL_A_INDICES, JSON.stringify([])).catch(() => undefined);
      }
      const quote = pool[Math.floor(Math.random() * pool.length)];
      trackAllTimeSeenQuote(quote);
      return quote;
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newUsedIndices = [...usedIndices, randomIndex];

    if (isEntitled) {
      setUsedPoolBIndices(newUsedIndices);
      AsyncStorage.setItem(STORAGE_KEYS.USED_POOL_B_INDICES, JSON.stringify(newUsedIndices)).catch(() => undefined);
    } else {
      setUsedPoolAIndices(newUsedIndices);
      AsyncStorage.setItem(STORAGE_KEYS.USED_POOL_A_INDICES, JSON.stringify(newUsedIndices)).catch(() => undefined);
    }

    const quote = pool[randomIndex];
    trackAllTimeSeenQuote(quote);
    return quote;
  }, [isEntitled, trackAllTimeSeenQuote, usedPoolAIndices, usedPoolBIndices]);

  const handleTap = useCallback((isGoldDay: boolean = false) => {
    if (isGoldDay) {
      const quote = getRandomQuote(true);
      setCurrentQuote(quote);
      return { success: true, needsPurchase: false, quote, isGold: true };
    }

    if (!isEntitled && tapCount >= FREE_TAP_LIMIT) {
      return { success: false, needsPurchase: true, quote: null, isGold: false };
    }

    const quote = getRandomQuote(false);
    setCurrentQuote(quote);

    if (!isEntitled) {
      const newTapCount = tapCount + 1;
      setTapCount(newTapCount);
      AsyncStorage.setItem(STORAGE_KEYS.TAP_COUNT, newTapCount.toString());
    }

    return { success: true, needsPurchase: false, quote, isGold: false };
  }, [isEntitled, tapCount, getRandomQuote]);

  const purchase = useCallback(async () => {
    console.log('[AppContext] purchase() - Setting purchased state');
    setIsPurchased(true);
    await AsyncStorage.setItem(STORAGE_KEYS.PURCHASED, 'true');
    console.log('[AppContext] ✅ Purchase state saved!');
    
    Alert.alert(
      '🎉 Success!',
      'Premium access unlocked! You now have full access to all quotes.',
      [{ text: 'Awesome!', style: 'default' }]
    );
  }, []);

  const setPaidForTesting = useCallback(async (paid: boolean) => {
    console.log('[AppContext] setPaidForTesting()', { paid });
    setDevForcePurchased(paid);
    await AsyncStorage.setItem(STORAGE_KEYS.DEV_FORCE_PURCHASED, paid ? 'true' : 'false');
  }, []);

  const resetForTesting = useCallback(async () => {
    console.log('[AppContext] resetForTesting()');
    setIsPurchased(false);
    setDevForcePurchased(false);
    setTapCount(0);
    setUsedPoolAIndices([]);
    setUsedPoolBIndices([]);
    setAllTimeSeenQuotes([]);
    setCurrentQuote(null);
    setLuckyDayState(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PURCHASED),
      AsyncStorage.removeItem(STORAGE_KEYS.DEV_FORCE_PURCHASED),
      AsyncStorage.removeItem(STORAGE_KEYS.TAP_COUNT),
      AsyncStorage.removeItem(STORAGE_KEYS.USED_POOL_A_INDICES),
      AsyncStorage.removeItem(STORAGE_KEYS.USED_POOL_B_INDICES),
      AsyncStorage.removeItem(STORAGE_KEYS.LUCKY_DAY),
      AsyncStorage.removeItem(STORAGE_KEYS.ALL_TIME_SEEN_QUOTES),
    ]);
  }, []);

  const allTimeSeenCount = useMemo(() => {
    return new Set(allTimeSeenQuotes).size;
  }, [allTimeSeenQuotes]);

  return {
    isPurchased: isEntitled,
    hasRealPurchase: isPurchased,
    devForcePurchased,
    tapCount,
    currentQuote,
    canGetFreeQuote,
    remainingFreeTaps,
    isLoading,
    luckyDay,
    allTimeSeenCount,
    handleTap,
    purchase,
    setPaidForTesting,
    resetForTesting,
    setCurrentQuote,
    setLuckyDay,
    clearLuckyDay,
    isLuckyDay,
  };
});
