# Mframapa Pricing Tiers

## Overview

| Tier       | Price          | Target                              |
|------------|----------------|-------------------------------------|
| Free       | Free forever   | Casual users, first-time explorers  |
| Pro        | $4.99 / month  | Health-conscious individuals        |
| Enterprise | Custom pricing | Researchers, NGOs, organisations    |

---

## Feature Breakdown

| Feature                        | Free | Pro | Enterprise |
|--------------------------------|:----:|:---:|:----------:|
| Real-time AQI readings         | ✓    | ✓   | ✓          |
| City search                    | ✓    | ✓   | ✓          |
| Up to 3 saved cities           | ✓    | —   | —          |
| Unlimited saved cities         | —    | ✓   | ✓          |
| AI-powered insights            | —    | ✓   | ✓          |
| Prediction dashboard           | —    | ✓   | ✓          |
| Health risk dashboard          | —    | ✓   | ✓          |
| Historical playback            | —    | ✓   | ✓          |
| Compare cities                 | —    | ✓   | ✓          |
| Data exports (CSV / GeoJSON)   | —    | ✓   | ✓          |
| Community hub                  | —    | ✓   | ✓          |
| Anomaly alerts                 | —    | —   | ✓          |
| Africa heatmap                 | —    | —   | ✓          |
| Batch predictions              | —    | —   | ✓          |
| API access                     | —    | —   | ✓          |
| Country explorer               | —    | —   | ✓          |

---

## Tier Details

### Free
- Basic real-time AQI for any African city
- Search across 400+ cities
- Save up to 3 favourite locations

### Pro — $4.99 / month
Everything in Free, plus:
- Unlimited saved cities
- AI-generated air quality insights (Gemini-powered)
- 7-day prediction dashboard with uncertainty bands
- Health risk guidance tailored to AQI level
- Historical playback — scrub through past readings
- Side-by-side city comparison
- Export data as CSV or GeoJSON
- Community hub — submit and view crowd-sourced readings
- 7-day free trial on first sign-up

### Enterprise — Custom pricing
Everything in Pro, plus:
- Anomaly detection alerts for unusual PM2.5 spikes
- Africa-wide heatmap view
- Batch predictions (up to 20 locations per request)
- REST API access with institutional rate limits (6 000 req/min)
- Country-level explorer with regional statistics
- Dedicated support

---

## Implementation Reference

Feature gating is enforced in `src/utils/planFeatures.ts` via `hasAccess(userTier, featureKey)`.
The active tier is stored in `useStore → profile.tier` (`'free' | 'pro' | 'enterprise'`).
Use the `usePlan()` hook to gate features in any screen:

```ts
const { can, isPro } = usePlan();

if (!can('dataExports')) {
  navigation.navigate('Paywall');
  return;
}
```
