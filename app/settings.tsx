import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

// GitHub raw content URLs
const TERMS_URL =
  'https://rork-364-git-main-lee-manleys-projects.vercel.app/legal/terms.html';
const PRIVACY_URL =
  'https://rork-364-git-main-lee-manleys-projects.vercel.app/legal/privacy.html';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { resetForTesting, isPurchased } = useApp();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const triggerHeavyHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const handleBack = useCallback(() => {
    triggerHaptic();
    router.back();
  }, [triggerHaptic]);

  const handleOpenTerms = useCallback(async () => {
    triggerHaptic();
    try {
      await WebBrowser.openBrowserAsync(TERMS_URL);
    } catch (err) {
      Alert.alert('Error', 'Could not open Terms of Service');
    }
  }, [triggerHaptic]);

  const handleOpenPrivacy = useCallback(async () => {
    triggerHaptic();
    try {
      await WebBrowser.openBrowserAsync(PRIVACY_URL);
    } catch (err) {
      Alert.alert('Error', 'Could not open Privacy Policy');
    }
  }, [triggerHaptic]);

  const handleDeleteAccount = useCallback(() => {
    triggerHaptic();
    setShowDeleteModal(true);
  }, [triggerHaptic]);

  const handleConfirmDelete = useCallback(() => {
    triggerHeavyHaptic();
    setShowDeleteModal(false);
    resetForTesting();
    router.push('/');
  }, [triggerHeavyHaptic, resetForTesting]);

  const handleRestorePurchase = useCallback(() => {
    triggerHaptic();
    Alert.alert(
      'Restore Purchase',
      'Restore purchases will be available once in-app purchases are integrated.',
      [{ text: 'OK' }]
    );
  }, [triggerHaptic]);

  const handleCancelDelete = useCallback(() => {
    triggerHaptic();
    setShowDeleteModal(false);
  }, [triggerHaptic]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 20, paddingHorizontal: 20 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={Colors.gold} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.decorativeLine} />
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.decorativeLine} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleOpenTerms}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleOpenPrivacy}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Trash2
              size={18}
              color={Colors.backgroundDark}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonTextPrimary}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Purchase Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Purchase</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRestorePurchase}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={18}
              color={Colors.backgroundDark}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonTextPrimary}>Restore Purchase</Text>
          </TouchableOpacity>
          {!isPurchased && (
            <Text style={styles.statusText}>
              Tap the button above to restore your premium access
            </Text>
          )}
          {isPurchased && (
            <Text style={styles.statusTextPurchased}>Premium Active</Text>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalDescription}>
              This will clear all app data and return you to the welcome screen.
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalGhostButton}
                onPress={handleCancelDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.modalGhostButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDangerButton}
                onPress={handleConfirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDangerButtonText}>Delete</Text>
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
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  decorativeLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.5,
    marginVertical: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.gold,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.goldLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    opacity: 0.8,
  },
  button: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  dangerButton: {
    backgroundColor: Colors.gold,
  },
  statusText: {
    fontSize: 13,
    color: Colors.cream,
    opacity: 0.6,
    marginTop: 12,
    fontStyle: 'italic',
  },
  statusTextPurchased: {
    fontSize: 13,
    color: Colors.goldLight,
    marginTop: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.cream,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 28,
  },
  modalButtonContainer: {
    width: '100%',
    gap: 12,
  },
  modalGhostButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: 'transparent',
  },
  modalGhostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalDangerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.gold,
  },
  modalDangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.backgroundDark,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
