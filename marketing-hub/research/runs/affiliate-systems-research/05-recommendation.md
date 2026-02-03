# Implementation Recommendations

## Research Date: February 2026

---

## 1. Executive Recommendation

Based on comprehensive research of opt-in affiliate systems in Japan and globally, we recommend building a **native affiliate center** integrated directly into the marketing automation platform. This approach aligns with the successful models of MyASP, UTAGE, and Proline Free in Japan, and GoHighLevel/ClickFunnels globally.

### Why Build In-House?

| Factor | Buy (3rd Party) | Build (Native) | Verdict |
|--------|-----------------|----------------|---------|
| Japan Market Fit | Limited | Customizable | Build |
| LINE Integration | Requires work | Seamless | Build |
| 2-Tier Support | Some platforms | Full control | Build |
| User Experience | Separate login | Unified | Build |
| Long-term Cost | $97-279/mo+ | One-time dev | Build |
| Competitive Edge | Same as others | Differentiator | Build |

**Recommendation:** Build native affiliate system with phased implementation.

---

## 2. Implementation Phases

### Phase 1: Core MVP (4-6 weeks)

**Goal:** Launch basic functional affiliate system

**Features:**
```
1. Affiliate Registration
   ├── Registration form
   ├── Terms acceptance
   ├── Email verification
   └── Manual/auto approval

2. Tracking Links
   ├── Unique link generation
   ├── URL parameter tracking (?ref=CODE)
   ├── Cookie-based attribution (30 days)
   └── Click counting

3. Conversion Tracking
   ├── Email opt-in trigger
   ├── LINE friend add trigger
   ├── Webhook for custom events
   └── Manual conversion entry

4. Basic Commissions
   ├── Fixed amount per conversion
   ├── Pending → Approved → Paid workflow
   └── Affiliate dashboard view

5. Simple Reporting
   ├── Clicks, conversions, rate
   ├── Earnings summary
   └── Date filtering
```

**Database Schema (MVP):**
```sql
-- Simplified MVP schema
affiliates (id, user_id, code, status, created_at)
affiliate_links (id, affiliate_id, campaign_id, url, code)
affiliate_clicks (id, link_id, ip, user_agent, created_at)
affiliate_conversions (id, click_id, type, status, created_at)
affiliate_commissions (id, affiliate_id, conversion_id, amount, status)
```

**Tech Stack:**
- Backend: Existing platform stack
- Tracking: Server-side + cookies
- Frontend: Embedded dashboard

---

### Phase 2: Japan-Optimized Features (4-6 weeks)

**Goal:** Match MyASP feature parity for Japan market

**Features:**
```
1. LINE Integration
   ├── Track LINE friend additions
   ├── LINE-specific landing pages
   ├── Friend ID to click mapping
   └── LINE webhook receiver

2. 2-Tier Commissions
   ├── Parent-child affiliate relationships
   ├── Tier 2 rate configuration
   ├── Automatic tier commission calculation
   └── Hierarchy visualization

3. VIP Rate System
   ├── Affiliate tier levels (Standard/VIP/Elite)
   ├── Per-affiliate rate overrides
   ├── Automatic tier upgrades (performance-based)
   └── Special campaign access

4. Multiple Trigger Points
   ├── On form submission (opt-in)
   ├── On email confirmation
   ├── On LINE friend add
   ├── On first purchase
   ├── On recurring payment
   └── Custom webhook triggers

5. Enhanced Reporting
   ├── Per-affiliate performance
   ├── Campaign comparison
   ├── Conversion funnel analytics
   └── CSV/Excel export
```

**Schema Additions:**
```sql
-- Add parent relationship
ALTER TABLE affiliates ADD parent_id BIGINT REFERENCES affiliates(id);
ALTER TABLE affiliates ADD tier ENUM('standard', 'vip', 'elite');
ALTER TABLE affiliates ADD custom_rate DECIMAL(10,2);

-- Add tier to commissions
ALTER TABLE affiliate_commissions ADD tier INT DEFAULT 1;

-- Hierarchy closure table
CREATE TABLE affiliate_hierarchy (
    ancestor_id BIGINT,
    descendant_id BIGINT,
    depth INT,
    PRIMARY KEY (ancestor_id, descendant_id)
);
```

---

### Phase 3: Advanced Tracking (3-4 weeks)

**Goal:** Implement fraud-resistant tracking

**Features:**
```
1. Server-to-Server (S2S) Tracking
   ├── Click ID generation
   ├── Postback URL configuration
   ├── HMAC signature validation
   └── Click ID persistence

2. Device Fingerprinting
   ├── FingerprintJS integration
   ├── Fingerprint storage
   ├── Cross-session attribution
   └── Privacy-compliant implementation

3. Fraud Detection (Basic)
   ├── IP velocity checks
   ├── Duplicate conversion detection
   ├── Disposable email blocking
   ├── Self-referral prevention
   └── Manual review queue

4. Attribution Windows
   ├── Configurable cookie duration
   ├── First-click vs last-click
   ├── Multi-touch attribution (optional)
   └── Cross-device considerations
```

**API Endpoints:**
```
POST /api/v1/tracking/click
  - Generate click_id, store click data

POST /api/v1/tracking/postback
  - Receive conversion postbacks
  - Validate HMAC signature
  - Create conversion record

GET /api/v1/tracking/link/:code
  - Redirect with tracking
  - Set cookies/parameters
```

---

### Phase 4: Payout System (3-4 weeks)

**Goal:** Automate affiliate payments

**Features:**
```
1. Payout Configuration
   ├── Minimum threshold setting
   ├── Payout schedule (weekly/monthly)
   ├── Cooling-off period (30 days)
   └── Currency settings

2. Payment Methods
   ├── Bank transfer (Japan priority)
   ├── PayPal mass payout
   ├── Wise integration
   └── Manual payout option

3. Payout Processing
   ├── Automatic payout generation
   ├── Batch processing
   ├── CSV export for manual processing
   └── Payment confirmation tracking

4. Tax & Compliance
   ├── Tax withholding (Japan)
   ├── Invoice generation
   ├── Annual earnings reports
   └── W-9 collection (US affiliates)
```

**Payout Workflow:**
```
1. Commission approved
   └── Enters cooling-off period (30 days)

2. Cooling-off complete
   └── Commission becomes payable

3. Payout date reached
   └── System aggregates payable commissions
   └── Checks minimum threshold
   └── Creates payout record

4. Payout processing
   └── Admin reviews/approves
   └── API call to PayPal/Wise OR
   └── CSV export for bank transfer

5. Confirmation
   └── Mark commissions as paid
   └── Notify affiliate
```

---

### Phase 5: Enterprise Features (Ongoing)

**Goal:** Scale for large affiliate programs

**Features:**
```
1. Advanced Fraud Detection
   ├── Machine learning model
   ├── Real-time scoring
   ├── Automated blocking
   └── Appeal process

2. API & Integrations
   ├── Full REST API
   ├── Webhook events
   ├── Zapier integration
   └── Third-party platform connectors

3. White-Label Option
   ├── Custom branding
   ├── Subdomain support
   └── Branded affiliate portal

4. Advanced Analytics
   ├── Cohort analysis
   ├── LTV by affiliate
   ├── Predictive performance
   └── Custom dashboards

5. Multi-Program Support
   ├── Multiple campaigns
   ├── Different commission structures
   ├── Program-specific affiliates
   └── Cross-program reporting
```

---

## 3. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Marketing Automation Platform                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Affiliate   │    │   Tracking   │    │  Commission  │      │
│  │   Portal      │    │   Engine     │    │   Engine     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         └───────────────────┴───────────────────┘               │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────┐         │
│  │                  Core Database                     │         │
│  │  (affiliates, clicks, conversions, commissions)    │         │
│  └───────────────────────────────────────────────────┘         │
│                            │                                    │
│  ┌─────────────────────────┴─────────────────────────┐         │
│  │                  Integration Layer                 │         │
│  │  (Email, LINE, Payment, External APIs)             │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tracking Flow

```
User Journey:

1. User sees affiliate link
   https://app.com/r/AFF123

2. Click tracked
   ┌─────────────────────────────┐
   │ Generate click_id: CLK_abc  │
   │ Store: IP, UA, fingerprint  │
   │ Set cookie: 30 days         │
   │ Redirect to LP              │
   └─────────────────────────────┘

3. User browses, considers

4. User signs up (opt-in)
   ┌─────────────────────────────┐
   │ Check cookie/session        │
   │ Find click_id: CLK_abc      │
   │ Create conversion           │
   │ Calculate commission        │
   │ Notify affiliate            │
   └─────────────────────────────┘

5. Cooling-off period (30 days)

6. Payout processed
```

### Database Schema (Complete)

```sql
-- Full schema for production implementation

-- Affiliates
CREATE TABLE affiliates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL REFERENCES users(id),
    parent_id BIGINT REFERENCES affiliates(id),
    affiliate_code VARCHAR(32) UNIQUE NOT NULL,
    status ENUM('pending', 'approved', 'suspended', 'rejected') DEFAULT 'pending',
    tier ENUM('standard', 'vip', 'elite') DEFAULT 'standard',
    custom_commission_rate DECIMAL(10,2),

    -- Payment info
    payment_method ENUM('bank', 'paypal', 'wise') DEFAULT 'bank',
    payment_email VARCHAR(255),
    bank_info JSON, -- Encrypted bank details

    -- Tax info
    tax_id VARCHAR(50),
    tax_form_submitted BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    suspended_at TIMESTAMP,

    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_code (affiliate_code)
);

-- Hierarchy closure table (for multi-tier)
CREATE TABLE affiliate_hierarchy (
    ancestor_id BIGINT NOT NULL,
    descendant_id BIGINT NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    PRIMARY KEY (ancestor_id, descendant_id),
    INDEX idx_descendant (descendant_id)
);

-- Campaigns/Programs
CREATE TABLE affiliate_campaigns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Commission settings
    commission_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    commission_amount DECIMAL(10,2) NOT NULL,
    tier2_rate DECIMAL(5,2) DEFAULT 0,

    -- Tracking settings
    cookie_days INT DEFAULT 30,
    attribution_model ENUM('first_click', 'last_click') DEFAULT 'last_click',

    -- Triggers
    trigger_on_signup BOOLEAN DEFAULT TRUE,
    trigger_on_email_confirm BOOLEAN DEFAULT FALSE,
    trigger_on_purchase BOOLEAN DEFAULT FALSE,

    -- Status
    status ENUM('active', 'paused', 'ended') DEFAULT 'active',
    start_date DATE,
    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- Tracking links
CREATE TABLE affiliate_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id),
    campaign_id BIGINT REFERENCES affiliate_campaigns(id),

    destination_url VARCHAR(1000) NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,

    -- Custom tracking
    sub_id VARCHAR(100), -- Affiliate's sub-tracking
    custom_params JSON,

    -- Stats (denormalized for performance)
    total_clicks INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_code (short_code)
);

-- Click tracking
CREATE TABLE affiliate_clicks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    link_id BIGINT NOT NULL REFERENCES affiliate_links(id),
    click_id VARCHAR(64) UNIQUE NOT NULL,

    -- Visitor info
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    referer VARCHAR(1000),

    -- Device info
    fingerprint VARCHAR(64),
    device_type ENUM('desktop', 'mobile', 'tablet'),
    browser VARCHAR(50),
    os VARCHAR(50),

    -- Geo info
    country_code CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Fraud indicators
    is_bot BOOLEAN DEFAULT FALSE,
    fraud_score INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_link (link_id),
    INDEX idx_click_id (click_id),
    INDEX idx_created (created_at),
    INDEX idx_ip (ip_address),
    INDEX idx_fingerprint (fingerprint)
);

-- Conversions
CREATE TABLE affiliate_conversions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    click_id BIGINT REFERENCES affiliate_clicks(id),
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id),
    campaign_id BIGINT REFERENCES affiliate_campaigns(id),

    -- Conversion details
    conversion_type ENUM('lead', 'email_confirm', 'line_friend', 'trial', 'purchase', 'recurring') NOT NULL,
    order_id VARCHAR(100),
    amount DECIMAL(10,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'JPY',

    -- Customer info (for fraud detection)
    customer_email VARCHAR(255),
    customer_ip VARCHAR(45),

    -- Status
    status ENUM('pending', 'approved', 'rejected', 'reversed') DEFAULT 'pending',
    rejection_reason VARCHAR(255),

    -- Fraud
    fraud_score INT DEFAULT 0,
    fraud_flags JSON,
    reviewed_by BIGINT REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_customer_email (customer_email)
);

-- Commissions
CREATE TABLE affiliate_commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id),
    conversion_id BIGINT NOT NULL REFERENCES affiliate_conversions(id),

    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'JPY',
    tier INT DEFAULT 1,

    status ENUM('pending', 'approved', 'payable', 'paid', 'cancelled') DEFAULT 'pending',

    -- Payout tracking
    payout_id BIGINT REFERENCES affiliate_payouts(id),

    -- Cooling off
    payable_at TIMESTAMP, -- When commission becomes payable

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,

    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_payable (payable_at)
);

-- Payouts
CREATE TABLE affiliate_payouts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT NOT NULL REFERENCES affiliates(id),

    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'JPY',

    payment_method ENUM('bank', 'paypal', 'wise', 'manual') NOT NULL,
    payment_reference VARCHAR(255), -- Transaction ID from payment provider
    payment_details JSON, -- Method-specific details

    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason VARCHAR(255),

    -- Period
    period_start DATE,
    period_end DATE,

    -- Admin
    approved_by BIGINT REFERENCES users(id),
    processed_by BIGINT REFERENCES users(id),
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,

    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status)
);

-- Payout items (which commissions are in which payout)
CREATE TABLE affiliate_payout_items (
    payout_id BIGINT NOT NULL REFERENCES affiliate_payouts(id),
    commission_id BIGINT NOT NULL REFERENCES affiliate_commissions(id),
    PRIMARY KEY (payout_id, commission_id)
);
```

---

## 4. Development Timeline

### Total Estimated Time: 18-24 weeks

```
Week 1-2:    Planning, schema design, API design
Week 3-8:    Phase 1 (Core MVP)
Week 9-14:   Phase 2 (Japan Features)
Week 15-18:  Phase 3 (Advanced Tracking)
Week 19-22:  Phase 4 (Payout System)
Week 23+:    Phase 5 (Enterprise - ongoing)
```

### MVP Launch Target: Week 8

**MVP Deliverables:**
- Affiliate registration and approval
- Tracking link generation
- Click and conversion tracking
- Basic commission calculation
- Affiliate dashboard
- Admin management interface

---

## 5. Resource Requirements

### Development Team

| Role | Time | Focus |
|------|------|-------|
| Backend Developer | Full-time | Core system, APIs |
| Frontend Developer | 50% | Dashboard, portal |
| DevOps | 25% | Infrastructure, scaling |
| QA | 25% | Testing, fraud scenarios |
| Product Manager | 25% | Requirements, coordination |

### Infrastructure

```
MVP:
- Existing database (extended schema)
- Redis cache (click deduplication)
- Background job processor (commission calculation)

Scale:
- Dedicated tracking database (high write)
- CDN for redirect handling
- ML service for fraud detection
```

### Third-Party Services

| Service | Purpose | Cost Estimate |
|---------|---------|---------------|
| FingerprintJS Pro | Device fingerprinting | $100-500/mo |
| MaxMind GeoIP | Geo detection | $50/mo |
| PayPal Payouts | Mass payments | Per transaction |
| Wise API | International payouts | Per transaction |

---

## 6. Success Metrics

### KPIs to Track

| Metric | Target (6 months) |
|--------|-------------------|
| Active Affiliates | 100+ |
| Conversion Rate | 3-5% |
| Affiliate-driven Signups | 20% of total |
| Fraud Rate | <5% |
| Payout Accuracy | 99.9% |
| System Uptime | 99.9% |

### Business Impact

- **User Retention**: Affiliates stay for ASP functionality
- **Viral Growth**: Built-in referral mechanism
- **Revenue**: Platform can take % of transactions
- **Competitive**: Match MyASP/UTAGE feature set

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Fraud at scale | Start with manual approval, add ML later |
| Payment errors | Strict QA, reconciliation checks |
| Tracking gaps | Multiple tracking methods, fallbacks |
| Compliance | Consult legal, implement consent |
| Performance | Cache aggressively, async processing |

---

## 8. Conclusion

Building a native affiliate system is the recommended approach for a Japan-focused marketing automation platform. The investment is significant (18-24 weeks) but provides:

1. **Competitive parity** with MyASP/UTAGE
2. **User retention** (affiliates stay on platform)
3. **Viral growth** mechanism
4. **Revenue opportunity** (transaction fees)
5. **Differentiation** in the market

Start with MVP (8 weeks), launch to early users, iterate based on feedback, and add advanced features progressively.

---

## Sources

This recommendation is based on research from:
- [MyASP Documentation](https://docs.myasp.jp/)
- [UTAGE Academy](https://utageacademy.com/)
- [Proline Free Manual](https://autosns.co.jp/manual/)
- [Post Affiliate Pro](https://www.postaffiliatepro.com/)
- [TUNE Platform](https://www.tune.com/)
- [Scaleo Tracking Guide](https://www.scaleo.io/blog/)
- [Affiliate Fraud Prevention](https://www.ipqualityscore.com/)
