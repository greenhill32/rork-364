import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { PurchasesPackage } from 'react-native-purchases';

export default function Subscription() {
  const insets = useSafeAreaInsets();
  const {
    isInitialized,
    currentOffering,
    isLoadingOfferings,
    isPurchasing,
    error,
    fetchOfferings,
    purchasePackage,
    hasActiveEntitlement,
  } = useRevenueCat();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const isPremium = hasActiveEntitlement('premium');

  useEffect(() => {
    if (isInitialized && !currentOffering && !isLoadingOfferings) {
      fetchOfferings();
    }
  }, [isInitialized, currentOffering, isLoadingOfferings, fetchOfferings]);

  useEffect(() => {
    if (currentOffering?.availablePackages && currentOffering.availablePackages.length > 0) {
      setSelectedPackage(currentOffering.availablePackages[0]);
    }
  }, [currentOffering]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleBack = useCallback(() => {
    triggerHaptic();
    router.back();
  }, [triggerHaptic]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) return;
    
    triggerHaptic();

    const result = await purchasePackage(selectedPackage);
    
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        '🎉 Purchase Successful!',
        'You now have premium access to all quotes and features. Enjoy!',
        [
          {
            text: 'Start Exploring',
            onPress: () => {
              router.back();
            },
            style: 'default',
          },
        ]
      );
    } else if (result.error && !result.userCancelled) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Purchase Failed', result.error);
    }
  }, [selectedPackage, purchasePackage, triggerHaptic]);

  const handlePackageSelect = useCallback((pkg: PurchasesPackage) => {
    triggerHaptic();
    setSelectedPackage(pkg);
  }, [triggerHaptic]);

  const formatPrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackageTitle = (pkg: PurchasesPackage) => {
    const type = pkg.packageType;
    if (type === 'MONTHLY') return 'Monthly';
    if (type === 'ANNUAL') return 'Annual';
    if (type === 'WEEKLY') return 'Weekly';
    if (type === 'LIFETIME') return 'Lifetime';
    return pkg.identifier;
  };

  const renderContent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.messageContainer}>
          <Sparkles size={48} color={Colors.gold} />
          <Text style={styles.messageTitle}>Not Available on Web</Text>
          <Text style={styles.messageText}>
            In-app purchases are only available on iOS and Android devices.
          </Text>
        </View>
      );
    }

    if (!isInitialized || isLoadingOfferings) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.messageText}>Loading offerings...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOfferings}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isPremium) {
      return (
        <View style={styles.messageContainer}>
          <Check size={64} color={Colors.gold} />
          <Text style={styles.messageTitle}>Premium Active</Text>
          <Text style={styles.messageText}>
            You already have premium access. Thank you for your support!
          </Text>
        </View>
      );
    }

    if (!currentOffering || currentOffering.availablePackages.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>No Offerings Available</Text>
          <Text style={styles.messageText}>
            Please check back later or contact support.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.heroSection}>
          <Sparkles size={56} color={Colors.gold} />
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all quotes and exclusive features
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Check size={20} color={Colors.gold} style={styles.featureIcon} />
            <Text style={styles.featureText}>Unlimited quote access</Text>
          </View>
          <View style={styles.featureItem}>
            <Check size={20} color={Colors.gold} style={styles.featureIcon} />
            <Text style={styles.featureText}>Premium quote library</Text>
          </View>
          <View style={styles.featureItem}>
            <Check size={20} color={Colors.gold} style={styles.featureIcon} />
            <Text style={styles.featureText}>No ads or interruptions</Text>
          </View>
          <View style={styles.featureItem}>
            <Check size={20} color={Colors.gold} style={styles.featureIcon} />
            <Text style={styles.featureText}>Support development</Text>
          </View>
        </View>

        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {currentOffering.availablePackages.map((pkg) => {
            const isSelected = selectedPackage?.identifier === pkg.identifier;
            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[
                  styles.packageCard,
                  isSelected && styles.packageCardSelected,
                ]}
                onPress={() => handlePackageSelect(pkg)}
                activeOpacity={0.7}
              >
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>{getPackageTitle(pkg)}</Text>
                  <Text style={styles.packagePrice}>{formatPrice(pkg)}</Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Check size={20} color={Colors.backgroundDark} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing || !selectedPackage}
          activeOpacity={0.7}
        >
          {isPurchasing ? (
            <ActivityIndicator color={Colors.backgroundDark} />
          ) : (
            <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          Subscriptions auto-renew unless cancelled. Cancel anytime in your app store settings.
        </Text>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 14, paddingHorizontal: 16 },
        ]}
      >
        <View style={styles.headerDividerLine} />

        <View style={styles.headerRow}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              testID="subscription-back"
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={34} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          <Text testID="subscription-title" style={styles.headerTitle}>
            Premium
          </Text>

          <View style={styles.headerSide} />
        </View>

        <View style={styles.headerDividerLine} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerSide: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(227, 193, 126, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(227, 193, 126, 0.22)',
  },
  headerDividerLine: {
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.4,
    marginVertical: 10,
    width: 60,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '300',
    color: Colors.gold,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.gold,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.cream,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
    backgroundColor: 'rgba(227, 193, 126, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(227, 193, 126, 0.15)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.cream,
    flex: 1,
  },
  packagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(227, 193, 126, 0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(227, 193, 126, 0.12)',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 15,
    color: Colors.cream,
    opacity: 0.8,
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 56,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.cream,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.gold,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: Colors.cream,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.cream,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.backgroundDark,
  },
});
