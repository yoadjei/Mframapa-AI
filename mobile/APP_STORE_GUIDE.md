# Mframapa - Free App Distribution Guide

**Goal**: Reach 90%+ of African mobile users for $0  
**Strategy**: PWA-first + Free Android stores + Skip Apple

---

## Market Reality: Why Skip Apple?

| Platform | Africa Market Share | Fee | Decision |
|----------|---------------------|-----|----------|
| Android | ~88% | $25 (Google) or $0 | **Focus here** |
| iOS | ~12% | $99/year | **Skip - use PWA** |

African smartphone market is dominated by:
- Samsung (~31%)
- Transsion (Tecno, Infinix, itel) (~40%)
- Xiaomi (~10%)
- Huawei (~5%)
- Others (~14%)

**None of these require Google Play** - most come with alternative stores.

---

## Distribution Channels (Priority Order)

### 1. PWA - Progressive Web App (FREE)

**Reaches**: 100% of users (any browser)  
**Best for**: iOS users, quick access, no install friction

**Setup**:
1. Already have web app at mframapa.ai
2. Add `manifest.json` for installability
3. Add service worker for offline
4. Add iOS meta tags for home screen

**User Experience**:
- Visit website → "Add to Home Screen" prompt
- App icon appears on home screen
- Works offline
- No app store needed

**iOS Users**:
- This is their ONLY option (we're skipping $99 Apple fee)
- Safari → Share → "Add to Home Screen"
- Works almost identically to native app

---

### 2. Samsung Galaxy Store (FREE)

**Reaches**: ~31% of African smartphones  
**Review time**: 3-5 business days  
**URL**: https://seller.samsungapps.com

**Why Important**:
- Samsung is #1 smartphone brand in many African countries
- Pre-installed on all Samsung phones
- No Google account required to download

**Requirements**:
- Samsung Developer account (free)
- APK file (signed)
- App icons: 512x512 PNG
- Screenshots: 1080x1920 PNG (at least 4)
- Feature graphic: 1024x500 PNG
- Privacy policy URL
- App description (can do multiple languages)

**Submission Process**:
```
1. Register at seller.samsungapps.com
2. Create app profile
3. Upload APK
4. Fill store listing (title, description, screenshots)
5. Set pricing (FREE)
6. Select countries (all African countries)
7. Submit for review
```

---

### 3. Huawei AppGallery (FREE)

**Reaches**: ~15% of African smartphones (growing)  
**Review time**: 3-7 business days  
**URL**: https://developer.huawei.com/consumer/en/appgallery

**Why Critical**:
- Huawei phones don't have Google Play (sanctions)
- Growing market share in Africa
- AppGallery is the ONLY way to reach Huawei users

**Requirements**:
- Huawei Developer account (free)
- Identity verification (scan ID/passport)
- APK file (HMS not required for basic apps)
- App icons and screenshots
- Privacy policy

**Submission Process**:
```
1. Register at developer.huawei.com
2. Complete identity verification (1-2 days)
3. Create app in AppGallery Connect
4. Upload APK
5. Fill app information
6. Submit for review
```

**Note**: Our app doesn't use HMS (Huawei Mobile Services), so it will work fine.

---

### 4. Direct APK Download (FREE)

**Reaches**: 100% of Android users  
**Review time**: None (instant)

**Why Important**:
- No store approval needed
- Instant updates
- Full control
- Works even if stores reject

**Setup**:
1. Build signed APK locally
2. Host on website or GitHub Releases
3. Create download page with:
   - Download button
   - Version number
   - Installation instructions
   - "Allow unknown sources" guide

**Security Considerations**:
- Sign APK with your keystore
- Provide SHA-256 checksum
- Use HTTPS for download

**Example Download Page**:
```
Download Mframapa for Android

Version 1.0.0 (May 2026)
Size: 12 MB

[DOWNLOAD APK]

Installation:
1. Tap the downloaded file
2. If prompted, allow installation from this source
3. Tap "Install"
4. Open Mframapa and check your air quality!

SHA-256: abc123...
```

---

### 5. Amazon Appstore (FREE)

**Reaches**: Fire tablet users, some Android users  
**Review time**: 1-2 days  
**URL**: https://developer.amazon.com/apps-and-games

**Why Include**:
- Free to publish
- Some African users have Fire tablets
- Another discovery channel
- Fast review process

**Requirements**:
- Amazon Developer account (free)
- APK file
- Screenshots
- App description

---

### 6. F-Droid (FREE, Open Source)

**Reaches**: Tech-savvy users, developers  
**Review time**: 1-2 weeks  
**URL**: https://f-droid.org/en/contribute/

**Why Include**:
- Credibility in open-source community
- Attracts developer contributors
- Free hosting and builds
- Privacy-focused users

**Requirements**:
- Open-source repository (GitHub)
- F-Droid metadata file
- No proprietary dependencies
- Reproducible builds

**Setup**:
1. Make repo public
2. Add `metadata/ai.mframapa.yml` with app info
3. Submit inclusion request via GitLab
4. F-Droid builds from source

---

### 7. Aptoide (FREE)

**Reaches**: Alternative store users  
**URL**: https://www.aptoide.com/page/publishers

**Setup**:
1. Create publisher account
2. Upload APK
3. Basic review (usually quick)

---

### 8. Google Play Store ($25 ONE-TIME)

**Reaches**: ~45% of African smartphones  
**Review time**: 1-3 days  
**URL**: https://play.google.com/console

**Decision**: Optional - only if you get the $25

**If You Get Funding**:
- One-time $25 fee (not yearly)
- Largest Android store
- Best discoverability
- Automatic updates for users

---

## Store Comparison Summary

| Store | Fee | Africa Reach | Review Time | Effort |
|-------|-----|--------------|-------------|--------|
| PWA | $0 | 100% | None | Low |
| Samsung | $0 | 31% | 3-5 days | Medium |
| Huawei | $0 | 15% | 3-7 days | Medium |
| Direct APK | $0 | 100% | None | Low |
| Amazon | $0 | 5% | 1-2 days | Low |
| F-Droid | $0 | 2% | 1-2 weeks | Medium |
| Google Play | $25 | 45% | 1-3 days | Medium |
| Apple | $99/yr | 12% | 1-2 weeks | High |

---

## Recommended Rollout Order

### Week 11 (Free Stores)
1. ✅ PWA enhancement (already have web)
2. ✅ Samsung Galaxy Store submission
3. ✅ Huawei AppGallery submission
4. ✅ Direct APK download page

### Week 12 (Additional Stores)
5. ✅ Amazon Appstore submission
6. ✅ F-Droid submission (if open-sourcing)
7. ⏸️ Google Play (if $25 available)

### Post-Conference (If Funded)
8. Google Play Store
9. Consider Apple ($99/yr) only if significant iOS demand

---

## APK Signing (Required for All Stores)

### Generate Keystore (One-Time)
```bash
keytool -genkey -v -keystore mframapa-release.keystore \
  -alias mframapa -keyalg RSA -keysize 2048 -validity 10000
```

### Keep Safe:
- `mframapa-release.keystore` file
- Keystore password
- Key alias and password

**CRITICAL**: If you lose the keystore, you cannot update your app on stores. Back it up!

---

## Store-Specific Screenshots

### Required Sizes

| Store | Phone Screenshot | Tablet | Feature Graphic |
|-------|------------------|--------|-----------------|
| Samsung | 1080x1920 | Optional | 1024x500 |
| Huawei | 1080x1920 | Optional | 1024x500 |
| Google Play | 1080x1920 | 1200x1920 | 1024x500 |
| Amazon | 1080x1920 | 1200x1920 | - |

### Suggested Screenshots (5-8 per store)
1. Home screen with AQI gauge
2. Map view with African continent
3. Health advice in local language
4. City search/selection
5. Offline mode indicator
6. Dark mode view
7. Multiple languages showcase
8. Settings screen

---

## Store Listing Copy

### Short Description (80 chars)
```
Real-time air quality for Africa. Free. Offline. 27 languages.
```

### Full Description
```
Mframapa brings satellite-powered air quality intelligence to 1.4 billion Africans.

🌍 COVERAGE
Check PM2.5 air quality for any location in Africa - no ground sensors needed.

📱 WORKS OFFLINE
Pre-loaded with 500 African cities. Check air quality even without internet.

🗣️ YOUR LANGUAGE
Available in 27 African languages including Swahili, Hausa, Yoruba, Amharic, Twi, Zulu, and more.

💚 HEALTH GUIDANCE
Get personalized health advice based on current air quality levels.

🔋 BATTERY FRIENDLY
Lightweight design uses minimal data and battery.

🆓 COMPLETELY FREE
No ads. No subscriptions. No hidden costs.

Built by Africans, for Africa.
```

### Keywords/Tags
```
air quality, pollution, PM2.5, Africa, health, environment, climate, 
Swahili, Hausa, Yoruba, offline, satellite, weather, AQI
```

---

## Update Strategy

### For Store-Distributed Apps
1. Build new APK with incremented version
2. Upload to each store
3. Wait for review (1-7 days per store)
4. All stores update eventually

### For Direct APK
1. Build new APK
2. Replace file on website
3. Update version number on download page
4. Instant availability

### For PWA
1. Deploy to Vercel
2. Service worker auto-updates
3. Users get new version on next visit
4. **Fastest update path**

---

## Tracking Downloads

### Free Analytics
- Umami (self-hosted): Track APK downloads
- Store dashboards: Each store has analytics
- Server logs: Count API calls from app

### Metrics to Track
- Downloads per store
- Active users per store
- Geographic distribution
- Update adoption rate

---

*Last Updated: May 2026*
