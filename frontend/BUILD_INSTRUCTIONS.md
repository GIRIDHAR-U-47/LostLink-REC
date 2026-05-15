# Build Instructions for LostLink APK

This guide explains how to generate a standalone Android APK for the LostLink mobile application.

## Prerequisites
1. **Expo Account:** You need an account at [expo.dev](https://expo.dev).
2. **EAS CLI:** Install it globally:
   ```bash
   npm install -g eas-cli
   ```
3. **Login:** Log in to your Expo account:
   ```bash
   eas login
   ```

## Configuration
I have already updated the following files to make them build-ready:
- **`app.json`**: Added package name, versioning, and necessary Android permissions.
- **`eas.json`**: Configured the `preview` profile to generate an `.apk` file instead of an `.aab`.
- **`src/services/api.js`**: Improved to automatically switch between your local machine (in Expo Go) and your production backend (in the APK).

> [!IMPORTANT]
> Before building, update the `PRODUCTION_URL` in `src/services/api.js` to your actual live backend URL (e.g., your Render URL).

## Generate the APK
Run the following command in the `frontend` directory:

```bash
eas build --profile preview --platform android
```

### What happens next?
1. EAS will ask you to "Generate a new Android Keystore". Select **Yes**.
2. The build will be queued and processed in the Expo cloud.
3. Once finished, Expo will provide a **downloadable link** to your `.apk` file.
4. You can install this APK directly on any Android device.

## Testing with Expo Go (Development)
To continue developing locally:
```bash
npx expo start
```
The app will automatically detect your local IP and connect to your local backend.
