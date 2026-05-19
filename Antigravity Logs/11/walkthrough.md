# Walkthrough: APK Generation Configuration

I have configured your project to support generating an Android APK file via EAS Build.

## Changes Made

### 1. Updated `app.json`
I added the `android.package` field:
```json
"android": {
  "package": "com.jahan.circlcare",
  ...
}
```
This unique identifier is required by Android to identify your app.

### 2. Created `eas.json`
I created a configuration file for EAS Build with a `preview` profile specifically set up to generate an APK:
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

## Next Steps

To generate the APK, please follow these steps in your terminal:

1. **Install EAS CLI** (if you haven't already):
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to your Expo account**:
   ```powershell
   eas login
   ```

3. **Start the Build**:
   ```powershell
   eas build -p android --profile preview
   ```

### What happens next?
- EAS will ask if you want to initialize the project; select **Yes**.
- It will ask for your Android Keystore; if you don't have one, let EAS generate it for you.
- Once the build is finished (usually takes 5-10 minutes on the cloud), EAS will provide a **QR code** and a **Download Link** for the `.apk` file.
- You can download this APK and install it directly on your Android phone.
