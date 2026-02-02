# Rork Migration Checklist: 364 Ways to Say No

Evaluating whether the 364 Ways to Say No app can be built/migrated to Rork.com's no-code platform.

## Core Features

- [ ] **Quote Management System**
  - [ ] Multiple quote pools (POOL_A, POOL_B, GOLD_QUOTE)
  - [ ] Quote deduplication logic (tracking used indices)
  - [ ] Auto-reset when all quotes exhausted
  - [ ] Special lucky day quote retrieval

- [ ] **Freemium Model & Purchase Logic**
  - [ ] Free tier: 3 taps limit
  - [ ] Tap counter tracking and persistence
  - [ ] Purchase entitlement logic
  - [ ] In-app purchase (IAP) integration
  - [ ] Different quote pools for free vs paid users

- [ ] **Calendar Interface**
  - [ ] Month/day navigation
  - [ ] Date selection
  - [ ] Lucky day marking
  - [ ] Visual calendar rendering

- [ ] **Spin Wheel Interaction**
  - [ ] Wheel animation/rotation
  - [ ] Tap-to-spin mechanics
  - [ ] Quote retrieval on spin completion
  - [ ] Touch interaction handling

- [ ] **Lucky Day Feature**
  - [ ] Day selection UI
  - [ ] Date persistence
  - [ ] Gold quote display on lucky day
  - [ ] Date-specific logic in quote retrieval

## State Management & Persistence

- [ ] **AppContext Functionality**
  - [ ] Purchase state tracking (`isPurchased`, `hasRealPurchase`, `devForcePurchased`)
  - [ ] Quote pool management
  - [ ] Tap counter state
  - [ ] Lucky day selection state
  - [ ] Current quote display state

- [ ] **AsyncStorage Persistence**
  - [ ] Purchase status persistence
  - [ ] Tap count persistence
  - [ ] Used quote indices persistence
  - [ ] Lucky day selection persistence
  - [ ] Key-value storage without database

- [ ] **Dev Testing Helpers**
  - [ ] `setPaidForTesting()` functionality
  - [ ] `resetForTesting()` functionality
  - [ ] Easy toggle of purchase state for testing

## Technical Architecture

- [ ] **File-based Routing (Expo Router)**
  - [ ] Splash screen (index.tsx)
  - [ ] Onboarding/about screen
  - [ ] Spin wheel screen
  - [ ] Calendar screen
  - [ ] Stack navigation with fade animation

- [ ] **Data Layer**
  - [ ] Quote arrays as data source
  - [ ] Color constants/palette
  - [ ] No backend API required

- [ ] **UI Components**
  - [ ] React Native components
  - [ ] Custom styled components (no UI library)
  - [ ] Lucide React Native icons
  - [ ] StyleSheet-based styling

- [ ] **Performance Requirements**
  - [ ] Smooth wheel animation
  - [ ] Quick quote retrieval
  - [ ] Responsive touch handling

## Rork Platform Compatibility

- [ ] **Mobile App Generation**
  - [ ] Can Rork generate native iOS/Android from prompts?
  - [ ] Is React Native/Expo the output target? ✓ (Rork uses RN/Expo)

- [ ] **Feature Support on Rork**
  - [ ] Custom animations (spin wheel)
  - [ ] Touch gesture handling
  - [ ] File-based routing capabilities
  - [ ] State management (context/local state)
  - [ ] AsyncStorage integration

- [ ] **In-App Purchase (IAP)**
  - [ ] Can Rork handle IAP setup?
  - [ ] Does Rork support purchase flow logic?
  - [ ] Integration with app store payments?

- [ ] **Data Persistence**
  - [ ] AsyncStorage support
  - [ ] Local data persistence without backend
  - [ ] State hydration on app restart

- [ ] **Code Quality & TypeScript**
  - [ ] Does Rork output TypeScript?
  - [ ] Type safety support?
  - [ ] Linting/code standards?

## Development Workflow

- [ ] **Current Rork Capabilities**
  - [ ] Real-time code preview
  - [ ] Visual iteration on designs
  - [ ] Publish to app stores
  - [ ] Testing support (simulator/device)

- [ ] **Dev Environment Compatibility**
  - [ ] Can Rork projects use `bun install`?
  - [ ] `bun run start` equivalent?
  - [ ] Customizable build commands?
  - [ ] Integration with existing dev tools?

- [ ] **Version Control & Deployment**
  - [ ] Git integration
  - [ ] Custom build/deployment pipeline
  - [ ] CI/CD compatibility

## Known Limitations to Verify

- [ ] **Complex Logic**
  - [ ] Can Rork handle deduplication algorithms?
  - [ ] State management complexity tolerance
  - [ ] Conditional rendering based on entitlements

- [ ] **Custom Interactions**
  - [ ] Spin wheel animation complexity
  - [ ] Touch gesture handling
  - [ ] Animation performance

- [ ] **IAP Integration**
  - [ ] Rork's level of IAP abstraction/support
  - [ ] Complex purchase flow logic
  - [ ] Testing purchase flows in dev

## Migration Path Considerations

- [ ] **Code Quality**
  - [ ] Would generated code match current quality?
  - [ ] Need for manual refactoring/fixes?
  - [ ] Long-term maintainability?

- [ ] **Timeline**
  - [ ] Faster development vs current approach?
  - [ ] Faster iteration cycle?
  - [ ] Time to production parity?

- [ ] **Costs**
  - [ ] Rork platform pricing vs dev resources
  - [ ] App store submission support
  - [ ] Ongoing maintenance costs

## Decision Criteria

**Go with Rork if:**
- [ ] Rork can generate all required features
- [ ] Generated code quality is acceptable
- [ ] IAP integration is straightforward
- [ ] Development speed > code control needs

**Stick with current approach if:**
- [ ] Fine-grained control is critical
- [ ] Custom optimization needs outweigh speed benefits
- [ ] Current dev workflow is optimal
- [ ] Team prefers direct code ownership

## Notes & Findings

- [ ] Contact Rork support about complex features
- [ ] Test with a small Rork prototype first
- [ ] Document any Rork limitations discovered
- [ ] Compare generated code with current implementation

---

**Status**: Not Started
**Last Updated**: 2026-02-02
**Owner**: [Your Name]
