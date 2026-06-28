## Building AirSense Pro for Android

Prerequisites:

Quick steps:

1. Install Capacitor if not already installed:

npm install @capacitor/core @capacitor/cli --save

2. Build the web app:

npm run build:web

3. Add the Android platform:

npx cap add android

4. Open the Android project in Android Studio:

npx cap open android

5. Build and run on an emulator or device from Android Studio.

Notes:


Install example:

npm install @capacitor/geolocation @capacitor/device @capacitor/app --save

Then run `npx cap sync` to apply native platform changes.
Android permissions:

- Ensure `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` are present in `android/app/src/main/AndroidManifest.xml` if your app requests location.
- The geolocation plugin may add required permissions automatically, but double-check them if you see runtime permission rejections.

If Android Studio doesn't launch with `npx cap open android`, open the `android` folder manually in Android Studio and run from there.
