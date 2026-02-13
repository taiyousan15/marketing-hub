# MarketingHub Deployment Troubleshooting Guide

## Build Issues

### Error: DATABASE_URL not set

**Symptoms**
```
Error: DATABASE_URL is not set
```

**Cause**: Environment variable not configured in Vercel Dashboard

**Solution**:
1. Vercel Dashboard → Settings → Environment Variables
2. Add `DATABASE_URL` with Vercel Postgres connection string
3. Redeploy: `vercel --prod`

---

### Error: Prisma Client not generated

**Symptoms**
```
Error: Cannot find module '@prisma/client'
```

**Cause**: `postinstall` script didn't run (missing from package.json)

**Solution**:
1. Verify `package.json` contains:
   ```json
   "postinstall": "prisma generate"
   ```
2. Run locally: `npm run postinstall`
3. Commit and push changes

---

### Error: Module not found: @/components/...

**Symptoms**
```
Type error: Cannot find module '@/components/auto-webinar/viewer/webinar-player'
```

**Cause**: Missing component file or import path issue

**Solution**:
1. Verify component exists: `ls src/components/auto-webinar/viewer/`
2. Check import path matches file location
3. Ensure TypeScript config includes component directory
4. Clear cache: `rm -rf .next && npm run build`

---

### Error: Build timeout (>10 minutes)

**Symptoms**
```
Build failed: Vercel build timeout
```

**Cause**: Build takes too long, usually due to:
- Large dependencies
- Slow type checking
- Unoptimized code

**Solution**:
1. Check build log: `vercel logs --follow`
2. Identify slow step (Compilation/TypeScript/Static)
3. Remove unused dependencies: `npm prune`
4. Enable Turbopack (should be default)
5. Optimize imports (use `experimental.optimizePackageImports`)

---

## Database Issues

### Error: P1001 - Connection refused

**Symptoms**
```
PrismaClientInitializationError: Can't reach database server at `...`
```

**Cause**: Database not accessible or connection string incorrect

**Solution**:
1. Verify `DATABASE_URL` is set correctly
2. Check Vercel Postgres is running
3. Test locally with: `npx prisma studio`
4. Verify firewall/network allows connections
5. Try `POSTGRES_PRISMA_URL` instead (connection pooling)

---

### Error: P1017 - Server closed connection

**Symptoms**
```
Connection pool error / server closed the connection unexpectedly
```

**Cause**: Too many connections or connection pool exhausted

**Solution**:
1. Switch to `POSTGRES_PRISMA_URL` (supports connection pooling)
2. In `datasource db`:
   ```prisma
   url = env("DATABASE_URL")
   ```
3. Update DATABASE_URL to use pooling endpoint
4. Restart: `vercel --prod`

---

### Error: P1002 - Timeout

**Symptoms**
```
Prisma query timeout after 10s
```

**Cause**: Slow query or database overload

**Solution**:
1. Check slow queries: `EXPLAIN ANALYZE <query>`
2. Add database indexes
3. Optimize Prisma queries (use `select` to reduce payload)
4. Increase timeout in Prisma Client:
   ```typescript
   const prisma = new PrismaClient({
     log: ['query'],
     errorFormat: 'pretty',
   })
   ```

---

### Error: Tables not found

**Symptoms**
```
Error: Unknown table 'main.Event'
```

**Cause**: Database migrations not applied

**Solution**:
1. Run migrations:
   ```bash
   export DATABASE_URL="<POSTGRES_PRISMA_URL>"
   npx prisma migrate deploy
   ```
2. Verify tables exist: `npx prisma studio`
3. Check migration history: `ls prisma/migrations/`

---

## Webhook Issues

### LINE Webhook: 401 Unauthorized

**Symptoms**
```
401 Unauthorized when LINE sends webhook
```

**Cause**: Invalid `LINE_CHANNEL_SECRET`

**Solution**:
1. Verify in LINE Developers Console:
   - https://developers.line.biz/console/
   - Select channel → Messaging API settings
   - Copy exact `Channel Secret`
2. Update `LINE_CHANNEL_SECRET` in Vercel
3. Redeploy: `vercel --prod`

---

### Stripe Webhook: 403 Forbidden

**Symptoms**
```
403 Forbidden / Signature verification failed
```

**Cause**: Incorrect `STRIPE_WEBHOOK_SECRET`

**Solution**:
1. Get new signing secret:
   - https://dashboard.stripe.com/webhooks
   - Select endpoint → Signing secret
   - Click "Reveal"
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Test with Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```
4. Redeploy: `vercel --prod`

---

### Webhook Not Receiving Events

**Symptoms**
```
No webhook events arriving at endpoint
```

**Cause**: URL not registered or endpoint returning error

**Solution**:
1. Verify URL is correct: `https://marketinghub.vercel.app/api/webhooks/[service]`
2. Check DNS resolution: `curl -I https://marketinghub.vercel.app/api/webhooks/stripe`
3. View logs: `vercel logs --follow`
4. Look for 401/403/404 errors
5. Re-register webhook in service dashboard

---

## Authentication Issues

### Clerk: Invalid publishable key

**Symptoms**
```
Error: Invalid Clerk publishable key format
```

**Cause**: Wrong key format or missing prefix

**Solution**:
1. Verify in Clerk Dashboard:
   - https://dashboard.clerk.com/
   - Select application → API Keys
   - Copy `Publishable Key` (starts with `pk_`)
2. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Verify `CLERK_SECRET_KEY` is also set
4. Redeploy: `vercel --prod`

---

### Clerk: Sign-in redirect loop

**Symptoms**
```
Infinite redirect: / → /login → /
```

**Cause**: `NEXT_PUBLIC_APP_URL` doesn't match deployment URL

**Solution**:
1. Verify `NEXT_PUBLIC_APP_URL = https://marketinghub.vercel.app`
2. No trailing slash
3. Must be HTTPS
4. Redeploy after fixing

---

## Performance Issues

### Slow API responses (>3 seconds)

**Symptoms**
```
API responses taking 5-10 seconds
```

**Cause**: Unoptimized database queries or AI API calls

**Solution**:
1. Check logs: `vercel logs --follow`
2. Look for slow queries (>1s)
3. Add database indexes:
   ```prisma
   @@index([tenantId])
   @@index([createdAt])
   ```
4. Optimize N+1 queries (use `include`/`select`)
5. Consider caching with Redis/Upstash

---

### High memory usage

**Symptoms**
```
Function timeout / OOM killer
```

**Cause**: Large payload processing or memory leak

**Solution**:
1. Check memory in logs: `vercel logs --follow`
2. Implement streaming for large responses
3. Paginate large datasets
4. Use middleware to process in batches
5. Profile with: `node --inspect`

---

## Deployment Issues

### Vercel: Insufficient capacity

**Symptoms**
```
Deployment failed: Insufficient capacity in region
```

**Cause**: Resource limitation in selected region

**Solution**:
1. Change region: Vercel Dashboard → Settings → Region
2. Try: `sfo1` (San Francisco) or `fra1` (Frankfurt)
3. Redeploy

---

### GitHub: Branch protection prevents deployment

**Symptoms**
```
Cannot merge PR / deploy blocked
```

**Cause**: Required status checks or review blocking merge

**Solution**:
1. Ensure all checks pass:
   - Build successful
   - Type checks pass
   - Linting passes
2. Get required approvals
3. Merge PR → auto-deployment to production

---

## Monitoring & Debugging

### Enable detailed logging

```bash
# View all logs with timestamps
vercel logs --follow --since 1h

# Filter by level
vercel logs --follow | grep -E "(error|ERROR|Error)"

# Save logs to file
vercel logs > deployment.log
```

### Use Prisma logging

```typescript
// src/lib/db/prisma.ts
const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
})
```

### Check Edge Middleware

```bash
# Test middleware
curl -i https://marketinghub.vercel.app/

# Check headers
curl -v https://marketinghub.vercel.app/ 2>&1 | grep -E "^(<|>)"
```

---

## Escalation Checklist

Before contacting support:
- [ ] Checked Vercel logs: `vercel logs --follow`
- [ ] Verified all 37 environment variables are set
- [ ] Database is accessible: `npx prisma studio`
- [ ] Migrations applied: `npx prisma migrate status`
- [ ] Recent commits don't break build locally: `npm run build`
- [ ] Webhooks are registered in service dashboards
- [ ] Rollback to previous deployment works
- [ ] Tried redeployment: `vercel --prod`

---

## Emergency Contacts

- **Vercel Support**: https://vercel.com/support
- **Prisma Docs**: https://www.prisma.io/docs/
- **Clerk Support**: https://support.clerk.com/
- **Stripe Support**: https://stripe.com/support

---

**Last Updated**: 2026-02-13
**Version**: 1.0
