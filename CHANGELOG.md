# ⚡ Dashx - Versions & Release History

All notable changes to this project are documented in this file.

---

## [v1.0.0] - 2026-10-28

### 🚀 Highlights
- **Progressive Web App (PWA) Support**: Dashx can now be installed directly as a standalone mobile or desktop application from any modern browser (Chrome, Edge, Safari).
- **Mobile-First Bottom Navigation Bar**: Clean iOS/Android-style bottom navigation with quick access to **Home**, **Resources**, **Add (+)**, **Favorites**, and **Collections**.
- **Refined Header & Mobile Experience**:
  - Removed redundant top tab bar for a cleaner, unified workspace.
  - Centered Dashx branding on mobile screens.
  - Interactive profile avatar with account information and one-tap sign out.
  - Offcanvas slide-out sidebar for categories and collections navigation.
- **Custom App Icons & Favicon**:
  - Custom dark-mode pill design with centered white lightning bolt.
  - 192x192, 512x512, and maskable PWA icons configured for Android and iOS home screens.
- **Production Deployment**: Automated live production deployment to Vercel at [dashx-two.vercel.app](https://dashx-two.vercel.app).

---

## How to Install Dashx on Mobile

### 🤖 Android (Direct Install / PWA)
1. Open [https://dashx-two.vercel.app](https://dashx-two.vercel.app) in Google Chrome.
2. Tap the **Install App** prompt or tap the three dots (⋮) in the top right corner.
3. Select **Install app** or **Add to Home screen**.
4. Dashx will be added to your home screen and app drawer as an independent application.

### 🍎 iPhone / iPad (iOS)
1. Open [https://dashx-two.vercel.app](https://dashx-two.vercel.app) in Safari.
2. Tap the **Share** button (box with an upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right corner.

---

## Generating a Standalone Android APK
To create a standalone `.apk` package from the live web application:
1. Visit [PWABuilder](https://www.pwabuilder.com/).
2. Enter your live URL: `https://dashx-two.vercel.app`.
3. Click **Start** > **Package for Stores** > **Android**.
4. Download the generated `.apk` / `.aab` package and attach it directly to GitHub Releases.

