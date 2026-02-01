# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React Native mobile app called "364 Ways to Say No" built with Expo and Expo Router. The app provides daily excuses/quotes for declining requests, with a freemium model (3 free taps, then requires purchase for unlimited access). Features a calendar interface and spin wheel interaction for selecting days.

**Tech Stack**: React Native 0.81, Expo ~54, Expo Router ~6, TypeScript, React Query, Zustand (via context), AsyncStorage

## Development Commands

### Install & Setup
```bash
bun install           # Install dependencies
```

### Running the App
```bash
bun run start              # Start development server (shows QR code)
bun run start -- --ios     # Open iOS Simulator directly
bun run start -- --android # Open Android Emulator directly
bun run start-web          # Run web version for testing
```

### Code Quality
```bash
bun run lint           # Run ESLint
```

### Testing on Device
- **iOS/Android device**: Scan QR code from `bun run start` using Expo Go or Rork app
- **Web browser**: Run `bun start-web`
- **Simulator/Emulator**: Use `bun run start -- --ios` or `--android`

## Architecture Overview

### Core State Management
**AppContext** (`context/AppContext.tsx`) - Uses `@nkzw/create-context-hook` to manage all app-wide state:
- **Purchase state**: `isPurchased` (entitlement combining real purchase + dev testing flag), `hasRealPurchase` (actual IAP), `devForcePurchased` (testing override)
- **Quote management**: Two pools (POOL_A for free users, POOL_B for paid users), tracks used indices to avoid repeats, auto-resets when all quotes exhausted
- **Tap/Free tier**: Tracks `tapCount` against `FREE_TAP_LIMIT` (3), calculates `canGetFreeQuote` and `remainingFreeTaps`
- **Lucky day**: Special day selection for "gold quote" feature, persisted to AsyncStorage
- **Current quote**: Display state
- **Methods**: `handleTap()` - main quote retrieval with purchase-gating logic, `purchase()`, `setPaidForTesting()`, `resetForTesting()` for dev/testing

State persists to AsyncStorage using STORAGE_KEYS constants. Dev testing helpers (`setPaidForTesting`, `resetForTesting`) allow toggling purchase state without real IAP.

### Screen Navigation (Expo Router)
File-based routing in `app/` directory:
- `index.tsx` - Splash screen (3-sec delay, redirects to about)
- `about.tsx` - Onboarding/info screen with feature overview
- `spin-wheel.tsx` - Main wheel interaction screen
- `calendar.tsx` - Calendar interface to pick days
- `_layout.tsx` - Root layout configuring navigation stack with fade animation

All screens configured in `_layout.tsx` Stack with `headerShown: false`.

### Data Layer
**`data/quotes.ts`** - Three quote pools:
- `POOL_A_QUOTES` - Free tier quotes
- `POOL_B_QUOTES` - Premium tier quotes (more extensive)
- `GOLD_QUOTE` - Special quote for lucky day
- `FREE_TAP_LIMIT` - Currently 3

**`constants/colors.ts`** - Centralized color palette (gold theme with dark purple background)

### UI Framework
Uses React Native components with StyleSheet for styling. Lucide React Native icons. No external UI library - all custom styled components with colors from constants.

## Key Implementation Details

### Purchase Flow
1. User gets 3 free taps (`FREE_TAP_LIMIT`)
2. Each tap on free account increments `tapCount`
3. When `tapCount >= FREE_TAP_LIMIT`, `handleTap()` returns `{ success: false, needsPurchase: true }`
4. Screen should show purchase prompt
5. `purchase()` sets `isPurchased = true` and persists to AsyncStorage
6. After purchase, user switches to `POOL_B_QUOTES` (premium pool)
7. Dev testing: Use `setPaidForTesting(true)` to simulate purchase without IAP

### Quote Deduplication
- Maintains `usedPoolAIndices` and `usedPoolBIndices` arrays
- When retrieving a quote, filters out already-used indices
- When all quotes used, resets the used indices array and restarts the cycle
- This prevents showing the same quote twice in a session

### Lucky Day Feature
- User can select a "lucky day" (month/day/year combination)
- On that date, user gets `GOLD_QUOTE` instead of regular quote
- Special date check uses `isLuckyDay(month, day)` method
- Persists lucky day selection to AsyncStorage

## Important Notes

- **State persistence**: All mutable state syncs to AsyncStorage (purchase status, tap count, used quote indices, lucky day)
- **Purchase entitlement**: `isPurchased` returned from context is the union of real purchase and dev force flag - components should use this for access control
- **Free tier limitation**: Only applied when `!isEntitled` in quote retrieval logic
- **Dev mode**: `devForcePurchased` flag allows testing paid features locally; logs include `[AppContext]` prefix for debugging
- **No IAP integration yet**: `purchase()` method only sets local state; actual App Store/Play Store IAP would need to be integrated here
