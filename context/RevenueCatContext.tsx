import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesOfferings, 
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL 
} from 'react-native-purchases';

const REVENUECAT_API_KEY = 'test_nBATQtnaacwTUNBNNBapyAtKVDB';

interface RevenueCatState {
  isInitialized: boolean;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOfferings['current'] | null;
  customerInfo: CustomerInfo | null;
  isLoadingOfferings: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
}

export const [RevenueCatProvider, useRevenueCat] = createContextHook(() => {
  const [state, setState] = useState<RevenueCatState>({
    isInitialized: false,
    offerings: null,
    currentOffering: null,
    customerInfo: null,
    isLoadingOfferings: false,
    isPurchasing: false,
    isRestoring: false,
    error: null,
  });

  const initialize = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Skipping initialization on web');
      setState(prev => ({ ...prev, isInitialized: true }));
      return;
    }

    try {
      console.log('[RevenueCat] Initializing with API key');
      
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      
      await Purchases.configure({ 
        apiKey: REVENUECAT_API_KEY,
      });
      
      console.log('[RevenueCat] SDK configured successfully');

      const info = await Purchases.getCustomerInfo();
      console.log('[RevenueCat] Customer info:', {
        activeSubscriptions: info.activeSubscriptions,
        entitlements: Object.keys(info.entitlements.active),
      });

      setState(prev => ({
        ...prev,
        isInitialized: true,
        customerInfo: info,
      }));
    } catch (error) {
      console.error('[RevenueCat] Initialization failed:', error);
      setState({
        isInitialized: true,
        offerings: null,
        currentOffering: null,
        customerInfo: null,
        isLoadingOfferings: false,
        isPurchasing: false,
        isRestoring: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  }, []);

  const fetchOfferings = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Skipping fetch offerings on web');
      return;
    }

    setState(prev => ({ ...prev, isLoadingOfferings: true, error: null }));
    
    try {
      console.log('[RevenueCat] Fetching offerings');
      const offerings = await Purchases.getOfferings();
      
      console.log('[RevenueCat] Offerings fetched:', {
        current: offerings.current?.identifier,
        all: Object.keys(offerings.all),
        packages: offerings.current?.availablePackages.length,
      });

      setState(prev => ({
        ...prev,
        offerings,
        currentOffering: offerings.current,
        isLoadingOfferings: false,
      }));
    } catch (error) {
      console.error('[RevenueCat] Failed to fetch offerings:', error);
      setState(prev => ({
        ...prev,
        isLoadingOfferings: false,
        error: error instanceof Error ? error.message : 'Failed to fetch offerings',
      }));
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string; userCancelled?: boolean }> => {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Purchase not available on web');
      return { success: false, error: 'Not available on web' };
    }

    console.log('[RevenueCat] 🛒 Setting isPurchasing to true');
    setState(prev => ({ ...prev, isPurchasing: true, error: null }));
    
    try {
      console.log('[RevenueCat] 📦 Calling Purchases.purchasePackage for:', pkg.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      console.log('[RevenueCat] ✅ Purchase successful!', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
        isPremium: !!customerInfo.entitlements.active.premium,
      });

      console.log('[RevenueCat] 📝 Updating state with new customer info');
      setState(prev => ({
        ...prev,
        customerInfo,
        isPurchasing: false,
      }));

      console.log('[RevenueCat] 🎉 Returning success=true');
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('[RevenueCat] ❌ Purchase failed:', error);
      console.error('[RevenueCat] Error details:', {
        message: error.message,
        code: error.code,
        userCancelled: error.userCancelled,
      });
      
      const isUserCancelled = error.userCancelled || error.code === '1';
      
      console.log('[RevenueCat] User cancelled?', isUserCancelled);
      
      setState(prev => ({
        ...prev,
        isPurchasing: false,
        error: isUserCancelled ? null : (error.message || 'Purchase failed'),
      }));

      return { 
        success: false, 
        error: error.message || 'Purchase failed',
        userCancelled: isUserCancelled,
      };
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Restore not available on web');
      return { success: false, error: 'Not available on web' };
    }

    setState(prev => ({ ...prev, isRestoring: true, error: null }));
    
    try {
      console.log('[RevenueCat] Restoring purchases');
      
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('[RevenueCat] Restore successful:', {
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
      });

      setState(prev => ({
        ...prev,
        customerInfo,
        isRestoring: false,
      }));

      return { success: true, customerInfo };
    } catch (error) {
      console.error('[RevenueCat] Restore failed:', error);
      
      setState(prev => ({
        ...prev,
        isRestoring: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      }));

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }, []);

  const hasActiveEntitlement = useCallback((entitlementId: string = 'premium') => {
    if (Platform.OS === 'web') return false;
    
    if (!state.customerInfo) return false;
    
    const entitlement = state.customerInfo.entitlements.active[entitlementId];
    return !!entitlement;
  }, [state.customerInfo]);

  const refreshCustomerInfo = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      console.log('[RevenueCat] Refreshing customer info');
      const info = await Purchases.getCustomerInfo();
      
      setState(prev => ({
        ...prev,
        customerInfo: info,
      }));
      
      return info;
    } catch (error) {
      console.error('[RevenueCat] Failed to refresh customer info:', error);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    initialize,
    fetchOfferings,
    purchasePackage,
    restorePurchases,
    hasActiveEntitlement,
    refreshCustomerInfo,
  };
});
