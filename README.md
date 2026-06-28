<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wz_Uhr_LcKUvaTay04A70Ca3eiA4i0ip

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android

Follow the Android build steps in [ANDROID.md](ANDROID.md). After installing prerequisites, you can run:

```
npm run build:android
```

This will build the web assets, sync Capacitor's Android project, and open Android Studio.
