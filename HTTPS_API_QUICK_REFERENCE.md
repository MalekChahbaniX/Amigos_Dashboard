# HTTPS API Configuration - Quick Reference

## TL;DR

✅ **HTTPS is now configured for production**
- Production API: `https://amigosdelivery25.com/api`
- Development API: `http://192.168.1.104:5000/api`
- Environment-based URL selection
- No mixed content warnings

---

## Environment Files

### `.env` (Development)
```dotenv
VITE_API_URL=https://amigosdelivery25.com/api
VITE_DEV_API_URL=http://192.168.1.104:5000/api
VITE_ENV=development
```

### `.env.production` (Production)
```dotenv
VITE_API_URL=https://amigosdelivery25.com/api
VITE_ENV=production
```

---

## API URL Selection Logic

```
Development (npm run dev):
├─ VITE_API_URL exists? No
├─ VITE_DEV_API_URL exists? Yes ✅
└─ Result: http://192.168.1.104:5000/api

Production (npm run build):
├─ VITE_API_URL exists? Yes ✅
└─ Result: https://amigosdelivery25.com/api
```

---

## Testing Checklist

### Development
```bash
npm run dev
# Expected: API calls to http://192.168.1.104:5000/api
# No HTTPS errors for localhost
```

### Production Build
```bash
npm run build
# Expected: Build succeeds with no errors
# dist/ folder ready for deployment
```

### Production Deployment
```
1. Open https://amigosdelivery25.com
2. DevTools → Network
3. Check all API calls use https://amigosdelivery25.com/api
4. No 🔴 mixed content warnings
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| Mixed content warning | Verify backend is HTTPS and env vars are correct |
| API calls fail | Check CORS headers and backend is accessible |
| Env vars not loading | Restart dev server after changing .env files |

---

## Files Changed
- ✅ `client/src/lib/api.ts` - Smart URL resolution
- ✅ `.env` - Dev/prod config
- ✅ `.env.production` - Production-only config

**Status:** ✅ Ready for production
