# Testing Guide - Multiple Users on Localhost

Since this app uses `localStorage` for storage, here are the best ways to test with multiple users on localhost:

## ⚠️ IMPORTANT: localStorage Behavior

**Regular tabs in the same browser window SHARE localStorage** - they will see the same data!
**To test with multiple users, you need separate localStorage contexts.**

---

## Method 1: Incognito/Private Windows (RECOMMENDED - Easiest)

This is the easiest way to test multiple users:

1. **Open your app in a regular browser window** → This is User 1
2. **Open an incognito/private window** → This is User 2
   - **Chrome/Edge**: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)
   - **Firefox**: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
   - **Safari**: `Cmd+Shift+N` (Mac)
3. **Open another incognito window** → This is User 3

**Why this works**: Each incognito window has its own separate `localStorage`, so they act as completely different users.

---

## Method 2: Different Browsers (Also Easy)

Open the app in different browsers - each has separate localStorage:

1. **Chrome** → User 1
2. **Firefox** → User 2
3. **Safari** → User 3
4. **Edge** → User 4

**Why this works**: Each browser has its own storage system.

---

## Method 3: Different Browser Profiles (Chrome/Edge)

1. Click the profile icon in Chrome/Edge
2. Click "Add" → Create new profile
3. Each profile has separate localStorage
4. Open your app in each profile

**Why this works**: Each profile is isolated.

---

## Method 4: Different Browser Windows (NOT Regular Tabs!)

**Important**: Regular tabs in the same window share localStorage!

To use different windows:
1. Open a new browser window (not tab): `Cmd+N` (Mac) or `Ctrl+N` (Windows)
2. In some browsers, different windows may share localStorage
3. **Better**: Use incognito or different browsers

---

## 🧪 Step-by-Step Test Scenario

### Setup:
1. Start your dev server: `npm run dev`
2. Note the URL (usually `http://localhost:5173`)

### Test with 2 Users:

**User 1 (Regular Chrome window):**
1. Open `http://localhost:5173` in regular Chrome
2. Login with Student ID: `261147123`
3. Enter name: "Alice"
4. Start session for course: "ECSE 250"
5. Working on: "Midterm prep"

**User 2 (Incognito Chrome window):**
1. Open incognito window (`Cmd+Shift+N`)
2. Go to `http://localhost:5173`
3. Login with Student ID: `261170709`
4. Enter name: "Bob"
5. Start session for course: "ECSE 250"
6. Working on: "Assignment 3"

### What Should Happen:
- ✅ Both users should see each other in "Online Users" section
- ✅ Both should see each other in "Active Sessions"
- ✅ User 1 can click "Connect" on User 2's session
- ✅ User 1 can send a message to User 2
- ✅ User 2 should see the message in their inbox (Messages button)

---

## 🔍 Debugging Tips

### Check if localStorage is shared:
1. Open browser console (F12)
2. Type: `localStorage.getItem('shared_session:...')` (check for session keys)
3. If both tabs see the same keys → localStorage is shared (use incognito instead)

### Check Database:
1. Open `http://localhost:5173/database.html` in any tab
2. You'll see all registered users and sessions
3. Verify both users are registered
4. Verify both sessions exist

### Console Logs to Watch:
- `[fetchSessions] Found X session keys` - Should show 2+ if both users are online
- `[checkMessages] Found X message keys` - Should show messages
- `✅ Message sent` - Confirms message was saved
- `✅ Message is for me!` - Confirms message was found

---

## ❌ What WON'T Work

- **Regular tabs in same window** → Share localStorage (same user)
- **Same browser, same profile** → Shares localStorage
- **Different ports** → Still same localStorage per browser

---

## ✅ What WILL Work

- **Incognito windows** → Separate localStorage ✅
- **Different browsers** → Separate localStorage ✅
- **Different browser profiles** → Separate localStorage ✅

---

## Quick Test Checklist

- [ ] User 1 can login with 9-digit Student ID
- [ ] User 2 can login with different 9-digit Student ID
- [ ] Both users appear in each other's "Online Users" section
- [ ] Both users appear in each other's "Active Sessions"
- [ ] User 1 can send message to User 2
- [ ] User 2 sees message in inbox
- [ ] User 2 can reply to User 1
- [ ] Database page shows both users registered
- [ ] Database page shows both sessions active

---

## 🐛 If Messages Don't Show

1. **Check console logs** - Look for `[checkMessages]` logs
2. **Verify session IDs** - Make sure `mySessionId` is set correctly
3. **Check message keys** - Look for `message:` keys in localStorage
4. **Verify message format** - Check that `msg.to` matches recipient's session ID
5. **Try manual refresh** - Click "Messages" button again
6. **Check database page** - See if messages are stored

---

## 💡 Pro Tip

Use the **Database page** (`http://localhost:5173/database.html`) to see:
- All registered users
- All active sessions
- Verify data is being stored correctly
- Debug why users/sessions aren't showing

