# Plan: Generate APK for CirclCare

This plan outlines the steps to configure the project for generating a standalone Android APK using Expo Application Services (EAS).

## User Review Required

> [!IMPORTANT]
> To generate the APK, you will need an Expo account. If you don't have one, you can create it at [expo.dev](https://expo.dev).
> 
> You will also need to run the final build command manually in your terminal as it requires logging into your Expo account.

## Proposed Changes

### Configuration

#### [MODIFY] [app.json](file:///c:/Users/Jahan/Documents/circlcare/app.json)
- Add the `android.package` identifier. This is required for standalone builds.

#### [NEW] [eas.json](file:///c:/Users/Jahan/Documents/circlcare/eas.json)
- Create the EAS configuration file to define the build profile for an APK.
- Profile `preview` will be configured to output an `.apk` file instead of an `.aab` (which is for the Play Store).

## Execution Steps

1. **Update Configuration**: I will apply the changes to `app.json` and create `eas.json`.
2. **User Command**: I will provide the exact command you need to run to start the build process.

## Verification Plan

### Manual Verification
- Once the configuration is applied, you can run `npx eas build -p android --profile preview`.
- EAS will provide a download link to the `.apk` file once the build is finished.
- You can install this APK on any Android device.
