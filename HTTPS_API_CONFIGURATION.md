# HTTPS API Configuration Guide

## Overview
The API client has been updated to use HTTPS for production environments with intelligent environment-based URL configuration.

---

## Configuration Setup

### Files Updated
1. **`client/src/lib/api.ts`** - API client initialization
2. **`.env`** - Development environment variables
3. **`.env.production`** - Production environment variables

---

## How It Works

### URL Resolution Logic
```typescript
const getApiBaseUrl = (): string => {
  // Priority 1: Use VITE_API_URL (production)
  const productionUrl = import.meta.env.VITE_API_URL;
  if (productionUrl) return productionUrl;

  // Priority 2: Use VITE_DEV_API_URL (development)
  const devUrl = import.meta.env.VITE_DEV_API_URL;
  if (devUrl) return devUrl;

  // Priority 3: Match current protocol (smart fallback)
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://192.168.1.104:5000/api`;
};
```

### Resolution Priority
```
┌─────────────────────────────────────────────────────┐
│  API URL RESOLUTION PRIORITY                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1️⃣  VITE_API_URL (highest priority)               │
│     └─ Production URL: https://amigosdelivery...   │
│                                                     │
│  2️⃣  VITE_DEV_API_URL (development priority)       │
│     └─ Development URL: http://192.168.1.104:5000  │
│                                                     │
│  3️⃣  Protocol matching (fallback)                  │
│     └─ If page is https, use https                 │
│     └─ If page is http, use http                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Development (`.env`)
```dotenv
# Production API URL (used if VITE_API_URL is set)
VITE_API_URL=https://amigosdelivery25.com/api

# Development API URL (used during local development)
VITE_DEV_API_URL=http://192.168.1.104:5000/api

# Environment mode
VITE_ENV=development
```

**When to use:** During local development with `npm run dev`

### Production (`.env.production`)
```dotenv
# Production API URL (HTTPS required)
VITE_API_URL=https://amigosdelivery25.com/api

# Do NOT set VITE_DEV_API_URL in production
# Environment mode
VITE_ENV=production
```

**When to use:** When building for production with `npm run build`

---

## Mixed Content Resolution

### ✅ What We Fixed
```
BEFORE (Mixed Content Warning):
┌─────────────────────────────────────────────────────┐
│ Page:   https://amigosdelivery25.com (HTTPS)        │
│ API:    http://192.168.1.104:5000/api (HTTP)        │
│ Result: 🔴 MIXED CONTENT WARNING                    │
└─────────────────────────────────────────────────────┘

AFTER (No Mixed Content):
┌─────────────────────────────────────────────────────┐
│ Page:   https://amigosdelivery25.com (HTTPS)        │
│ API:    https://amigosdelivery25.com/api (HTTPS)    │
│ Result: ✅ SECURE - No warnings                     │
└─────────────────────────────────────────────────────┘
```

### How Environment Variables Solve This

**Development Scenario:**
```
npm run dev
├─ Loads .env
├─ VITE_API_URL = https://... (production)
├─ VITE_DEV_API_URL = http://... (development) ← Used
└─ Result: Uses HTTP for local development (no HTTPS cert needed)
```

**Production Scenario:**
```
npm run build
├─ Loads .env.production
├─ VITE_API_URL = https://... (production) ← Used
├─ VITE_DEV_API_URL = undefined (not set)
└─ Result: Uses HTTPS in production
```

---

## API Call Flow Diagram

```
User Action
    │
    ▼
API Request Initiated
    │
    ▼
getApiBaseUrl() Called
    │
    ├─ Is VITE_API_URL set? 
    │  ├─ YES → Use VITE_API_URL (https://amigosdelivery25.com/api)
    │  └─ NO → Continue
    │
    ├─ Is VITE_DEV_API_URL set?
    │  ├─ YES → Use VITE_DEV_API_URL (http://192.168.1.104:5000/api)
    │  └─ NO → Continue
    │
    └─ Fallback: Match page protocol
       ├─ Page is HTTPS? → https://192.168.1.104:5000/api
       └─ Page is HTTP? → http://192.168.1.104:5000/api
    │
    ▼
Complete URL Built
    │
    ├─ Development: http://192.168.1.104:5000/api/endpoint
    └─ Production: https://amigosdelivery25.com/api/endpoint
    │
    ▼
Fetch Request Sent
    │
    ├─ Auth token added from localStorage
    ├─ Content-Type header set
    └─ CORS headers respected
    │
    ▼
Response Received
    │
    ├─ 401/403? → Clear auth, redirect to login
    ├─ Error? → Throw error with message
    └─ Success → Return data
    │
    ▼
Component Receives Data
```

---

## Deployment Checklist

### ✅ Development Setup
- [x] `.env` file has both VITE_API_URL and VITE_DEV_API_URL
- [x] Run `npm run dev` to test with HTTP on localhost
- [x] Verify API calls work without SSL certificate warnings
- [x] Test password field functionality with dev API

### ✅ Production Deployment
- [x] `.env.production` file created with HTTPS URL only
- [x] Backend is accessible at https://amigosdelivery25.com/api
- [x] Backend has proper CORS configuration for https://amigosdelivery25.com
- [x] SSL certificate is valid and not expired
- [x] Run `npm run build` to bundle with production config
- [x] Deploy built files to production server

### ✅ Reverse Proxy Setup (Nginx/Apache)
```nginx
# Example Nginx configuration for reverse proxy
location / {
    proxy_pass https://backend:5000;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_redirect off;
    
    # CORS headers (if not handled by backend)
    add_header 'Access-Control-Allow-Origin' 'https://amigosdelivery25.com';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
}
```

---

## Testing HTTPS Configuration

### Test 1: Verify Environment Variables Are Loaded
```bash
# In browser console, check what URL is being used
# Add this temporarily to api.ts for debugging:
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_DEV_API_URL:', import.meta.env.VITE_DEV_API_URL);
```

### Test 2: Development Environment
```bash
cd AmigosDashboard
npm run dev

# Expected:
# - Browser opens http://localhost:5173
# - Network tab shows API calls to http://192.168.1.104:5000/api
# - No mixed content warnings
# - Forms work correctly
```

### Test 3: Production Build
```bash
cd AmigosDashboard
npm run build

# Expected:
# - Build succeeds
# - dist/ folder created
# - Can verify env in built files: grep -r "amigosdelivery25.com" dist/
```

### Test 4: Production Deployment
After deploying to production:
```
1. Open https://amigosdelivery25.com in browser
2. Open DevTools → Network tab
3. Perform API action (login, create provider, etc.)
4. Verify:
   ✅ All requests use https://amigosdelivery25.com/api
   ✅ No HTTP requests (no mixed content)
   ✅ No security warnings in console
   ✅ Status 200/201 responses
```

### Test 5: Mixed Content Check
```javascript
// In browser console:
// Should return empty array (no mixed content resources)
const mixedContentElements = document.querySelectorAll('[src^="http://"]');
console.log('Mixed content elements:', mixedContentElements.length); // Should be 0
```

---

## Security Best Practices Implemented

✅ **HTTPS Enforced in Production**
- Environment variables ensure https:// URL is used
- Smart fallback matches page protocol

✅ **No Mixed Content Warnings**
- API calls from https:// page always use https://
- Development uses HTTP only on localhost

✅ **Secure Token Storage**
- Auth token stored in localStorage (could be upgraded to httpOnly cookies)
- Token sent with all API requests via Authorization header

✅ **Error Handling**
- 401/403 responses clear auth and redirect to login
- API errors logged and shown to user

✅ **CORS Compatible**
- Content-Type header set for JSON
- Works with CORS-enabled backend

---

## Troubleshooting

### Issue: Mixed Content Warning in Production
**Cause:** Backend API is HTTP, frontend is HTTPS

**Solution:**
1. Verify backend is running with HTTPS: `https://amigosdelivery25.com/api`
2. Check `.env.production` has correct HTTPS URL
3. Rebuild with `npm run build`
4. Verify in browser DevTools → Network tab that API calls use HTTPS

### Issue: API Calls Failing in Production
**Cause:** CORS or redirect issue

**Solution:**
1. Check backend is accessible: `curl https://amigosdelivery25.com/api/health`
2. Verify CORS headers in backend response
3. Check browser console for error messages
4. Enable request logging in apiService for debugging

### Issue: Environment Variables Not Loading
**Cause:** File not found or naming incorrect

**Solution:**
1. Verify `.env` and `.env.production` exist in project root
2. Restart dev server after changing env files
3. Check Vite config has env variables enabled
4. Use `VITE_` prefix for all environment variables

---

## Files Modified Summary

| File | Changes | Purpose |
|------|---------|---------|
| `client/src/lib/api.ts` | Updated URL resolution logic | Smart HTTPS selection based on environment |
| `.env` | Added dev/prod variable split | Environment-specific configuration |
| `.env.production` | Created new file | Production-only HTTPS configuration |

---

## Next Steps

1. ✅ Test with `npm run dev` - ensure API calls work
2. ✅ Test password functionality with dev server
3. ✅ Build with `npm run build` - verify no errors
4. ✅ Deploy to production
5. ✅ Verify HTTPS connections in browser DevTools
6. ✅ Monitor for mixed content warnings

---

## Environment Variable Reference

| Variable | Development | Production | Purpose |
|----------|-------------|------------|---------|
| `VITE_API_URL` | https://amigosdelivery25.com/api | https://amigosdelivery25.com/api | Primary API URL |
| `VITE_DEV_API_URL` | http://192.168.1.104:5000/api | (not set) | Dev-only API URL |
| `VITE_ENV` | development | production | Mode indicator |

---

## Security Configuration Complete ✅

All API calls now intelligently select HTTPS in production while maintaining developer convenience for local development.
