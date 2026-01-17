# Notification Audio Setup

## Location
Place your notification audio file here as `notification.mp3`

## Requirements
- **Format**: MP3
- **Duration**: 1-2 seconds
- **Volume**: Moderate (not too loud)
- **File Size**: Ideally < 500KB

## How It Works

The `useAdminWebSocket` hook implements a **three-tier notification sound strategy**:

1. **Primary**: Attempts to play `/notification.mp3` from this public folder
2. **Fallback 1**: If the MP3 file is missing or fails to load, uses Web Audio API to generate a simple 800Hz beep tone (0.5 seconds)
3. **Fallback 2**: If Web Audio API is unavailable, silently logs and continues without sound

This ensures notifications always work, even without a custom audio file.

## How to Add Custom Sound

### Option 1: Use a Local MP3 File
1. Source a notification sound (e.g., from Freesound.com, Zapsplat, or create your own)
2. Convert to MP3 format if needed
3. Name it `notification.mp3`
4. Place it in this directory (`AmigosDashboard/client/public/`)

### Option 2: Use a Web URL
If you prefer to host the audio remotely (e.g., on a CDN), modify the hook to use:
```typescript
const audio = new Audio('https://your-cdn.com/notification.mp3');
```

### Option 3: Keep the Default Beep
No action needed! The Web Audio API beep provides a simple, working notification sound.

## Testing

1. Start the dashboard
2. Log in as admin
3. Create a new order
4. You should hear:
   - The custom MP3 if `notification.mp3` exists
   - A 800Hz beep tone if MP3 is missing
   - No error in the console

## Browser Compatibility

- **Chrome/Edge**: Full support for HTML5 Audio and Web Audio API
- **Firefox**: Full support for HTML5 Audio and Web Audio API
- **Safari**: Full support but may require user interaction first (due to autoplay policies)
- **Mobile browsers**: May block autoplay; requires user gesture to enable

## Troubleshooting

### No sound plays
1. Check browser console for errors
2. Verify file exists at `AmigosDashboard/client/public/notification.mp3`
3. Check browser autoplay policy settings
4. Verify browser volume is not muted

### Web Audio API beep not working
- This indicates a browser compatibility issue
- Check if Web Audio API is available: `window.AudioContext || window.webkitAudioContext`
- Fallback toast notification will still display

### MP3 plays but too quiet/loud
- Adjust `audio.volume` in the hook (range 0-1)
- Current setting: `audio.volume = 0.5` (50%)

