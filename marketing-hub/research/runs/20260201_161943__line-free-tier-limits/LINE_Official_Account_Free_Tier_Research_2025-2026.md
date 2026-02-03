# LINE Official Account Free Message Limits Research Report
## Regional Comparison 2025-2026

**Research Date:** February 1, 2026
**Last Updated:** February 2026

---

## Executive Summary

LINE Official Account free message limits vary significantly by region, ranging from **200 messages/month (Japan)** to **500 messages/month (US, Singapore, Indonesia)**. Some regions like Thailand recently reduced their free tier from 500 to 300 messages (August 2024). Notably, certain regions (US, Singapore, Indonesia, EU) have **no access to paid plans**, limiting businesses to only the free Communication plan.

---

## 1. Free Message Limits by Region/Country

### Comprehensive Comparison Table

| Country/Region | Free Tier Name | Free Messages/Month | Paid Plans Available | Verification Available |
|----------------|----------------|---------------------|---------------------|------------------------|
| **United States** | Communication Plan | 500 | No (Communication only) | No |
| **Japan** | Communication Plan (コミュニケーションプラン) | 200 | Yes (Light: ¥5,000, Standard: ¥15,000) | Yes |
| **Thailand** | Free Package | 300 (reduced from 500 in Aug 2024) | Yes (Basic: ฿1,280, Pro: ฿1,780) | Yes |
| **Taiwan** | Light Usage (輕用量) | 200 | Yes (Mid: NT$800, High: NT$1,200) | Yes |
| **Indonesia** | Communication Plan | 500 | No (Communication only) | No |
| **Singapore** | Communication Plan | 500 | No (Communication only) | No |
| **European Union** | N/A | N/A - Service not available | N/A | N/A |
| **Other Regions** | Communication Plan | 500-1000 (varies) | Limited | No |

---

## 2. Detailed Regional Analysis

### 2.1 United States / English LINE Official Account

**Confirmed: 500 messages/month free**

| Plan | Monthly Fee | Free Messages | Additional Messages |
|------|-------------|---------------|---------------------|
| Communication (Free) | $0 | 500 | Not available |

**Key Limitations:**
- Only Communication Plan is available
- Light and Standard plans are NOT available in the US
- Paid plans, Chat Pro, and Premium IDs are unavailable
- No upgrade path to send more messages through standard channels
- Verified accounts are NOT available (only unverified)

**Source:** [LINE Official Account Help Center - Message Limits](https://help2.line.me/official_account/web/categoryId/20006330/pc?lang=en&contentId=20011707)

---

### 2.2 Japan (日本)

**Confirmed: 200 messages/month free**

| Plan | Monthly Fee | Free Messages | Additional Messages |
|------|-------------|---------------|---------------------|
| Communication (コミュニケーションプラン) | ¥0 | 200 | Not available |
| Light (ライトプラン) | ¥5,000 | 5,000 | Not available |
| Standard (スタンダードプラン) | ¥15,000 | 30,000 | ¥3/message |

**Key Details:**
- Lowest free tier among all regions (200 messages)
- Full access to all three pricing tiers
- Verified accounts available
- The Standard Plan is the only plan that allows additional message purchases
- Payment method re-registration required by March 31, 2025 for accounts registered before February 14, 2023

**Source:** [LINE for Business Japan - Pricing](https://www.lycbiz.com/jp/service/line-official-account/plan/)

---

### 2.3 Thailand (ประเทศไทย)

**Confirmed: 300 messages/month free (reduced from 500 in August 2024)**

| Plan | Monthly Fee | Free Messages | Additional Messages |
|------|-------------|---------------|---------------------|
| Free Package | ฿0 | 300 | Not available |
| Basic Package | ฿1,280 | 15,000 | ฿0.10/message |
| Pro Package | ฿1,780 | 35,000 | ฿0.04-0.06/message |

**Recent Changes (August 1, 2024):**
- Free tier reduced from 500 to 300 messages/month
- New Pro Package introduced with MyCustomer | CRM tool included
- Basic Package price adjusted to ฿1,280/month

**Key Benefits:**
- Most affordable paid plans compared to Japan
- Verified accounts available
- Full feature access including Rich Menu, Auto Reply, LINE VOOM

**Source:** [LINE for Business Thailand](https://lineforbusiness.com/th/news/20240619_1)

---

### 2.4 Taiwan (台灣)

**Confirmed: 200 messages/month free**

| Plan | Monthly Fee (TWD) | Free Messages | Additional Messages |
|------|-------------------|---------------|---------------------|
| Light Usage (輕用量) | NT$0 | 200 | Not available |
| Medium Usage (中用量) | NT$800 | 3,000 | Not available |
| High Usage (高用量) | NT$1,200 | 6,000 | NT$0.2/message (decreasing scale) |

**Key Details:**
- Same free tier as Japan (200 messages)
- Verified accounts available
- Time zone note: Billing is based on Japan time zone, so messages sent after 11 PM Taiwan time count toward the next day's quota
- Unused free messages do NOT roll over to the next month
- Verified Account Dedicated ID costs NT$720/year (desktop/Android) or NT$1,038 (iOS)

**Source:** [LINE Business Taiwan - Pricing](https://tw.linebiz.com/service/account-solutions/line-official-account/)

---

### 2.5 Indonesia

**Confirmed: 500 messages/month free**

| Plan | Monthly Fee | Free Messages | Additional Messages |
|------|-------------|---------------|---------------------|
| Communication (Free) | $0 | 500 | Not available |

**Key Limitations:**
- Only Communication Plan is available
- Light and Standard plans are NOT available
- Paid plans, Chat Pro, and Premium IDs are unavailable
- No upgrade path to send more than 500 messages
- Verified accounts are NOT available

**Source:** [LINE Official Account Help Center](https://help2.line.me/official_account/android/pc?lang=en&contentId=20013992)

---

### 2.6 Singapore

**Confirmed: 500 messages/month free**

| Plan | Monthly Fee | Free Messages | Additional Messages |
|------|-------------|---------------|---------------------|
| Communication (Free) | $0 | 500 | Not available |

**Key Limitations:**
- Identical to Indonesia and US restrictions
- Only Communication Plan available
- No paid plan upgrades available
- No verified accounts

**Source:** [LINE Official Account Help Center](https://help2.line.me/official_account/web/?contentId=20013997)

---

### 2.7 European Union

**NOT AVAILABLE**

- LINE Official Account service is NOT available in the European Union
- Businesses in EU countries cannot create LINE Official Accounts
- This includes all EU member states

**Source:** [LINE Help Center](https://help.line.me/official_account/web/categoryId/20010172/pc?lang=en&contentId=20013134)

---

## 3. API Access Limitations

### 3.1 Messaging API Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| Push Messages | 2,000 requests/second |
| Multicast Messages | Subject to rate limits (updated April 23, 2025) |

**Key Points:**
- Rate limits apply per-channel basis (not per subscription level)
- Exceeding rate limits returns `429 Too Many Requests` error
- Message counting: Based on number of recipients, not message objects
- Reply messages are NOT counted toward the monthly quota

### 3.2 What Counts Toward Message Limits

**Counted (Uses Quota):**
- Push messages
- Multicast messages
- Broadcast messages
- Narrowcast messages
- Messaging API Push API

**NOT Counted (Free):**
- Reply messages (Reply API)
- 1-on-1 chat messages
- Auto-response messages
- Greeting messages (welcome messages)
- AI auto-response messages

**Source:** [LINE Developers - Messaging API Pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)

---

## 4. Account Verification Requirements

### 4.1 Verification Availability by Region

| Region | Verification Available |
|--------|----------------------|
| Japan | Yes |
| Taiwan | Yes |
| Thailand | Yes |
| United States | No |
| Indonesia | No |
| Singapore | No |
| European Union | N/A (Service unavailable) |

### 4.2 Account Badge Types

| Badge | Color | Description |
|-------|-------|-------------|
| Unverified | Grey Shield | No verification, available to anyone |
| Verified | Blue Shield | Passed LINE's verification process |
| Premium | Green Shield | Highest verification level |

### 4.3 Verification Requirements (Japan, Taiwan, Thailand only)

**Required Documents:**
- Company description
- Website URL
- Physical store photos (if applicable)
- Administrator name
- Employment certificate, ID card, or business card
- Company/Business registration or government approval documentation
- Tax registration certificate

**Process:**
1. Access 'Display Settings' > 'Verification status'
2. Click 'Verify this account'
3. Submit accurate business information
4. Wait 2-3 business days for review
5. Pay verification fee upon approval
6. Badge changes to Blue within 1 business day after payment

**Costs:**
- Taiwan: NT$720/year (desktop/Android) or NT$1,038/year (iOS) for Dedicated ID

**Source:** [LINE Official Account Guidelines](https://terms2.line.me/official_account_guideline_oth)

---

## 5. Multiple Account Creation Policy

### 5.1 Account Limits

| Account Type | Maximum per Business ID |
|--------------|------------------------|
| Unverified Accounts | Up to 100 |
| Verified Accounts | Up to 100 |
| Total Combined | Up to 100 |

### 5.2 Key Policies

**Permitted:**
- Creating up to 100 LINE Official Accounts with one Business ID
- Affiliate companies can share access to accounts (with proper authorization)
- Managing multiple accounts through LINE Official Account Manager

**Restrictions:**
- User Information obtained through one account CANNOT be used for another account
- Each account must manage User Information separately
- No resale of advertising space to third parties
- Cannot advertise for multiple unrelated entities
- Account rights cannot be assigned to third parties without consent

**Verification Requirements:**
- Only one verified organization per corporation/sole proprietor
- Verified and Premium accounts must be linked to Business Manager

**Source:** [LINE Official Account Terms of Use](https://terms2.line.me/official_account_terms_oth)

---

## 6. Recent Changes (2024-2026)

### 6.1 Thailand (August 2024)
- Free tier reduced: 500 → 300 messages/month
- New Pro Package introduced at ฿1,780/month
- Basic Package adjusted to ฿1,280/month

### 6.2 Japan (2025)
- Payment method re-registration required by March 31, 2025
- Accounts registered before February 14, 2023 affected

### 6.3 LINE Notify Discontinuation (March 31, 2025)
- LINE Notify service ceased on March 31, 2025
- All functions discontinued from April 1, 2025
- Businesses must migrate to Messaging API

### 6.4 Multicast API Rate Limit Changes (April 2025)
- New rate limits for "Send multicast message" endpoint effective April 23, 2025

---

## 7. Pricing Comparison Summary

### Global Pricing (USD equivalent, approximate)

| Region | Free Plan | Entry Paid Plan | Premium Paid Plan |
|--------|-----------|-----------------|-------------------|
| Japan | ¥0 (200 msg) | ¥5,000 (~$33) for 5,000 msg | ¥15,000 (~$100) for 30,000 msg |
| Thailand | ฿0 (300 msg) | ฿1,280 (~$37) for 15,000 msg | ฿1,780 (~$51) for 35,000 msg |
| Taiwan | NT$0 (200 msg) | NT$800 (~$25) for 3,000 msg | NT$1,200 (~$37) for 6,000 msg |
| US/SG/ID | $0 (500 msg) | Not Available | Not Available |
| Global Default | $0 (500 msg) | $50 for 10,000 msg | $150 for 40,000 msg |

---

## 8. Recommendations for Businesses

### 8.1 For US/Singapore/Indonesia Users
- **Challenge:** Limited to 500 messages/month with no upgrade option
- **Solution:** Consider creating accounts in Japan/Taiwan/Thailand if you have legitimate business presence there
- **Alternative:** Use Messaging API efficiently; Reply messages don't count toward quota

### 8.2 For High-Volume Businesses
- **Japan:** Standard Plan (¥15,000) is most cost-effective for high volume
- **Thailand:** Pro Package (฿1,780) offers best value with CRM included
- **Taiwan:** High Usage Plan (NT$1,200) allows additional message purchases

### 8.3 For Maximum Free Messages
- **Best Region:** US, Singapore, Indonesia (500 messages/month free)
- **Verification Trade-off:** These regions don't offer verified accounts
- **Japan/Taiwan:** Only 200 messages free but full feature access

---

## 9. Sources and References

### Official LINE Documentation
- [Messaging API Pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)
- [LINE Official Account Help Center - Message Limits](https://help2.line.me/official_account/web/categoryId/20006330/pc?lang=en&contentId=20011707)
- [Japan Official Account Help Center](https://help2.line.me/official_account_jp/web/pc?lang=en&contentId=20011745)
- [LINE Official Account Terms of Use](https://terms2.line.me/official_account_terms_oth)
- [LINE Official Account Guidelines](https://terms2.line.me/official_account_guideline_oth)

### Regional Business Portals
- [LINE for Business Japan](https://www.lycbiz.com/jp/service/line-official-account/plan/)
- [LINE for Business Thailand](https://lineforbusiness.com/th-en/service/line-oa-features)
- [LINE Business Taiwan](https://tw.linebiz.com/service/account-solutions/line-official-account/)
- [LINE for Business Global](https://www.linebiz.com/jp-en/other/)

### Third-Party Analysis
- [SaleSmartly - LINE Official Account Pricing 2024](https://www.salesmartly.com/en/blog/docs/line-official-account-price)
- [Respond.io - LINE Business Guide](https://respond.io/blog/line-business)
- [SleekFlow - LINE Business Account Guide](https://sleekflow.io/blog/line-business-account-set-up)

---

## Appendix A: Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│           LINE Official Account Free Tier Quick Reference       │
├─────────────────────────────────────────────────────────────────┤
│  Japan:      200 messages/month  │  Paid plans: YES  │  Verified: YES  │
│  Taiwan:     200 messages/month  │  Paid plans: YES  │  Verified: YES  │
│  Thailand:   300 messages/month  │  Paid plans: YES  │  Verified: YES  │
│  USA:        500 messages/month  │  Paid plans: NO   │  Verified: NO   │
│  Singapore:  500 messages/month  │  Paid plans: NO   │  Verified: NO   │
│  Indonesia:  500 messages/month  │  Paid plans: NO   │  Verified: NO   │
│  EU:         NOT AVAILABLE       │                                      │
├─────────────────────────────────────────────────────────────────┤
│  Messages NOT counted: Reply, 1-on-1 chat, Auto-response, Greeting │
│  Max accounts per Business ID: 100                                    │
│  API Rate Limit: 2,000 requests/second (Push messages)               │
└─────────────────────────────────────────────────────────────────┘
```

---

*This research report was compiled on February 1, 2026. LINE pricing and policies are subject to change. Always verify current information on official LINE Business websites for your region.*
