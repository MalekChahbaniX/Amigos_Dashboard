# API URL Configuration - Quick Testing Guide

## 🧪 Verify Both Fixes Are Working

### Quick Test 1: Development Mode Uses Dev URL

**Steps:**
```bash
# 1. Start development server
cd AmigosDashboard
npm run dev

# 2. Open browser to http://localhost:5173

# 3. Open DevTools (F12) → Network tab

# 4. Perform any API action (login, list providers, etc.)

# 5. Check Network tab
```

**Expected Results:**
✅ API calls go to: `http://192.168.1.104:5000/api/...`
✅ No calls to `https://amigosdelivery25.com`
✅ No warnings in console about HTTPS

**If Failed:**
❌ Calls go to `https://amigosdelivery25.com` → Fix #1 not working
❌ Warnings about "Production URL must use HTTPS" → Development using production config

---

### Quick Test 2: Production Build Uses HTTPS

**Steps:**
```bash
# 1. Build for production
cd AmigosDashboard
npm run build

# 2. Check the built files for URLs
grep -o "https://amigosdelivery25.com/api" dist/assets/*.js | head -1

# 3. Verify no development URLs exist
grep "192.168.1.104" dist/assets/*.js
```

**Expected Results:**
✅ Found: `https://amigosdelivery25.com/api` in dist files
✅ Not found: `192.168.1.104` in dist files
✅ All API calls in production bundle use HTTPS

**If Failed:**
❌ Contains `192.168.1.104` → Dev URL in production build
❌ Contains `http://` only → HTTP in production URL

---

### Quick Test 3: HTTPS Validation Works

**Steps:**

#### 3a: Normal HTTPS URL (should work silently)
```typescript
// In .env.production: (already correct)
VITE_API_URL=https://amigosdelivery25.com/api

npm run build
# Check console when app loads: Should see NO warnings
```

#### 3b: Test HTTP Normalization (intentional test)
```typescript
// Temporarily modify .env for testing:
// (Only for testing - revert after!)
VITE_API_URL=http://amigosdelivery25.com/api

npm run build

// Build dist folder and check console:
// Should see warning: "[API] Production URL must use HTTPS. Got: http://... Normalizing to HTTPS..."
```

**Expected Results:**
✅ HTTPS URLs: Work silently, no warnings
✅ HTTP URLs: Normalized to HTTPS with console warning
✅ All requests still work with HTTPS

**Important:** Revert .env.production back to HTTPS after testing!

---

## 🔍 Manual Verification in Code

### Verify Fix #1: Mode Detection

Check that development mode is checked FIRST:

```bash
cd AmigosDashboard
grep -A 15 "getApiBaseUrl" client/src/lib/api.ts | head -20
```

**Look for this pattern:**
```typescript
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.VITE_ENV === 'production';

if (!isProduction) {  // ← Development check FIRST
  // ... return dev URL ...
}

// Production logic only after development check
```

✅ **If found:** Fix #1 is correctly implemented

---

### Verify Fix #2: HTTPS Validation

Check that HTTPS validation exists in production path:

```bash
cd AmigosDashboard
grep -A 10 "productionUrl" client/src/lib/api.ts | grep -A 8 "startsWith"
```

**Look for this pattern:**
```typescript
if (!productionUrl.startsWith('https://')) {
  console.warn(
    `[API] Production URL must use HTTPS. Got: ${productionUrl}. ` +
    `Normalizing to HTTPS...`
  );
  const normalizedUrl = productionUrl.replace(/^http:\/\//, 'https://');
  return normalizedUrl;
}
```

✅ **If found:** Fix #2 is correctly implemented

---

## 🚀 Quick Deployment Checklist

Before deploying, verify:

- [ ] **Development Test Passed**
  - npm run dev works
  - API calls go to localhost
  - No production URL warnings

- [ ] **Production Build Test Passed**
  - npm run build succeeds
  - dist/ has HTTPS URLs
  - No dev URLs in build

- [ ] **Code Verification Passed**
  - Mode detection (Fix #1) present
  - HTTPS validation (Fix #2) present

- [ ] **Environment Files Correct**
  - .env has VITE_DEV_API_URL (dev only)
  - .env.production has VITE_API_URL (HTTPS only)

- [ ] **Ready to Deploy**
  - All checks passed
  - Commit changes
  - Deploy to production

---

## 🔧 Troubleshooting

### Issue: Development still hits production API
**Solution:**
1. Check .env has `VITE_DEV_API_URL=http://192.168.1.104:5000/api`
2. Check import.meta.env.MODE is 'development'
3. Restart dev server: `npm run dev`
4. Clear browser cache

### Issue: Production build has dev URLs
**Solution:**
1. Verify .env.production exists and has correct VITE_API_URL
2. Delete dist/ folder: `rm -rf dist`
3. Rebuild: `npm run build`
4. Check dist files for HTTPS URLs

### Issue: HTTPS warning appears in development
**Solution:**
1. This shouldn't happen (dev uses dev URL)
2. Check environment variable loading
3. Verify isProduction logic is correct
4. Try restarting dev server

### Issue: Production API calls fail
**Solution:**
1. Check backend is accessible at HTTPS URL
2. Verify SSL certificate is valid
3. Check CORS is configured
4. Enable request logging to see actual URLs

---

## ✅ Success Criteria

| Criteria | Status |
|----------|--------|
| Development uses http:// for dev API | [ ] Pass |
| Production uses https:// for prod API | [ ] Pass |
| HTTP URLs normalized to HTTPS | [ ] Pass |
| No API calls cross environments | [ ] Pass |
| Console warnings appear for HTTP URLs | [ ] Pass |
| All feature tests pass | [ ] Pass |
| Performance unaffected | [ ] Pass |

---

## 📊 Quick Comparison

### Before Fixes
```
npm run dev
└─ Uses: https://amigosdelivery25.com/api ❌ (wrong!)

npm run build
└─ Uses: https://amigosdelivery25.com/api + http:// not validated ⚠️
```

### After Fixes
```
npm run dev
└─ Uses: http://192.168.1.104:5000/api ✅ (correct!)

npm run build
└─ Uses: https://amigosdelivery25.com/api (validated HTTPS) ✅
```

---

**Time to verify: ~5 minutes per environment**
**Effort: Minimal (just follow steps above)**
**Risk: None (both fixes are additive, no breaking changes)**
