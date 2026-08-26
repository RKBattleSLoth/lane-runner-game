# How to Check Browser Console for Errors

## Chrome / Edge / Brave

**Method 1: Keyboard Shortcut**
- Mac: Press `Cmd + Option + J`
- Windows/Linux: Press `Ctrl + Shift + J`

**Method 2: Right-Click Menu**
1. Right-click anywhere on the page
2. Click "Inspect" or "Inspect Element"
3. Click the "Console" tab at the top

## Safari

**First, enable Developer menu (one time setup):**
1. Safari menu → Settings (or Preferences)
2. Click "Advanced" tab
3. Check "Show Develop menu in menu bar"

**Then check console:**
- Mac: Press `Cmd + Option + C`
- Or: Develop menu → Show JavaScript Console

## Firefox

**Keyboard Shortcut:**
- Mac: Press `Cmd + Option + K`
- Windows/Linux: Press `Ctrl + Shift + K`

**Or Right-Click:**
1. Right-click anywhere on the page
2. Click "Inspect Element"
3. Click the "Console" tab

---

## What to Look For

Once the console is open, you should see messages like:

✅ **Good (sounds loading):**
```
🔊 Attempting to load shoot sound...
MP3 fetch response: 200 true
Response OK, loading audio data...
ArrayBuffer size: 78592 bytes
✅ Successfully loaded and decoded shoot sound!
Buffer duration: 0.5 seconds
```

❌ **Bad (sounds not loading):**
```
MP3 fetch response: 404 false
❌ shoot.mp3/shoot.wav not found
```

---

## Send Me What You See

Copy the console messages and send them to me so I can see what's happening!
