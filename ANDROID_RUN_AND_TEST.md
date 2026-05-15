# CirclCare AI Android Run and Test Guide

This guide is for running the Expo Android app with the local Express backend and then running the automated QA suite.

## 1. Prerequisites

Install these first:

- Node.js 20 or newer
- npm
- Android Studio with an Android emulator, or a physical Android phone
- Expo Go from the Play Store if using the quickest Expo workflow

From the repo root:

```powershell
cd C:\Users\Jahan\Documents\circlcare
```

## 2. Install Dependencies

Install frontend dependencies:

```powershell
npm install
```

Install backend dependencies:

```powershell
cd backend
npm install
cd ..
```

## 3. Configure Environment

Create the frontend env file:

```powershell
Copy-Item .env.example .env.local
```

Create the backend env file:

```powershell
Copy-Item backend\.env.example backend\.env
```

For Android emulator, set this in `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
```

For a physical Android phone, use your computer's local Wi-Fi IP instead:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3001
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:3001
```

To find your Windows Wi-Fi IP:

```powershell
ipconfig
```

Look for the `IPv4 Address` under your active Wi-Fi adapter.

In `backend\.env`, set:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.4-mini
PORT=3001
NODE_ENV=development
```

The app can still demonstrate many flows with mock/demo behavior, but OpenAI parsing needs a valid `OPENAI_API_KEY`.

## 4. Run the Backend

Open Terminal 1:

```powershell
cd C:\Users\Jahan\Documents\circlcare\backend
npm run dev
```

Expected result:

```text
CirclCare backend listening on port 3001
```

Leave this terminal running.

## 5. Run the Android App

Open Terminal 2:

```powershell
cd C:\Users\Jahan\Documents\circlcare
npm start
```

Then choose one Android path:

- Press `a` to open on an Android emulator.
- Scan the Expo QR code with Expo Go on a physical Android phone.

If you change `.env.local`, stop Expo and restart it with cache cleared:

```powershell
npx expo start -c
```

## 6. Quick Manual Test Flow

Use this request on the Home screen:

```text
Ammi ko kal 11 baje clinic le jana hai, wheelchair friendly car chahiye aur wapis medicine bhi pick karni hai.
```

Then verify:

1. Home accepts the request.
2. Understanding screen shows parsed service details.
3. Match screen shows recommended and alternative providers.
4. Quote screen shows itemized pricing and total.
5. Booking confirmation shows a confirmed booking.
6. Status screen advances through the booking lifecycle.
7. Feedback and dispute screens are reachable after the flow.

## 7. Demo Mode Test

In the app:

1. Go to Profile.
2. Open Settings.
3. Turn on Demo Mode.
4. Return to Home.
5. Tap each demo scenario A through E.

Recommended checks:

- Scenario A: clinic visit bundle and wheelchair support.
- Scenario B: female caregiver and Punjabi language requirement.
- Scenario C: physiotherapy with verified provider requirement.
- Scenario D: food plus medicine recurring support.
- Scenario E: provider cancellation and fallback/compensation flow.

## 8. Run Automated Tests

Frontend component tests:

```powershell
cd C:\Users\Jahan\Documents\circlcare
npm test
```

Backend unit tests:

```powershell
cd C:\Users\Jahan\Documents\circlcare\backend
npm test
```

Backend TypeScript build check:

```powershell
cd C:\Users\Jahan\Documents\circlcare\backend
npm run build
```

Frontend lint:

```powershell
cd C:\Users\Jahan\Documents\circlcare
npm run lint
```

Current expected automated results:

```text
Frontend: 3 test suites, 6 tests passing
Backend: 3 test suites, 19 tests passing
```

## 9. Common Android Issues

If the Android app cannot reach the backend:

- For emulator, confirm `.env.local` uses `http://10.0.2.2:3001`.
- For physical phone, confirm `.env.local` uses your computer's LAN IP.
- Confirm phone and computer are on the same Wi-Fi.
- Confirm the backend terminal is still running.
- Restart Expo with `npx expo start -c`.
- Allow Node.js through Windows Firewall if prompted.

If Expo Go does not update after env changes:

```powershell
npx expo start -c
```

If the backend port is already in use:

```powershell
netstat -ano | findstr :3001
```

Either stop that process or change `PORT` in `backend\.env` and update `EXPO_PUBLIC_API_URL` to match.




