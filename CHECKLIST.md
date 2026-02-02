# 364 Ways to Say No - Production Readiness Checklist

## Critical Blockers (Must Fix Before App Store/Production)

### Payment & Security
- [ ] Implement real IAP integration (App Store/Play Store)
  - [ ] Choose IAP provider (RevenueCat recommended)
  - [ ] Configure products in App Store Connect / Google Play Console
  - [ ] Implement receipt validation (server-side or RevenueCat)
  - [ ] Add purchase restoration flow for reinstalls/device transfers
  - [ ] Handle purchase errors and edge cases (declined, pending, network timeout)
- [ ] Encrypt purchase state (use secure keychain instead of AsyncStorage)
  - [ ] Migrate from AsyncStorage to Expo SecureStore for `isPurchased` flag
  - [ ] Add runtime integrity checks for critical state
- [ ] Remove/guard dev testing methods in production builds
  - [ ] Guard `setPaidForTesting()` and `resetForTesting()` with `__DEV__` flag
  - [ ] Remove from production context return value

### Content
- [ ] Populate POOL_B_QUOTES with actual content (364 quotes minimum)
  - [ ] Create/source quote database
  - [ ] Validate quote length and content appropriateness
  - [ ] Ensure POOL_B has significantly more quotes than POOL_A (currently 1 vs 3)

### Data Integrity & Race Conditions
- [ ] Fix AsyncStorage race conditions
  - [ ] Await all AsyncStorage writes before updating React state
  - [ ] Add error handling/try-catch to all AsyncStorage operations
  - [ ] Implement atomic state persistence (batch related writes)
  - [ ] Add retry logic with exponential backoff for storage operations
- [ ] Fix concurrent tap race condition
  - [ ] Add debouncing or mutex lock to `handleTap()`
  - [ ] Prevent rapid taps from bypassing 3-tap limit
- [ ] Fix pool reset race condition
  - [ ] Await AsyncStorage.setItem before pool reset completes
  - [ ] Ensure all indices are cleared atomically

### Error Handling & Recovery
- [ ] Add React Error Boundary at root level
  - [ ] Wrap `<AppProvider>` with error boundary in `_layout.tsx`
  - [ ] Show error recovery UI instead of white screen crash
- [ ] Add loading states during AsyncStorage hydration
  - [ ] Check `isLoading` flag in splash screen before navigating
  - [ ] Show skeleton UI in calendar while data loads
  - [ ] Prevent user actions until app state is ready
- [ ] Handle purchase flow errors with user feedback
  - [ ] Add try/catch around `purchase()` calls
  - [ ] Show error alerts for failed purchases
  - [ ] Log errors to analytics/Sentry

### iOS Compliance
- [ ] Create privacy manifest (PrivacyInfo.xcprivacy)
  - [ ] Required for iOS 17+ App Store submission
  - [ ] Document any third-party SDKs and their privacy categories
- [ ] Host legal documents properly
  - [ ] Move privacy policy from GitHub raw to dedicated domain
  - [ ] Move terms of service from GitHub raw to dedicated domain
  - [ ] Verify URLs are accepted by App Store reviewers
- [ ] Fix splash screen background color
  - [ ] Change from white to `#3D1A3D` (Colors.background) to match app
- [ ] Test on iPhone 14 Pro+ for Dynamic Island
  - [ ] Verify header content isn't obscured by Dynamic Island
  - [ ] Increase top padding if needed

### Accessibility (Critical for App Store Approval)
- [ ] Add VoiceOver accessibility labels to all interactive elements
  - [ ] Calendar day buttons: `accessibilityLabel={`Select day ${day}`}`
  - [ ] Navigation buttons (ChevronLeft, ChevronRight): add labels
  - [ ] Settings, X close, and all icons: add descriptive labels
  - [ ] Quote modal content: add semantic structure
- [ ] Add accessibility roles to all interactive elements
  - [ ] Mark buttons with `accessibilityRole="button"`
  - [ ] Mark headers with `accessibilityRole="header"`
  - [ ] Mark modals with `accessibilityRole="dialog"`
- [ ] Implement focus management in modals
  - [ ] Focus close button when modal opens
  - [ ] Trap focus inside modal
  - [ ] Restore focus when modal closes
- [ ] Respect reduced motion accessibility setting
  - [ ] Check `AccessibilityInfo.isReduceMotionEnabled()`
  - [ ] Disable/reduce animations for users with motion sensitivity
- [ ] Fix color contrast issues
  - [ ] Test with WCAG AA contrast checker
  - [ ] Increase opacity/brightness instead of reducing opacity for text
  - [ ] Verify all text meets 4.5:1 contrast ratio

---

## High Priority (Polish & iOS Optimization)

### State Management & AsyncStorage
- [ ] Add data migration framework
  - [ ] Add `STORAGE_VERSION` constant
  - [ ] Implement migration logic for schema changes
  - [ ] Handle legacy data on app updates
- [ ] Fix lucky day year validation
  - [ ] Check if year is included in `isLuckyDay` comparison
  - [ ] Ensure lucky day only triggers on specific year, not every year
- [ ] Persist visited days across sessions
  - [ ] Use composite key `${month}-${day}` instead of just day number
  - [ ] Save to AsyncStorage
  - [ ] Load on app startup
  - [ ] OR: Remove graying feature if intentionally session-only

### Navigation & Routing
- [ ] Fix navigation flow for natural back gestures
  - [ ] Replace `.replace()` with `.push()` for forward navigation
  - [ ] Reserve `.replace()` only for true state resets
  - [ ] Test iOS swipe-back gesture works consistently
- [ ] Implement deep linking configuration
  - [ ] Handle deep link parameters in `+native-intent.tsx`
  - [ ] Support share functionality (e.g., `rork-app://quote/123`)

### UI/UX Improvements
- [ ] Fix swipe gesture conflicts with iOS back gesture
  - [ ] Limit PanResponder to calendar grid area only
  - [ ] Increase swipe threshold to 80-100px to avoid accidental triggers
  - [ ] Test gesture doesn't interfere with native back gesture
- [ ] Fix splash screen image loading
  - [ ] Replace hardcoded 3-second delay
  - [ ] Wait for `Image.onLoad` callback before showing content
  - [ ] Use `expo-asset` to preload images
- [ ] Fix StatusBar style
  - [ ] Change from hardcoded "light" to "auto"
  - [ ] Test in both light and dark modes
- [ ] Add error boundaries
  - [ ] Wrap root navigation with error boundary
  - [ ] Add error boundaries around major features
- [ ] Improve quote modal UX
  - [ ] Add backdrop tap-to-dismiss
  - [ ] Add swipe-to-dismiss (iOS pattern)
  - [ ] Add `onRequestClose` handling

### Performance Optimization
- [ ] Memoize calendar grid rendering
  - [ ] Use `useMemo` for `renderCalendarDays()`
  - [ ] Optimize based on `currentMonth`, `currentYear`, `visitedDays`
- [ ] Replace `Image` with `expo-image`
  - [ ] Better caching of splash screen image
  - [ ] Support blur placeholders
  - [ ] Automatic image optimization
- [ ] Use `useWindowDimensions()` instead of `Dimensions.get()`
  - [ ] Respond to orientation changes
  - [ ] Support iPad multitasking resizing
- [ ] Consider splitting AppContext for smaller re-renders
  - [ ] Split into PurchaseContext, QuoteContext, SettingsContext
  - [ ] Reduce unnecessary re-renders as app grows

### Purchase Flow
- [ ] Add loading state during purchase
  - [ ] Show spinner while processing
  - [ ] Prevent multiple simultaneous purchase attempts
- [ ] Add success feedback after purchase
  - [ ] Show celebration/upgrade message
  - [ ] Confirm switch to POOL_B
- [ ] Add purchase restoration from settings
  - [ ] Implement "Restore Purchases" button
  - [ ] Handle already-purchased users on fresh install

### Analytics & Monitoring
- [ ] Set up error tracking (Sentry or Crashlytics)
  - [ ] Log all AsyncStorage failures
  - [ ] Track IAP errors and conversion rates
- [ ] Implement structured logging
  - [ ] Replace console.log with proper logging library
  - [ ] Gate logs behind `__DEV__` flag for production
- [ ] Add analytics events for business metrics
  - [ ] Track free tier usage (tap count)
  - [ ] Track purchase funnel (modal shown, purchase attempted, succeeded)
  - [ ] Track lucky day usage

---

## Medium Priority (Polish & UX Enhancements)

### Code Quality
- [ ] Enable TypeScript strict mode
  - [ ] Set `strict: true` in tsconfig.json
  - [ ] Fix any strict null check violations
- [ ] Fix ESLint warnings
  - [ ] Remove unused imports (SettingsIcon, Modal)
  - [ ] Remove unused error variables
  - [ ] Add missing useCallback dependencies
- [ ] Add unit tests for critical logic
  - [ ] Test `handleTap()` logic (free limit, purchase gate, gold day)
  - [ ] Test quote deduplication
  - [ ] Test tap counting and reset
  - [ ] Test lucky day detection

### Design System
- [ ] Create spacing constants
  - [ ] Define `xs: 8, sm: 12, md: 16, lg: 24, xl: 32`
  - [ ] Replace magic numbers throughout code
- [ ] Document magic numbers with constants
  - [ ] Calendar DAY_SIZE calculation
  - [ ] Swipe threshold values
  - [ ] Haptic feedback thresholds
- [ ] Verify font licensing for App Store
  - [ ] Confirm Didot is freely usable
  - [ ] OR switch to SF Pro (Apple's design font)
  - [ ] Test Didot appearance on Android

### UI Enhancements
- [ ] Rename "Delete Account" button
  - [ ] Change to "Clear All Data" or "Reset App"
- [ ] Add visual feedback for visited days
  - [ ] Add icon or pattern in addition to opacity
  - [ ] Better support for color-blind users
- [ ] Support dynamic type sizing (accessibility)
  - [ ] Use `PixelRatio` or `react-native-size-matters`
  - [ ] Scale fonts based on system settings
- [ ] Add "Are you sure?" confirmation for lucky day changes
  - [ ] Prevent accidental changes
  - [ ] Show "Last chance" messaging

### Features & Content
- [ ] Add quote sharing functionality
  - [ ] Share button in quote modal
  - [ ] Share quote text + app link
  - [ ] Track shares for engagement metrics
- [ ] Add home screen quick actions (iOS)
  - [ ] "View Today's Excuse" quick action
  - [ ] Consider other contextual actions
- [ ] Add quote history feature
  - [ ] Allow users to revisit previous quotes
  - [ ] Option to favorite quotes
- [ ] Rename settings button (iOS specific)
  - [ ] Settings icon may confuse with system settings
  - [ ] Consider "Options" or three-dot menu

---

## Low Priority (Nice to Have)

### Developer Experience
- [ ] Use typed routes in Expo Router
  - [ ] Enable `experiments.typedRoutes: true`
  - [ ] Use generated route types instead of magic strings
- [ ] Add component storybook for design system
- [ ] Create dev helpers for testing different scenarios
  - [ ] Quick toggle for purchase state
  - [ ] Quick tap counter manipulation

### Features
- [ ] Implement quote collections/themes
- [ ] Add quote search functionality
- [ ] Add quote filter by category or length
- [ ] Create quote API endpoint for dynamic updates

### Backend Infrastructure
- [ ] Set up backend service for entitlement checking
- [ ] Implement user accounts (optional for future expansion)
- [ ] Create CMS for quote management
- [ ] Set up CDN for quote distribution

---

## Testing Checklist

### Functional Testing
- [ ] Test free tier (3 taps, then gated)
- [ ] Test purchase flow (unlock premium)
- [ ] Test lucky day selection and retrieval
- [ ] Test quote deduplication across sessions
- [ ] Test app restart with saved state
- [ ] Test quote pool switching

### Device Testing
- [ ] Test on iPhone 12 (standard)
- [ ] Test on iPhone 14 Pro+ (Dynamic Island)
- [ ] Test on iPad (if supporting tablets)
- [ ] Test on Android (if targeting both platforms)
- [ ] Test in light and dark modes

### Accessibility Testing
- [ ] Test with VoiceOver enabled (iOS)
- [ ] Test with TalkBack enabled (Android)
- [ ] Test with reduced motion enabled
- [ ] Test with large text size enabled
- [ ] Test with color blind simulator

### Performance Testing
- [ ] Profile with React DevTools
- [ ] Check for unnecessary re-renders
- [ ] Verify 60fps animations
- [ ] Test on low-end device (iPhone SE or older)
- [ ] Check app startup time
- [ ] Monitor memory usage

### Network Testing
- [ ] Test on slow 3G connection
- [ ] Test with intermittent connectivity
- [ ] Test with no network connection
- [ ] Verify offline functionality works

---

## Deployment Checklist

### Before App Store Submission
- [ ] All critical blockers completed
- [ ] App tested on target devices
- [ ] Privacy policy URL verified
- [ ] Terms of service URL verified
- [ ] Screenshots and app preview created
- [ ] App description and keywords finalized
- [ ] App icon and launch screen finalized
- [ ] Build signed and notarized
- [ ] TestFlight beta tested with real users

### Post-Launch Monitoring
- [ ] Monitor crash rates in Sentry/Crashlytics
- [ ] Track IAP conversion rates
- [ ] Monitor user retention
- [ ] Review App Store reviews for common issues
- [ ] Prepare hot-fix for critical bugs

---

## Notes

**Estimated Timeline:**
- Critical blockers: 2-3 weeks
- High priority items: 1-2 weeks
- Medium priority items: 1 week (ongoing)
- Low priority items: Future iterations

**Key Dependencies:**
- IAP implementation must happen before any App Store submission
- Content creation (364 quotes) should happen in parallel with development
- Accessibility testing should include real users with assistive technology

**Review Sources:**
- Backend Architecture Review: Agent af24aa0
- Frontend UI/UX Review: Agent a8d6c36
- Date: February 2, 2026
