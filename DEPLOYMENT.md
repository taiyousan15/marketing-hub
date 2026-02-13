# MarketingHub Vercel Deployment Guide

## Production URL
```
https://marketinghub.vercel.app
```

## Vercel Project Information
- **Project ID**: `prj_ocyPSE2JgAzfEYLHlqm4BE5Y6aK9`
- **Organization**: Marketing Hub Team
- **Plan**: Vercel Pro (required for production)
- **Region**: US East (iad1)

---

## Deployment Process

### 1. Initial Setup (One-time)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
cd marketing-hub
vercel link --project-id prj_ocyPSE2JgAzfEYLHlqm4BE5Y6aK9
```

### 2. Environment Variables Configuration

Set the following 37 environment variables in Vercel Dashboard:

**Access**: https://vercel.com/dashboard → Select `marketing-hub` → Settings → Environment Variables

#### Database (1 variable)
```
DATABASE_URL = postgresql://...   # Vercel Postgres connection string
```

#### Authentication (4 variables)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
CLERK_SECRET_KEY = sk_live_...
NEXT_PUBLIC_APP_URL = https://marketinghub.vercel.app
NODE_ENV = production
```

#### LINE Integration (3 variables)
```
LINE_CHANNEL_ACCESS_TOKEN = ...
LINE_CHANNEL_SECRET = ...
LINE_TENANT_ID = ... (optional)
```

#### Stripe (3 variables)
```
STRIPE_SECRET_KEY = sk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
```

#### SendGrid (4 variables)
```
SENDGRID_API_KEY = SG...
SENDGRID_FROM_EMAIL = noreply@yourdomain.com
SENDGRID_FROM_NAME = MarketingHub
```

#### Twilio (3 variables)
```
TWILIO_ACCOUNT_SID = ...
TWILIO_AUTH_TOKEN = ...
TWILIO_PHONE_NUMBER = +...
```

#### Pusher (6 variables)
```
PUSHER_APP_ID = ...
PUSHER_KEY = ...
PUSHER_SECRET = ...
PUSHER_CLUSTER = ap3
NEXT_PUBLIC_PUSHER_KEY = ...
NEXT_PUBLIC_PUSHER_CLUSTER = ap3
```

#### AI / Anthropic (1 variable)
```
ANTHROPIC_API_KEY = sk-ant-...
```

#### Google OAuth (3 variables)
```
GOOGLE_CLIENT_ID = ....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = ...
NEXT_PUBLIC_GOOGLE_CLIENT_ID = ...
```

#### Zoom (3 variables)
```
ZOOM_CLIENT_ID = ...
ZOOM_CLIENT_SECRET = ...
NEXT_PUBLIC_ZOOM_CLIENT_ID = ...
```

#### LiveKit (3 variables)
```
LIVEKIT_URL = wss://...
LIVEKIT_API_KEY = ...
LIVEKIT_API_SECRET = ...
```

#### Security (1 variable)
```
CRON_SECRET = <random: openssl rand -base64 32>
```

### 3. Deploy to Production

#### Option A: Automatic (Recommended)
```bash
# Push to main branch - Vercel auto-deploys
git push origin main
```

Monitor at: https://vercel.com/dashboard/projects/marketing-hub/deployments

#### Option B: Manual
```bash
# Deploy current branch
vercel --prod

# View deployment logs
vercel logs --follow
```

### 4. Verify Deployment

```bash
# Check deployment status
vercel status

# View latest build logs
vercel logs

# Test health endpoint
curl https://marketinghub.vercel.app/api/health
```

---

## Database Setup

### Vercel Postgres

1. **Create Database** (if not exists)
   - Vercel Dashboard → Storage → Create Database → Postgres
   - Name: `marketing-hub-production`
   - Region: `iad1` (US East)

2. **Get Connection String**
   ```
   Vercel Dashboard → Storage → marketing-hub-production → .env.local
   Copy: POSTGRES_PRISMA_URL
   ```

3. **Set Environment Variable**
   ```
   DATABASE_URL = <paste POSTGRES_PRISMA_URL>
   ```

4. **Run Migrations**
   ```bash
   export DATABASE_URL="<POSTGRES_PRISMA_URL>"
   npx prisma migrate deploy
   ```

---

## Webhook Configuration

### Stripe Webhook

1. **Get Webhook URL**: `https://marketinghub.vercel.app/api/webhooks/stripe`

2. **Stripe Dashboard Setup**
   - https://dashboard.stripe.com/webhooks
   - Add endpoint with above URL
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`

3. **Copy Signing Secret** → Add to `STRIPE_WEBHOOK_SECRET`

### LINE Webhook

1. **Webhook URL**: `https://marketinghub.vercel.app/api/webhooks/line`

2. **LINE Developers Console Setup**
   - Select Channel → Messaging API settings
   - Webhook URL: (above)
   - Click "Verify" → should return 200
   - Use webhook: ON

### Twilio Webhook

1. **Webhook URL**: `https://marketinghub.vercel.app/api/webhooks/sms`

2. **Twilio Console Setup**
   - Phone Numbers → Manage → Select number
   - Messaging: A MESSAGE COMES IN → Webhook
   - URL: (above)
   - HTTP: POST
   - Save

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Filtered logs (errors only)
vercel logs --follow | grep -i error

# Last 100 lines
vercel logs | head -100
```

### Vercel Dashboard

- **Deployments**: https://vercel.com/dashboard/projects/marketing-hub/deployments
- **Analytics**: https://vercel.com/dashboard/projects/marketing-hub/analytics
- **Functions**: https://vercel.com/dashboard/projects/marketing-hub/functions
- **Environment**: https://vercel.com/dashboard/projects/marketing-hub/settings/environment-variables

---

## Rollback

### Quick Rollback
```bash
# View recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-id>
```

### Manual Rollback
```bash
# Find previous git commit
git log --oneline | head -5

# Revert changes
git revert <commit-hash>

# Push - Vercel auto-deploys
git push origin main
```

---

## Performance Optimization

### Build Time
- Turbopack: 4-6 seconds
- TypeScript check: 2-3 seconds
- Total: ~5-10 seconds

### Image Optimization
Supported domains:
- `lh3.googleusercontent.com` (Google OAuth)
- `avatars.githubusercontent.com` (GitHub OAuth)
- `img.clerk.com` (Clerk)
- `profile.line-scdn.net` (LINE)

Formats: WebP, AVIF (automatic conversion)

### Package Imports Optimization
Auto-optimized:
- `lucide-react`
- `@radix-ui/react-icons`
- `date-fns`

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## Support & Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma PostgreSQL](https://www.prisma.io/docs/orm/drivers/postgres)

### Contact
- Team: marketing-hub-team@example.com
- Slack: #marketing-hub-deployment

---

## Deployment Checklist

- [ ] All environment variables configured (37 total)
- [ ] Vercel Postgres database created
- [ ] Database migrations applied
- [ ] Stripe webhook URL registered
- [ ] LINE webhook URL verified
- [ ] Twilio webhook URL configured
- [ ] Build completes successfully (<10 seconds)
- [ ] No TypeScript errors
- [ ] Health endpoint returns 200
- [ ] Clerk authentication working
- [ ] Application accessible at production URL
- [ ] Error logs monitored (24 hours)

---

**Last Updated**: 2026-02-13
**Version**: 1.0
