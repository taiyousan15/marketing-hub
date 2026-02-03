# Technical Implementation Guide for Affiliate Systems

## Research Date: February 2026

---

## 1. Tracking Methods

### 1.1 Cookie-Based Tracking

**Overview:**
Traditional method storing affiliate ID in browser cookie.

**Implementation:**
```javascript
// On affiliate link click
function setAffiliateCookie(affiliateId, days = 30) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `affiliate_id=${affiliateId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// On conversion, read cookie
function getAffiliateCookie() {
  const match = document.cookie.match(/affiliate_id=([^;]+)/);
  return match ? match[1] : null;
}
```

**Cookie Parameters:**
| Parameter | Recommended Value | Purpose |
|-----------|------------------|---------|
| expires | 30-90 days | Attribution window |
| path | / | Site-wide tracking |
| SameSite | Lax or Strict | Security |
| Secure | true (HTTPS) | Security |

**Limitations:**
- Blocked by ad blockers
- Deleted by privacy tools
- Cross-device tracking impossible
- Safari ITP limits to 7 days
- Chrome phasing out 3rd party cookies

**Conversion Loss:**
15-35% of conversions lost due to:
- Cookie deletion
- Incognito browsing
- Browser privacy settings
- Ad blocker extensions

---

### 1.2 URL Parameter Tracking

**Overview:**
Affiliate ID passed via URL query parameters.

**URL Structure:**
```
Base:    https://example.com/landing-page
Tracked: https://example.com/landing-page?ref=AFF123
Full:    https://example.com/landing-page?ref=AFF123&campaign=email&source=newsletter
```

**Common Parameter Names:**
| Parameter | Usage |
|-----------|-------|
| ref | Affiliate ID reference |
| aff_id | Affiliate identifier |
| partner | Partner code |
| a | Short affiliate code |
| clickid | Click tracking ID |
| sub1-sub5 | Sub-tracking parameters |

**Backend Processing:**
```python
# Python/Flask example
from flask import request

@app.route('/landing-page')
def landing():
    affiliate_id = request.args.get('ref')
    click_id = request.args.get('clickid')

    if affiliate_id:
        # Store in session
        session['affiliate_id'] = affiliate_id
        session['click_id'] = click_id

        # Log click
        log_affiliate_click(
            affiliate_id=affiliate_id,
            click_id=click_id,
            ip=request.remote_addr,
            user_agent=request.user_agent.string
        )

    return render_template('landing.html')
```

**Advantages:**
- Works with all browsers
- No cookie consent required
- Server-side capture possible

**Disadvantages:**
- Lost on navigation away
- Visible in URL (security concern)
- UTM parameter conflicts

---

### 1.3 Server-to-Server (S2S/Postback) Tracking

**Overview:**
Server-side tracking where conversion data is sent directly between servers.

**How It Works:**
```
1. User clicks affiliate link
   └── Tracking server generates unique click_id

2. Click_id passed to advertiser landing page
   └── https://advertiser.com/lp?clickid=abc123

3. Advertiser stores click_id with session
   └── Database: sessions(session_id, click_id, created_at)

4. User converts (signup, purchase)
   └── Conversion recorded with click_id

5. Advertiser sends postback to tracking server
   └── https://tracking.com/postback?clickid=abc123&payout=50

6. Tracking server attributes conversion to affiliate
   └── Commission created for affiliate who generated click
```

**Postback URL Format:**
```
Standard:
https://tracking.example.com/postback
  ?clickid={click_id}
  &payout={payout_amount}
  &status=approved

With security:
https://tracking.example.com/postback
  ?clickid={click_id}
  &payout={payout_amount}
  &hash={hmac_signature}
  &timestamp={unix_timestamp}
```

**Implementation (Sender - Advertiser Side):**
```python
import hashlib
import hmac
import requests
import time

def send_postback(click_id, payout, secret_key):
    timestamp = int(time.time())

    # Create HMAC signature
    message = f"{click_id}:{payout}:{timestamp}"
    signature = hmac.new(
        secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    postback_url = f"https://tracking.com/postback"
    params = {
        'clickid': click_id,
        'payout': payout,
        'timestamp': timestamp,
        'hash': signature
    }

    response = requests.get(postback_url, params=params)
    return response.status_code == 200
```

**Implementation (Receiver - Tracking Side):**
```python
from flask import request, abort
import hmac
import hashlib
import time

@app.route('/postback')
def receive_postback():
    click_id = request.args.get('clickid')
    payout = request.args.get('payout')
    timestamp = request.args.get('timestamp')
    received_hash = request.args.get('hash')

    # Verify timestamp (prevent replay attacks)
    if abs(time.time() - int(timestamp)) > 300:  # 5 min window
        abort(403, 'Timestamp expired')

    # Verify signature
    message = f"{click_id}:{payout}:{timestamp}"
    expected_hash = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(received_hash, expected_hash):
        abort(403, 'Invalid signature')

    # Process conversion
    conversion = process_conversion(click_id, payout)

    return 'OK', 200
```

**Advantages:**
- Immune to cookie blocking
- Cannot be manipulated client-side
- 15-35% better conversion tracking
- Works cross-device

**Disadvantages:**
- More complex implementation
- Requires server infrastructure
- Click ID must persist through funnel

---

### 1.4 Device Fingerprinting

**Overview:**
Creates unique device identifier from browser/device characteristics.

**Fingerprint Components:**
```javascript
const fingerprintComponents = {
  // Browser
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  cookieEnabled: navigator.cookieEnabled,

  // Screen
  screenResolution: [screen.width, screen.height],
  colorDepth: screen.colorDepth,
  pixelRatio: window.devicePixelRatio,

  // Hardware
  hardwareConcurrency: navigator.hardwareConcurrency,
  deviceMemory: navigator.deviceMemory,

  // Canvas fingerprint
  canvas: getCanvasFingerprint(),

  // WebGL
  webgl: getWebGLFingerprint(),

  // Audio
  audio: getAudioFingerprint(),

  // Fonts
  fonts: getInstalledFonts(),

  // Timezone
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezoneOffset: new Date().getTimezoneOffset()
};
```

**Canvas Fingerprinting:**
```javascript
function getCanvasFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Draw text with specific styling
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Fingerprint test 🖐', 2, 2);

  // Draw shapes
  ctx.fillStyle = 'rgb(255, 0, 128)';
  ctx.fillRect(50, 50, 80, 40);

  return canvas.toDataURL();
}
```

**Using FingerprintJS (Recommended):**
```javascript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fpPromise = FingerprintJS.load();

async function getVisitorId() {
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId; // Unique fingerprint hash
}
```

**Advantages:**
- Works without cookies
- Persists across sessions
- Resistant to clearing
- Cross-session identification

**Disadvantages:**
- Privacy concerns (GDPR)
- Browser anti-fingerprint measures
- Not 100% unique
- Can change with updates

---

## 2. Commission Calculation

### 2.1 Commission Types

**Fixed Amount:**
```python
def calculate_fixed_commission(conversion, rate):
    return rate  # e.g., $50 per lead
```

**Percentage:**
```python
def calculate_percentage_commission(conversion, rate):
    return conversion.amount * (rate / 100)  # e.g., 20% of sale
```

**Tiered (Performance-Based):**
```python
TIERS = [
    {'min': 0, 'max': 10, 'rate': 0.10},      # 10% for 0-10 sales
    {'min': 11, 'max': 50, 'rate': 0.15},     # 15% for 11-50 sales
    {'min': 51, 'max': float('inf'), 'rate': 0.20}  # 20% for 51+
]

def calculate_tiered_commission(affiliate, conversion):
    monthly_sales = get_monthly_sales(affiliate)

    for tier in TIERS:
        if tier['min'] <= monthly_sales <= tier['max']:
            return conversion.amount * tier['rate']
```

**Recurring:**
```python
def calculate_recurring_commission(subscription, rate, months_active):
    # Commission on each subscription payment
    return subscription.monthly_amount * (rate / 100)
```

**Lifetime:**
```python
def calculate_lifetime_commission(customer, rate):
    # Commission on all purchases from referred customer
    total_purchases = get_customer_lifetime_purchases(customer)
    return total_purchases * (rate / 100)
```

### 2.2 Multi-Tier Commission

**2-Tier Structure:**
```python
def calculate_2tier_commission(conversion, affiliate):
    commissions = []

    # Direct affiliate commission (Tier 1)
    tier1_rate = get_tier1_rate(affiliate)
    tier1_commission = conversion.amount * tier1_rate
    commissions.append({
        'affiliate_id': affiliate.id,
        'amount': tier1_commission,
        'tier': 1
    })

    # Parent affiliate commission (Tier 2)
    if affiliate.parent_id:
        parent = get_affiliate(affiliate.parent_id)
        tier2_rate = get_tier2_rate(parent)
        tier2_commission = conversion.amount * tier2_rate
        commissions.append({
            'affiliate_id': parent.id,
            'amount': tier2_commission,
            'tier': 2
        })

    return commissions
```

**Multi-Level (MLM) Structure:**
```python
def calculate_mlm_commission(conversion, affiliate, max_levels=5):
    commissions = []
    current_affiliate = affiliate
    level = 1

    while current_affiliate and level <= max_levels:
        rate = get_level_rate(level)  # Decreasing rates: 10%, 5%, 2%, 1%, 0.5%
        commission = conversion.amount * rate

        commissions.append({
            'affiliate_id': current_affiliate.id,
            'amount': commission,
            'level': level
        })

        current_affiliate = get_parent_affiliate(current_affiliate)
        level += 1

    return commissions
```

**Level Rate Examples:**
| Level | Description | Typical Rate |
|-------|-------------|--------------|
| 1 | Direct referral | 10-30% |
| 2 | Parent | 5-10% |
| 3 | Grandparent | 2-5% |
| 4 | Great-grandparent | 1-2% |
| 5 | 5th generation | 0.5-1% |

---

## 3. Database Design

### 3.1 Core Tables

```sql
-- Affiliates table
CREATE TABLE affiliates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT REFERENCES users(id),
    parent_id BIGINT REFERENCES affiliates(id) NULL,
    affiliate_code VARCHAR(32) UNIQUE NOT NULL,
    status ENUM('pending', 'approved', 'suspended', 'rejected') DEFAULT 'pending',
    tier ENUM('standard', 'vip', 'elite') DEFAULT 'standard',
    commission_rate DECIMAL(5,2) NULL, -- Override rate
    payment_email VARCHAR(255),
    payment_method ENUM('paypal', 'wise', 'bank') DEFAULT 'paypal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_code (affiliate_code)
);

-- Campaigns/Programs
CREATE TABLE affiliate_campaigns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    commission_type ENUM('fixed', 'percentage') DEFAULT 'fixed',
    commission_amount DECIMAL(10,2) NOT NULL,
    tier2_amount DECIMAL(10,2) DEFAULT 0,
    cookie_days INT DEFAULT 30,
    status ENUM('active', 'paused', 'ended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking links
CREATE TABLE affiliate_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT REFERENCES affiliates(id),
    campaign_id BIGINT REFERENCES affiliate_campaigns(id),
    url VARCHAR(500) NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    custom_params JSON,
    clicks_count INT DEFAULT 0,
    conversions_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_campaign (campaign_id),
    INDEX idx_code (short_code)
);

-- Click tracking
CREATE TABLE affiliate_clicks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    link_id BIGINT REFERENCES affiliate_links(id),
    click_id VARCHAR(64) UNIQUE NOT NULL, -- For S2S tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500),
    fingerprint VARCHAR(64),
    country_code CHAR(2),
    device_type ENUM('desktop', 'mobile', 'tablet'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_link (link_id),
    INDEX idx_click_id (click_id),
    INDEX idx_created (created_at),
    INDEX idx_fingerprint (fingerprint)
);

-- Conversions
CREATE TABLE affiliate_conversions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    click_id BIGINT REFERENCES affiliate_clicks(id),
    affiliate_id BIGINT REFERENCES affiliates(id),
    campaign_id BIGINT REFERENCES affiliate_campaigns(id),
    conversion_type ENUM('lead', 'trial', 'sale', 'recurring') NOT NULL,
    order_id VARCHAR(64),
    amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
    ip_address VARCHAR(45),
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- Commissions
CREATE TABLE affiliate_commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT REFERENCES affiliates(id),
    conversion_id BIGINT REFERENCES affiliate_conversions(id),
    amount DECIMAL(10,2) NOT NULL,
    tier INT DEFAULT 1,
    status ENUM('pending', 'approved', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status)
);

-- Payouts
CREATE TABLE affiliate_payouts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    affiliate_id BIGINT REFERENCES affiliates(id),
    amount DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    INDEX idx_affiliate (affiliate_id),
    INDEX idx_status (status)
);
```

### 3.2 Multi-Tier Hierarchy

For efficient ancestor/descendant queries:

```sql
-- Closure table for hierarchy
CREATE TABLE affiliate_hierarchy (
    ancestor_id BIGINT REFERENCES affiliates(id),
    descendant_id BIGINT REFERENCES affiliates(id),
    depth INT NOT NULL,
    PRIMARY KEY (ancestor_id, descendant_id),
    INDEX idx_descendant (descendant_id),
    INDEX idx_depth (depth)
);

-- Insert ancestor relationships when affiliate joins
DELIMITER //
CREATE TRIGGER after_affiliate_insert
AFTER INSERT ON affiliates
FOR EACH ROW
BEGIN
    -- Self-reference
    INSERT INTO affiliate_hierarchy (ancestor_id, descendant_id, depth)
    VALUES (NEW.id, NEW.id, 0);

    -- Copy parent's ancestors
    IF NEW.parent_id IS NOT NULL THEN
        INSERT INTO affiliate_hierarchy (ancestor_id, descendant_id, depth)
        SELECT ancestor_id, NEW.id, depth + 1
        FROM affiliate_hierarchy
        WHERE descendant_id = NEW.parent_id;
    END IF;
END//
DELIMITER ;

-- Get all ancestors (upline)
SELECT a.* FROM affiliates a
JOIN affiliate_hierarchy h ON a.id = h.ancestor_id
WHERE h.descendant_id = :affiliate_id AND h.depth > 0
ORDER BY h.depth;

-- Get all descendants (downline)
SELECT a.* FROM affiliates a
JOIN affiliate_hierarchy h ON a.id = h.descendant_id
WHERE h.ancestor_id = :affiliate_id AND h.depth > 0
ORDER BY h.depth;
```

---

## 4. Fraud Prevention

### 4.1 Common Fraud Types

| Fraud Type | Description | Detection Method |
|------------|-------------|------------------|
| Click Fraud | Bot-generated clicks | IP analysis, rate limiting |
| Self-Referral | Affiliate refers themselves | Email/IP matching |
| Cookie Stuffing | Hidden cookie injection | JavaScript monitoring |
| Lead Fraud | Fake form submissions | Email verification, CAPTCHA |
| Click Injection | Last-click attribution theft | Timing analysis |

### 4.2 Detection Implementation

**IP-Based Detection:**
```python
from collections import defaultdict
from datetime import datetime, timedelta

class FraudDetector:
    def __init__(self):
        self.ip_clicks = defaultdict(list)
        self.ip_conversions = defaultdict(list)

    def check_click(self, ip, affiliate_id):
        now = datetime.now()
        window = now - timedelta(hours=1)

        # Filter recent clicks from same IP
        recent = [t for t in self.ip_clicks[ip] if t > window]
        self.ip_clicks[ip] = recent

        # Rate limiting: max 10 clicks per hour per IP
        if len(recent) >= 10:
            return {'fraud': True, 'reason': 'rate_limit_exceeded'}

        self.ip_clicks[ip].append(now)
        return {'fraud': False}

    def check_conversion(self, ip, email, affiliate_id):
        flags = []

        # Check IP velocity
        now = datetime.now()
        window = now - timedelta(hours=24)
        recent_conversions = [t for t in self.ip_conversions[ip] if t > window]

        if len(recent_conversions) >= 5:
            flags.append('high_ip_velocity')

        # Check email patterns
        if self.is_disposable_email(email):
            flags.append('disposable_email')

        # Check affiliate self-referral
        affiliate = get_affiliate(affiliate_id)
        if affiliate.email == email:
            flags.append('self_referral')

        self.ip_conversions[ip].append(now)

        return {
            'fraud': len(flags) > 0,
            'flags': flags,
            'score': len(flags) * 25  # Risk score 0-100
        }

    def is_disposable_email(self, email):
        disposable_domains = [
            'tempmail.com', 'throwaway.com', '10minutemail.com',
            'guerrillamail.com', 'mailinator.com'
        ]
        domain = email.split('@')[1].lower()
        return domain in disposable_domains
```

**Device Fingerprint Analysis:**
```python
def analyze_fingerprint(fingerprint, affiliate_id):
    # Get recent conversions with same fingerprint
    recent = db.query("""
        SELECT COUNT(*) as count, affiliate_id
        FROM affiliate_conversions
        WHERE fingerprint = %s
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY affiliate_id
    """, [fingerprint])

    # Multiple conversions from same device
    if any(r.count > 3 for r in recent):
        return {'suspicious': True, 'reason': 'multiple_conversions_same_device'}

    # Same fingerprint across different affiliates
    if len(set(r.affiliate_id for r in recent)) > 1:
        return {'suspicious': True, 'reason': 'cross_affiliate_fingerprint'}

    return {'suspicious': False}
```

**HMAC Postback Validation:**
```python
import hmac
import hashlib

def validate_postback(params, secret_key):
    """Validate incoming postback with HMAC signature"""
    received_hash = params.pop('hash', None)
    timestamp = params.get('timestamp')

    if not received_hash or not timestamp:
        return False

    # Check timestamp freshness (5 minute window)
    if abs(time.time() - int(timestamp)) > 300:
        return False

    # Reconstruct signature
    sorted_params = sorted(params.items())
    message = '&'.join(f"{k}={v}" for k, v in sorted_params)

    expected_hash = hmac.new(
        secret_key.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(received_hash, expected_hash)
```

### 4.3 Machine Learning Fraud Detection

**Features for ML Model:**
```python
def extract_fraud_features(click, conversion):
    return {
        # Time features
        'click_to_conversion_seconds': (conversion.created_at - click.created_at).seconds,
        'hour_of_day': conversion.created_at.hour,
        'day_of_week': conversion.created_at.weekday(),

        # IP features
        'ip_country_match': click.country == conversion.country,
        'ip_clicks_24h': count_ip_clicks(click.ip, hours=24),
        'ip_conversions_24h': count_ip_conversions(click.ip, hours=24),

        # Device features
        'is_mobile': click.device_type == 'mobile',
        'has_fingerprint': bool(click.fingerprint),
        'fingerprint_seen_before': fingerprint_count(click.fingerprint) > 1,

        # Affiliate features
        'affiliate_conversion_rate': get_conversion_rate(click.affiliate_id),
        'affiliate_fraud_rate': get_fraud_rate(click.affiliate_id),
        'affiliate_age_days': (datetime.now() - affiliate.created_at).days,

        # Email features (for lead gen)
        'email_domain_free': is_free_email(conversion.email),
        'email_domain_disposable': is_disposable_email(conversion.email),
    }
```

---

## 5. API Integration

### 5.1 RESTful API Design

```yaml
# OpenAPI 3.0 Specification (excerpt)
paths:
  /api/v1/affiliates:
    get:
      summary: List affiliates
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, approved, suspended]
    post:
      summary: Create affiliate
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AffiliateCreate'

  /api/v1/affiliates/{id}/links:
    get:
      summary: Get affiliate tracking links
    post:
      summary: Generate new tracking link

  /api/v1/conversions:
    post:
      summary: Record conversion (postback)
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                click_id:
                  type: string
                amount:
                  type: number
                order_id:
                  type: string

  /api/v1/commissions:
    get:
      summary: List commissions
      parameters:
        - name: affiliate_id
        - name: status
        - name: date_from
        - name: date_to

  /api/v1/payouts:
    post:
      summary: Create payout
    get:
      summary: List payouts
```

### 5.2 Webhook Events

```python
WEBHOOK_EVENTS = {
    'affiliate.created': 'New affiliate registered',
    'affiliate.approved': 'Affiliate approved',
    'affiliate.suspended': 'Affiliate suspended',
    'click.tracked': 'New click tracked',
    'conversion.created': 'New conversion recorded',
    'conversion.approved': 'Conversion approved',
    'conversion.rejected': 'Conversion rejected',
    'commission.created': 'New commission generated',
    'commission.paid': 'Commission paid out',
    'payout.completed': 'Payout processed'
}

# Webhook payload example
{
    "event": "conversion.created",
    "timestamp": "2026-02-01T12:00:00Z",
    "data": {
        "conversion_id": 12345,
        "affiliate_id": 678,
        "click_id": "abc123",
        "type": "lead",
        "amount": 0,
        "status": "pending"
    },
    "signature": "sha256=..."
}
```

### 5.3 Payment Integration

**PayPal Mass Payout:**
```python
import paypalrestsdk

def process_paypal_payouts(payouts):
    paypalrestsdk.configure({
        "mode": "live",
        "client_id": PAYPAL_CLIENT_ID,
        "client_secret": PAYPAL_SECRET
    })

    items = []
    for payout in payouts:
        items.append({
            "recipient_type": "EMAIL",
            "amount": {
                "value": str(payout.amount),
                "currency": "USD"
            },
            "receiver": payout.affiliate.payment_email,
            "note": f"Affiliate commission payout #{payout.id}"
        })

    payout_batch = paypalrestsdk.Payout({
        "sender_batch_header": {
            "sender_batch_id": f"batch_{datetime.now().timestamp()}",
            "email_subject": "Your affiliate commission payout"
        },
        "items": items
    })

    if payout_batch.create():
        return payout_batch.batch_header.payout_batch_id
    else:
        raise Exception(payout_batch.error)
```

**Wise (TransferWise) Integration:**
```python
import requests

def process_wise_payout(payout):
    headers = {
        'Authorization': f'Bearer {WISE_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    # Create quote
    quote_response = requests.post(
        'https://api.wise.com/v3/profiles/{profile_id}/quotes',
        headers=headers,
        json={
            'sourceCurrency': 'USD',
            'targetCurrency': payout.affiliate.currency,
            'sourceAmount': payout.amount,
            'paymentType': 'REGULAR'
        }
    )
    quote = quote_response.json()

    # Create recipient
    recipient_response = requests.post(
        'https://api.wise.com/v1/accounts',
        headers=headers,
        json={
            'currency': payout.affiliate.currency,
            'type': 'email',
            'profile': WISE_PROFILE_ID,
            'accountHolderName': payout.affiliate.name,
            'details': {
                'email': payout.affiliate.payment_email
            }
        }
    )
    recipient = recipient_response.json()

    # Create transfer
    transfer_response = requests.post(
        'https://api.wise.com/v1/transfers',
        headers=headers,
        json={
            'targetAccount': recipient['id'],
            'quoteUuid': quote['id'],
            'customerTransactionId': str(payout.id),
            'details': {
                'reference': f'Commission payout #{payout.id}'
            }
        }
    )

    return transfer_response.json()
```

---

## 6. Performance Optimization

### 6.1 Caching Strategy

```python
import redis

cache = redis.Redis()

def get_affiliate_stats(affiliate_id, force_refresh=False):
    cache_key = f"affiliate_stats:{affiliate_id}"

    if not force_refresh:
        cached = cache.get(cache_key)
        if cached:
            return json.loads(cached)

    stats = db.query("""
        SELECT
            COUNT(DISTINCT c.id) as clicks,
            COUNT(DISTINCT cv.id) as conversions,
            SUM(cm.amount) as total_commission
        FROM affiliate_links l
        LEFT JOIN affiliate_clicks c ON l.id = c.link_id
        LEFT JOIN affiliate_conversions cv ON c.id = cv.click_id
        LEFT JOIN affiliate_commissions cm ON cv.id = cm.conversion_id
        WHERE l.affiliate_id = %s
        AND c.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    """, [affiliate_id])

    cache.setex(cache_key, 300, json.dumps(stats))  # 5 min cache
    return stats
```

### 6.2 Batch Processing

```python
from celery import Celery

app = Celery('affiliate')

@app.task
def process_pending_commissions():
    """Batch process pending commissions"""
    pending = db.query("""
        SELECT c.* FROM affiliate_conversions c
        WHERE c.status = 'pending'
        AND c.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        LIMIT 1000
    """)

    for conversion in pending:
        if validate_conversion(conversion):
            approve_conversion(conversion)
        else:
            reject_conversion(conversion, reason='validation_failed')

@app.task
def generate_monthly_payouts():
    """Generate monthly payout records"""
    eligible = db.query("""
        SELECT
            a.id as affiliate_id,
            SUM(cm.amount) as total
        FROM affiliates a
        JOIN affiliate_commissions cm ON a.id = cm.affiliate_id
        WHERE cm.status = 'approved'
        AND cm.paid_at IS NULL
        GROUP BY a.id
        HAVING total >= %s
    """, [MINIMUM_PAYOUT])

    for record in eligible:
        create_payout(record.affiliate_id, record.total)
```

---

## 7. Key Technical Takeaways

1. **S2S tracking is essential** - Cookie-based tracking is unreliable
2. **HMAC signatures** - Secure all postback communications
3. **Device fingerprinting** - Supplement cookies, not replace
4. **Multi-tier requires closure table** - Efficient hierarchy queries
5. **Fraud detection at scale** - ML required at 50+ affiliates
6. **API-first design** - Enable third-party integrations
7. **Caching is critical** - Real-time dashboards need it
8. **Batch processing** - Commissions, payouts, reports

---

## Sources

- [Scaleo Affiliate Tracking Methods](https://www.scaleo.io/blog/affiliate-network-affiliate-tracking-method-types/)
- [Post Affiliate Pro Cookie-less Tracking](https://www.postaffiliatepro.com/faq/track-without-cookies/)
- [Post Affiliate Pro S2S Tracking](https://www.postaffiliatepro.com/features/s2s-tracking/)
- [Postback URL Tracking Guide](https://www.scaleo.io/blog/affiliate-marketing-postback-url-tracking/)
- [Everflow Postback Configurations](https://helpdesk.everflow.io/customer/postback-tracking-link-configurations-for-affiliate-marketing-platforms)
- [Post Affiliate Pro Multi-Tier](https://www.postaffiliatepro.com/features/multi-tier-commissions-multi-level-marketing/)
- [Trackdesk MLM](https://trackdesk.com/features/mlm)
- [Affiliate Fraud Detection](https://www.postaffiliatepro.com/blog/affiliate-fraud-detection-prevention/)
- [IPQS Fraud Prevention](https://www.ipqualityscore.com/features/prevent-affiliate-ad-fraud)
