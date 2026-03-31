# Deploy SSE Fix - Checklist

## Changes Made

Fixed infinite reload loop caused by Server-Sent Events (SSE) on public product pages.

## Files Modified

1. `packages/frontend/src/app/products/page.tsx` - Disabled SSE on public product list
2. `packages/frontend/src/app/products/[id]/page.tsx` - Disabled SSE on public product detail

## Pre-Deployment

### 1. Verify Changes Locally

```bash
cd packages/frontend
npm run build
npm run start
```

Test:

- [ ] Visit `/products` - should load without auto-refresh
- [ ] Visit `/products/[any-id]` - should load without auto-refresh
- [ ] Visit `/admin/products/[any-id]` - media sync should still work
- [ ] Check browser console - no SSE errors
- [ ] Check Network tab - no repeated `/events` requests on public pages

### 2. Check for TypeScript Errors

```bash
cd packages/frontend
npm run type-check
```

### 3. Run Linter

```bash
cd packages/frontend
npm run lint
```

## Deployment Steps

### Option A: Railway (Recommended)

```bash
# Commit changes
git add .
git commit -m "fix: disable SSE on public pages to prevent infinite reload loop"
git push origin main

# Railway will auto-deploy
```

### Option B: Manual Build

```bash
# Build frontend
cd packages/frontend
npm run build

# Build backend (if needed)
cd ../backend
npm run build

# Deploy to your hosting platform
```

## Post-Deployment Verification

### 1. Check Backend Logs

Look for SSE request patterns:

```bash
# Should see VERY FEW of these now:
grep "/api/v1/products/events" logs
```

Expected: Only 1-2 connections from admin editors
Problem: Hundreds of requests = fix didn't deploy

### 2. Test Public Pages

- [ ] Visit https://your-domain.com/products
- [ ] Page loads normally
- [ ] No auto-refresh behavior
- [ ] Products display correctly
- [ ] Manual refresh (F5) works

- [ ] Visit https://your-domain.com/products/[any-id]
- [ ] Page loads normally
- [ ] No auto-refresh behavior
- [ ] Product details display correctly
- [ ] Manual refresh (F5) works

### 3. Test Admin Pages

- [ ] Login to admin
- [ ] Visit `/admin/products/[any-id]`
- [ ] Upload a media file
- [ ] Open same product in another tab
- [ ] Verify media appears in both tabs (SSE working)

### 4. Monitor Performance

Check these metrics for 10-15 minutes:

**Backend:**

- [ ] CPU usage stable (not spiking)
- [ ] Memory usage stable
- [ ] Request rate normal
- [ ] No error spikes in logs

**Frontend:**

- [ ] Page load time normal
- [ ] No console errors
- [ ] No memory leaks (check DevTools)

### 5. Check Cloudflare (if applicable)

- [ ] No 429 rate limit errors
- [ ] No 502/504 gateway errors
- [ ] Cache hit rate normal

## Rollback Plan

If issues occur after deployment:

### Quick Rollback (Railway)

```bash
# In Railway dashboard:
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "Redeploy"
```

### Manual Rollback

```bash
git revert HEAD
git push origin main
```

### Emergency Fix

If you need SSE back immediately:

```typescript
// In packages/frontend/src/app/products/page.tsx
// Uncomment this line:
useProductEvents(fetchProducts);
```

## Success Criteria

✅ Fix is successful if:

1. Backend logs show <10 `/events` requests per minute
2. Public pages load without auto-refresh
3. Admin edit page still syncs media across tabs
4. No increase in error rates
5. No user complaints about page behavior

❌ Rollback if:

1. Public pages don't load
2. Admin media sync stops working
3. Error rate increases >10%
4. User complaints about broken functionality

## Communication

### User Notification (Optional)

If users were experiencing the issue:

> "We've fixed an issue where product pages were auto-refreshing continuously.
> Pages now load normally. To see the latest product updates, simply refresh
> the page manually (F5 or pull-to-refresh on mobile)."

### Team Notification

```
✅ SSE Fix Deployed

Changes:
- Disabled real-time updates on public product pages
- Fixed infinite reload loop
- Admin edit page still has real-time media sync

Impact:
- Users need to manually refresh to see latest updates
- Significantly reduced server load
- Better user experience (no unexpected refreshes)

Monitoring:
- Backend logs: [link]
- Error tracking: [link]
```

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**
   - Watch error rates
   - Check user feedback
   - Monitor server metrics

2. **Document for team**
   - Update internal wiki
   - Add to onboarding docs
   - Share in team chat

3. **Plan improvements**
   - Consider WebSocket implementation
   - Evaluate need for real-time updates
   - Gather user feedback

## Support

If issues arise:

1. Check backend logs first
2. Check browser console
3. Verify deployment completed
4. Test in incognito mode
5. Clear browser cache
6. Contact dev team if needed
