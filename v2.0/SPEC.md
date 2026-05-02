# Mframapa AI v2.0 - Development Specification

**Timeline**: 20 weeks (5 months)  
**Build Phase**: Weeks 1-16  
**Testing & Cleanup**: Weeks 17-20  
**Budget**: $30-40 total  
**Conference**: Denmark

---

## Timeline Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           20-WEEK TIMELINE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PHASE 1          PHASE 2       PHASE 3      PHASE 4       PHASE 5        │
│  Data Infra       ML Models     PWA          Mobile App    Testing        │
│  ───────────      ─────────     ───────      ──────────    ───────        │
│  Weeks 1-5        Weeks 6-9     Weeks 10-12  Weeks 13-16   Weeks 17-20    │
│  (5 weeks)        (4 weeks)     (3 weeks)    (4 weeks)     (4 weeks)      │
│                                                                            │
│  ████████████     ████████      ██████       ████████      ████████       │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Budget

| Category | Amount | Notes |
|----------|--------|-------|
| Infrastructure | $0/mo | Free tiers only |
| Domain | $10-15 | If renewal needed |
| Google Play | $25 | Optional, one-time |
| **Total** | **$30-40** | |

---

## Distribution Strategy

| Platform | Fee | Priority |
|----------|-----|----------|
| PWA | $0 | Primary |
| Samsung Galaxy Store | $0 | High |
| Huawei AppGallery | $0 | High |
| Direct APK | $0 | High |
| Amazon Appstore | $0 | Medium |
| F-Droid | $0 | Medium |
| Google Play | $25 | If funded |
| Apple App Store | $99/yr | Skip |

---

## Phase 1: Data Infrastructure (Weeks 1-5)

### Week 1: Foundation

**Focus**: Project setup and first data connector

| Task | Description | Deliverable |
|------|-------------|-------------|
| Set up v2.0 branch | Clean branch for new development | Git branch |
| Create data sources module | `backend/data_sources/` structure | Module scaffold |
| Implement base classes | Abstract DataSource class | `base.py` |
| ERA5 connector | Climate reanalysis (PBLH, wind, humidity) | `era5.py` |
| Unit tests for ERA5 | Verify data fetching works | Test file |

**End of Week 1**: ERA5 connector working, base architecture in place

---

### Week 2: Satellite Data

**Focus**: Primary satellite data source

| Task | Description | Deliverable |
|------|-------------|-------------|
| Sentinel-5P connector | NO2, AOD, SO2, CO from TROPOMI | `sentinel5p.py` |
| Refactor Open-Meteo | Update existing code to new interface | `open_meteo.py` |
| API error handling | Timeouts, retries, error codes | Error handling |
| Unit tests | Test all connectors | Test files |
| Documentation | API usage docs | README |

**End of Week 2**: Two satellite sources working independently

---

### Week 3: Multi-Source & Fallback

**Focus**: Redundancy and fallback logic

| Task | Description | Deliverable |
|------|-------------|-------------|
| MODIS AOD connector | Alternative AOD source | `modis.py` |
| Data orchestrator | Coordinates multiple sources | `orchestrator.py` |
| Fallback hierarchy | satellite → reanalysis → cache → default | Config |
| Reliability scoring | Track source success rates | Scoring logic |
| Integration tests | Test fallback behavior | Test files |

**End of Week 3**: System can fall back when sources fail

---

### Week 4: Caching Layer

**Focus**: Performance and offline capability

| Task | Description | Deliverable |
|------|-------------|-------------|
| Upstash Redis setup | Free tier Redis cache | Redis connection |
| Cache strategy | What to cache, TTL settings | Cache config |
| Pre-compute city data | Cache AQI for 500 cities | Batch job |
| Local SQLite backup | Fallback when Redis unavailable | SQLite layer |
| Cache invalidation | When to refresh cached data | Invalidation logic |

**End of Week 4**: API responses cached, faster performance

---

### Week 5: Feature Enrichment

**Focus**: Additional data sources for model features

| Task | Description | Deliverable |
|------|-------------|-------------|
| WorldPop integration | Population density data | Population layer |
| SRTM elevation | Terrain data | Elevation layer |
| Feature pipeline | Combine all features for model | Pipeline code |
| Data validation | Verify all features present | Validation tests |
| Documentation | Data dictionary update | Docs |

**End of Week 5**: All model features available from real sources

---

## Phase 2: ML Enhancement (Weeks 6-9)

### Week 6: Regional Data & West Africa

**Focus**: Data segmentation and first regional model

| Task | Description | Deliverable |
|------|-------------|-------------|
| Define regions | 6 African regions with boundaries | Region config |
| Data segmentation | Split training data by region | Data splits |
| Urban/rural classifier | Classify locations | Classifier |
| West Africa model | Train first regional model | Model file |
| Validation | Test against holdout data | Metrics |

**End of Week 6**: West Africa model trained (R² target: 0.80)

---

### Week 7: More Regional Models

**Focus**: Train remaining region models

| Task | Description | Deliverable |
|------|-------------|-------------|
| East Africa model | Kenya, Tanzania, Uganda, etc. | Model file |
| North Africa model | Egypt, Morocco, Tunisia, etc. | Model file |
| Central Africa model | DRC, Cameroon, Congo, etc. | Model file |
| Model comparison | Compare regional vs continental | Analysis |

**End of Week 7**: 4 regional models trained

---

### Week 8: Final Models & Ensemble

**Focus**: Complete model suite

| Task | Description | Deliverable |
|------|-------------|-------------|
| Southern Africa model | South Africa, Zimbabwe, etc. | Model file |
| Horn of Africa model | Somalia, Ethiopia, Eritrea | Model file |
| Ensemble setup | Combine XGBoost + LightGBM | Ensemble code |
| Model selection logic | Pick model based on location | Selection logic |
| Export models | JSON/ONNX for production | Model files |

**End of Week 8**: All 12 models (6 regions × 2 urban/rural) ready

---

### Week 9: Uncertainty & Automation

**Focus**: Production readiness

| Task | Description | Deliverable |
|------|-------------|-------------|
| Uncertainty estimation | Conformal prediction intervals | Uncertainty code |
| Validation suite | Comprehensive model testing | Test suite |
| Retraining pipeline | Automated monthly retraining | GitHub Actions |
| Model versioning | Track model versions | Version system |
| Documentation | Model card, performance docs | Docs |

**End of Week 9**: Models production-ready with uncertainty bands

---

## Phase 3: PWA Enhancement (Weeks 10-12)

### Week 10: PWA Foundation

**Focus**: Make web app installable

| Task | Description | Deliverable |
|------|-------------|-------------|
| manifest.json | PWA manifest file | Manifest |
| App icons | All required sizes | Icon set |
| Meta tags | iOS-specific tags | HTML updates |
| Splash screens | Loading screens | Images |
| Test installation | Verify "Add to Home Screen" | QA |

**End of Week 10**: Web app installable on Android and iOS

---

### Week 11: Offline Mode

**Focus**: Full offline functionality

| Task | Description | Deliverable |
|------|-------------|-------------|
| Service worker | Caching and offline logic | sw.js |
| Cache strategy | Which assets to cache | Cache config |
| Offline UI | "You're offline" states | UI components |
| Pre-cache cities | 500 cities available offline | City data |
| Sync strategy | Update when back online | Sync logic |

**End of Week 11**: App works fully offline

---

### Week 12: PWA Polish

**Focus**: User experience refinement

| Task | Description | Deliverable |
|------|-------------|-------------|
| Install prompt | Custom install banner | Component |
| iOS instructions | "Add to Home Screen" guide | UI/UX |
| Performance audit | Lighthouse optimization | Improvements |
| Compression | Smaller assets, gzip | Optimization |
| PWA testing | Cross-browser, cross-device | QA report |

**End of Week 12**: PWA fully optimized and tested

---

## Phase 4: Mobile App (Weeks 13-16)

### Week 13: App Foundation

**Focus**: Expo project setup

| Task | Description | Deliverable |
|------|-------------|-------------|
| Expo initialization | Create React Native project | Project |
| Navigation setup | Tab and stack navigation | Navigation |
| Home screen | Main AQI display | Screen |
| Theme system | Dark/light mode | Theme |
| Basic styling | Core UI components | Components |

**End of Week 13**: Basic app structure with Home screen

---

### Week 14: Core Features

**Focus**: Main functionality

| Task | Description | Deliverable |
|------|-------------|-------------|
| Map screen | Location selection | Screen |
| City search | Manual city picker | Component |
| API integration | Connect to backend | Services |
| Offline storage | MMKV for local data | Storage |
| Settings screen | Language, preferences | Screen |

**End of Week 14**: Core app functionality complete

---

### Week 15: Build & First Store

**Focus**: Production build and Samsung submission

| Task | Description | Deliverable |
|------|-------------|-------------|
| APK signing | Generate keystore, sign APK | Signed APK |
| App optimization | Reduce APK size (<15MB) | Optimized APK |
| Store assets | Screenshots, descriptions | Assets |
| Samsung account | Create developer account | Account |
| Samsung submission | Submit to Galaxy Store | Submission |

**End of Week 15**: APK built, Samsung review in progress

---

### Week 16: Additional Stores

**Focus**: Expand distribution

| Task | Description | Deliverable |
|------|-------------|-------------|
| Huawei AppGallery | Submit to Huawei | Submission |
| Amazon Appstore | Submit to Amazon | Submission |
| Direct download | APK download page | Web page |
| F-Droid prep | Open source metadata | Submission |
| Store tracking | Monitor review status | Tracking |

**End of Week 16**: App submitted to all free stores

---

## Phase 5: Testing & Cleanup (Weeks 17-20)

### Week 17: Integration Testing

**Focus**: End-to-end testing

| Task | Description | Deliverable |
|------|-------------|-------------|
| API testing | Test all endpoints | Test suite |
| Data flow testing | Verify data pipeline | Tests |
| Mobile testing | Test on real devices | QA report |
| PWA testing | Cross-browser testing | QA report |
| Bug fixes | Fix discovered issues | Fixes |

**End of Week 17**: All critical bugs identified and fixed

---

### Week 18: Performance

**Focus**: Optimization and load handling

| Task | Description | Deliverable |
|------|-------------|-------------|
| Load testing | Simulate concurrent users | Test results |
| API optimization | Reduce latency | Improvements |
| Cache tuning | Optimize hit rates | Tuning |
| Mobile performance | Battery, memory usage | Optimization |
| Database optimization | Query performance | Improvements |

**End of Week 18**: System handles expected load

---

### Week 19: Monitoring & Analytics

**Focus**: Production observability

| Task | Description | Deliverable |
|------|-------------|-------------|
| UptimeRobot setup | Uptime monitoring | Monitors |
| Error tracking | Sentry free tier | Error tracking |
| Analytics | Umami or similar | Analytics |
| Dashboards | Key metrics visible | Dashboard |
| Alerting | Notify on issues | Alerts |

**End of Week 19**: Full monitoring in place

---

### Week 20: Final Polish

**Focus**: Conference readiness

| Task | Description | Deliverable |
|------|-------------|-------------|
| Documentation | User guides, API docs | Docs |
| Demo preparation | Stable demo environment | Demo |
| Pitch materials | Update with metrics | Materials |
| Final QA | Complete walkthrough | QA report |
| Launch checklist | Verify everything ready | Checklist |

**End of Week 20**: Ready for Denmark conference

---

## Success Criteria

### Technical

| Metric | Target |
|--------|--------|
| Model R² | ≥ 0.80 per region |
| API uptime | > 99% |
| API latency (p95) | < 500ms |
| Offline cities | 500 |
| APK size | < 15MB |
| PWA Lighthouse | > 90 |

### Distribution

| Platform | Target |
|----------|--------|
| PWA | Live and installable |
| Samsung Galaxy Store | Approved |
| Huawei AppGallery | Approved |
| Direct APK | Available |

### User Metrics (by conference)

| Metric | Target |
|--------|--------|
| PWA installs | 50+ |
| APK downloads | 200+ |
| Countries reached | 5+ |
| Daily active users | 20+ |

---

## Free Infrastructure Stack

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| AWS EC2 | Backend | 750 hrs/mo (12 mo) |
| Vercel | Frontend | 100GB bandwidth |
| Upstash | Redis cache | 10K commands/day |
| Cloudflare | CDN | Unlimited |
| UptimeRobot | Monitoring | 50 monitors |
| GitHub Actions | CI/CD | 2000 min/mo |
| Colab | ML training | Free GPU |

---

*Version 2.0 Specification*  
*20-week timeline with proper pacing*
