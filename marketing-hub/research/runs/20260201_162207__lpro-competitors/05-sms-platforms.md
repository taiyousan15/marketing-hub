# SMS Multi-Number Distribution Platforms

## Overview
SMS platforms for bulk messaging require proper A2P (Application-to-Person) registration and multi-number distribution for high throughput. Key regulations include 10DLC (10-Digit Long Code) in the US and toll-free number verification.

---

## A2P 10DLC Explained

### What is 10DLC?
- **Application-to-Person 10-digit long code**
- US carrier-approved messaging standard
- Local numbers with area codes (e.g., 415, 212, 310)
- Designed for high-volume, trusted messaging

### Registration Requirements
- **The Campaign Registry (TCR)** - Third-party organization vetting 10DLC registration
- Created by major carriers: Verizon, AT&T, T-Mobile
- Tracks which businesses are texting and message types

### 10DLC vs Toll-Free

| Feature | 10DLC | Toll-Free |
|---------|-------|-----------|
| Number Type | Local (area code) | 1-800, 1-888, etc. |
| Trust Level | Local feel | High consumer trust |
| Throughput | 5-15 msgs/second | 3 msgs/second |
| Volume | ~100,000 msgs/month | Few thousand/day |
| Best For | Localized, smaller base | Enterprise, national |
| Cost | Lower | Higher |

### Sources
- [Twilio A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc)
- [Sinch 10DLC](https://sinch.com/phone-numbers/10-digit-long-codes/text-messaging/)

---

## 1. Twilio

**Website:** https://www.twilio.com/
**Type:** Communication Platform as a Service (CPaaS)

### Description
Industry-leading communication API platform with 4,800+ global carrier connections.

### Key Features
- SMS/MMS API
- Voice API
- Email (SendGrid)
- WhatsApp Business API
- 99.95% uptime SLA
- Automated failover

### Multi-Number Distribution
- Number pools
- Load balancing across numbers
- Automated distribution

### BAN Prevention / Carrier Compliance
- 10DLC registration support
- Toll-free verification
- Quality rating monitoring
- Carrier relationship management

### Pricing
| Item | Cost |
|------|------|
| SMS (US) | $0.0075-$0.0083/message |
| Phone Number | Varies by type |
| 10DLC Brand Registration (Standard) | $44 one-time |
| 10DLC Campaign Vetting | $15 one-time |
| 10DLC Campaign Monthly | $1.50-$10/campaign |

**Low-Volume Registration:** $4 one-time brand registration

### API Availability
- Full REST API
- SDKs for all major languages
- Extensive documentation

### Sources
- [Twilio Pricing](https://www.twilio.com/en-us/pricing)
- [Twilio 10DLC](https://www.twilio.com/en-us/phone-numbers/a2p-10dlc)

---

## 2. Plivo

**Website:** https://www.plivo.com/
**Type:** Cloud Communication Platform

### Description
Connects to 1,600+ carriers in 220+ geographies with automatic carrier failover and load balancing.

### Key Features
- SMS/MMS API
- Voice API
- Number Management
- Powerpack (Number Pooling)
- Smart Queue
- Long message concatenation
- Delivery reports

### Multi-Number Distribution (Powerpack)
- **Automatic SMS/MMS distribution across pool of long codes**
- Smart queue management
- Stay within per-number rate limits
- Number Pool Management for large blocks
- Automatic rotation and assignment
- Campaign-level segmentation

### BAN Prevention / Carrier Failover
- **Minimum 2 local carriers per country**
- **Automatic load balancing on carrier failure**
- **Automatic re-routing to better-performing carriers**
- Optimized message delivery rates

### Global Infrastructure
- 7 PoPs: California, Virginia, Frankfurt, Mumbai, Singapore, Sydney, São Paulo
- Minimal latency across 5 continents

### Pricing
- Pay-per-use model
- Contact for volume pricing
- Number pooling included in Powerpack

### API Availability
- Full REST API
- SDKs available
- Webhook support

### Sources
- [Plivo SMS](https://www.plivo.com/sms/)
- [Plivo Powerpack](https://www.plivo.com/sms/powerpack/)
- [Plivo Number Pool API](https://www.plivo.com/docs/sms/api/numberpool/)

---

## 3. MessageBird (Bird)

**Website:** https://messagebird.com/
**Type:** Omnichannel Engagement Platform

### Description
240+ direct-to-carrier connections for global SMS delivery.

### Key Features
- SMS API
- SMS Batch API
- Omnichannel platform
- Rich media support
- Global reach

### Multi-Number Distribution
- **Sticky-VMN-as-a-Sender** - Same sender number for same recipient
- "inbox" originator triggers random VMN selection
- Dedicated or shared VMN pools
- Batch API for multiple messages in single request
- Up to 50 recipients per message object

### BAN Prevention / Delivery Optimization
- Direct carrier connections
- Sticky VMN ensures consistent sender
- Per-message management

### Sticky VMN Availability
- Canada
- Netherlands
- United Kingdom
- (No capacity limits needed in other countries)

### Pricing
- Pay-per-use
- Contact for enterprise pricing

### API Availability
- Full REST API
- Batch API for bulk sending
- Webhook support

### Sources
- [MessageBird SMS API](https://developers.messagebird.com/api/sms-messaging/)
- [MessageBird Batch API](https://developers.messagebird.com/api/sms-batch-api/)

---

## 4. Vonage (formerly Nexmo)

**Website:** https://www.vonage.com/
**Type:** Communication APIs

### Description
Known for straightforward APIs, competitive pricing, and adaptive routing.

### Key Features
- SMS API
- Voice API
- Video API
- Adaptive routing
- Real-time alerting
- Built-in verification APIs

### Multi-Number Distribution / Load Balancing
- **Adaptive routing** - Automatically switches between carriers
- **Proactive re-routing** around congestion
- GPS-like routing for SMS
- Burstable high-rate traffic with controlled delivery

### BAN Prevention / Quality Assurance
- Consistent sender ID across channels
- Automatic blocking of suspicious traffic
- Real-time alerting
- Carrier-aware routing

### Delivery
- 200+ countries
- 2,000+ networks

### Pricing
| Item | Cost (US) |
|------|-----------|
| Outbound SMS | $0.00846/message |
| Inbound SMS | $0.00679/message |
| 10DLC Carrier Fees | Pass-through |

### API Availability
- JSON-over-HTTP API
- SDKs: Node, Python, Java, .NET, Ruby
- cURL examples in documentation

### Sources
- [Vonage SMS API](https://www.vonage.com/communications-apis/sms/)
- [Nordic APIs SMS Comparison](https://nordicapis.com/10-sms-apis-worth-checking-out/)

---

## 5. Bandwidth

**Website:** https://www.bandwidth.com/
**Type:** Enterprise Communication Platform

### Description
Direct-carrier control for US enterprises. #1 Toll-free Messaging provider.

### Key Features
- Direct carrier connections
- Toll-free messaging
- Voice API
- 911 services
- Enterprise focus

### Multi-Number Distribution
- Enterprise-grade distribution
- Direct carrier integration
- High-volume support

### BAN Prevention
- Direct carrier relationships
- Enterprise compliance
- Toll-free verification

### Pricing
- Enterprise pricing
- Contact for quotes

### Best For
- US enterprises needing direct-carrier control
- High-volume toll-free messaging

### Sources
- [Bandwidth 10DLC to Toll-Free](https://www.bandwidth.com/blog/10dlc-to-toll-free-sms/)

---

## 6. Sinch

**Website:** https://sinch.com/
**Type:** Cloud Communications Platform

### Description
Enterprise-grade messaging with global reach and carrier connectivity.

### Key Features
- SMS API
- Voice API
- Video API
- Operator partnerships
- Global coverage

### Multi-Number Distribution
- Single connection for scale
- Global number management

### BAN Prevention
- Enterprise compliance
- Carrier partnerships

### Sources
- [Sinch 10DLC](https://sinch.com/phone-numbers/10-digit-long-codes/text-messaging/)

---

## SMS Marketing Platforms (Consumer-Focused)

### EZ Texting

**Website:** https://www.eztexting.com/

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| Basic | $30/mo | 500 | Basic features |
| Mid | ~$75/mo | 500 | 10DLC support |
| Top | $125/mo | 500 | Full features |
| Enterprise | $3,000/mo | 200,000 | Full suite |

**10DLC Features:**
- Choose your own 10DLC number
- Fast approval (hours vs weeks)
- Standard or High-Volume registration options

### SimpleTexting

**Website:** https://simpletexting.com/

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| Starter | $39/mo | 500 | 3 user seats, $4 carrier fee |

**Features:**
- Flexibility for multiple departments
- Extra numbers available
- Team-friendly

### Sources
- [EZ Texting Pricing](https://www.eztexting.com/pricing)
- [SimpleTexting Pricing](https://simpletexting.com/pricing/)

---

## Multi-Number Strategy Best Practices

### Load Distribution
1. **Use Number Pools**
   - Distribute traffic across multiple numbers
   - Stay within per-number rate limits
   - Increase overall throughput

2. **Sticky Sender**
   - Same sender number for same recipient
   - Builds trust and recognition
   - Reduces spam reports

3. **Carrier Diversity**
   - Multiple carrier connections
   - Automatic failover
   - Avoid single point of failure

### Compliance
1. **Register All Numbers**
   - 10DLC for US local
   - Toll-free verification
   - International compliance

2. **Warm-Up New Numbers**
   - Gradual volume increase
   - Build reputation
   - Avoid sudden spikes

3. **Monitor Quality**
   - Track delivery rates
   - Monitor opt-out rates
   - Address issues quickly

### Technical Implementation
1. **Rate Limiting**
   - Respect per-number limits
   - Implement smart queuing
   - Throttle during high load

2. **Fallback Logic**
   - Primary → Secondary carrier
   - Number rotation
   - Error handling

3. **Analytics**
   - Delivery tracking
   - Cost optimization
   - Performance monitoring

---

## Comparison Matrix

| Provider | Load Balancing | Carrier Failover | 10DLC Support | Pricing Model |
|----------|----------------|------------------|---------------|---------------|
| Twilio | Yes | Automated | Full | Pay-per-use |
| Plivo | Powerpack | 1600+ carriers | Yes | Pay-per-use |
| MessageBird | Sticky-VMN | 240+ carriers | Yes | Pay-per-use |
| Vonage | Adaptive routing | 2000+ networks | Yes | Pay-per-use |
| Bandwidth | Enterprise | Direct carrier | Yes | Enterprise |
| Sinch | Yes | Global | Yes | Enterprise |

---

## LPRO-Like Features in SMS

### Closest to LPRO's Auto-Distribution
1. **Plivo Powerpack** - Automatic distribution across number pool
2. **MessageBird Batch API** - Multi-recipient, sticky sender
3. **Vonage Adaptive Routing** - Automatic carrier switching

### BAN Prevention Equivalent
- Carrier compliance (10DLC, toll-free verification)
- Number warming
- Rate limiting
- Multi-carrier failover

### Key Difference
SMS platforms focus on **carrier compliance** rather than "BAN prevention" because:
- Carriers have formal quality scoring
- Registration is required (not optional)
- Violations result in filtering, not account bans
