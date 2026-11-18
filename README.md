# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## 🚀 CI/CD Pipeline (Build APK & AAB)

This repository includes automated GitHub Actions CI/CD workflows for building Android APK and AAB binaries.

### 1. Free GitHub Actions Native Build (`.github/workflows/build-android.yml`)
- **Automated on Push**: Every push to `main` automatically builds both APK and AAB binaries using free GitHub Actions runners.
- **Manual Trigger**:
  1. Go to the **Actions** tab on your GitHub repository (`https://github.com/saifAnsari732/call-Apps-frontend/actions`).
  2. Select **"Build Android (APK & AAB)"** on the left.
  3. Click **"Run workflow"**.
  4. Choose:
     - **Build Target**: `both` (APK + AAB), `apk` (only APK), or `aab` (only AAB).
     - **Build Variant**: `release` (optimized production build) or `debug`.
  5. Once the run finishes, scroll down to **Artifacts** to download `KisanConnect-Android-...zip` containing:
     - Ready-to-install `.apk` file for Android devices.
     - `.aab` (Android App Bundle) file for Google Play Console submission.

### 2. EAS Cloud Build (`.github/workflows/eas-build.yml` / `eas.json`)
If you use Expo Application Services (EAS):
- `eas build -p android --profile preview`: Builds standalone APK for testing.
- `eas build -p android --profile production`: Builds release AAB for Google Play Store.
- Add `EXPO_TOKEN` to your repository Secrets to trigger EAS builds directly from GitHub Actions.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
